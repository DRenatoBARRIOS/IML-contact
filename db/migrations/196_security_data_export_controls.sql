-- IML SECURITY-03 v0.3
-- Data classification and controlled export gateway metadata.
-- Numbered 196 to avoid collision with parallel LAB/BMR migrations 194/195.
--
-- INVARIANTS
-- 1. Export is a separate authorization event, not a side effect of read access.
-- 2. Every controlled export has a field allowlist and volume limit.
-- 3. Sensitive exports require encryption before delivery.
-- 4. Restricted identity, linkage material and secret material are never
--    permitted through the generic export gateway.
-- 5. AI principals remain unable to approve or execute exports.

BEGIN;

SELECT pg_advisory_xact_lock(hashtext('IML:196_security_data_export_controls'));

CREATE TABLE IF NOT EXISTS iml_security.data_classification_definition (
  classification_code text PRIMARY KEY,
  sensitivity_rank integer NOT NULL CHECK (sensitivity_rank >= 0),
  name text NOT NULL,
  description text NOT NULL,
  generic_export_allowed boolean NOT NULL DEFAULT false,
  encryption_required boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp()
);

INSERT INTO iml_security.data_classification_definition (
  classification_code,
  sensitivity_rank,
  name,
  description,
  generic_export_allowed,
  encryption_required
)
VALUES
  (
    'PUBLIC',
    0,
    'Public',
    'Information approved for public disclosure through an explicit publication process.',
    true,
    false
  ),
  (
    'INTERNAL',
    20,
    'Internal',
    'Non-public operational information with no patient or direct personal content.',
    true,
    false
  ),
  (
    'PERSONAL',
    60,
    'Personal',
    'Personal data that can relate to an identifiable individual.',
    true,
    true
  ),
  (
    'HEALTH',
    80,
    'Health',
    'Clinical or health-related personal data requiring heightened controls.',
    true,
    true
  ),
  (
    'RESTRICTED_IDENTITY',
    95,
    'Restricted identity',
    'Direct patient identity attributes. Not exportable through the generic gateway.',
    false,
    true
  ),
  (
    'LINKAGE_RESTRICTED',
    100,
    'Restricted linkage material',
    'Re-identification/linkage material. Restricted to the identity broker.',
    false,
    true
  ),
  (
    'SECRET_MATERIAL',
    110,
    'Secret material',
    'Passwords, raw keys, recovery secrets or equivalent material. Must not be stored or exported.',
    false,
    true
  )
ON CONFLICT (classification_code) DO UPDATE SET
  sensitivity_rank = EXCLUDED.sensitivity_rank,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  generic_export_allowed = EXCLUDED.generic_export_allowed,
  encryption_required = EXCLUDED.encryption_required,
  updated_at = clock_timestamp();

ALTER TABLE iml_security.export_authorization
  ADD COLUMN IF NOT EXISTS allowed_classifications text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS field_allowlist text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS requires_encryption boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS policy_version text NULL,
  ADD COLUMN IF NOT EXISTS completed_record_count bigint NULL,
  ADD COLUMN IF NOT EXISTS artifact_hash char(64) NULL,
  ADD COLUMN IF NOT EXISTS encryption_key_reference_id uuid NULL
    REFERENCES iml_security.key_reference(id)
    ON DELETE RESTRICT;

ALTER TABLE iml_security.export_authorization
  DROP CONSTRAINT IF EXISTS chk_security_export_completed_count;
ALTER TABLE iml_security.export_authorization
  ADD CONSTRAINT chk_security_export_completed_count
  CHECK (completed_record_count IS NULL OR completed_record_count >= 0);

ALTER TABLE iml_security.export_authorization
  DROP CONSTRAINT IF EXISTS chk_security_export_artifact_hash;
ALTER TABLE iml_security.export_authorization
  ADD CONSTRAINT chk_security_export_artifact_hash
  CHECK (artifact_hash IS NULL OR length(artifact_hash) = 64);

CREATE OR REPLACE FUNCTION iml_security.validate_export_authorization_row()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_classification text;
  v_generic_allowed boolean;
  v_encryption_required boolean;
