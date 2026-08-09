// Romania profile v0.1 -> existing IML PostgreSQL schema.
//
// The current schema stores profile versions as integers >= 1, so documentary
// profile v0.1 is stored as database version 1. Indicator evidence metadata is
// normalized to the schema's A-E / support_type vocabulary. Documentary text,
// titles, publishers, URLs, dates, notes, indicator codes, summaries and
// limitations are preserved verbatim from romaniaProfile.js.

const SOURCES = [
  {
    title: "Romania 2025 Digital Decade Country Report",
    publisher: "European Commission",
    url: "https://digital-strategy.ec.europa.eu/en/factpages/romania-2025-digital-decade-country-report",
    publicationDate: "2025-06-18",
    accessedAt: "2026-08-09",
    note: "The Commission reports improved availability of eHealth data while recommending further expansion of online data sources and implementation of the health-system digitalisation strategy.",
    indicators: [
      {
        code: "RO-ADP-01",
        evidenceLevel: "A",
        supportType: "supports",
        summary: "Official EU monitoring documents continued investment in digital public services and improved eHealth-data availability.",
        limitation: "The report is a high-level country assessment and does not by itself demonstrate uniform clinical adoption across providers.",
      },
      {
        code: "RO-GOV-01",
        evidenceLevel: "B",
        supportType: "context_only",
        summary: "The Commission identifies adoption and implementation of a national health-system digitalisation strategy as a priority.",
        limitation: "A recommendation signals an active policy need rather than completed governance implementation.",
      },
    ],
  },
  {
    title: "Digital Decade 2025: eHealth Indicator Study",
    publisher: "European Commission",
    url: "https://digital-strategy.ec.europa.eu/en/library/digital-decade-2025-ehealth-indicator-study",
    publicationDate: "2025-06-16",
    accessedAt: "2026-08-09",
    note: "The 2024 data collection identified Romania among the countries with the largest annual increases in composite eHealth maturity, at +17 percentage points.",
    indicators: [
      {
        code: "RO-TEC-01",
        evidenceLevel: "A",
        supportType: "supports",
        summary: "Romania showed substantial year-on-year improvement in the EU eHealth access indicator.",
        limitation: "The composite indicator focuses on citizens' technical access to EHR data and is not a complete measure of end-to-end clinical interoperability.",
      },
    ],
  },
  {
    title: "Draft Government Decision approving the National Health Digitalisation Strategy 2026–2030",
    publisher: "Romanian Ministry of Health",
    url: "https://www.ms.gov.ro/en/decisional-transparency/normative-acts-in-transparency/proiectul-de-hot%C4%83r%C3%A2rea-guvernului-privind-aprobarea-strategiei-na%C8%9Bionale-de-digitalizare-%C3%AEn-s%C4%83n%C4%83tate-2026-2030/",
    publicationDate: "2026-01-22",
    accessedAt: "2026-08-09",
    note: "The Ministry published the proposed 2026–2030 national strategy and supporting documents for decisional transparency.",
    indicators: [
      {
        code: "RO-GOV-02",
        evidenceLevel: "A",
        supportType: "supports",
        summary: "A national strategic framework for health digitalisation is formally documented by the Ministry of Health.",
        limitation: "The cited page concerns the draft approval process; final adoption and implementation should be verified separately.",
      },
    ],
  },
  {
    title: "MyHealth@EU — information for patients and health professionals",
    publisher: "European Commission, Directorate-General for Health and Food Safety",
    url: "https://health.ec.europa.eu/ehealth-digital-health-and-care/my-rights-over-my-health-data/myhealtheu-flyer-addressed-patients-and-health-professionals_en",
    publicationDate: null,
    accessedAt: "2026-08-09",
    note: "The Commission lists Romania among countries offering MyHealth@EU electronic cross-border health services.",
    indicators: [
      {
        code: "RO-TEC-02",
        evidenceLevel: "A",
        supportType: "supports",
        summary: "Romania participates in the EU cross-border digital-health service environment.",
        limitation: "The listing does not establish that every service, data category or provider is available nationally in every care setting.",
      },
      {
        code: "RO-IDT-01",
        evidenceLevel: "B",
        supportType: "partially_supports",
        summary: "Cross-border electronic health services require trusted patient and professional identification within the EU service framework.",
        limitation: "This source does not provide a detailed assessment of Romania's domestic identity, consent or access-control architecture.",
      },
    ],
  },
  {
    title: "2024 EU4Health Work Programme: new projects advancing digital healthcare across the EU",
    publisher: "European Health and Digital Executive Agency (HaDEA)",
    url: "https://hadea.ec.europa.eu/news/2024-eu4health-work-programme-new-projects-advancing-digital-healthcare-across-eu-2025-12-03_en",
    publicationDate: "2025-12-03",
    accessedAt: "2026-08-09",
    note: "HaDEA reports that the RO-MI-LR-DR project, starting in 2026, aims to develop Romanian services for medical images, laboratory results and discharge reports.",
    indicators: [
      {
        code: "RO-TEC-03",
        evidenceLevel: "A",
        supportType: "supports",
        summary: "Romania has an active project to expand the range of structured health data supported in cross-border exchange.",
        limitation: "The project starting in 2026 demonstrates funded implementation activity, not completed nationwide operational coverage.",
      },
      {
        code: "RO-LRN-01",
        evidenceLevel: "C",
        supportType: "context_only",
        summary: "The project provides a concrete implementation pathway that can generate operational learning about new data categories.",
        limitation: "The source does not document a mature national feedback, audit or learning system.",
      },
    ],
  },
];

