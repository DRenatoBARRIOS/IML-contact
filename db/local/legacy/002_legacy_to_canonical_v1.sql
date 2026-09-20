-- IML Legacy -> Canonical transformation layer v1.0
-- LOCAL ONLY. This layer records explicit transformations from preserved legacy rows
-- into canonical IML objects. It never alters the source preservation layer.

BEGIN;

CREATE SCHEMA IF NOT EXISTS iml_legacy;

CREATE TABLE IF NOT EXISTS iml_legacy.transform_run (
    transform_run_id uuid PRIMARY KEY,
    import_run_id uuid NOT NULL REFERENCES iml_legacy.import_run(import_run_id) ON DELETE RESTRICT,
    profile_code text NOT NULL,
    transformer_version text NOT NULL,
    mode text NOT NULL CHECK (mode IN ('DRY_RUN','APPLY')),
    started_at timestamptz NOT NULL DEFAULT now(),
    completed_at timestamptz,
    status text NOT NULL CHECK (status IN ('running','completed','failed')),
    source_record_count bigint NOT NULL DEFAULT 0,
    mapped_count bigint NOT NULL DEFAULT 0,
    unresolved_count bigint NOT NULL DEFAULT 0,
    ambiguous_count bigint NOT NULL DEFAULT 0,
    error_count bigint NOT NULL DEFAULT 0,
    notes text
);

CREATE TABLE IF NOT EXISTS iml_legacy.transform_rule (
    rule_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_code text NOT NULL,
    source_dataset text NOT NULL,
    source_column_ordinal integer,
    source_column_name text,
    target_schema text NOT NULL,
    target_table text NOT NULL,
    target_column text,
    transform_code text NOT NULL,
    required boolean NOT NULL DEFAULT false,
    active boolean NOT NULL DEFAULT true,
    rule_order integer NOT NULL DEFAULT 100,
    notes text,
    UNIQUE(profile_code, source_dataset, rule_order, target_schema, target_table, target_column)
);

CREATE TABLE IF NOT EXISTS iml_legacy.canonical_link (
    canonical_link_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    transform_run_id uuid NOT NULL REFERENCES iml_legacy.transform_run(transform_run_id) ON DELETE RESTRICT,
    raw_record_id uuid NOT NULL REFERENCES iml_legacy.raw_record(raw_record_id) ON DELETE RESTRICT,
    target_schema text NOT NULL,
    target_table text NOT NULL,
    target_id uuid,
    status text NOT NULL CHECK (status IN ('planned','created','linked','unresolved','ambiguous','error')),
    resolution_code text NOT NULL,
    evidence jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(transform_run_id, raw_record_id, target_schema, target_table, resolution_code)
);

CREATE INDEX IF NOT EXISTS canonical_link_raw_record_idx
    ON iml_legacy.canonical_link(raw_record_id);

CREATE INDEX IF NOT EXISTS canonical_link_target_idx
    ON iml_legacy.canonical_link(target_schema, target_table, target_id);

COMMENT ON TABLE iml_legacy.transform_run IS
'Local audit trail for deterministic Legacy-to-IML canonical transformations.';

COMMENT ON TABLE iml_legacy.transform_rule IS
'Explicit transformation rules. No heuristic relationship creation is permitted.';

COMMENT ON TABLE iml_legacy.canonical_link IS
'Provenance bridge from one preserved legacy row to a canonical IML object or an explicit unresolved state.';

COMMIT;
