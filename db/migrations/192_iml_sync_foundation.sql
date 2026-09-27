-- IML Clinical Workspace
-- Migration 192: IML-SYNC-01 foundation
-- Version: 0.1.2
-- Date: 2026-09-06
--
-- Additive technical metadata only. No patient data is created or copied.

BEGIN;

CREATE SCHEMA IF NOT EXISTS iml_system;

CREATE TABLE IF NOT EXISTS iml_system.migration_history (
    migration_name text PRIMARY KEY,
    sha256 char(64) NOT NULL,
    applied_at timestamptz NOT NULL DEFAULT now(),
    applied_by text NOT NULL DEFAULT current_user,
    tool_code text NOT NULL DEFAULT 'IML-SYNC-01'
);

CREATE TABLE IF NOT EXISTS iml_system.sync_run (
    run_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    sync_code text NOT NULL DEFAULT 'IML-SYNC-01',
    sync_version text NOT NULL,
    direction text NOT NULL CHECK (direction IN (
        'LOCAL_TO_NEON',
        'REPOSITORY_TO_LOCAL',
        'REPOSITORY_TO_NEON',
        'VERIFY'
    )),
    mode text NOT NULL,
    source_database text,
    target_database text,
    manifest_sha256 char(64),
    status text NOT NULL CHECK (status IN ('STARTED','SUCCEEDED','FAILED')),
    started_at timestamptz NOT NULL DEFAULT now(),
    completed_at timestamptz,
    details jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_sync_run_started_at
    ON iml_system.sync_run(started_at DESC);

CREATE INDEX IF NOT EXISTS idx_sync_run_mode_status
    ON iml_system.sync_run(mode, status);

INSERT INTO iml_system.module_registry(code,name,category,status,version,description)
VALUES (
    'IML_SYNC_CONTROL',
    'Controlled local to Neon synchronization',
    'TRANSVERSAL',
    'ACTIVE',
    'IML-SYNC-01/0.1.2',
    'Allowlist-driven schema migration and reference synchronization. Patient-linked tables and raw terminology staging are excluded by default.'
)
ON CONFLICT(code) DO UPDATE SET
    name=EXCLUDED.name,
    category=EXCLUDED.category,
    status=EXCLUDED.status,
    version=EXCLUDED.version,
    description=EXCLUDED.description,
    updated_at=now();

COMMIT;
