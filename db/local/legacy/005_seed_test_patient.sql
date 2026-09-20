-- Fictional patient TEST for IML Clinical Workspace exercises.
-- Safe test fixture: no real patient data.

BEGIN;

INSERT INTO iml_workspace_edit.patient
(patient_id, given_name, family_name, birth_date, sex_at_birth, fictional, notes)
VALUES
('TEST', '', 'TEST', DATE '1958-01-15', 'male', true,
 'Patient fictif de démonstration, polypathologique, destiné aux exercices IML.')
ON CONFLICT (patient_id) DO UPDATE SET
  given_name=EXCLUDED.given_name,
  family_name=EXCLUDED.family_name,
  birth_date=EXCLUDED.birth_date,
  sex_at_birth=EXCLUDED.sex_at_birth,
  fictional=true,
  notes=EXCLUDED.notes,
  updated_at=now();

DELETE FROM iml_workspace_edit.lab_order WHERE patient_id='TEST';
DELETE FROM iml_workspace_edit.lab_result WHERE patient_id='TEST';
DELETE FROM iml_workspace_edit.vital_observation WHERE patient_id='TEST';
DELETE FROM iml_workspace_edit.medication_statement WHERE patient_id='TEST';
DELETE FROM iml_workspace_edit.diagnosis WHERE patient_id='TEST';
DELETE FROM iml_workspace_edit.consultation WHERE patient_legacy_id='TEST';

INSERT INTO iml_workspace_edit.diagnosis
(diagnosis_id, patient_id, label, coding_system, code, status, important, comment)
VALUES
('20000000-0000-4000-8000-000000000001','TEST','Hypertension artérielle secondaire','ICD-10','I15.9','ACTIVE',true,'Cas d’exercice.'),
('20000000-0000-4000-8000-000000000002','TEST','Insuffisance rénale chronique, stade à préciser','ICD-10','N18.9','ACTIVE',true,'Le stade sera affiné à partir des données biologiques.'),
('20000000-0000-4000-8000-000000000003','TEST','Diabète de type 2 non insulinotraité','ICD-10','E11.9','ACTIVE',true,'Cas d’exercice.'),
('20000000-0000-4000-8000-000000000004','TEST','Trouble dépressif persistant / dysthymie','ICD-10','F34.1','ACTIVE',false,'Diagnostic d’exercice à discuter dans le module terminologique.'),
('20000000-0000-4000-8000-000000000005','TEST','Hyperplasie bénigne de la prostate','ICD-10','N40','ACTIVE',false,'Cas d’exercice.'),
('20000000-0000-4000-8000-000000000006','TEST','Dyslipidémie, sans précision','ICD-10','E78.5','ACTIVE',false,'Ajoutée pour enrichir l’exercice polypathologique.');

INSERT INTO iml_workspace_edit.medication_statement
(medication_statement_id, patient_id, substance, atc_code, strength_value, strength_unit,
 dose_text, frequency_text, route, treatment_group, active, comment)
VALUES
('30000000-0000-4000-8000-000000000001','TEST','Amlodipine','C08CA01',10,'mg','10 mg le matin','1 fois/jour','orale','Association antihypertensive',true,NULL),
('30000000-0000-4000-8000-000000000002','TEST','Irbesartan','C09CA04',300,'mg','300 mg le matin','1 fois/jour','orale','Association antihypertensive',true,NULL),
('30000000-0000-4000-8000-000000000003','TEST','Metformine','A10BA02',500,'mg','500 mg matin et soir','2 fois/jour','orale','Diabète',true,NULL),
('30000000-0000-4000-8000-000000000004','TEST','Tamsulosine','G04CA02',0.4,'mg','0,4 mg le soir','1 fois/jour','orale','HBP',true,
 'Dose de démonstration provisoire. La formulation initiale « 8 le soir » doit être clarifiée avant tout usage autre que TEST.');

INSERT INTO iml_workspace_edit.consultation
(consultation_id, patient_legacy_id, consultation_date, location, motif,
 examen_clinique, conduite_a_tenir, sections, status)
VALUES
('10000000-0000-4000-8000-000000000001','TEST',DATE '2026-03-20','Cabinet TEST',
 'Suivi HTA','TA 168/96 mmHg. Examen sans signe aigu rapporté dans ce scénario.',
 'Poursuite de la surveillance tensionnelle.',
 '{"mesures":"TA 168/96 mmHg"}'::jsonb,'SIGNED'),
('10000000-0000-4000-8000-000000000002','TEST',DATE '2026-06-18','Cabinet TEST',
 'Suivi HTA et diabète','TA 174/100 mmHg.',
 'Contrôle biologique et surveillance rapprochée.',
 '{"mesures":"TA 174/100 mmHg"}'::jsonb,'SIGNED'),
('10000000-0000-4000-8000-000000000003','TEST',DATE '2026-08-22','Cabinet TEST',
 'Suivi polypathologie','TA 166/98 mmHg.',
 'Réévaluation du contrôle tensionnel et du bilan rénal.',
 '{"mesures":"TA 166/98 mmHg"}'::jsonb,'SIGNED'),
