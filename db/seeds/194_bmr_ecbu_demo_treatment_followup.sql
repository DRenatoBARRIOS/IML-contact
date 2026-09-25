-- IML BMR / ECBU demonstrator
-- 194_bmr_ecbu_demo_treatment_followup.sql
-- Synthetic DEMO-001 only. Test/demo databases only.
--
-- Uses existing IML clinical structures:
--   care_plan_item_revision: MEDICATION + FOLLOW_UP
--   clinical_note: signed follow-up narrative
--
-- No new schema objects are created.

BEGIN;

SELECT pg_advisory_xact_lock(hashtext('IML:DEMO:BMR_ECBU:DEMO-001:TREATMENT'));

-- ---------------------------------------------------------------------------
-- Fixed synthetic IDs
-- ---------------------------------------------------------------------------
-- Medication item_id : c1111111-1111-4111-8111-111111111111
-- Medication revision: c1111111-1111-4111-8111-111111111112
-- Follow-up item_id  : c2222222-2222-4222-8222-222222222222
-- Follow-up revision : c2222222-2222-4222-8222-222222222223
-- Follow-up note     : c3333333-3333-4333-8333-333333333333

-- Preconditions: DEMO-001 encounter and practitioner must exist.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM iml_clinical.encounter
    WHERE id = '33333333-3333-4333-8333-333333333333'::uuid
  ) THEN
    RAISE EXCEPTION 'DEMO-001 encounter is missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM iml_identity.practitioner
    WHERE id = '11111111-1111-4111-8111-111111111111'::uuid
  ) THEN
    RAISE EXCEPTION 'DEMO practitioner is missing';
  END IF;
END
$$;

-- ---------------------------------------------------------------------------
-- 1. Treatment
-- ---------------------------------------------------------------------------
-- This is a synthetic demonstration record, not a prescribing recommendation.
-- Dose/duration are intentionally not encoded until a dedicated medication
-- structure is validated in IML.

INSERT INTO iml_clinical.care_plan_item_revision (
  id,
  item_id,
  encounter_id,
  revision_number,
  item_type,
  title,
  details,
  status,
  priority,
  due_date,
  recorded_by,
  access_session_id,
  recorded_at
)
VALUES (
  'c1111111-1111-4111-8111-111111111112'::uuid,
  'c1111111-1111-4111-8111-111111111111'::uuid,
  '33333333-3333-4333-8333-333333333333'::uuid,
  1,
  'MEDICATION',
  'Fosfomycin — synthetic DEMO-001 treatment',
  'Synthetic demonstrator only. Selected to illustrate linkage between antimicrobial susceptibility and a clinical care-plan decision. This record is not a prescribing recommendation.',
  'ORDERED',
  'ROUTINE',
  NULL,
  '11111111-1111-4111-8111-111111111111'::uuid,
  NULL,
  '2026-09-25T16:10:00+02:00'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 2. Follow-up item
-- ---------------------------------------------------------------------------

INSERT INTO iml_clinical.care_plan_item_revision (
  id,
  item_id,
  encounter_id,
  revision_number,
  item_type,
  title,
  details,
  status,
  priority,
  due_date,
  recorded_by,
  access_session_id,
  recorded_at
)
VALUES (
  'c2222222-2222-4222-8222-222222222223'::uuid,
  'c2222222-2222-4222-8222-222222222222'::uuid,
  '33333333-3333-4333-8333-333333333333'::uuid,
  1,
  'FOLLOW_UP',
  'Clinical follow-up after symptomatic UTI',
  'Synthetic DEMO-001 follow-up: reassess urinary symptoms, fever/systemic signs, tolerance, and need for repeat microbiology.',
  'COMPLETED',
  'ROUTINE',
  '2026-09-28'::date,
  '11111111-1111-4111-8111-111111111111'::uuid,
  NULL,
  '2026-09-28T10:00:00+02:00'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 3. Signed clinical evolution note
-- ---------------------------------------------------------------------------

INSERT INTO iml_clinical.clinical_note (
  id,
  person_id,
  encounter_id,
  note_type,
  body,
  status,
  version,
  authored_at,
  authored_by,
  signed_at
)
VALUES (
  'c3333333-3333-4333-8333-333333333333'::uuid,
  '22222222-2222-4222-8222-222222222222'::uuid,
  '33333333-3333-4333-8333-333333333333'::uuid,
  'FOLLOW_UP',
  'DEMO-001 synthetic follow-up. Urinary symptoms improved; no fever or systemic signs reported. Treatment decision and outcome are synthetic demonstration data only.',
  'SIGNED',
  1,
  '2026-09-28T10:00:00+02:00'::timestamptz,
  '11111111-1111-4111-8111-111111111111'::uuid,
  '2026-09-28T10:05:00+02:00'::timestamptz
)
ON CONFLICT (id) DO NOTHING;

COMMIT;
