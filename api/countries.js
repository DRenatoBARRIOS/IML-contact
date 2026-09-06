import { neon } from "@neondatabase/serverless";

const FRANCE_SECURITY_ADJUSTMENT = 15;

const FRANCE_CYBER_EVIDENCE = {
  watch: "Security score adjusted downward by 15 points in the France working profile because repeated hospital cyber incidents have produced documented impacts on availability, continuity of care, confidentiality and recovery. This is a provisional evidence adjustment at country-profile level: it does not imply that every French healthcare institution has the same level of security maturity. Major incidents include Rouen, Dax, Villefranche-sur-Saône, Corbeil-Essonnes, Versailles, Brest, Rennes, Armentières and Cannes. The 2022 Corbeil-Essonnes attack caused major care disruption and data exfiltration; public official sources identify LockBit 3.0 but do not provide a complete public root-cause account of the initial compromise. CERT Santé recorded 764 security incidents in 2025, confirming that cyber risk is a continuing system-level issue rather than an isolated event.",
  sources: [
    {
      title: "La sécurité informatique des établissements de santé",
      publisher: "Cour des comptes",
      url: "https://www.ccomptes.fr/sites/default/files/2024-12/20250103-S2024-1456-La-securite-informatique-des-etablissements-de-sante.pdf",
      publication_date: "2025-01-03",
      note: "National audit documenting the intensification of cyberattacks affecting French hospitals. It cites the CHU de Rouen and Dax-Côte d’Argent as early large-scale incidents, then Corbeil-Essonnes and Versailles in 2022, followed in 2023 by Brest, Rennes, Rouen, Ouest-Vosgien, Diaconesses-Croix Saint-Simon, Ramsay and Elsan facilities, and in 2024 by Armentières and Cannes.",
      indicators: [{
        code: "Security",
        evidence_level: "high",
        support_type: "official audit",
        summary: "Repeated attacks across multiple institutions and years provide direct evidence of persistent cybersecurity and resilience challenges in the French hospital sector.",
        limitation: "Incident occurrence alone does not measure the security maturity of every French healthcare institution, and France has comparatively strong mandatory incident-reporting obligations."
      }]
    },
    {
      title: "Secteur de la santé — État de la menace informatique",
      publisher: "ANSSI / CERT-FR",
      url: "https://www.cert.ssi.gouv.fr/uploads/CERTFR-2024-CTI-010.pdf",
      publication_date: "2024-11-07",
      note: "Official threat assessment listing ransomware incidents affecting French hospitals since 2020, including Sud Francilien, Versailles, La Réunion, Brest, Rennes, Ouest Vosgien, Armentières and Cannes. The report notes that attackers generally succeed in encrypting part or all of compromised systems and documents a range of ransomware families including LockBit 3.0.",
      indicators: [{
        code: "Security",
        evidence_level: "high",
        support_type: "national cybersecurity authority",
        summary: "The repeated use of ransomware against healthcare providers supports a lower resilience score because compromise has repeatedly affected system availability and recovery burden.",
        limitation: "The report is a threat assessment, not a comparative maturity audit of all French hospitals."
      }]
    },
    {
      title: "Corbeil-Essonnes / Centre hospitalier Sud Francilien — case study",
      publisher: "ANSSI / CERT-FR",
      url: "https://www.cert.ssi.gouv.fr/uploads/CERTFR-2024-CTI-010.pdf",
      publication_date: "2024-11-07",
      note: "The ANSSI case study records compromise by LockBit 3.0, major disruption to hospital services, transfers of newborns, laboratory disruption and exfiltration of about 11 GB of data. It shows direct consequences for care continuity and confidentiality.",
      indicators: [{
        code: "Security",
        evidence_level: "high",
        support_type: "official incident case study",
        summary: "Corbeil-Essonnes is strong evidence that cybersecurity failure can become a clinical continuity event, not only an IT incident.",
        limitation: "The public case study identifies the ransomware ecosystem and observed consequences but does not publish a complete technical root-cause reconstruction of the initial intrusion."
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
        summary: "Confirms the confidentiality dimension of the CHSF incident in addition to the documented availability and continuity impacts.",
        limitation: "This source is focused on victim assistance and data exposure, not forensic attribution."
      }]
    },
    {
      title: "CHU de Brest — FIN12 intrusion analysis",
      publisher: "CERT Santé / ANSSI",
      url: "https://cyberveille.esante.gouv.fr/actualites/france-lanssi-publie-un-rapport-concernant-fin12-2023-09-27",
      publication_date: "2023-09-27",
      note: "The CHU de Brest attack is linked by ANSSI analysis to FIN12. Initial access was obtained through remote desktop using stolen credentials, followed by attempts to exploit multiple vulnerabilities and use credential-dumping and reconnaissance tools for privilege escalation and lateral movement.",
      indicators: [{
        code: "Security",
        evidence_level: "high",
        support_type: "official technical analysis",
        summary: "The Brest case demonstrates the combined risk of stolen credentials, exposed remote access and incomplete patching in a hospital environment.",
        limitation: "The published account focuses on attacker techniques and attribution rather than the full operational impact on care."
      }]
    },
    {
      title: "Cyberattaque du centre hospitalier d'Armentières suite à la compromission d'un compte VPN",
      publisher: "CERT Santé",
      url: "https://cyberveille.esante.gouv.fr/retours-d-experience/cyberattaque-du-centre-hospitalier-darmentieres-suite-la-compromission-dun",
      publication_date: "2024-09-16",
      note: "The attacker entered through a compromised VPN account, escalated privileges, obtained domain-level control and encrypted servers and workstations. The hospital activated its Plan Blanc and operated in degraded mode during the response and reconstruction period.",
      indicators: [{
        code: "Security",
        evidence_level: "high",
        support_type: "official return of experience",
        summary: "Armentières provides concrete evidence on access control, privilege escalation, backup protection, crisis response and prolonged degraded operation.",
        limitation: "A single detailed return of experience cannot by itself be generalized to the whole national hospital estate."
      }]
    },
    {
      title: "Attaque par rançongiciel du centre hospitalier de Cannes",
      publisher: "CERT Santé",
      url: "https://cyberveille.esante.gouv.fr/retours-d-experience/attaque-par-rancongiciel-du-centre-hospitalier-de-cannes-2024-10-29",
      publication_date: "2024-10-29",
      note: "The Cannes hospital incident began through a compromised account. The attacker escalated to domain administrator, encrypted a file server and about 15% of workstations, and reached PACS components through an exploited vendor vulnerability. Rapid containment limited clinical impact, but the event required network isolation and degraded operation.",
      indicators: [{
        code: "Security",
        evidence_level: "high",
        support_type: "official return of experience",
        summary: "Cannes shows both vulnerability and resilience: compromise spread across identity, endpoint and imaging infrastructure, while containment reduced patient-care consequences.",
        limitation: "The incident also demonstrates improved detection and response, so it should not be interpreted only as negative evidence."
      }]
    },
    {
      title: "Observatoire des incidents — Rapport 2025",
      publisher: "CERT Santé / Agence du Numérique en Santé",
      url: "https://cyberveille.esante.gouv.fr/lobservatoire-des-incidents",
      publication_date: "2026-05-11",
      note: "CERT Santé reports 764 security incidents in 2025 across health and medico-social structures, with 606 structures declaring at least one incident. The report also notes that only two incidents were classified as major, showing both recurrent exposure and improving response capacity.",
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

      const values = Array.isArray(country.values) ? [...country.values] : [];
      if (values.length >= 5) {
        const recordedSecurity = Number(values[4]);
        if (Number.isFinite(recordedSecurity)) {
          values[4] = Math.max(0, recordedSecurity - FRANCE_SECURITY_ADJUSTMENT);
        }
      }

      return {
        ...country,
        values,
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
