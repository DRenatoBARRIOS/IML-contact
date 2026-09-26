import { neon } from "@neondatabase/serverless";
import { ensurePreviewCountryData } from "../db/production-country-sync.mjs";

const FRANCE_SECURITY_ADJUSTMENT = 20;

const FRANCE_CYBER_EVIDENCE = {
  watch: "Security: repeated hospital cyber incidents reveal a gap between formal safeguards and observed operational resilience.",
  sources: [
    {
      title: "La sécurité informatique des établissements de santé",
      publisher: "Cour des comptes",
      url: "https://www.ccomptes.fr/sites/default/files/2024-12/20250103-S2024-1456-La-securite-informatique-des-etablissements-de-sante.pdf",
      url_status: "verified",
      documentary_url: "https://www.ccomptes.fr/sites/default/files/2024-12/20250103-S2024-1456-La-securite-informatique-des-etablissements-de-sante.pdf",
      last_checked_at: "2026-09-22T00:00:00+00:00",
      replacement_reason: "Official Cour des comptes PDF confirmed during the 22 September 2026 secondary link review.",
      publication_date: "2025-01-03",
      accessed_at: "2026-09-22",
      note: "National audit documenting persistent cybersecurity and resilience challenges in French hospitals.",
      indicators: [{
        code: "Security",
        evidence_level: "high",
        support_type: "official audit",
        summary: "Repeated attacks across multiple institutions and years support a downward evidence adjustment to the Security score.",
        limitation: "Incident occurrence alone does not measure the security maturity of every French healthcare institution."
      }]
    },
    {
      title: "Secteur de la santé — État de la menace informatique",
      publisher: "ANSSI / CERT-FR",
      url: "https://www.cert.ssi.gouv.fr/cti/CERTFR-2024-CTI-010/",
      url_status: "redirected",
      documentary_url: "https://www.cert.ssi.gouv.fr/uploads/CERTFR-2024-CTI-010.pdf",
      last_checked_at: "2026-09-22T00:00:00+00:00",
      replacement_reason: "The documentary PDF is preserved while the stable official CERT-FR HTML report is used as the public link.",
      publication_date: "2024-11-07",
      accessed_at: "2026-09-22",
      note: "National cybersecurity assessment documenting repeated ransomware incidents affecting French healthcare providers.",
      indicators: [{
        code: "Security",
        evidence_level: "high",
        support_type: "national cybersecurity authority",
        summary: "Repeated ransomware incidents support a lower resilience score because compromise has repeatedly affected availability and recovery.",
        limitation: "The report is a threat assessment, not a comparative maturity audit of all French hospitals."
      }]
    },
    {
      title: "Observatoire des incidents et retours d'expérience",
      publisher: "CERT Santé / Agence du Numérique en Santé",
      url: "https://cyberveille.esante.gouv.fr/lobservatoire-des-incidents",
      url_status: "verified",
      documentary_url: "https://cyberveille.esante.gouv.fr/lobservatoire-des-incidents",
      last_checked_at: "2026-09-22T00:00:00+00:00",
      replacement_reason: "Official CERT Santé observatory page confirmed during the 22 September 2026 secondary link review.",
      publication_date: "2026-05-11",
      accessed_at: "2026-09-22",
      note: "CERT Santé and the Agence du Numérique en Santé document recurring incidents and operational lessons across the health sector.",
      indicators: [{
        code: "Security",
        evidence_level: "high",
        support_type: "national incident observatory",
        summary: "National incident reporting confirms cybersecurity resilience as a continuing maturity issue.",
        limitation: "Reported incidents depend partly on reporting practices and are not a direct measure of attack prevalence."
      }]
    },
    {
      title: "Violation de données du CHSF de Corbeil-Essonnes",
      publisher: "Cybermalveillance.gouv.fr",
      url: "https://www.cybermalveillance.gouv.fr/tous-nos-contenus/actualites/violation-donnees-chsf-formulaire-lettre-plainte-electronique",
      url_status: "verified",
      documentary_url: "https://www.cybermalveillance.gouv.fr/tous-nos-contenus/actualites/violation-donnees-chsf-formulaire-lettre-plainte-electronique",
      last_checked_at: "2026-09-22T00:00:00+00:00",
      replacement_reason: "Official Cybermalveillance.gouv.fr incident page confirmed during the 22 September 2026 secondary link review.",
      publication_date: "2022-09-28",
      accessed_at: "2026-09-22",
      note: "Government victim-assistance notice confirming the 2022 attack and potential exposure of personal data.",
      indicators: [{
        code: "Security",
        evidence_level: "high",
        support_type: "official incident documentation",
        summary: "Confirms the confidentiality dimension of the CHSF incident.",
        limitation: "This source is focused on victim assistance and data exposure, not forensic attribution."
      }]
    }
  ]
};

