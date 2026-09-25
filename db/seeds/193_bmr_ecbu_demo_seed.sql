-- IML BMR / ECBU demonstrator
-- 193_bmr_ecbu_demo_seed.sql
-- Canonical LAB/LOINC seed v0.2
-- Synthetic data only. Test/demo databases only.
--
-- Laboratory facts use the canonical lab_observation LOINC columns introduced
-- by migration 194. No BMR-specific terminology tables are used.
BEGIN;
SELECT pg_advisory_xact_lock(hashtext('IML:DEMO:BMR_ECBU:DEMO-001'));

DO $seed$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema='iml_laboratory'
      AND table_name='lab_observation'
      AND column_name='loinc_concept_id'
  ) OR NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema='iml_laboratory'
      AND table_name='microbiology_isolate'
      AND column_name='identification_observation_id'
  ) THEN
    RAISE EXCEPTION
      'DEMO-001 v0.2 requires migrations 194 and 195 before seeding';
  END IF;
END
$seed$;

INSERT INTO iml_identity.practitioner
(id,family_name,given_names,profession,specialty,active)
VALUES
('11111111-1111-4111-8111-111111111111','DEMO',ARRAY['Clinician']::text[],'PHYSICIAN','GENERAL_PRACTICE',true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO iml_identity.person
(id,status,created_at,created_by)
VALUES
('22222222-2222-4222-8222-222222222222','ACTIVE','2026-09-25T09:00:00+02:00','11111111-1111-4111-8111-111111111111')
ON CONFLICT (id) DO NOTHING;

INSERT INTO iml_clinical.encounter
(id,person_id,practitioner_id,organization_id,location_id,care_episode_id,
 encounter_type,reason,status,started_at,ended_at,signed_at,signed_by)
VALUES
('33333333-3333-4333-8333-333333333333',
 '22222222-2222-4222-8222-222222222222',
 '11111111-1111-4111-8111-111111111111',
 NULL,NULL,NULL,
 'GENERAL_PRACTICE',
 'DEMO-001 — dysuria and urinary frequency; suspected urinary tract infection',
 'SIGNED',
 '2026-09-25T09:15:00+02:00',
 '2026-09-25T09:35:00+02:00',
 '2026-09-25T09:35:00+02:00',
 '11111111-1111-4111-8111-111111111111')
ON CONFLICT (id) DO NOTHING;

INSERT INTO iml_laboratory.lab_order
(id,person_id,encounter_id,care_episode_id,ordered_by,test_code,test_label,
 indication,priority,status,ordered_at)
VALUES
('44444444-4444-4444-8444-444444444444',
 '22222222-2222-4222-8222-222222222222',
 '33333333-3333-4333-8333-333333333333',
 NULL,
 '11111111-1111-4111-8111-111111111111',
 'ECBU',
 'Examen cytobactériologique des urines',
 'Dysuria and urinary frequency; suspected symptomatic UTI',
 'ROUTINE','COMPLETED','2026-09-25T09:30:00+02:00')
ON CONFLICT (id) DO UPDATE SET
  test_code = EXCLUDED.test_code,
  test_label = EXCLUDED.test_label,
  indication = EXCLUDED.indication,
  priority = EXCLUDED.priority,
  status = EXCLUDED.status;

INSERT INTO iml_laboratory.lab_specimen
(id,lab_order_id,encounter_id,specimen_type,collected_at,received_at,
 collection_method,collection_site,catheter_status,specimen_quality,
 source_system,source_message_id,data_status)
VALUES
('55555555-5555-4555-8555-555555555555',
 '44444444-4444-4444-8444-444444444444',
 '33333333-3333-4333-8333-333333333333',
 'urine',
 '2026-09-25T10:00:00+02:00',
 '2026-09-25T10:40:00+02:00',
 'midstream','urinary_tract','none','acceptable',
 'IML_DEMO','DEMO-001-SPECIMEN','reported')
ON CONFLICT (id) DO NOTHING;

INSERT INTO iml_laboratory.lab_report
(id,person_id,lab_order_id,laboratory_name,report_status,specimen_collected_at,
 validated_at,content_profile,content_profile_version,transmission_channel,
 national_share_status,original_document_reference,received_at,specimen_id)
VALUES
('66666666-6666-4666-8666-666666666666',
 '22222222-2222-4222-8222-222222222222',
 '44444444-4444-4444-8444-444444444444',
 'IML Synthetic Microbiology Laboratory',
 'FINAL',
 '2026-09-25T10:00:00+02:00',
 '2026-09-25T15:30:00+02:00',
 'IML_BMR_ECBU','0.2','SYNTHETIC_DEMO','NOT_APPLICABLE','DEMO-001',
 '2026-09-25T15:35:00+02:00',
 '55555555-5555-4555-8555-555555555555')
ON CONFLICT (id) DO UPDATE SET
  content_profile = EXCLUDED.content_profile,
  content_profile_version = EXCLUDED.content_profile_version,
  specimen_id = EXCLUDED.specimen_id,
  report_status = EXCLUDED.report_status,
  validated_at = EXCLUDED.validated_at;

INSERT INTO iml_laboratory.lab_observation
(id,lab_report_id,local_code,loinc_code,label,value_text,value_numeric,
 original_unit,normalized_unit,normalized_unit_system,reference_range,
 method,abnormal_flag,corrected_from)
VALUES
('a1111111-1111-4111-8111-111111111111',
 '66666666-6666-4666-8666-666666666666',
 'GP-URI-WBCQ','30405-5','Leucocyturie quantitative',NULL,125000,
 '/mL','/mL','UCUM',NULL,'Synthetic quantitative microscopy','H',NULL),
('a2222222-2222-4222-8222-222222222222',
 '66666666-6666-4666-8666-666666666666',
 'GP-URI-CULT','630-4','Bacteria identified in urine by culture',
 'Escherichia coli',NULL,
 NULL,NULL,NULL,NULL,'Culture',NULL,NULL)
ON CONFLICT (id) DO UPDATE SET
  local_code = EXCLUDED.local_code,
  loinc_code = EXCLUDED.loinc_code,
  label = EXCLUDED.label,
  value_text = EXCLUDED.value_text,
  value_numeric = EXCLUDED.value_numeric,
  original_unit = EXCLUDED.original_unit,
  normalized_unit = EXCLUDED.normalized_unit,
  normalized_unit_system = EXCLUDED.normalized_unit_system,
  reference_range = EXCLUDED.reference_range,
  method = EXCLUDED.method,
  abnormal_flag = EXCLUDED.abnormal_flag;

-- If selected LOINC 2.83 concepts have already been promoted from the local
-- workbench into the canonical terminology tables, link them. Otherwise the
-- exchanged loinc_code remains authoritative and loinc_concept_id stays NULL,
-- exactly as allowed by migration 194.
UPDATE iml_laboratory.lab_observation o
SET loinc_concept_id = c.id
FROM iml_terminology.concept c
JOIN iml_terminology.release r ON r.id = c.release_id
JOIN iml_terminology.system s ON s.id = r.system_id
WHERE o.id IN (
    'a1111111-1111-4111-8111-111111111111'::uuid,
    'a2222222-2222-4222-8222-222222222222'::uuid
  )
  AND s.system_code = 'LOINC'
  AND r.release_key = 'LOINC_2.83'
  AND c.code = o.loinc_code
  AND o.loinc_concept_id IS DISTINCT FROM c.id;

INSERT INTO iml_laboratory.microbiology_context
(id,lab_report_id,symptoms,fever,leukocyturia,pregnancy,urinary_device,
 clinical_interpretation,validated_by,validated_at)
VALUES
('77777777-7777-4777-8777-777777777777',
 '66666666-6666-4666-8666-666666666666',
 '{"dysuria":true,"frequency":true,"urgency":false,"suprapubic_pain":false,"flank_pain":false,"haematuria":false,"source":"synthetic_demo"}'::jsonb,
 false,true,false,false,'INFECTION',
 '11111111-1111-4111-8111-111111111111',
 '2026-09-25T16:00:00+02:00')
ON CONFLICT (id) DO NOTHING;

INSERT INTO iml_laboratory.microbiology_isolate
(id,lab_report_id,identification_observation_id,isolate_rank,
 organism_name,organism_code,taxonomy_system,
 identification_method,identification_confidence,organism_count,organism_count_unit,
 colony_count_text,polymicrobial,bmr_flag,bmr_definition,bmr_definition_version,
 phenotype,resistance_mechanism,mechanism_confirmed,mechanism_method,
 source_system,source_identifier,data_status)
VALUES
('88888888-8888-4888-8888-888888888888',
 '66666666-6666-4666-8666-666666666666',
 'a2222222-2222-4222-8222-222222222222',
 1,'Escherichia coli',NULL,NULL,'Culture','high',
 100000,'CFU/mL','>= 10^5 CFU/mL',false,true,
 'Synthetic demonstrator classification','DEMO-0.2',
 'ESBL','ESBL phenotype',false,NULL,
 'IML_DEMO','DEMO-001-ISOLATE-1','reported')
ON CONFLICT (id) DO UPDATE SET
  lab_report_id = EXCLUDED.lab_report_id,
  identification_observation_id = EXCLUDED.identification_observation_id,
  isolate_rank = EXCLUDED.isolate_rank,
  organism_name = EXCLUDED.organism_name,
  identification_method = EXCLUDED.identification_method,
  identification_confidence = EXCLUDED.identification_confidence,
  organism_count = EXCLUDED.organism_count,
  organism_count_unit = EXCLUDED.organism_count_unit,
  colony_count_text = EXCLUDED.colony_count_text,
  polymicrobial = EXCLUDED.polymicrobial,
  bmr_flag = EXCLUDED.bmr_flag,
  bmr_definition = EXCLUDED.bmr_definition,
  bmr_definition_version = EXCLUDED.bmr_definition_version,
  phenotype = EXCLUDED.phenotype,
  resistance_mechanism = EXCLUDED.resistance_mechanism,
  mechanism_confirmed = EXCLUDED.mechanism_confirmed,
  source_system = EXCLUDED.source_system,
  source_identifier = EXCLUDED.source_identifier,
  data_status = EXCLUDED.data_status,
  updated_at = clock_timestamp();

INSERT INTO iml_laboratory.antimicrobial_susceptibility
(id,lab_report_id,specimen,organism,antibiotic,mic_or_diameter,unit,
 interpretation,interpretation_standard,standard_version,validated_at,isolate_id)
VALUES
('b1111111-1111-4111-8111-111111111111','66666666-6666-4666-8666-666666666666','urine','Escherichia coli','Amoxicillin',NULL,NULL,'R','DEMO','0.2','2026-09-25T15:30:00+02:00','88888888-8888-4888-8888-888888888888'),
('b2222222-2222-4222-8222-222222222222','66666666-6666-4666-8666-666666666666','urine','Escherichia coli','Cefotaxime',NULL,NULL,'R','DEMO','0.2','2026-09-25T15:30:00+02:00','88888888-8888-4888-8888-888888888888'),
('b3333333-3333-4333-8333-333333333333','66666666-6666-4666-8666-666666666666','urine','Escherichia coli','Ciprofloxacin',NULL,NULL,'R','DEMO','0.2','2026-09-25T15:30:00+02:00','88888888-8888-4888-8888-888888888888'),
('b4444444-4444-4444-8444-444444444444','66666666-6666-4666-8666-666666666666','urine','Escherichia coli','Fosfomycin',NULL,NULL,'S','DEMO','0.2','2026-09-25T15:30:00+02:00','88888888-8888-4888-8888-888888888888'),
('b5555555-5555-4555-8555-555555555555','66666666-6666-4666-8666-666666666666','urine','Escherichia coli','Nitrofurantoin',NULL,NULL,'S','DEMO','0.2','2026-09-25T15:30:00+02:00','88888888-8888-4888-8888-888888888888')
ON CONFLICT (id) DO UPDATE SET
  lab_report_id = EXCLUDED.lab_report_id,
  specimen = EXCLUDED.specimen,
  organism = EXCLUDED.organism,
  antibiotic = EXCLUDED.antibiotic,
  interpretation = EXCLUDED.interpretation,
  interpretation_standard = EXCLUDED.interpretation_standard,
  standard_version = EXCLUDED.standard_version,
  validated_at = EXCLUDED.validated_at,
  isolate_id = EXCLUDED.isolate_id;

INSERT INTO iml_clinical.microbiology_interpretation
(id,lab_report_id,microbiology_context_id,encounter_id,isolate_id,
 classification,confidence,supporting_evidence,contradicting_evidence,
 assertion_kind,asserted_by,asserted_at,status,interpretation_version)
VALUES
('99999999-9999-4999-8999-999999999999',
 '66666666-6666-4666-8666-666666666666',
 '77777777-7777-4777-8777-777777777777',
 '33333333-3333-4333-8333-333333333333',
 '88888888-8888-4888-8888-888888888888',
 'symptomatic_uti','high',
 '[{"type":"symptom","code":"dysuria","present":true},
   {"type":"symptom","code":"frequency","present":true},
   {"type":"laboratory","catalog_code":"GP-URI-WBCQ","loinc":"30405-5","present":true},
   {"type":"culture","catalog_code":"GP-URI-CULT","loinc":"630-4","organism":"Escherichia coli","count":100000,"unit":"CFU/mL"}]'::jsonb,
 '[{"type":"systemic_sign","code":"fever","present":false}]'::jsonb,
 'clinician_asserted',
 '11111111-1111-4111-8111-111111111111',
 '2026-09-25T16:05:00+02:00',
 'active',1)
ON CONFLICT (id) DO NOTHING;

COMMIT;
