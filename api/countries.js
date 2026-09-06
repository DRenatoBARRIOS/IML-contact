import { neon } from "@neondatabase/serverless";
import { seedUzbekistan } from "../db/seeds/20260822_uzbekistan.mjs";

const FRANCE_SECURITY_ADJUSTMENT = 20;

const COUNTRY_CONTINUITY = [
  { iso3: "UZB", seed: seedUzbekistan },
];

async function ensurePublishedCountryContinuity(sql) {
  if (process.env.VERCEL_ENV !== "preview") return;

  const previewBranch = String(process.env.VERCEL_GIT_COMMIT_REF || "");
  if (!["main", "main-test"].includes(previewBranch)) return;

  for (const entry of COUNTRY_CONTINUITY) {
    const rows = await sql`
      SELECT EXISTS (
        SELECT 1
        FROM countries c
        JOIN country_profiles cp ON cp.country_id = c.id
        WHERE c.iso3 = ${entry.iso3}
          AND c.is_active = TRUE
          AND cp.status = 'published'
      ) AS ready;
    `;

    if (!rows[0]?.ready) {
      await entry.seed(sql);
    }
  }
}

const FRANCE_CYBER_EVIDENCE = {
  watch: "Security: repeated hospital cyber incidents reveal a gap between formal safeguards and observed operational resilience.",
  sources: [
    {
      title: "La sécurité informatique des établissements de santé",
      publisher: "Cour des comptes",
      url: "https://www.ccomptes.fr/sites/default/files/2024-12/20250103-S2024-1456-La-securite-informatique-des-etablissements-de-sante.pdf",
      publication_date: "2025-01-03",
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
      url: "https://www.cert.ssi.gouv.fr/uploads/CERTFR-2024-CTI-010.pdf",
      publication_date: "2024-11-07",
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
      publication_date: "2026-05-11",
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
      publication_date: "2022-09-28",
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

function institutionalSourceKey(source) {
  const publisher = String(source?.publisher || "").toLowerCase();
  const url = String(source?.url || source?.documentary_url || "").toLowerCase();

  if (publisher.includes("cour des comptes")) return "cour-des-comptes";
  if (publisher.includes("anssi") || publisher.includes("cert-fr") || url.includes("cert.ssi.gouv.fr")) return "anssi-cert-fr";
  if (publisher.includes("cert santé") || publisher.includes("agence du numérique en santé") || url.includes("cyberveille.esante.gouv.fr")) return "cert-sante-ans";
  return `${publisher}|${url}|${source?.title || ""}`;
}

function deduplicateInstitutionalSources(sources) {
  const seen = new Set();
  return (Array.isArray(sources) ? sources : []).filter((source) => {
    const key = institutionalSourceKey(source);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function GET() {
  if (!process.env.DATABASE_URL) {
    return Response.json(
      { error: "DATABASE_URL is not available." },
      { status: 500 }
    );
  }

  try {
    const sql = neon(process.env.DATABASE_URL);

    await ensurePublishedCountryContinuity(sql);

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

      const sources = deduplicateInstitutionalSources([
        ...(Array.isArray(country.sources) ? country.sources : []),
        ...FRANCE_CYBER_EVIDENCE.sources,
      ]);

      return {
        ...country,
        values,
        watch,
        sources,
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