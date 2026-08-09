// Corrective source-quality patch for the published Romania profile.
//
// This patch is intentionally narrow and idempotent. It does not alter scores,
// profile versioning, unrelated countries, or the country-profile UI.

const CHECKED_AT = "2026-08-09T17:38:28.000Z";

const URLS = {
  digitalDecade: "https://digital-strategy.ec.europa.eu/en/factpages/romania-2025-digital-decade-country-report",
  ehealthStudy: "https://digital-strategy.ec.europa.eu/en/library/digital-decade-2025-ehealth-indicator-study",
  strategy: "https://www.ms.ro/ro/transparenta-decizionala/acte-normative-in-transparenta/proiectul-de-hot%C4%83r%C3%A2re-a-guvernului-privind-aprobarea-strategiei-na%C8%9Bionale-de-digitalizare-%C3%AEn-s%C4%83n%C4%83tate-2026-2030/",
  cnasNcp: "https://cnas.ro/2024/07/19/informare-rezumatul-principalelor-informatii-expuse-in-conferinta-de-presa-a-conducerii-cnas-din-data-de-19-iulie-2024/",
  myHealthEu: "https://health.ec.europa.eu/ehealth-digital-health-and-care/my-rights-over-my-health-data/myhealtheu-flyer-addressed-patients-and-health-professionals_en",
  hadea: "https://hadea.ec.europa.eu/news/2024-eu4health-work-programme-new-projects-advancing-digital-healthcare-across-eu-2025-12-03_en",
};

