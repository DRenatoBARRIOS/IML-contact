// Uzbekistan exploratory Country Profile v0.1 -> IML PostgreSQL schema.
// Documentary review date: 2026-08-22.
// Database profile version 1 corresponds to documentary version 0.1.

const SOURCES = [
  {
    title: "Uzbekistan Digital Health Platform — national FHIR implementation guide",
    publisher: "Ministry of Health of the Republic of Uzbekistan",
    url: "https://dhp.uz/fhir/core/en/index.html",
    publicUrl: "https://dhp.uz/fhir/core/en/index.html",
    publicationDate: null,
    accessedAt: "2026-08-22",
    note: "The official national implementation guide documents FHIR R5, UZ Core profiles, national terminologies and a broad Digital Health Platform architecture; it explicitly states that the guide remains a draft and is not yet ready for production use.",
    indicators: [{
      code: "UZ-TEC-01",
      evidenceLevel: "A",
      supportType: "supports",
      summary: "Uzbekistan has a country-specific FHIR R5 implementation guide intended to standardize clinical data representation and interoperability across the national Digital Health Platform.",
      limitation: "The implementation guide is still in draft/experimental status, so it demonstrates strong technical foundations rather than completed nationwide production interoperability."
    }]
  },
  {
    title: "DMED — unified medical system",
    publisher: "UZINFOCOM",
    url: "https://uzinfocom.uz/projects/dmed-en-18",
    publicUrl: "https://uzinfocom.uz/projects/dmed-en-18",
    publicationDate: "2024-07-09",
    accessedAt: "2026-08-22",
    note: "UZINFOCOM's stable project page describes DMED as the unified medical system developed for digitising the Ministry of Health, including a unified medical passport, telemedicine and electronic prescriptions.",
    indicators: [{
      code: "UZ-ADP-01",
      evidenceLevel: "A",
      supportType: "supports",
      summary: "DMED is documented as an operational national medical system with concrete patient and clinical functions rather than only a planned platform.",
      limitation: "The project page does not independently quantify nationwide facility coverage, active use or completeness of records."
    }]
  },
  {
    title: "DMED patient application",
    publisher: "Ministry of Health of the Republic of Uzbekistan",
    url: "https://gov.uz/en/ssv/sections/view/89522",
    publicUrl: "https://gov.uz/en/ssv/sections/view/89522",
    publicationDate: "2025-09-30",
    accessedAt: "2026-08-22",
    note: "The Ministry describes routine patient-facing DMED functions including appointment booking, laboratory results, electronic prescriptions and access to a personal medical record.",
    indicators: [{
      code: "UZ-ADP-02",
      evidenceLevel: "A",
      supportType: "supports",
      summary: "DMED provides concrete patient-facing digital services that are described as available rather than merely planned.",
      limitation: "The page does not quantify national active-user rates, provider coverage or completeness of longitudinal records."
    }]
  },
  {
    title: "OneID — national identification and authentication system",
    publisher: "Unified Interactive Government Services Portal of the Republic of Uzbekistan",
    url: "https://my.gov.uz/uz/page/oneid-about",
    publicUrl: "https://my.gov.uz/uz/page/oneid-about",
    publicationDate: null,
    accessedAt: "2026-08-22",
    note: "The official MyGov page describes OneID as the unified identification system for access to public and other information systems, including identity attributes, authentication results and additional authentication methods.",
    indicators: [{
      code: "UZ-IDT-01",
      evidenceLevel: "A",
      supportType: "partially_supports",
      summary: "Uzbekistan has a reusable national identification and authentication layer that can underpin trusted access to digital services.",
      limitation: "This source establishes the national identity layer but does not by itself prove patient matching, consent, authorization or provenance controls inside every health application."
    }]
  },
  {
    title: "Ministry of Health information on protection of personal data",
    publisher: "Ministry of Health of the Republic of Uzbekistan",
    url: "https://gov.uz/ru/ssv/pages/saytga-ma-lumot",
    publicUrl: "https://gov.uz/ru/ssv/pages/saytga-ma-lumot",
    publicationDate: null,
    accessedAt: "2026-08-22",
    note: "The Ministry cites Uzbekistan's Personal Data Law No. ZRU-547 and describes legal, organizational and technical duties for integrity, confidentiality and prevention of unlawful processing.",
    indicators: [{
      code: "UZ-SEC-01",
      evidenceLevel: "B",
      supportType: "supports",
      summary: "A national legal framework establishes explicit confidentiality and protection duties for personal data, including technical and organizational safeguards.",
      limitation: "The legal framework does not demonstrate how uniformly security controls, incident response, audit logging and resilience are implemented across health organizations."
    }]
  },
  {
    title: "Ministry clinical protocol demonstrating ICD-11 coding",
    publisher: "Ministry of Health of the Republic of Uzbekistan",
    url: "https://gov.uz/ru/ssv/sections/view/138350",
    publicUrl: "https://gov.uz/ru/ssv/sections/view/138350",
    publicationDate: null,
    accessedAt: "2026-08-22",
    note: "The official Ministry of Health clinical protocol for obesity in children and adolescents explicitly presents ICD-10 and ICD-11 codes. This is direct country-specific evidence that ICD-11 coding appears in current Uzbek clinical protocol publication, but it does not by itself establish nationwide ICD-11 migration or a national ICD API.",
    indicators: [{
      code: "UZ-TEC-02",
      evidenceLevel: "B",
      supportType: "partially_supports",
      summary: "A current Ministry of Health clinical protocol explicitly presents ICD-11 coding alongside ICD-10, demonstrating concrete use of ICD-11 terminology in national clinical documentation.",
      limitation: "A single published protocol does not demonstrate nationwide ICD-11 migration, complete terminology services, or end-to-end interoperability across health information systems."
    }]
  },
  {
    title: "BI Platform — health data analytics and decision support",
    publisher: "UZINFOCOM",
    url: "https://uzinfocom.uz/projects/the-bi-platform-project-en-32",
    publicUrl: "https://uzinfocom.uz/projects/the-bi-platform-project-en-32",
    publicationDate: "2024-08-05",
    accessedAt: "2026-08-22",
    note: "UZINFOCOM describes a Ministry of Health BI platform integrating multiple health systems and supporting data-driven management, transparency, accountability and clinical or operational decision-making.",
    indicators: [
      {
        code: "UZ-LRN-01",
        evidenceLevel: "A",
        supportType: "supports",
        summary: "A dedicated health BI platform provides an operational basis for integrating data from multiple systems and using analytics for management and decision support.",
        limitation: "The public project page does not provide independent evaluation of data quality, routine use by all institutions or measurable improvement attributable to the platform."
      },
      {
        code: "UZ-ADP-03",
        evidenceLevel: "B",
        supportType: "partially_supports",
        summary: "The BI platform connects several existing national health information systems, showing use of shared digital data beyond a single application.",
        limitation: "The listed integrations do not establish complete nationwide semantic interoperability."
      }
    ]
  },
  {
    title: "National Health Compact — Uzbekistan",
    publisher: "Government of the Republic of Uzbekistan / World Bank Group",
    url: "https://thedocs.worldbank.org/en/doc/0273f33ab6ee48c5d842108b9b55c789-0140022025/related/National-Health-Compact-Uzbekistan.pdf",
    publicUrl: null,
    publicationDate: null,
    accessedAt: "2026-08-22",
    note: "The National Health Compact is a country-specific strategic document linking current health reforms to digital transformation, electronic medical records, digital information systems, nationwide performance monitoring and explicit implementation targets. It is retained as documentary evidence but not exposed as a public button until the automated audit can inspect PDF content reliably.",
    indicators: [
      {
        code: "UZ-GOV-02",
        evidenceLevel: "A",
        supportType: "supports",
        summary: "The national reform compact assigns digital-transformation responsibilities and measurable targets to government bodies.",
        limitation: "The compact contains commitments and targets; it should not be read as evidence that all targets have already been achieved."
      },
      {
        code: "UZ-LRN-02",
        evidenceLevel: "A",
        supportType: "supports",
        summary: "The compact includes nationwide performance-monitoring objectives and digital management targets, providing a formal basis for learning and accountability.",
        limitation: "Public longitudinal outcome data are still needed to assess whether the monitoring loop consistently changes policy or care."
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
      ${"Exploratory evidence profile documenting Uzbekistan's national Digital Health Platform, FHIR-based interoperability work, DMED services, national identity infrastructure and data-driven health-system reform."},
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
      (${profileId}, 'identity', 62),
      (${profileId}, 'adoption', 70),
      (${profileId}, 'security', 58),
      (${profileId}, 'learning', 68);
  `;

  const strengths = [
    "Uzbekistan has a national Digital Health Platform with a country-specific FHIR R5 implementation guide and UZ Core profiles for interoperable clinical data.",
    "DMED is documented as a unified medical system with patient-facing services including digital medical records, telemedicine and electronic prescriptions.",
    "The Ministry of Health publishes current clinical protocols that explicitly include ICD-11 coding alongside ICD-10, providing direct evidence of standards uptake in national clinical documentation.",
    "A dedicated health BI platform and the National Health Compact provide foundations for data-driven management, monitoring and continued digital transformation."
  ];

  const watch = [
    "The national FHIR implementation guide explicitly remains a draft and is not yet ready for production use; interoperability maturity should therefore be reassessed as stable releases appear.",
    "The stable public sources establish active national systems but do not yet provide an independently verified national denominator for facility coverage or routine clinical use.",
    "Legal evidence for privacy and security is stronger than public evidence of operational cybersecurity, incident response, resilience and audit performance.",
    "The National Health Compact contains forward-looking targets and commitments; achievement of these targets should be verified with later operational and outcome data."
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
    const publicUrl = source.publicUrl === undefined ? source.url : source.publicUrl;
    const urlStatus = publicUrl ? 'verified' : 'unverified';
    const sourceRows = await sql`
      INSERT INTO country_profile_sources (
        profile_id, title, publisher, source_url, publication_date, accessed_at,
        evidence_note, public_url, url_status, last_checked_at
      ) VALUES (
        ${profileId}, ${source.title}, ${source.publisher}, ${source.url},
        ${source.publicationDate}, ${source.accessedAt}, ${source.note},
        ${publicUrl}, ${urlStatus}, ${source.accessedAt}
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
