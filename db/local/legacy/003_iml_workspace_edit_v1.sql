-- IML local clinical workspace v1
-- Editable local records live here. The preserved Easy Care import in iml_legacy remains immutable.

CREATE SCHEMA IF NOT EXISTS iml_workspace_edit;

CREATE TABLE IF NOT EXISTS iml_workspace_edit.consultation (
    consultation_id uuid PRIMARY KEY,
    patient_legacy_id text NOT NULL,
    consultation_date date NOT NULL,
    location text,
    motif text,
    examen_clinique text,
    conduite_a_tenir text,
    sections jsonb NOT NULL DEFAULT '{}'::jsonb,
    status text NOT NULL DEFAULT 'DRAFT'
        CHECK (status IN ('DRAFT','SIGNED','CANCELLED')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS consultation_patient_date_idx
    ON iml_workspace_edit.consultation(patient_legacy_id, consultation_date DESC, created_at DESC);

COMMENT ON SCHEMA iml_workspace_edit IS
'Local editable IML workspace. Never synchronized to Neon by the legacy sync allowlist.';

COMMENT ON TABLE iml_workspace_edit.consultation IS
'New local consultations created in the migration viewer/workspace. Does not alter iml_legacy.';
