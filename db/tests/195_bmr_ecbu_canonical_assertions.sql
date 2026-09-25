-- IML BMR / ECBU canonical verification v0.2
-- Read-only assertions for iml_workspace_bmr_test after migration 195 and seed 193.

DO $verify$
DECLARE
  n integer;
  bad integer;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema='iml_laboratory'
      AND table_name='lab_observation'
      AND column_name='loinc_concept_id'
  ) THEN
    RAISE EXCEPTION 'VERIFY: canonical lab_observation.loinc_concept_id is missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema='iml_laboratory'
      AND table_name='microbiology_isolate'
      AND column_name='identification_observation_id'
  ) THEN
    RAISE EXCEPTION 'VERIFY: microbiology_isolate.identification_observation_id is missing';
  END IF;

  -- No competing specimen relationship on lab_observation.
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema='iml_laboratory'
      AND table_name='lab_observation'
      AND column_name='specimen_id'
  ) THEN
    RAISE EXCEPTION
      'VERIFY: lab_observation.specimen_id exists; canonical specimen path must remain observation -> report -> specimen';
  END IF;

  SELECT count(*) INTO n
  FROM iml_laboratory.lab_observation
  WHERE id IN (
    'a1111111-1111-4111-8111-111111111111'::uuid,
    'a2222222-2222-4222-8222-222222222222'::uuid
  )
    AND (
      (id='a1111111-1111-4111-8111-111111111111'::uuid
       AND local_code='GP-URI-WBCQ' AND loinc_code='30405-5'
       AND normalized_unit_system='UCUM')
      OR
      (id='a2222222-2222-4222-8222-222222222222'::uuid
       AND local_code='GP-URI-CULT' AND loinc_code='630-4'
       AND value_text='Escherichia coli')
    );

  IF n <> 2 THEN
    RAISE EXCEPTION
      'VERIFY: expected two canonical GP/LOINC demo observations, found %', n;
  END IF;

  SELECT count(*) INTO n
  FROM iml_laboratory.microbiology_isolate i
  JOIN iml_laboratory.lab_observation o
    ON o.id=i.identification_observation_id
   AND o.lab_report_id=i.lab_report_id
  WHERE i.id='88888888-8888-4888-8888-888888888888'::uuid
    AND o.loinc_code='630-4'
    AND o.value_text='Escherichia coli';

  IF n <> 1 THEN
    RAISE EXCEPTION
      'VERIFY: isolate is not anchored to the canonical organism-identification observation';
  END IF;

  SELECT count(*) INTO bad
  FROM iml_laboratory.lab_observation o
  JOIN iml_terminology.concept c ON c.id=o.loinc_concept_id
  JOIN iml_terminology.release r ON r.id=c.release_id
  JOIN iml_terminology.system s ON s.id=r.system_id
  WHERE o.id IN (
    'a1111111-1111-4111-8111-111111111111'::uuid,
    'a2222222-2222-4222-8222-222222222222'::uuid
  )
    AND o.loinc_concept_id IS NOT NULL
    AND (s.system_code <> 'LOINC' OR r.release_key <> 'LOINC_2.83');

  IF bad <> 0 THEN
    RAISE EXCEPTION
      'VERIFY: a populated loinc_concept_id does not resolve to canonical LOINC 2.83';
  END IF;

  SELECT count(*) INTO n
  FROM iml_laboratory.antimicrobial_susceptibility a
  JOIN iml_laboratory.microbiology_isolate i
    ON i.id=a.isolate_id
   AND i.lab_report_id=a.lab_report_id
  WHERE a.lab_report_id='66666666-6666-4666-8666-666666666666'::uuid;

  IF n <> 5 THEN
    RAISE EXCEPTION
      'VERIFY: expected 5 susceptibility rows linked to the same isolate/report, found %', n;
  END IF;

  SELECT count(*) INTO n
  FROM iml_clinical.microbiology_interpretation
  WHERE id='99999999-9999-4999-8999-999999999999'::uuid
    AND classification='symptomatic_uti'
    AND lab_report_id='66666666-6666-4666-8666-666666666666'::uuid
    AND isolate_id='88888888-8888-4888-8888-888888888888'::uuid;

  IF n <> 1 THEN
    RAISE EXCEPTION
      'VERIFY: structured clinical interpretation is missing or detached';
  END IF;
END
$verify$;

SELECT
  r.content_profile,
  r.content_profile_version,
  count(DISTINCT o.id) AS loinc_observations,
  count(DISTINCT a.id) AS susceptibility_rows,
  max(i.organism_name) AS organism,
  max(ci.classification) AS clinical_classification
FROM iml_laboratory.lab_report r
LEFT JOIN iml_laboratory.lab_observation o ON o.lab_report_id=r.id
LEFT JOIN iml_laboratory.microbiology_isolate i ON i.lab_report_id=r.id
LEFT JOIN iml_laboratory.antimicrobial_susceptibility a ON a.lab_report_id=r.id
LEFT JOIN iml_clinical.microbiology_interpretation ci ON ci.lab_report_id=r.id
WHERE r.id='66666666-6666-4666-8666-666666666666'::uuid
GROUP BY r.content_profile, r.content_profile_version;
