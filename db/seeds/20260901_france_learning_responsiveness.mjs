// France Learning-domain correction following the adoption of LRN-5.
// Documentary basis: Cour des comptes, Securite sociale 2024 —
// Mon espace sante : des conditions de reussite encore a reunir.
// Assessment date: 2026-09-01.

const COUR_DES_COMPTES_TITLE =
  "Sécurité sociale 2024 — Mon espace santé : des conditions de réussite encore à réunir";

const UPDATED_WATCH_NOTE =
  "Authoritative audit findings document persistent failures of evaluation, enforcement and institutional follow-through. Under IML LRN-5, this functional passive obstruction directly reduces the Feedback, Correction and Learning score.";

export async function applyFranceLearningResponsivenessCorrection(sql) {
  const profileRows = await sql`
    SELECT cp.id
    FROM country_profiles cp
    JOIN countries c ON c.id = cp.country_id
    WHERE c.iso3 = 'FRA'
      AND cp.status = 'published'
    ORDER BY cp.version DESC
    LIMIT 1;
  `;

  if (profileRows.length !== 1) {
    throw new Error("Published France country profile not found.");
  }

  const profileId = profileRows[0].id;

  await sql`
    WITH updated AS (
      UPDATE country_profile_scores
      SET score = 10
      WHERE profile_id = ${profileId}
        AND domain_code = 'learning'
      RETURNING profile_id
    )
    INSERT INTO country_profile_scores (profile_id, domain_code, score)
    SELECT ${profileId}, 'learning', 10
    WHERE NOT EXISTS (SELECT 1 FROM updated)
      AND NOT EXISTS (
        SELECT 1
        FROM country_profile_scores
        WHERE profile_id = ${profileId}
          AND domain_code = 'learning'
      );
  `;

  await sql`
    UPDATE country_profiles
    SET assessment_date = '2026-09-01',
        updated_at = NOW()
    WHERE id = ${profileId};
  `;

  await sql`
    WITH changed AS (
      UPDATE country_profile_notes
      SET note_text = ${UPDATED_WATCH_NOTE}
      WHERE profile_id = ${profileId}
        AND note_type = 'watch'
        AND note_text = 'Correction and redress remain slow, opaque and frequently ineffective'
      RETURNING id
    )
    INSERT INTO country_profile_notes (
      profile_id, note_type, display_order, note_text
    )
    SELECT
      ${profileId},
      'watch',
      COALESCE((
        SELECT MAX(display_order) + 1
        FROM country_profile_notes
        WHERE profile_id = ${profileId}
          AND note_type = 'watch'
      ), 1),
      ${UPDATED_WATCH_NOTE}
    WHERE NOT EXISTS (
      SELECT 1
      FROM country_profile_notes
      WHERE profile_id = ${profileId}
        AND note_type = 'watch'
        AND note_text = ${UPDATED_WATCH_NOTE}
    );
  `;

  const sourceRows = await sql`
    SELECT id
    FROM country_profile_sources
    WHERE profile_id = ${profileId}
      AND title = ${COUR_DES_COMPTES_TITLE}
    LIMIT 1;
  `;

  if (sourceRows.length !== 1) {
    throw new Error("France Cour des comptes source not found.");
  }

  const sourceId = sourceRows[0].id;
  const evidenceSummary =
    "The French Court of Auditors documents repeated failures to evaluate, enforce and act on known digital-health problems. This authoritative control evidence demonstrates weak institutional answerability and follow-through rather than an isolated individual experience.";
  const limitation =
    "The report evaluates selected national programmes and does not measure response times for every institution or every individual inquiry.";

  await sql`
    WITH updated AS (
      UPDATE country_profile_source_indicators
      SET evidence_level = 'A',
          support_type = 'supports',
          evidence_summary = ${evidenceSummary},
          limitation_note = ${limitation}
      WHERE source_id = ${sourceId}
        AND indicator_code = 'LRN-5'
      RETURNING source_id
    )
    INSERT INTO country_profile_source_indicators (
      source_id, indicator_code, evidence_level, support_type,
      evidence_summary, limitation_note, evidence_direction,
      evidence_scope, implementation_status
    )
    SELECT
      ${sourceId}, 'LRN-5', 'A', 'supports',
      ${evidenceSummary}, ${limitation}, 'unknown',
      'unknown', 'not_assessed'
    WHERE NOT EXISTS (SELECT 1 FROM updated)
      AND NOT EXISTS (
        SELECT 1
        FROM country_profile_source_indicators
        WHERE source_id = ${sourceId}
          AND indicator_code = 'LRN-5'
      );
  `;

  return {
    iso3: "FRA",
    profileId,
    learningScore: 10,
    indicator: "LRN-5",
    evidence: "Cour des comptes — Sécurité sociale 2024",
  };
}