export async function patchRomaniaSourceQuality(sql) {
  const profiles = await sql`
    SELECT cp.id
    FROM country_profiles cp
    JOIN countries c ON c.id = cp.country_id
    WHERE c.iso3 = 'ROU'
      AND cp.version = 1
      AND cp.status = 'published'
    LIMIT 1;
  `;

  if (profiles.length === 0) {
    throw new Error("Published Romania profile version 1 was not found.");
  }

  const profileId = profiles[0].id;

  await sql`
    UPDATE country_profile_sources
    SET
      source_url = ${URLS.digitalDecade},
      public_url = ${URLS.digitalDecade},
      url_status = 'verified',
      last_checked_at = ${CHECKED_AT},
      replacement_reason = NULL
    WHERE profile_id = ${profileId}
      AND title = 'Romania 2025 Digital Decade Country Report';
  `;

  await sql`
    UPDATE country_profile_sources
    SET
      source_url = ${URLS.ehealthStudy},
      public_url = ${URLS.ehealthStudy},
      url_status = 'verified',
      last_checked_at = ${CHECKED_AT},
      replacement_reason = NULL
    WHERE profile_id = ${profileId}
      AND title = 'Digital Decade 2025: eHealth Indicator Study';
  `;

  await sql`
    UPDATE country_profile_sources
    SET
      source_url = ${URLS.strategy},
      public_url = ${URLS.strategy},
      url_status = 'verified',
      last_checked_at = ${CHECKED_AT},
      replacement_reason = 'Corrected an invalid Ministry of Health path after source audit. The previous public URL returned a 404 page; the canonical ms.ro decisional-transparency page was verified on 9 August 2026.'
    WHERE profile_id = ${profileId}
      AND title = 'Draft Government Decision approving the National Health Digitalisation Strategy 2026–2030';
  `;

  const cnasSources = await sql`
    UPDATE country_profile_sources
    SET
      title = 'Romania National Contact Point for eHealth implementation update',
      publisher = 'Casa Națională de Asigurări de Sănătate (CNAS)',
      source_url = ${URLS.cnasNcp},
      public_url = NULL,
      publication_date = '2024-07-19',
      accessed_at = '2026-08-09',
      evidence_note = 'CNAS reported that Romania had started organising and operationalising its National Contact Point for eHealth for implementation of European ePrescription and Patient Summary services.',
      url_status = 'transient_error',
      last_checked_at = ${CHECKED_AT},
      replacement_reason = 'Romania-specific official documentary evidence retained, but the CNAS page returned HTTP 503 to the automated public-link checker on 9 August 2026. The public link is therefore hidden until a later check succeeds.'
    WHERE profile_id = ${profileId}
      AND title IN (
        'MyHealth@EU — information for patients and health professionals',
        'Romania National Contact Point for eHealth implementation update'
      )
    RETURNING id;
  `;

  const cnasSourceId = cnasSources[0]?.id;
  if (!cnasSourceId) {
    throw new Error("Romania CNAS/MyHealth documentary source row was not found.");
  }

  // The CNAS source supports the Romanian implementation context, but the
  // current MyHealth@EU service-country claim is linked to a separately audited
  // European Commission source below.
  await sql`
    DELETE FROM country_profile_source_indicators
    WHERE source_id = ${cnasSourceId}
      AND indicator_code = 'RO-TEC-02';
  `;

  await sql`
    UPDATE country_profile_source_indicators
    SET
      evidence_level = 'B',
      support_type = 'partially_supports',
      evidence_summary = 'Official CNAS reporting documents Romania''s implementation work for the National Contact Point for eHealth, European ePrescription and Patient Summary services.',
      limitation_note = 'The CNAS page is retained as Romania-specific documentary evidence but was temporarily unavailable to the automated public-link checker on 9 August 2026. It does not provide a detailed assessment of domestic identity, consent or access-control architecture.'
    WHERE source_id = ${cnasSourceId}
      AND indicator_code = 'RO-IDT-01';
  `;

  let myHealthEuRows = await sql`
    SELECT id
    FROM country_profile_sources
    WHERE profile_id = ${profileId}
      AND title = 'MyHealth@EU service-country listing — Romania explicitly listed'
    LIMIT 1;
  `;

  let myHealthEuSourceId;
  if (myHealthEuRows.length === 0) {
    const inserted = await sql`
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
        last_checked_at,
        replacement_reason
      ) VALUES (
        ${profileId},
        'MyHealth@EU service-country listing — Romania explicitly listed',
        'European Commission, Directorate-General for Health and Food Safety',
        ${URLS.myHealthEu},
        NULL,
        '2026-08-09',
        'The European Commission current MyHealth@EU service-country list explicitly includes Romania among the countries offering electronic cross-border health services and describes ePrescriptions and Patient Summaries.',
        ${URLS.myHealthEu},
        'verified',
        ${CHECKED_AT},
        'Added as a separately labelled EU service-country source so that a general European listing is not presented as a Romania-specific national publication.'
      )
      RETURNING id;
    `;
    myHealthEuSourceId = inserted[0].id;
  } else {
    myHealthEuSourceId = myHealthEuRows[0].id;
    await sql`
      UPDATE country_profile_sources
      SET
        publisher = 'European Commission, Directorate-General for Health and Food Safety',
        source_url = ${URLS.myHealthEu},
        public_url = ${URLS.myHealthEu},
        accessed_at = '2026-08-09',
        evidence_note = 'The European Commission current MyHealth@EU service-country list explicitly includes Romania among the countries offering electronic cross-border health services and describes ePrescriptions and Patient Summaries.',
        url_status = 'verified',
        last_checked_at = ${CHECKED_AT},
        replacement_reason = 'Added as a separately labelled EU service-country source so that a general European listing is not presented as a Romania-specific national publication.'
      WHERE id = ${myHealthEuSourceId};
    `;
  }

  await sql`
    DELETE FROM country_profile_source_indicators
    WHERE source_id = ${myHealthEuSourceId}
      AND indicator_code = 'RO-TEC-02';
  `;

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
      ${myHealthEuSourceId},
      'RO-TEC-02',
      'A',
      'supports',
      'The European Commission current MyHealth@EU service-country list explicitly includes Romania among countries offering electronic cross-border health services.',
      'The source is an EU-wide service-country listing rather than a Romania-specific national publication, and it does not establish that every data category or provider is available in every Romanian care setting.',
      'unknown',
      'unknown',
      'not_assessed'
    );
  `;

  await sql`
    UPDATE country_profile_sources
    SET
      source_url = ${URLS.hadea},
      public_url = ${URLS.hadea},
      url_status = 'verified',
      last_checked_at = ${CHECKED_AT},
      replacement_reason = NULL
    WHERE profile_id = ${profileId}
      AND title = '2024 EU4Health Work Programme: new projects advancing digital healthcare across the EU';
  `;

  await sql`
    UPDATE country_profile_notes
    SET note_text = 'Romania is explicitly listed by the European Commission among countries offering MyHealth@EU electronic cross-border health services; CNAS also documents national implementation work for the eHealth contact point.'
    WHERE profile_id = ${profileId}
      AND note_type = 'strength'
      AND display_order = 2;
  `;

  const audit = await sql`
    SELECT
      s.title,
      s.publisher,
      s.public_url,
      s.url_status,
      s.last_checked_at,
      s.replacement_reason
    FROM country_profile_sources s
    WHERE s.profile_id = ${profileId}
    ORDER BY s.id;
  `;

  const counts = await sql`
    SELECT
      (SELECT COUNT(*)::int FROM country_profile_sources WHERE profile_id = ${profileId}) AS sources,
      (
        SELECT COUNT(*)::int
        FROM country_profile_source_indicators i
        JOIN country_profile_sources s ON s.id = i.source_id
        WHERE s.profile_id = ${profileId}
      ) AS indicators;
  `;

  return {
    iso3: 'ROU',
    profileId,
    checkedAt: CHECKED_AT,
    counts: counts[0],
    sources: audit,
  };
}
