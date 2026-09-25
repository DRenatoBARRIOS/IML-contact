-- IML LOINC local workbench
-- BMR / ECBU trace set v0.1
-- Local-only. Never applied automatically to Neon.
--
-- Purpose:
--   Bind the validated BMR/ECBU demonstrator to the existing canonical
--   GP/LAB LOINC workbench. No parallel BMR terminology tables are created.
--
-- The set contains only LOINC codes already selected in the GP catalog v0.3.
-- Colony count is intentionally not assigned a guessed LOINC here; it remains
-- a structured microbiology isolate fact until an exact mapping is curated.

BEGIN;

SELECT pg_advisory_xact_lock(hashtext('IML:LOINC:BMR_ECBU_TRACE:v0.1'));

DO $$
DECLARE
  rid bigint;
  missing_codes text;
BEGIN
  SELECT id INTO rid
  FROM iml_loinc_workbench.source_release
  WHERE is_current
  ORDER BY id DESC
  LIMIT 1;

  IF rid IS NULL THEN
    RAISE EXCEPTION 'BMR_ECBU_TRACE: no current local LOINC release';
  END IF;

  SELECT string_agg(w.loinc_num, ', ' ORDER BY w.loinc_num)
    INTO missing_codes
  FROM (
    VALUES
      ('24357-6'),
      ('5799-2'),
      ('5802-4'),
      ('30405-5'),
      ('30391-7'),
      ('630-4'),
      ('29576-6'),
      ('50545-3')
  ) AS w(loinc_num)
  LEFT JOIN iml_loinc_workbench.loinc_source s
    ON s.release_id = rid
   AND s.loinc_num = w.loinc_num
  WHERE s.loinc_num IS NULL;

  IF missing_codes IS NOT NULL THEN
    RAISE EXCEPTION
      'BMR_ECBU_TRACE: expected LOINC 2.83 codes missing locally: %',
      missing_codes;
  END IF;
END
$$;

WITH r AS (
  SELECT id
  FROM iml_loinc_workbench.source_release
  WHERE is_current
  ORDER BY id DESC
  LIMIT 1
)
INSERT INTO iml_loinc_workbench.reference_set(
  release_id,
  set_code,
  name_fr,
  set_kind,
  status,
  rule_description,
  properties
)
SELECT
  r.id,
  'BMR_ECBU_TRACE',
  'Trace BMR / ECBU — médecine générale',
  'workflow_trace',
  'active',
  'Trace clinique BMR/ECBU raccordé au catalogue biologique GP v0.3 et au corpus LOINC 2.83 local.',
  jsonb_build_object(
    'catalog_version', 'IML-GP-BIO-V0.3',
    'demonstrator_version', 'BMR_ECBU_v0.2',
    'scope', 'GP',
    'local_only', true
  )
FROM r
ON CONFLICT (release_id, set_code) DO UPDATE SET
  name_fr = EXCLUDED.name_fr,
  set_kind = EXCLUDED.set_kind,
  status = EXCLUDED.status,
  rule_description = EXCLUDED.rule_description,
  properties = EXCLUDED.properties;

WITH r AS (
  SELECT id
  FROM iml_loinc_workbench.source_release
  WHERE is_current
  ORDER BY id DESC
  LIMIT 1
),
wanted(loinc_num, catalog_code, clinical_group, clinical_tier, sequence_order, selection_reason) AS (
  VALUES
    ('24357-6','GP-POCT-URINE','URINALYSIS','GP_ACUTE_POCT',10,
     'Bandelette urinaire multiparamétrique, étape de triage au cabinet'),
    ('5799-2','GP-URI-LEU','URINALYSIS','GP_FIRST_LINE',20,
     'Leucocyte estérase urinaire, triage infection urinaire'),
    ('5802-4','GP-URI-NIT','URINALYSIS','GP_FIRST_LINE',30,
     'Nitrites urinaires, triage infection urinaire'),
    ('30405-5','GP-URI-WBCQ','URINALYSIS','GP_SECOND_LINE',40,
     'Leucocyturie quantitative, résultat ECBU'),
    ('30391-7','GP-URI-RBCQ','URINALYSIS','GP_SECOND_LINE',50,
     'Hématurie quantitative, résultat ECBU/sédiment'),
    ('630-4','GP-URI-CULT','MICROBIOLOGY','GP_SECOND_LINE',60,
     'Organisme identifié en culture urinaire'),
    ('29576-6','GP-URI-AST','MICROBIOLOGY','GP_SECOND_LINE',70,
     'Panel de sensibilité antimicrobienne après culture'),
    ('50545-3','GP-URI-MIC','MICROBIOLOGY','GP_SPECIALIZED',80,
     'Panel de sensibilité avec CMI lorsque rapportée')
)
INSERT INTO iml_loinc_workbench.reference_set_member(
  release_id,
  set_code,
  loinc_num,
  clinical_group,
  clinical_tier,
  priority,
  sequence_order,
  selection_reason,
  trigger_type,
  trigger_detail,
  properties
)
SELECT
  r.id,
  'BMR_ECBU_TRACE',
  w.loinc_num,
  w.clinical_group,
  w.clinical_tier,
  1,
  w.sequence_order,
  w.selection_reason,
  'clinical',
  'urinary_infection_or_ecbu_pathway',
  jsonb_build_object(
    'catalog_code', w.catalog_code,
    'catalog_version', 'IML-GP-BIO-V0.3',
    'mapping_kind', 'SINGLE'
  )
FROM r
CROSS JOIN wanted w
ON CONFLICT (release_id, set_code, loinc_num) DO UPDATE SET
  clinical_group = EXCLUDED.clinical_group,
  clinical_tier = EXCLUDED.clinical_tier,
  priority = EXCLUDED.priority,
  sequence_order = EXCLUDED.sequence_order,
  selection_reason = EXCLUDED.selection_reason,
  trigger_type = EXCLUDED.trigger_type,
  trigger_detail = EXCLUDED.trigger_detail,
  properties = EXCLUDED.properties;

COMMIT;

-- Expected count for the current release:
-- SELECT count(*)
-- FROM iml_loinc_workbench.reference_set_member m
-- JOIN iml_loinc_workbench.source_release r ON r.id=m.release_id
-- WHERE r.is_current AND m.set_code='BMR_ECBU_TRACE';
-- -> 8
