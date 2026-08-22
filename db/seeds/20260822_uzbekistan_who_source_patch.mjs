// Preview corrective patch for Uzbekistan source quality.
// Replaces the user-unreliable WHO public link with a directly verifiable
// Ministry of Health clinical protocol that explicitly uses ICD-11 coding.

export async function patchUzbekistanWhoSource(sql) {
  const profiles = await sql`
    SELECT cp.id AS profile_id
    FROM country_profiles cp
    JOIN countries c ON c.id = cp.country_id
    WHERE c.iso3 = 'UZB' AND cp.version = 1
    LIMIT 1;
  `;

  if (!profiles.length) {
    throw new Error('Uzbekistan profile v1 not found.');
  }

  const profileId = profiles[0].profile_id;

  const sources = await sql`
    SELECT id
    FROM country_profile_sources
    WHERE profile_id = ${profileId}
      AND title LIKE 'WHO results report 2024–2025%'
    LIMIT 1;
  `;

  if (!sources.length) {
    throw new Error('Uzbekistan WHO source not found.');
  }

  const sourceId = sources[0].id;
  const ministryUrl = 'https://gov.uz/ru/ssv/sections/view/138350';

  await sql`
    UPDATE country_profile_sources
    SET
      title = 'Ministry clinical protocol demonstrating ICD-11 coding',
      publisher = 'Ministry of Health of the Republic of Uzbekistan',
      source_url = ${ministryUrl},
      public_url = ${ministryUrl},
      publication_date = NULL,
      accessed_at = '2026-08-22',
      evidence_note = 'The official Ministry of Health clinical protocol for obesity in children and adolescents explicitly presents ICD-10 and ICD-11 codes. This is direct country-specific evidence that ICD-11 coding appears in current Uzbek clinical protocol publication, but it does not by itself establish nationwide ICD-11 migration or a national ICD API.',
      url_status = 'verified',
      last_checked_at = '2026-08-22',
      replacement_reason = 'Replaced WHO public link after local user verification showed that the page did not reliably land on Uzbekistan-specific content.'
    WHERE id = ${sourceId};
  `;

  await sql`
    DELETE FROM country_profile_source_indicators
    WHERE source_id = ${sourceId};
  `;

  await sql`
    INSERT INTO country_profile_source_indicators (
      source_id, indicator_code, evidence_level, support_type,
      evidence_summary, limitation_note, evidence_direction,
      evidence_scope, implementation_status
    ) VALUES (
      ${sourceId},
      'UZ-TEC-02',
      'B',
      'partially_supports',
      'A current Ministry of Health clinical protocol explicitly presents ICD-11 coding alongside ICD-10, demonstrating concrete use of ICD-11 terminology in national clinical documentation.',
      'A single published protocol does not demonstrate nationwide ICD-11 migration, complete terminology services, or end-to-end interoperability across health information systems.',
      'unknown',
      'unknown',
      'not_assessed'
    );
  `;

  await sql`
    UPDATE country_profile_notes
    SET note_text = 'The Ministry of Health publishes current clinical protocols that explicitly include ICD-11 coding alongside ICD-10, providing direct evidence of standards uptake in national clinical documentation.'
    WHERE profile_id = ${profileId}
      AND note_type = 'strength'
      AND display_order = 3;
  `;

  return { iso3: 'UZB', sourceId, publicUrl: ministryUrl, indicators: 1 };
}