('10000000-0000-4000-8000-000000000004','TEST',DATE '2026-09-20','Cabinet TEST',
 'Céphalées [KSH97-P : R51]','TA 178/102 mmHg. Céphalées, sans autre élément clinique ajouté au cas TEST à ce stade.',
 'Demande de NFS, ionogramme sanguin, créatinine avec estimation du DFG et HbA1c. Réévaluation après résultats.',
 '{"mesures":"TA 178/102 mmHg","terminologie_motif":"KSH97-P R51"}'::jsonb,'DRAFT');

INSERT INTO iml_workspace_edit.vital_observation
(observation_id, patient_id, observed_at, observation_type, systolic, diastolic, unit, comment)
VALUES
('40000000-0000-4000-8000-000000000001','TEST',DATE '2026-03-20','blood_pressure',168,96,'mmHg',NULL),
('40000000-0000-4000-8000-000000000002','TEST',DATE '2026-06-18','blood_pressure',174,100,'mmHg',NULL),
('40000000-0000-4000-8000-000000000003','TEST',DATE '2026-08-22','blood_pressure',166,98,'mmHg',NULL),
('40000000-0000-4000-8000-000000000004','TEST',DATE '2026-09-20','blood_pressure',178,102,'mmHg','Consultation pour céphalées.');

INSERT INTO iml_workspace_edit.lab_result
(lab_result_id, patient_id, result_date, panel, analyte, value, unit, reference_range, flag)
VALUES
('50000000-0000-4000-8000-000000000001','TEST',DATE '2026-03-12','NFS','Hémoglobine',12.8,'g/dL','13.0–17.0','L'),
('50000000-0000-4000-8000-000000000002','TEST',DATE '2026-03-12','NFS','Leucocytes',6.8,'G/L','4.0–10.0',NULL),
('50000000-0000-4000-8000-000000000003','TEST',DATE '2026-03-12','NFS','Plaquettes',245,'G/L','150–400',NULL),
('50000000-0000-4000-8000-000000000004','TEST',DATE '2026-03-12','Ionogramme / rein','Sodium',139,'mmol/L','135–145',NULL),
('50000000-0000-4000-8000-000000000005','TEST',DATE '2026-03-12','Ionogramme / rein','Potassium',4.7,'mmol/L','3.5–5.0',NULL),
('50000000-0000-4000-8000-000000000006','TEST',DATE '2026-03-12','Ionogramme / rein','Créatinine',156,'µmol/L','Variable selon laboratoire','H'),
('50000000-0000-4000-8000-000000000007','TEST',DATE '2026-03-12','Ionogramme / rein','DFG estimé',42,'mL/min/1,73 m²','≥ 60','L'),
('50000000-0000-4000-8000-000000000008','TEST',DATE '2026-03-12','Diabète','HbA1c',7.4,'%','À interpréter selon objectif individualisé','H'),
('50000000-0000-4000-8000-000000000009','TEST',DATE '2026-07-15','NFS','Hémoglobine',12.3,'g/dL','13.0–17.0','L'),
('50000000-0000-4000-8000-000000000010','TEST',DATE '2026-07-15','NFS','Leucocytes',7.1,'G/L','4.0–10.0',NULL),
('50000000-0000-4000-8000-000000000011','TEST',DATE '2026-07-15','NFS','Plaquettes',238,'G/L','150–400',NULL),
('50000000-0000-4000-8000-000000000012','TEST',DATE '2026-07-15','Ionogramme / rein','Sodium',138,'mmol/L','135–145',NULL),
('50000000-0000-4000-8000-000000000013','TEST',DATE '2026-07-15','Ionogramme / rein','Potassium',4.9,'mmol/L','3.5–5.0',NULL),
('50000000-0000-4000-8000-000000000014','TEST',DATE '2026-07-15','Ionogramme / rein','Créatinine',171,'µmol/L','Variable selon laboratoire','H'),
('50000000-0000-4000-8000-000000000015','TEST',DATE '2026-07-15','Ionogramme / rein','DFG estimé',37,'mL/min/1,73 m²','≥ 60','L'),
('50000000-0000-4000-8000-000000000016','TEST',DATE '2026-07-15','Diabète','HbA1c',7.8,'%','À interpréter selon objectif individualisé','H');

INSERT INTO iml_workspace_edit.lab_order
(lab_order_id, patient_id, consultation_id, ordered_date, panel, analyte, status)
VALUES
('60000000-0000-4000-8000-000000000001','TEST','10000000-0000-4000-8000-000000000004',DATE '2026-09-20','NFS','NFS','ORDERED'),
('60000000-0000-4000-8000-000000000002','TEST','10000000-0000-4000-8000-000000000004',DATE '2026-09-20','Ionogramme / rein','Sodium','ORDERED'),
('60000000-0000-4000-8000-000000000003','TEST','10000000-0000-4000-8000-000000000004',DATE '2026-09-20','Ionogramme / rein','Potassium','ORDERED'),
('60000000-0000-4000-8000-000000000004','TEST','10000000-0000-4000-8000-000000000004',DATE '2026-09-20','Ionogramme / rein','Créatinine + DFG estimé','ORDERED'),
('60000000-0000-4000-8000-000000000005','TEST','10000000-0000-4000-8000-000000000004',DATE '2026-09-20','Diabète','HbA1c','ORDERED');

COMMIT;