function simplifyFranceWatch(items) {
  return (Array.isArray(items) ? items : []).map((item) => {
    const text = String(item || "");
    if (text.startsWith("Learning revised")) {
      return "Learning: institutional responsiveness and follow-through remain limited in several documented areas.";
    }
    if (text.startsWith("Security score adjusted downward")) {
      return "Security: repeated hospital cyber incidents reveal a gap between formal safeguards and observed operational resilience.";
    }
    return item;
  });
}

export async function GET() {
  const databaseUrl = process.env.DATABASE_URL_MANUAL || process.env.DATABASE_URL;

  if (!databaseUrl) {
    return Response.json(
      { error: "DATABASE_URL is not available." },
      { status: 500 }
    );
  }

  try {
    const sql = neon(databaseUrl);

    await ensurePreviewCountryData(sql);

    const countries = await sql`
      SELECT
        c.iso3,
        c.slug,
        c.name_en AS name,
        c.map_x::double precision AS map_x,
        c.map_y::double precision AS map_y,
        c.label_dx::double precision AS label_dx,
        c.label_dy::double precision AS label_dy,
        c.text_size::double precision AS text_size,

        cp.version,
        cp.subtitle,
        cp.assessment_date,
        cp.published_at,

        COALESCE(
          (
            SELECT json_agg(s.score ORDER BY d.display_order)
            FROM country_profile_scores s
            JOIN iml_domains d
              ON d.code = s.domain_code
            WHERE s.profile_id = cp.id
          ),
          '[]'::json
        ) AS values,

        COALESCE(
          (
            SELECT json_agg(n.note_text ORDER BY n.display_order)
            FROM country_profile_notes n
            WHERE n.profile_id = cp.id
              AND n.note_type = 'strength'
          ),
          '[]'::json
        ) AS strengths,

        COALESCE(
          (
            SELECT json_agg(n.note_text ORDER BY n.display_order)
            FROM country_profile_notes n
            WHERE n.profile_id = cp.id
              AND n.note_type = 'watch'
          ),
          '[]'::json
        ) AS watch,

        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'title', s.title,
                'publisher', s.publisher,
                'url',
                CASE
                  WHEN s.url_status IN ('verified', 'redirected')
                    THEN s.public_url
                  ELSE NULL
                END,
                'url_status', COALESCE(s.url_status, 'unverified'),
                'documentary_url', s.source_url,
                'last_checked_at', s.last_checked_at,
                'replacement_reason', s.replacement_reason,
                'publication_date', s.publication_date,
                'accessed_at', s.accessed_at,
                'note', s.evidence_note,
                'indicators',
                COALESCE(
                  (
                    SELECT json_agg(
                      json_build_object(
                        'code', i.indicator_code,
                        'evidence_level', i.evidence_level,
                        'support_type', i.support_type,
                        'summary', i.evidence_summary,
                        'limitation', i.limitation_note
                      )
                      ORDER BY i.indicator_code
                    )
                    FROM country_profile_source_indicators i
                    WHERE i.source_id = s.id
                  ),
                  '[]'::json
                )
              )
              ORDER BY s.id
            )
            FROM country_profile_sources s
            WHERE s.profile_id = cp.id
          ),
          '[]'::json
        ) AS sources

      FROM countries c
      JOIN country_profiles cp
        ON cp.country_id = c.id

      WHERE c.is_active = TRUE
        AND cp.status = 'published'

      ORDER BY c.name_en;
    `;

    const enrichedCountries = countries.map((country) => {
      if (String(country.iso3 || "").toUpperCase() !== "FRA") return country;

      const values = Array.isArray(country.values) ? [...country.values] : [];
      if (values.length >= 5) {
        const recordedSecurity = Number(values[4]);
        if (Number.isFinite(recordedSecurity)) {
          values[4] = Math.max(0, recordedSecurity - FRANCE_SECURITY_ADJUSTMENT);
        }
      }

      const watch = simplifyFranceWatch([
        ...(Array.isArray(country.watch) ? country.watch : []),
        FRANCE_CYBER_EVIDENCE.watch,
      ]);

      return {
        ...country,
        values,
        watch,
        sources: [...(Array.isArray(country.sources) ? country.sources : []), ...FRANCE_CYBER_EVIDENCE.sources],
      };
    });

    const jurisdictions = await sql`
      SELECT
        CASE
          WHEN parent_identifier.value IS NOT NULL
               AND jurisdiction_identifier.scheme = 'ISO_3166_2'
          THEN parent_identifier.value || '-' || split_part(jurisdiction_identifier.value, '-', 2)
          ELSE jurisdiction_identifier.value
        END AS iso3,
        jurisdiction_identifier.value AS jurisdiction_code,
        ge.canonical_name AS name,
        et.code AS entity_type,
        parent_identifier.value AS parent_iso3,
        parent.canonical_name AS parent_name,

        COALESCE(cp.version_label, cp.version::text) AS version,
        cp.status,
        cp.subtitle,
        cp.assessment_date,
        cp.published_at,

        (
          SELECT a.overall_score
          FROM country_profile_assessments a
          WHERE a.profile_id = cp.id
          ORDER BY a.id DESC
          LIMIT 1
        ) AS overall_score,

        COALESCE(
          (
            SELECT json_build_object(
              'assessment_status', a.assessment_status,
              'assessment_method', a.assessment_method,
              'confidence_level', a.confidence_level,
              'review_notes', a.review_notes,
              'reviewed_at', a.reviewed_at,
              'published_at', a.published_at,
              'overall_score', a.overall_score
            )
            FROM country_profile_assessments a
            WHERE a.profile_id = cp.id
            ORDER BY a.id DESC
            LIMIT 1
          ),
          '{}'::json
        ) AS assessment,

        COALESCE(
          (
            SELECT json_agg(s.score ORDER BY d.display_order)
            FROM country_profile_scores s
            JOIN iml_domains d ON d.code = s.domain_code
            WHERE s.profile_id = cp.id
          ),
          '[]'::json
        ) AS values,

        COALESCE(
          (
            SELECT json_agg(n.note_text ORDER BY n.display_order)
            FROM country_profile_notes n
            WHERE n.profile_id = cp.id AND n.note_type = 'strength'
          ),
          '[]'::json
        ) AS strengths,

        COALESCE(
          (
            SELECT json_agg(n.note_text ORDER BY n.display_order)
            FROM country_profile_notes n
            WHERE n.profile_id = cp.id AND n.note_type = 'watch'
          ),
          '[]'::json
        ) AS watch,

        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'title', s.title,
                'publisher', s.publisher,
                'url',
                CASE
                  WHEN s.url_status IN ('verified', 'redirected')
                    THEN s.public_url
                  ELSE NULL
                END,
                'url_status', COALESCE(s.url_status, 'unverified'),
                'documentary_url', s.source_url,
                'last_checked_at', s.last_checked_at,
                'replacement_reason', s.replacement_reason,
                'publication_date', s.publication_date,
                'accessed_at', s.accessed_at,
                'note', s.evidence_note,
                'indicators',
                COALESCE(
                  (
                    SELECT json_agg(
                      json_build_object(
                        'code', i.indicator_code,
                        'evidence_level', i.evidence_level,
                        'support_type', i.support_type,
                        'summary', i.evidence_summary,
                        'limitation', i.limitation_note
                      )
                      ORDER BY i.indicator_code
                    )
                    FROM country_profile_source_indicators i
                    WHERE i.source_id = s.id
                  ),
                  '[]'::json
                )
              )
              ORDER BY s.id
            )
            FROM country_profile_sources s
            WHERE s.profile_id = cp.id
          ),
          '[]'::json
        ) AS sources

      FROM geo_entities ge
      JOIN geo_entity_types et
        ON et.id = ge.entity_type_id
      JOIN geo_identifiers jurisdiction_identifier
        ON jurisdiction_identifier.entity_id = ge.id
       AND jurisdiction_identifier.is_primary = TRUE
       AND jurisdiction_identifier.valid_to IS NULL
      JOIN geo_relations gr
        ON gr.from_entity_id = ge.id
       AND gr.valid_to IS NULL
      JOIN geo_relation_types rt
        ON rt.id = gr.relation_type_id
       AND rt.code = 'administrative_part_of'
      JOIN geo_entities parent
        ON parent.id = gr.to_entity_id
      JOIN geo_identifiers parent_identifier
        ON parent_identifier.entity_id = parent.id
       AND parent_identifier.scheme = 'ISO_3166_1_ALPHA3'
       AND parent_identifier.valid_to IS NULL
      JOIN country_profiles cp
        ON cp.geo_entity_id = ge.id
       AND cp.status = 'published'

      WHERE et.code <> 'country'
        AND ge.status = 'active'

      ORDER BY parent.canonical_name, ge.canonical_name;
    `;

    return Response.json(
      {
        count: enrichedCountries.length,
        countries: enrichedCountries,
        jurisdiction_count: jurisdictions.length,
        jurisdictions,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("Unable to load IML country profiles:", error);

    return Response.json(
      { error: "Unable to load country profiles." },
      { status: 500 }
    );
  }
}
