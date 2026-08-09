// Corrective source-quality patch for the published Romania profile.
//
// This patch is intentionally narrow and idempotent. It does not alter scores,
// profile versioning, unrelated countries, or the country-profile UI.

const CHECKED_AT = "2026-08-09T17:31:00.000Z";

const URLS = {
  digitalDecade: "https://digital-strategy.ec.europa.eu/en/factpages/romania-2025-digital-decade-country-report",
  ehealthStudy: "https://digital-strategy.ec.europa.eu/en/library/digital-decade-2025-ehealth-indicator-study",
  strategy: "https://www.ms.gov.ro/en/decisional-transparency/normative-acts-in-transparency/proiectul-de-hot%C4%83r%C3%A2re-a-guvernului-privind-aprobarea-strategiei-na%C8%9Bionale-de-digitalizare-%C3%AEn-s%C4%83n%C4%83tate-2026-2030/",
  cnasNcp: "https://cnas.ro/2024/07/19/informare-rezumatul-principalelor-informatii-expuse-in-conferinta-de-presa-a-conducerii-cnas-din-data-de-19-iulie-2024/",
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
      replacement_reason = 'Corrected an invalid Ministry of Health path after source audit. The previous URL returned a 404 page; the canonical official decisional-transparency page was verified on 9 August 2026.'
    WHERE profile_id = ${profileId}
      AND title = 'Draft Government Decision approving the National Health Digitalisation Strategy 2026–2030';
  `;

  const myHealthSources = await sql`
    UPDATE country_profile_sources
    SET
      title = 'Romania National Contact Point for eHealth implementation update',
      publisher = 'Casa Națională de Asigurări de Sănătate (CNAS)',
      source_url = ${URLS.cnasNcp},
      public_url = ${URLS.cnasNcp},
      publication_date = '2024-07-19',
      accessed_at = '2026-08-09',
      evidence_note = 'CNAS reported that Romania had started organising and operationalising its National Contact Point for eHealth for implementation of European ePrescription and Patient Summary services.',
      url_status = 'verified',
      last_checked_at = ${CHECKED_AT},
      replacement_reason = 'Replaced a generic European Commission MyHealth@EU flyer with a Romania-specific official CNAS source. The European Commission service-country material was retained as an external cross-check during the audit but is no longer used as the primary public link for this Romania evidence item.'
    WHERE profile_id = ${profileId}
      AND title IN (
        'MyHealth@EU — information for patients and health professionals',
        'Romania National Contact Point for eHealth implementation update'
      )
    RETURNING id;
  `;

  const myHealthSourceId = myHealthSources[0]?.id;
  if (!myHealthSourceId) {
    throw new Error("Romania MyHealth@EU source row was not found.");
  }

  await sql`
    UPDATE country_profile_source_indicators
    SET
      evidence_level = 'A',
      support_type = 'supports',
      evidence_summary = 'Official CNAS reporting documents Romania''s implementation work for the National Contact Point for eHealth, European ePrescription and Patient Summary services.',
      limitation_note = 'The CNAS source documents national implementation work and does not by itself establish the exact current go-live status, transaction volume or nationwide operational coverage of every MyHealth@EU service.'
    WHERE source_id = ${myHealthSourceId}
      AND indicator_code = 'RO-TEC-02';
  `;

  await sql`
    UPDATE country_profile_source_indicators
    SET
      evidence_level = 'B',
      support_type = 'partially_supports',
      evidence_summary = 'The Romanian National Contact Point for eHealth is the organisational and technical gateway required for cross-border exchange of ePrescription and Patient Summary data.',
      limitation_note = 'This evidence does not provide a detailed assessment of Romania''s domestic patient-identity, consent, authentication or access-control architecture.'
    WHERE source_id = ${myHealthSourceId}
      AND indicator_code = 'RO-IDT-01';
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
    SET note_text = 'Romanian CNAS has documented implementation work for the National Contact Point for eHealth, European ePrescription and Patient Summary services.'
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

  return {
    iso3: 'ROU',
    profileId,
    checkedAt: CHECKED_AT,
    sources: audit,
  };
}
