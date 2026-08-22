// Uzbekistan exploratory Country Profile v0.1 -> IML PostgreSQL schema.
// Documentary review date: 2026-08-22.
// Database profile version 1 corresponds to documentary version 0.1.

const SOURCES = [
  {
    title: "Uzbekistan Digital Health Platform — national FHIR implementation guide",
    publisher: "Ministry of Health of the Republic of Uzbekistan",
    url: "https://dhp.uz/fhir/core/en/index.html",
    publicationDate: null,
    accessedAt: "2026-08-22",
    note: "The official national implementation guide documents FHIR R5, UZ Core profiles, national terminologies and a broad Digital Health Platform architecture; it explicitly states that the guide remains a draft and is not yet ready for production use.",
    indicators: [
      {
        code: "UZ-TEC-01",
        evidenceLevel: "A",
        supportType: "supports",
        summary: "Uzbekistan has a country-specific FHIR R5 implementation guide intended to standardize clinical data representation and interoperability across the national Digital Health Platform.",
        limitation: "The implementation guide is still in draft/experimental status, so it demonstrates strong technical foundations rather than completed nationwide production interoperability."
      }
    ]
  },
  {
    title: "DMED national digitisation coverage — 3,050 institutions connected",
    publisher: "UZINFOCOM",
    url: "https://uzinfocom.uz/news/344",
    publicationDate: "2025-08-07",
    accessedAt: "2026-08-22",
    note: "UZINFOCOM reports that 3,050 medical institutions were connected to DMED, representing 93% of primary, secondary and tertiary medical organizations nationally at the time of publication.",
    indicators: [
      {
        code: "UZ-ADP-01",
        evidenceLevel: "A",
        supportType: "supports",
        summary: "DMED had reached broad institutional deployment, with 3,050 connected facilities reported as 93% of primary, secondary and tertiary medical organizations.",
        limitation: "This is a point-in-time implementation snapshot and does not establish the completeness of semantic interoperability, private-provider participation or quality of routine use in every connected institution."
      }
    ]
  },
  {
    title: "DMED patient application",
    publisher: "Ministry of Health of the Republic of Uzbekistan",
    url: "https://gov.uz/en/ssv/sections/view/89522",
    publicationDate: "2025-09-30",
    accessedAt: "2026-08-22",
    note: "The Ministry describes routine patient-facing DMED functions including appointment booking, laboratory results, electronic prescriptions and access to a personal medical record.",
    indicators: [
      {
        code: "UZ-ADP-02",
        evidenceLevel: "A",
        supportType: "supports",
        summary: "DMED provides concrete patient-facing digital services that are already described as available rather than merely planned.",
        limitation: "The page does not quantify national active-user rates, provider coverage or completeness of longitudinal records."
      }
    ]
  },
  {
    title: "DMED authentication through OneID",
    publisher: "UZINFOCOM",
    url: "https://uzinfocom.uz/en/news/457",
    publicationDate: "2025-11-28",
    accessedAt: "2026-08-22",
    note: "UZINFOCOM states that access to the unified DMED medical information system has used OneID authentication exclusively since 17 November 2025.",
    indicators: [
      {
        code: "UZ-IDT-01",
        evidenceLevel: "A",
        supportType: "supports",
        summary: "DMED is connected to the national OneID authentication environment, providing a documented trusted-access mechanism for the medical information system.",
        limitation: "Authentication through OneID does not by itself demonstrate complete patient matching, consent, authorization and provenance controls across every clinical subsystem."
      }
    ]
  },
  {
    title: "Ministry of Health information on protection of personal data",
    publisher: "Ministry of Health of the Republic of Uzbekistan",
    url: "https://gov.uz/ru/ssv/pages/saytga-ma-lumot",
    publicationDate: null,
    accessedAt: "2026-08-22",
    note: "The Ministry cites Uzbekistan's Personal Data Law No. ZRU-547 and describes legal, organizational and technical duties for integrity, confidentiality and prevention of unlawful processing.",
    indicators: [
      {
        code: "UZ-SEC-01",
        evidenceLevel: "B",
        supportType: "supports",
        summary: "A national legal framework establishes explicit confidentiality and protection duties for personal data, including technical and organizational safeguards.",
        limitation: "The legal framework does not demonstrate how uniformly security controls, incident response, audit logging and resilience are implemented across health organizations."
      }
    ]
  },
  {
    title: "Digital Healthcare Management Unit — standardization and governance mandate",
    publisher: "Ministry of Health of the Republic of Uzbekistan",
    url: "https://gov.uz/en/ssv/sections/view/68436",
    publicationDate: "2025-07-14",
    accessedAt: "2026-08-22",
    note: "The Ministry's Digital Healthcare Management Unit mandate includes national/international standards alignment, standardized integration, data-security and privacy compliance, stakeholder collaboration, evaluation and continuous improvement.",
    indicators: [
      {
        code: "UZ-GOV-02",
        evidenceLevel: "A",
        supportType: "supports",
        summary: "The Ministry has a dedicated digital-health management function with explicit responsibilities for standards, integration and coordination.",
        limitation: "The cited recruitment/terms-of-reference page establishes intended institutional responsibilities rather than independently measured governance performance."
      },
      {
        code: "UZ-SEC-02",
        evidenceLevel: "B",
        supportType: "partially_supports",
        summary: "Data-security and privacy compliance are explicit responsibilities within the digital-health standardization mandate.",
        limitation: "Operational cybersecurity maturity, incident handling and continuity controls require separate verification."
      },
      {
        code: "UZ-LRN-01",
        evidenceLevel: "B",
        supportType: "partially_supports",
        summary: "The mandate explicitly includes ongoing evaluation and improvement of digital-health programs.",
        limitation: "The source defines a learning responsibility but does not document a mature national feedback loop with published outcome metrics."
      }
    ]
  },
  {
    title: "Digital medicine — new information modules and KPI monitoring",
    publisher: "Ministry of Health of the Republic of Uzbekistan",
    url: "https://gov.uz/oz/ssv/news/view/132660",
    publicationDate: "2026-02-14",
    accessedAt: "2026-08-22",
    note: "The Ministry reports new digital-health modules, integration work with social-protection and state health-insurance systems, training plans, and an automated KPI system intended to assess health-worker performance.",
    indicators: [
      {
        code: "UZ-ADP-03",
        evidenceLevel: "A",
        supportType: "supports",
        summary: "Digital modules are being extended into specialized centers, pharmacies and cross-agency workflows, showing active implementation beyond a single pilot.",
        limitation: "The source describes deployment and training plans; uniform operational use across the entire country is not yet demonstrated."
      },
      {
        code: "UZ-LRN-02",
        evidenceLevel: "B",
        supportType: "partially_supports",
        summary: "An automated KPI system is planned as part of the digital reform, indicating movement toward systematic performance monitoring.",
        limitation: "The source does not yet show longitudinal KPI results, audit cycles or demonstrated improvement from feedback."
      }
    ]
  },
  {
    title: "Elektron Salomatlik — national PACS procurement",
    publisher: "Ministry of Health of the Republic of Uzbekistan",
    url: "https://gov.uz/en/ssv/sections/view/148606",
    publicationDate: "2026-04-01",
    accessedAt: "2026-08-22",
    note: "The Ministry is procuring a Picture Archiving and Communication System under the Support to Digital Reform in the Health Sector — Elektron Salomatlik project.",
    indicators: [
      {
        code: "UZ-TEC-02",
        evidenceLevel: "A",
        supportType: "supports",
        summary: "National procurement is extending digital-health infrastructure into medical imaging through PACS.",
        limitation: "A procurement notice demonstrates funded implementation activity, not completed installation, interoperability or nationwide clinical use."
      }
    ]
  }
];

