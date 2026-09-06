// IML exploratory comparative workstream.
// Patient harm, redress and system learning.
// Registered 6 September 2026.
// This workstream is deliberately outside country scoring until a comparative
// protocol has been reviewed and validated.

export async function ensurePatientHarmRedressLearningWorkstream(sql) {
  await sql`
    CREATE TABLE IF NOT EXISTS iml_research_workstreams (
      code TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      status TEXT NOT NULL,
      scoring_status TEXT NOT NULL,
      conclusion_status TEXT NOT NULL,
      scope TEXT NOT NULL,
      study_question TEXT,
      comparison_dimensions JSONB NOT NULL DEFAULT '[]'::jsonb,
      evidence_policy TEXT,
      registered_at DATE NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  const dimensions = JSON.stringify([
    "accessibility of remedy",
    "burden of proof and causation",
    "timeliness",
    "scope of redress",
    "disclosure and access to records",
    "independence and appeal",
    "equity of access",
    "link between incidents or claims and patient-safety learning"
  ]);

  await sql`
    INSERT INTO iml_research_workstreams (
      code,
      title,
      status,
      scoring_status,
      conclusion_status,
      scope,
      study_question,
      comparison_dimensions,
      evidence_policy,
      registered_at,
      updated_at
    ) VALUES (
      'PATIENT_HARM_REDRESS_LEARNING',
      'Patient harm, redress and system learning',
      'exploratory',
      'not_scored',
      'no_country_level_conclusion',
      'comparative health-system study',
      'When a patient experiences harm associated with care, how does the health system enable understanding of what happened, access to fair and timely redress, and learning that may reduce recurrence?',
      ${dimensions}::jsonb,
      'Initial work is limited to terminology, official-source mapping and comparative protocol design. Country differences may be described, but no ranking, score adjustment or causal conclusion should be drawn from this workstream at this stage.',
      '2026-09-06',
      NOW()
    )
    ON CONFLICT (code) DO UPDATE SET
      title = EXCLUDED.title,
      status = EXCLUDED.status,
      scoring_status = EXCLUDED.scoring_status,
      conclusion_status = EXCLUDED.conclusion_status,
      scope = EXCLUDED.scope,
      study_question = EXCLUDED.study_question,
      comparison_dimensions = EXCLUDED.comparison_dimensions,
      evidence_policy = EXCLUDED.evidence_policy,
      updated_at = NOW();
  `;

  return {
    code: 'PATIENT_HARM_REDRESS_LEARNING',
    status: 'exploratory',
    scoringStatus: 'not_scored',
    conclusionStatus: 'no_country_level_conclusion',
  };
}
