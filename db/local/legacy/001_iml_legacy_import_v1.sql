-- IML Legacy Import v1.0
-- Local-only preservation layer for legacy clinical systems.
-- This schema stores imported patient/source data locally and MUST NOT be synchronized to Neon.
-- Principle: 0 rows lost, 0 columns lost, 0 invented relationships.

BEGIN;

CREATE SCHEMA IF NOT EXISTS iml_legacy;

CREATE TABLE IF NOT EXISTS iml_legacy.import_run (
    import_run_id uuid PRIMARY KEY,
    source_system text NOT NULL,
    source_root text NOT NULL,
    started_at timestamptz NOT NULL DEFAULT now(),
    completed_at timestamptz,
    status text NOT NULL CHECK (status IN ('running','completed','failed')),
    importer_version text NOT NULL,
    dataset_count integer NOT NULL DEFAULT 0,
    row_count bigint NOT NULL DEFAULT 0,
    column_count integer NOT NULL DEFAULT 0,
    notes text
);

CREATE TABLE IF NOT EXISTS iml_legacy.dataset (
    dataset_id uuid PRIMARY KEY,
    import_run_id uuid NOT NULL REFERENCES iml_legacy.import_run(import_run_id) ON DELETE CASCADE,
    source_filename text NOT NULL,
    dataset_name text NOT NULL,
    relative_path text NOT NULL,
    encoding text,
    delimiter text,
    source_sha256 text NOT NULL,
    column_count integer NOT NULL,
    row_count bigint NOT NULL DEFAULT 0,
    UNIQUE (import_run_id, relative_path)
);

CREATE TABLE IF NOT EXISTS iml_legacy.dataset_column (
    dataset_id uuid NOT NULL REFERENCES iml_legacy.dataset(dataset_id) ON DELETE CASCADE,
    ordinal_position integer NOT NULL,
    source_column_name text NOT NULL,
    PRIMARY KEY (dataset_id, ordinal_position),
    UNIQUE (dataset_id, source_column_name)
);

CREATE TABLE IF NOT EXISTS iml_legacy.raw_record (
    raw_record_id uuid PRIMARY KEY,
    dataset_id uuid NOT NULL REFERENCES iml_legacy.dataset(dataset_id) ON DELETE CASCADE,
    source_row_number bigint NOT NULL,
    source_record jsonb NOT NULL,
    source_row_sha256 text NOT NULL,
    imported_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (dataset_id, source_row_number)
);

CREATE INDEX IF NOT EXISTS raw_record_dataset_idx
    ON iml_legacy.raw_record(dataset_id);

CREATE INDEX IF NOT EXISTS raw_record_source_record_gin
    ON iml_legacy.raw_record USING gin(source_record);

CREATE TABLE IF NOT EXISTS iml_legacy.mapping (
    mapping_id uuid PRIMARY KEY,
    raw_record_id uuid NOT NULL REFERENCES iml_legacy.raw_record(raw_record_id) ON DELETE CASCADE,
    target_schema text,
    target_table text,
    target_id text,
    status text NOT NULL CHECK (status IN ('mapped','unresolved','ambiguous','not_applicable')),
    mapping_method text NOT NULL,
    confidence numeric(5,4),
    evidence jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    CHECK (
      (status = 'mapped' AND target_schema IS NOT NULL AND target_table IS NOT NULL AND target_id IS NOT NULL)
      OR status <> 'mapped'
    )
);

CREATE INDEX IF NOT EXISTS mapping_raw_record_idx
    ON iml_legacy.mapping(raw_record_id);

COMMENT ON SCHEMA iml_legacy IS
'LOCAL-ONLY legacy preservation/import layer. Never synchronize patient/source rows to Neon.';

COMMENT ON TABLE iml_legacy.raw_record IS
'Immutable row-level preservation of the source dataset as JSONB. No inferred clinical relationships.';

COMMIT;