export async function seedUzbekistan(sql) {
  const countryRows = await sql`
    INSERT INTO countries (
      iso3, slug, name_en, map_x, map_y, label_dx, label_dy, text_size, is_active
    ) VALUES (
      'UZB', 'uzbekistan', 'Uzbekistan', 680, 137, 12, 2, 13, TRUE
    )
    ON CONFLICT (iso3) DO UPDATE SET
      slug = EXCLUDED.slug,
      name_en = EXCLUDED.name_en,
      map_x = EXCLUDED.map_x,
      map_y = EXCLUDED.map_y,
      label_dx = EXCLUDED.label_dx,
      label_dy = EXCLUDED.label_dy,
      text_size = EXCLUDED.text_size,
      is_active = TRUE,
      updated_at = NOW()
    RETURNING id;
  `;
  const countryId = countryRows[0].id;

  const profileRows = await sql`
    INSERT INTO country_profiles (
      country_id, version, status, subtitle, assessment_date, published_at
    ) VALUES (
      ${countryId},
      1,
      'published',
      ${"Exploratory evidence profile documenting Uzbekistan's rapidly developing national Digital Health Platform, FHIR-based interoperability work, DMED services, trusted access and ongoing implementation across public and private care."},
      '2026-08-22',
      '2026-08-22T00:00:00.000Z'
    )
    ON CONFLICT (country_id, version) DO UPDATE SET
      status = EXCLUDED.status,
      subtitle = EXCLUDED.subtitle,
      assessment_date = EXCLUDED.assessment_date,
      published_at = EXCLUDED.published_at,
      updated_at = NOW()
    RETURNING id;
  `;
  const profileId = profileRows[0].id;

  await sql`DELETE FROM country_profile_sources WHERE profile_id = ${profileId};`;
  await sql`DELETE FROM country_profile_notes WHERE profile_id = ${profileId};`;
  await sql`DELETE FROM country_profile_scores WHERE profile_id = ${profileId};`;

  await sql`
    INSERT INTO country_profile_scores (profile_id, domain_code, score) VALUES
      (${profileId}, 'governance', 70),
      (${profileId}, 'technical', 78),
      (${profileId}, 'identity', 68),
      (${profileId}, 'adoption', 72),
      (${profileId}, 'security', 60),
      (${profileId}, 'learning', 67);
  `;

  const strengths = [
    "Uzbekistan has a national Digital Health Platform with a country-specific FHIR R5 implementation guide and UZ Core profiles for interoperable clinical data.",
    "UZINFOCOM reported 3,050 medical institutions connected to DMED, representing 93% of primary, secondary and tertiary medical organizations at the time of publication.",
    "DMED exposes patient-facing functions including appointments, test results, electronic prescriptions and a personal medical record, with OneID used for authentication.",
    "Digital-health governance explicitly includes standardization, privacy/security compliance and continuous evaluation, while PACS and cross-agency integrations are being expanded."
  ];

  const watch = [
    "The national FHIR implementation guide explicitly remains a draft and is not yet ready for production use; interoperability maturity should therefore be reassessed as stable releases appear.",
    "Broad DMED institutional coverage does not by itself prove complete semantic interoperability, uniform quality of use or full participation of private providers.",
    "Legal and governance evidence for privacy and security is stronger than public evidence of operational cybersecurity, incident response, resilience and audit performance.",
    "Several major components, including PACS deployment and KPI monitoring, are still in implementation or procurement phases; national coverage and measurable outcomes need follow-up."
  ];

  for (let index = 0; index < strengths.length; index += 1) {
    await sql`
      INSERT INTO country_profile_notes (profile_id, note_type, display_order, note_text)
      VALUES (${profileId}, 'strength', ${index + 1}, ${strengths[index]});
    `;
  }
  for (let index = 0; index < watch.length; index += 1) {
    await sql`
      INSERT INTO country_profile_notes (profile_id, note_type, display_order, note_text)
      VALUES (${profileId}, 'watch', ${index + 1}, ${watch[index]});
    `;
  }

  let indicatorCount = 0;
  for (const source of SOURCES) {
    const sourceRows = await sql`
      INSERT INTO country_profile_sources (
        profile_id, title, publisher, source_url, publication_date, accessed_at,
        evidence_note, public_url, url_status, last_checked_at
      ) VALUES (
        ${profileId}, ${source.title}, ${source.publisher}, ${source.url},
        ${source.publicationDate}, ${source.accessedAt}, ${source.note},
        ${source.url}, 'verified', ${source.accessedAt}
      )
      RETURNING id;
    `;
    const sourceId = sourceRows[0].id;

    for (const indicator of source.indicators) {
      await sql`
        INSERT INTO country_profile_source_indicators (
          source_id, indicator_code, evidence_level, support_type,
          evidence_summary, limitation_note, evidence_direction,
          evidence_scope, implementation_status
        ) VALUES (
          ${sourceId}, ${indicator.code}, ${indicator.evidenceLevel},
          ${indicator.supportType}, ${indicator.summary}, ${indicator.limitation},
          'unknown', 'unknown', 'not_assessed'
        );
      `;
      indicatorCount += 1;
    }
  }

  const counts = await sql`
    SELECT
      (SELECT COUNT(*)::int FROM country_profile_scores WHERE profile_id = ${profileId}) AS scores,
      (SELECT COUNT(*)::int FROM country_profile_notes WHERE profile_id = ${profileId}) AS notes,
      (SELECT COUNT(*)::int FROM country_profile_sources WHERE profile_id = ${profileId}) AS sources,
      (
        SELECT COUNT(*)::int
        FROM country_profile_source_indicators i
        JOIN country_profile_sources s ON s.id = i.source_id
        WHERE s.profile_id = ${profileId}
      ) AS indicators;
  `;

  return {
    iso3: "UZB",
    countryId,
    profileId,
    databaseVersion: 1,
    documentaryVersion: "0.1",
    counts: counts[0],
    insertedIndicators: indicatorCount,
  };
}
