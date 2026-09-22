// France Learning-domain correction following the adoption of LRN-5.
// Documentary basis: Cour des comptes, Securite sociale 2024 —
// Mon espace sante : des conditions de reussite encore a reunir.
// Assessment date: 2026-09-01.

const COUR_DES_COMPTES_TITLE =
  "Sécurité sociale 2024 — Mon espace santé : des conditions de réussite encore à réunir";

const INTERNAL_REVIEW_MARKER = "[IML internal Learning rationale — 2026-09-01]";
const INTERNAL_REVIEW_NOTE =
  `${INTERNAL_REVIEW_MARKER}\nLearning 15 → 10. The French Court of Auditors documents objectives changed without adequate prior evaluation, uptake below expectations, limited enforceability of obligations and persistent institutional blockages. Under IML LRN-5, these authoritative findings demonstrate weak institutional answerability and follow-through; their functional effect is recorded as passive institutional obstruction without imputing individual intent.`;

async function storeInternalReviewNote(sql, profileId) {
  const rows = await sql`
    SELECT id, review_notes
    FROM country_profile_assessments
    WHERE profile_id = ${profileId}
    LIMIT 1;
  `;

  if (!rows.length) {
    await sql`
      INSERT INTO country_profile_assessments (
        profile_id, assessment_status, review_notes
      )
      VALUES (${profileId}, 'provisional', ${INTERNAL_REVIEW_NOTE});
    `;
    return;
  }

  if (!String(rows[0].review_notes || "").includes(INTERNAL_REVIEW_MARKER)) {
    const updatedNotes = rows[0].review_notes
      ? `${rows[0].review_notes}\n\n${INTERNAL_REVIEW_NOTE}`
      : INTERNAL_REVIEW_NOTE;
    await sql`
      UPDATE country_profile_assessments
      SET review_notes = ${updatedNotes}
      WHERE id = ${rows[0].id};
    `;
  }
}

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

  await storeInternalReviewNote(sql, profileId);

  await sql`
    DELETE FROM country_profile_notes
    WHERE profile_id = ${profileId}
      AND note_type = 'watch'
      AND note_text LIKE 'Learning revised from 15 to 10 on 1 September 2026.%';
  `;

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