BEGIN
  IF NEW.status IN ('approved', 'completed') THEN
    IF cardinality(NEW.field_allowlist) = 0 THEN
      RAISE EXCEPTION 'IML SECURITY export approval requires a non-empty field allowlist';
    END IF;

    IF NEW.max_records IS NULL OR NEW.max_records <= 0 THEN
      RAISE EXCEPTION 'IML SECURITY export approval requires a positive max_records limit';
    END IF;

    IF cardinality(NEW.allowed_classifications) = 0 THEN
      RAISE EXCEPTION 'IML SECURITY export approval requires allowed classifications';
    END IF;

    FOREACH v_classification IN ARRAY NEW.allowed_classifications LOOP
      SELECT generic_export_allowed, encryption_required
        INTO v_generic_allowed, v_encryption_required
      FROM iml_security.data_classification_definition
      WHERE classification_code = v_classification;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'Unknown IML data classification: %', v_classification;
      END IF;

      IF NOT v_generic_allowed THEN
        RAISE EXCEPTION 'Classification % is forbidden in the generic export gateway', v_classification;
      END IF;

      IF v_encryption_required AND NOT NEW.requires_encryption THEN
        RAISE EXCEPTION 'Classification % requires encrypted export delivery', v_classification;
      END IF;
    END LOOP;
  END IF;

  IF NEW.status = 'completed' THEN
    IF NEW.completed_record_count IS NULL THEN
      RAISE EXCEPTION 'Completed export requires completed_record_count';
    END IF;

    IF NEW.completed_record_count > NEW.max_records THEN
      RAISE EXCEPTION 'Completed export exceeds authorized max_records';
    END IF;

    IF NEW.artifact_hash IS NULL THEN
      RAISE EXCEPTION 'Completed export requires artifact_hash';
    END IF;

    IF NEW.requires_encryption AND NEW.encryption_key_reference_id IS NULL THEN
      RAISE EXCEPTION 'Encrypted completed export requires an external key reference';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_security_validate_export_authorization
  ON iml_security.export_authorization;
CREATE TRIGGER trg_security_validate_export_authorization
BEFORE INSERT OR UPDATE ON iml_security.export_authorization
FOR EACH ROW
EXECUTE FUNCTION iml_security.validate_export_authorization_row();

CREATE TABLE IF NOT EXISTS iml_security.export_event (
  seq bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  event_id uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  export_authorization_id uuid NOT NULL
    REFERENCES iml_security.export_authorization(id)
    ON DELETE RESTRICT,
  actor_type text NOT NULL,
  actor_id uuid NULL,
  event_type text NOT NULL CHECK (event_type IN (
    'requested',
    'approved',
    'denied',
    'started',
    'encrypted',
    'delivered',
    'completed',
    'failed',
    'revoked'
  )),
  record_count bigint NULL CHECK (record_count IS NULL OR record_count >= 0),
  artifact_hash char(64) NULL CHECK (
    artifact_hash IS NULL OR length(artifact_hash) = 64
  ),
  destination_class text NULL,
  detail_code text NULL,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);

COMMENT ON TABLE iml_security.export_event IS
'Append-only export control events. Clinical payloads and direct identifiers must not be copied into this table.';

CREATE INDEX IF NOT EXISTS idx_security_export_event_auth
  ON iml_security.export_event(export_authorization_id, created_at DESC);

CREATE OR REPLACE FUNCTION iml_security.reject_export_event_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'IML SECURITY export_event is append-only';
END;
$$;

DROP TRIGGER IF EXISTS trg_security_export_event_no_update
  ON iml_security.export_event;
CREATE TRIGGER trg_security_export_event_no_update
BEFORE UPDATE ON iml_security.export_event
FOR EACH ROW EXECUTE FUNCTION iml_security.reject_export_event_mutation();

DROP TRIGGER IF EXISTS trg_security_export_event_no_delete
  ON iml_security.export_event;
CREATE TRIGGER trg_security_export_event_no_delete
BEFORE DELETE ON iml_security.export_event
FOR EACH ROW EXECUTE FUNCTION iml_security.reject_export_event_mutation();

REVOKE ALL ON TABLE iml_security.export_event FROM PUBLIC;

UPDATE iml_security.security_profile
SET
  requirements = requirements || '{
    "data_classification_required": true,
    "controlled_export_gateway": true,
    "field_allowlist_required": true,
    "export_volume_limit_required": true,
    "restricted_identity_generic_export_forbidden": true,
    "linkage_material_generic_export_forbidden": true,
    "sensitive_export_encryption_required": true
  }'::jsonb,
  updated_at = clock_timestamp()
WHERE profile_code = 'CORE';

DO $$
BEGIN
  IF to_regclass('iml_system.module_registry') IS NOT NULL THEN
    UPDATE iml_system.module_registry
    SET
      version = 'IML-SECURITY-01/0.3.0',
      description = 'Security primitives, canonical access roles, emergency access, data classification and controlled export gateway.',
      updated_at = now()
    WHERE code = 'SECURITY_LAYER';
  END IF;
END
$$;

COMMIT;