export async function seedRomania(sql) {
  const countryRows = await sql`
    INSERT INTO countries (
      iso3, slug, name_en, map_x, map_y, label_dx, label_dy, text_size, is_active
    ) VALUES (
      'ROU', 'romania', 'Romania', 525, 122, 14, 4, 13, TRUE
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
      ${"Exploratory evidence profile documenting Romania's recent progress in digital health, cross-border services and the development of a national health digitalisation strategy."},
      '2026-08-09',
      '2026-08-09T00:00:00.000Z'
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

  // Replace only Romania v0.1/v1 children. Cascades remove source indicators.
  await sql`DELETE FROM country_profile_sources WHERE profile_id = ${profileId};`;
  await sql`DELETE FROM country_profile_notes WHERE profile_id = ${profileId};`;
  await sql`DELETE FROM country_profile_scores WHERE profile_id = ${profileId};`;

  await sql`
    INSERT INTO country_profile_scores (profile_id, domain_code, score) VALUES
      (${profileId}, 'governance', 62),
      (${profileId}, 'technical', 70),
      (${profileId}, 'identity', 60),
      (${profileId}, 'adoption', 64),
      (${profileId}, 'security', 50),
      (${profileId}, 'learning', 52);
  `;

  const strengths = [
    "European Commission monitoring reports substantial recent improvement in access to electronic health data in Romania.",
    "Romania is listed among countries offering MyHealth@EU electronic cross-border health services.",
    "A national health digitalisation strategy for 2026–2030 has been placed in decisional transparency, with interoperability and integrated digital services as central themes.",
    "An EU4Health project starting in 2026 is intended to extend Romanian cross-border services to medical images, laboratory results and discharge reports.",
  ];
  const watch = [
    "Verify the final adoption, implementation timetable and governance arrangements of the National Health Digitalisation Strategy 2026–2030.",
    "The European Commission continues to recommend expansion of health-data sources available online and user-centred implementation.",
    "Current documentary evidence is stronger for infrastructure and access than for routine semantic interoperability across all providers.",
    "Further review is needed on cybersecurity operations, private-provider participation, terminology governance and systematic learning from incidents and outcomes.",
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
        profile_id,
        title,
        publisher,
        source_url,
        publication_date,
        accessed_at,
        evidence_note,
        public_url,
        url_status,
        last_checked_at
      ) VALUES (
        ${profileId},
        ${source.title},
        ${source.publisher},
        ${source.url},
        ${source.publicationDate},
        ${source.accessedAt},
        ${source.note},
        ${source.url},
        'verified',
        ${source.accessedAt}
      )
      RETURNING id;
    `;
    const sourceId = sourceRows[0].id;

    for (const indicator of source.indicators) {
      await sql`
        INSERT INTO country_profile_source_indicators (
          source_id,
          indicator_code,
          evidence_level,
          support_type,
          evidence_summary,
          limitation_note,
          evidence_direction,
          evidence_scope,
          implementation_status
        ) VALUES (
          ${sourceId},
          ${indicator.code},
          ${indicator.evidenceLevel},
          ${indicator.supportType},
          ${indicator.summary},
          ${indicator.limitation},
          'unknown',
          'unknown',
          'not_assessed'
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
    iso3: "ROU",
    countryId,
    profileId,
    databaseVersion: 1,
    documentaryVersion: "0.1",
    counts: counts[0],
    insertedIndicators: indicatorCount,
  };
}
