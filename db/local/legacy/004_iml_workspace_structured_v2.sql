-- IML local clinical workspace v2
-- Structured local data for fictional/test patients and future editable records.
-- iml_legacy remains immutable. Nothing here is synchronized to Neon.

CREATE SCHEMA IF NOT EXISTS iml_workspace_edit;

CREATE TABLE IF NOT EXISTS iml_workspace_edit.patient (
    patient_id text PRIMARY KEY,
    given_name text,
    family_name text NOT NULL,
    birth_date date,
    sex_at_birth text,
    fictional boolean NOT NULL DEFAULT false,
    notes text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS iml_workspace_edit.diagnosis (
    diagnosis_id uuid PRIMARY KEY,
    patient_id text NOT NULL REFERENCES iml_workspace_edit.patient(patient_id) ON DELETE CASCADE,
    label text NOT NULL,
    coding_system text,
    code text,
    status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','RESOLVED','INACTIVE')),
    important boolean NOT NULL DEFAULT false,
    onset_date date,
    comment text,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS diagnosis_patient_idx
    ON iml_workspace_edit.diagnosis(patient_id, status, label);

CREATE TABLE IF NOT EXISTS iml_workspace_edit.medication_statement (
    medication_statement_id uuid PRIMARY KEY,
    patient_id text NOT NULL REFERENCES iml_workspace_edit.patient(patient_id) ON DELETE CASCADE,
    substance text NOT NULL,
    atc_code text,
    strength_value numeric,
    strength_unit text,
    dose_text text NOT NULL,
    frequency_text text,
    route text DEFAULT 'orale',
    treatment_group text,
    active boolean NOT NULL DEFAULT true,
    comment text,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS medication_statement_patient_idx
    ON iml_workspace_edit.medication_statement(patient_id, active, substance);

CREATE TABLE IF NOT EXISTS iml_workspace_edit.vital_observation (
    observation_id uuid PRIMARY KEY,
    patient_id text NOT NULL REFERENCES iml_workspace_edit.patient(patient_id) ON DELETE CASCADE,
    observed_at date NOT NULL,
    observation_type text NOT NULL,
    systolic numeric,
    diastolic numeric,
    value numeric,
    unit text,
    comment text,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS vital_observation_patient_date_idx
    ON iml_workspace_edit.vital_observation(patient_id, observed_at DESC);

CREATE TABLE IF NOT EXISTS iml_workspace_edit.lab_result (
    lab_result_id uuid PRIMARY KEY,
    patient_id text NOT NULL REFERENCES iml_workspace_edit.patient(patient_id) ON DELETE CASCADE,
    result_date date NOT NULL,
    panel text,
    analyte text NOT NULL,
    value numeric,
    value_text text,
    unit text,
    reference_range text,
    flag text,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS lab_result_patient_date_idx
    ON iml_workspace_edit.lab_result(patient_id, result_date DESC, analyte);

CREATE TABLE IF NOT EXISTS iml_workspace_edit.lab_order (
    lab_order_id uuid PRIMARY KEY,
    patient_id text NOT NULL REFERENCES iml_workspace_edit.patient(patient_id) ON DELETE CASCADE,
    consultation_id uuid REFERENCES iml_workspace_edit.consultation(consultation_id) ON DELETE SET NULL,
    ordered_date date NOT NULL,
    panel text,
    analyte text NOT NULL,
    status text NOT NULL DEFAULT 'ORDERED'
        CHECK (status IN ('ORDERED','COLLECTED','RESULTED','CANCELLED')),
    comment text,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS lab_order_patient_date_idx
    ON iml_workspace_edit.lab_order(patient_id, ordered_date DESC);

COMMENT ON TABLE iml_workspace_edit.patient IS
'Local editable/test patients. Fictional patients must have fictional=true.';
COMMENT ON TABLE iml_workspace_edit.diagnosis IS
'Patient problems/diagnoses with optional terminology system and code.';
COMMENT ON TABLE iml_workspace_edit.medication_statement IS
'Current or historical medication statements; ATC can be linked to reference medication data.';
COMMENT ON TABLE iml_workspace_edit.lab_result IS
'Structured laboratory result rows suitable for longitudinal tables.';
COMMENT ON TABLE iml_workspace_edit.lab_order IS
'Structured laboratory orders linked to a local consultation when available.';
