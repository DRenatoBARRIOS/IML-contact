import { neon } from "@neondatabase/serverless";

const FRANCE_CYBER_EVIDENCE = {
  watch: "Cybersecurity remains a material operational risk. Major French hospital incidents include Rouen, Dax, Villefranche-sur-Saône, Corbeil-Essonnes, Versailles, Brest, Rennes, Armentières and Cannes. The 2022 Corbeil-Essonnes attack caused major care disruption and data exfiltration; public official sources identify LockBit 3.0 but do not provide a complete public root-cause account of the initial compromise. CERT Santé recorded 764 security incidents in 2025, confirming that cyber risk is a continuing system-level issue rather than an isolated event.",
  sources: [
    {
      title: "La sécurité informatique des établissements de santé",
      publisher: "Cour des comptes",
      url: "https://www.ccomptes.fr/sites/default/files/2024-12/20250103-S2024-1456-La-securite-informatique-des-etablissements-de-sante.pdf",
      publication_date: "2025-01-03",
      note: "National audit documenting the intensification of cyberattacks affecting French hospitals and citing major incidents including Corbeil-Essonnes, Versailles, Brest, Rennes, Rouen, Armentières and Cannes.",
      indicators: [{
        code: "Security",
        evidence_level: "high",
        support_type: "official audit",
        summary: "Repeated attacks and operational disruption provide direct evidence of persistent cybersecurity and resilience challenges in the hospital sector.",
        limitation: "Incident occurrence alone does not measure the security maturity of every French healthcare institution."
      }]
    },
    {
      title: "Secteur de la santé — État de la menace informatique",
      publisher: "ANSSI / CERT-FR",
      url: "https://www.cert.ssi.gouv.fr/cti/CERTFR-2024-CTI-010/",
      publication_date: "2024-11-07",
      note: "Official threat assessment. Its Corbeil-Essonnes case study records compromise by LockBit 3.0, major disruption to hospital services, transfers of newborns, laboratory disruption and exfiltration of 11 GB of data.",
      indicators: [{
        code: "Security",
        evidence_level: "high",
        support_type: "national cybersecurity authority",
        summary: "The Corbeil-Essonnes incident demonstrates that a cyberattack can directly affect continuity of care, availability of clinical services and confidentiality of health-related data.",
        limitation: "The public case study identifies the ransomware ecosystem but does not publish a complete technical root-cause reconstruction of the initial intrusion."
      }]
    },
    {
      title: "Violation de données du CHSF de Corbeil-Essonnes",
      publisher: "Cybermalveillance.gouv.fr",
      url: "https://www.cybermalveillance.gouv.fr/tous-nos-contenus/actualites/violation-donnees-chsf-formulaire-lettre-plainte-electronique",
      publication_date: "2022-09-28",
      note: "Government victim-assistance notice confirming the 21 August 2022 attack, exfiltration of potentially personal data, notification of affected persons, complaint and CNIL reporting.",
      indicators: [{
        code: "Security",
        evidence_level: "high",
        support_type: "official incident documentation",
        summary: "Confirms the confidentiality dimension of the CHSF incident in addition to the widely documented availability and continuity impacts.",
        limitation: "This source is focused on victim assistance and data exposure, not forensic attribution."
      }]
    },
    {
      title: "Observatoire des incidents — Rapport 2025",
      publisher: "CERT Santé / Agence du Numérique en Santé",
      url: "https://cyberveille.esante.gouv.fr/lobservatoire-des-incidents",
      publication_date: "2026-05-11",
      note: "CERT Santé reports 764 security incidents in 2025 across health and medico-social structures, showing that cybersecurity risk remains recurrent at national scale.",
      indicators: [{
        code: "Security",
        evidence_level: "high",
        support_type: "national incident observatory",
        summary: "National incident reporting supports treating cybersecurity resilience as a continuing maturity dimension rather than a collection of exceptional cases.",
        limitation: "Reported incidents depend partly on reporting practices and should not be interpreted as a direct year-to-year measure of attack prevalence."
      }]
    }
  ]
};

export async function GET() {
  if (!process.env.DATABASE_URL) {
    return Response.json(
      { error: "DATABASE_URL is not available." },
      { status: 500 }
    );
  }

  try {
    const sql = neon(process.env.DATABASE_URL);

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
      return {
        ...country,
        watch: [...(Array.isArray(country.watch) ? country.watch : []), FRANCE_CYBER_EVIDENCE.watch],
        sources: [...(Array.isArray(country.sources) ? country.sources : []), ...FRANCE_CYBER_EVIDENCE.sources],
      };
    });

    return Response.json(
      {
        count: enrichedCountries.length,
        countries: enrichedCountries,
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
