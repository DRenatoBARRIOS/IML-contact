-- IML SECURITY MAQUETTE BUNDLE v0.4
-- Target: isolated Neon branch of IML Clinical Workspace Dev
-- Order is canonical and has passed PostgreSQL 17 integration testing.
-- DO NOT run on a production/main branch without isolated-branch validation.
--
-- Includes:
--   SECURITY-01 foundation
--   SECURITY-02 access controls
--   SECURITY-03 data classification / export controls
--   SECURITY-04 crypto envelope / external key references
--
-- No patient data are inserted by this bundle.

\echo '=== IML SECURITY-01 ==='
-- IML SECURITY-01 v0.1
-- Transversal security foundation for the IML Open Clinical Workspace.
-- Additive only: no existing functional schema/table is dropped or altered.
--
-- SECURITY INVARIANTS
-- 1. Default deny.
-- 2. A policy refusal is represented as DENY_FINAL and is terminal.
-- 3. Secrets and cryptographic key material are never stored in this schema.
-- 4. Audit payloads must not duplicate clinical content.
-- 5. Patient identity/clinical separation is preserved; this schema stores only opaque references.
--
-- NOTE: this migration creates the local/control-plane primitives. It does NOT
-- make Neon a permitted store for patient/clinical data. Deployment policy
-- remains responsible for deciding where this migration is applied.

BEGIN;

SELECT pg_advisory_xact_lock(hashtext('IML:192_security_layer'));

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE SCHEMA IF NOT EXISTS iml_security;

CREATE TABLE IF NOT EXISTS iml_security.security_profile (
  profile_code text PRIMARY KEY,
  jurisdiction_code text NOT NULL,
  name text NOT NULL,
  enabled boolean NOT NULL DEFAULT false,
  requirements jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp()
);

CREATE TABLE IF NOT EXISTS iml_security.key_reference (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key_purpose text NOT NULL CHECK (key_purpose IN (
    'identity',
    'clinical',
    'attachment',
    'export',
    'audit_signing',
    'pseudonymisation',
    'other'
  )),
  provider text NOT NULL,
  provider_key_ref text NOT NULL,
  algorithm text NOT NULL,
  key_version text NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN (
    'active',
    'rotating',
    'retired',
    'revoked'
  )),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  rotated_at timestamptz NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (provider, provider_key_ref, key_version)
);

COMMENT ON TABLE iml_security.key_reference IS
'References external KMS/HSM/local keystore keys. Secret key material must never be stored here.';

CREATE TABLE IF NOT EXISTS iml_security.role_binding (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  principal_type text NOT NULL CHECK (principal_type IN (
    'human',
    'service',
    'device',
    'ai_agent'
  )),
  principal_id uuid NOT NULL,
  role_code text NOT NULL,
  scope_type text NOT NULL DEFAULT 'workspace',
  scope_ref text NULL,
  enabled boolean NOT NULL DEFAULT true,
  valid_from timestamptz NULL,
  valid_until timestamptz NULL,
  attributes jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  CHECK (valid_until IS NULL OR valid_from IS NULL OR valid_until > valid_from)
);

CREATE INDEX IF NOT EXISTS idx_security_role_principal
  ON iml_security.role_binding(principal_type, principal_id, enabled);

CREATE INDEX IF NOT EXISTS idx_security_role_scope
  ON iml_security.role_binding(scope_type, scope_ref, role_code);

CREATE TABLE IF NOT EXISTS iml_security.policy_decision (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL DEFAULT gen_random_uuid(),
  principal_type text NOT NULL CHECK (principal_type IN (
    'human',
    'service',
    'device',
    'ai_agent'
  )),
  principal_id uuid NULL,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id text NULL,
  purpose_of_use text NOT NULL,
  effect text NOT NULL CHECK (effect IN ('ALLOW', 'DENY_FINAL')),
  reason_code text NOT NULL,
  policy_version text NOT NULL,
  context jsonb NOT NULL DEFAULT '{}'::jsonb,
  decided_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  UNIQUE (request_id)
);

COMMENT ON COLUMN iml_security.policy_decision.effect IS
'DENY_FINAL is terminal. It must never trigger a search for an alternate route, source, tool or credential.';

CREATE INDEX IF NOT EXISTS idx_security_policy_principal
  ON iml_security.policy_decision(principal_type, principal_id, decided_at DESC);

CREATE INDEX IF NOT EXISTS idx_security_policy_resource
  ON iml_security.policy_decision(resource_type, resource_id, decided_at DESC);

CREATE TABLE IF NOT EXISTS iml_security.ai_access_event (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_decision_id uuid NOT NULL
    REFERENCES iml_security.policy_decision(id)
    ON DELETE RESTRICT,
  model_provider text NULL,
  model_name text NULL,
  tool_code text NULL,
  request_fingerprint char(64) NULL
    CHECK (request_fingerprint IS NULL OR length(request_fingerprint) = 64),
  outcome text NOT NULL CHECK (outcome IN (
    'allowed',
    'denied_final',
    'technical_unavailable',
    'completed',
    'failed'
  )),
  detail_code text NULL,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);

COMMENT ON TABLE iml_security.ai_access_event IS
'AI boundary events. A denied_final outcome must terminate the access plan; only technical_unavailable may permit an already-authorized fallback.';

CREATE INDEX IF NOT EXISTS idx_security_ai_decision
  ON iml_security.ai_access_event(policy_decision_id, created_at DESC);

CREATE TABLE IF NOT EXISTS iml_security.export_authorization (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requested_by uuid NULL,
  purpose_of_use text NOT NULL,
  resource_scope jsonb NOT NULL,
  requested_format text NOT NULL,
  max_records bigint NULL CHECK (max_records IS NULL OR max_records > 0),
  destination_class text NOT NULL DEFAULT 'controlled',
  status text NOT NULL DEFAULT 'requested' CHECK (status IN (
    'requested',
    'approved',
    'denied',
    'completed',
    'expired',
    'revoked'
  )),
  approved_by uuid NULL,
  approved_at timestamptz NULL,
  expires_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_security_export_status
  ON iml_security.export_authorization(status, created_at DESC);

CREATE TABLE IF NOT EXISTS iml_security.pseudonym_binding (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_ref uuid NOT NULL,
  context_code text NOT NULL,
  pseudonym uuid NOT NULL DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'active' CHECK (status IN (
    'active',
    'revoked',
    'expired'
  )),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  expires_at timestamptz NULL,
  UNIQUE (subject_ref, context_code),
  UNIQUE (pseudonym, context_code)
);

COMMENT ON TABLE iml_security.pseudonym_binding IS
'Restricted linkage material. subject_ref is opaque and must not contain direct identifiers. Access must be limited to the Identity/Re-identification Broker.';

CREATE TABLE IF NOT EXISTS iml_security.audit_event (
  seq bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  event_id uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  occurred_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  actor_type text NOT NULL,
  actor_id uuid NULL,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id text NULL,
  outcome text NOT NULL,
  purpose_of_use text NULL,
  request_id uuid NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  prev_event_hash bytea NULL,
  event_hash bytea NOT NULL,
  external_signature text NULL
);

COMMENT ON TABLE iml_security.audit_event IS
'Append-only, hash-chained audit ledger. It is tamper-evident, not absolutely immutable; production deployments must export/sign events in a second trust domain.';

CREATE INDEX IF NOT EXISTS idx_security_audit_time
  ON iml_security.audit_event(occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_security_audit_actor
  ON iml_security.audit_event(actor_type, actor_id, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_security_audit_resource
  ON iml_security.audit_event(resource_type, resource_id, occurred_at DESC);

CREATE OR REPLACE FUNCTION iml_security.append_audit_event(
  p_actor_type text,
  p_actor_id uuid,
  p_action text,
  p_resource_type text,
  p_resource_id text,
  p_outcome text,
  p_purpose_of_use text,
  p_request_id uuid,
  p_metadata jsonb DEFAULT '{}'::jsonb,
  p_external_signature text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, iml_security
AS $$
DECLARE
  v_event_id uuid := gen_random_uuid();
  v_occurred_at timestamptz := clock_timestamp();
  v_prev_hash bytea;
  v_event_hash bytea;
  v_payload text;
  v_pgcrypto_schema text;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('IML:SECURITY:AUDIT_CHAIN'));

  SELECT event_hash
    INTO v_prev_hash
  FROM iml_security.audit_event
  ORDER BY seq DESC
  LIMIT 1;

  SELECT n.nspname
    INTO v_pgcrypto_schema
  FROM pg_catalog.pg_extension e
  JOIN pg_catalog.pg_namespace n
    ON n.oid = e.extnamespace
  WHERE e.extname = 'pgcrypto';

  IF v_pgcrypto_schema IS NULL THEN
    RAISE EXCEPTION 'IML SECURITY requires pgcrypto for audit hashing';
  END IF;

  v_payload := concat_ws('|',
    encode(COALESCE(v_prev_hash, ''::bytea), 'hex'),
    v_event_id::text,
    v_occurred_at::text,
    COALESCE(p_actor_type, ''),
    COALESCE(p_actor_id::text, ''),
    COALESCE(p_action, ''),
    COALESCE(p_resource_type, ''),
    COALESCE(p_resource_id, ''),
    COALESCE(p_outcome, ''),
    COALESCE(p_purpose_of_use, ''),
    COALESCE(p_request_id::text, ''),
    COALESCE(p_metadata, '{}'::jsonb)::text
  );

  EXECUTE format(
    'SELECT %I.digest($1::text, %L)',
    v_pgcrypto_schema,
    'sha256'
  )
  INTO v_event_hash
  USING v_payload;

  INSERT INTO iml_security.audit_event (
    event_id,
    occurred_at,
    actor_type,
    actor_id,
    action,
    resource_type,
    resource_id,
    outcome,
    purpose_of_use,
    request_id,
    metadata,
    prev_event_hash,
    event_hash,
    external_signature
  )
  VALUES (
    v_event_id,
    v_occurred_at,
    p_actor_type,
    p_actor_id,
    p_action,
    p_resource_type,
    p_resource_id,
    p_outcome,
    p_purpose_of_use,
    p_request_id,
    COALESCE(p_metadata, '{}'::jsonb),
    v_prev_hash,
    v_event_hash,
    p_external_signature
  );

  RETURN v_event_id;
END;
$$;

CREATE OR REPLACE FUNCTION iml_security.reject_audit_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'IML SECURITY audit_event is append-only';
END;
$$;

DROP TRIGGER IF EXISTS trg_security_audit_no_update
  ON iml_security.audit_event;
CREATE TRIGGER trg_security_audit_no_update
BEFORE UPDATE ON iml_security.audit_event
FOR EACH ROW EXECUTE FUNCTION iml_security.reject_audit_mutation();

DROP TRIGGER IF EXISTS trg_security_audit_no_delete
  ON iml_security.audit_event;
CREATE TRIGGER trg_security_audit_no_delete
BEFORE DELETE ON iml_security.audit_event
FOR EACH ROW EXECUTE FUNCTION iml_security.reject_audit_mutation();

REVOKE ALL ON TABLE iml_security.audit_event FROM PUBLIC;
REVOKE ALL ON FUNCTION iml_security.append_audit_event(
  text, uuid, text, text, text, text, text, uuid, jsonb, text
) FROM PUBLIC;

INSERT INTO iml_security.security_profile (
  profile_code,
  jurisdiction_code,
  name,
  enabled,
  requirements
)
VALUES
  (
    'CORE',
    'GLOBAL',
    'IML Security Core',
    true,
    '{"default_deny":true,"mfa_required":true,"external_key_management":true,"terminal_ai_denial":true}'::jsonb
  ),
  (
    'EU_GDPR',
    'EU',
    'European Union GDPR profile',
    false,
    '{"data_minimisation":true,"privacy_by_design":true,"pseudonymisation":true,"retention_policy_required":true}'::jsonb
  ),
  (
    'FR_HDS',
    'FR',
    'France health-data hosting profile',
    false,
    '{"hds_scope_review_required":true,"health_data_external_hosting_requires_certified_scope":true}'::jsonb
  ),
  (
    'US_HIPAA',
    'US',
    'United States HIPAA profile',
    false,
    '{"minimum_necessary":true,"audit_controls":true,"access_controls":true,"baa_review_required":true}'::jsonb
  )
ON CONFLICT (profile_code) DO UPDATE SET
  jurisdiction_code = EXCLUDED.jurisdiction_code,
  name = EXCLUDED.name,
  requirements = EXCLUDED.requirements,
  updated_at = clock_timestamp();

DO $$
BEGIN
  IF to_regclass('iml_system.module_registry') IS NOT NULL THEN
    EXECUTE $sql$
      INSERT INTO iml_system.module_registry(code,name,category,status,version,description)
      VALUES (
        'SECURITY_LAYER',
        'IML transversal security layer',
        'TRANSVERSAL',
        'SCAFFOLD',
        'IML-SECURITY-01/0.1.0',
        'Additive security primitives: policy decisions, RBAC/ABAC bindings, external key references, pseudonymisation linkage, export authorization, AI terminal-denial events and tamper-evident audit.'
      )
      ON CONFLICT(code) DO UPDATE SET
        name=EXCLUDED.name,
        category=EXCLUDED.category,
        status=EXCLUDED.status,
        version=EXCLUDED.version,
        description=EXCLUDED.description,
        updated_at=now()
    $sql$;
  END IF;
END
$$;

COMMIT;


\echo '=== IML SECURITY-02 ==='
-- IML SECURITY-02 v0.2
-- Canonical access roles and human-only emergency access.
-- Additive to SECURITY-01. No clinical/identity schema is altered.
--
-- INVARIANTS
-- 1. Default deny remains authoritative.
-- 2. AI/service/device principals can never receive break-glass access.
-- 3. Emergency access is human initiated, step-up authenticated, scoped,
--    time-limited, alerted and subject to post-event review.
-- 4. Break-glass is a distinct emergency authorization path, not a retry
--    after DENY_FINAL and never a way for AI to bypass policy.
-- 5. Security administrators do not gain clinical or identity access merely
--    because they administer security metadata.

BEGIN;

SELECT pg_advisory_xact_lock(hashtext('IML:193_security_access_controls'));

CREATE TABLE IF NOT EXISTS iml_security.role_definition (
  role_code text PRIMARY KEY,
  principal_class text NOT NULL CHECK (principal_class IN (
    'human',
    'service',
    'device',
    'ai_agent'
  )),
  name text NOT NULL,
  description text NOT NULL,
  can_request_break_glass boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp()
);

INSERT INTO iml_security.role_definition (
  role_code,
  principal_class,
  name,
  description,
  can_request_break_glass
)
VALUES
  (
    'physician',
    'human',
    'Physician',
    'Clinician providing direct patient care. Clinical access remains purpose- and scope-bound.',
    true
  ),
  (
    'medical_assistant',
    'human',
    'Medical assistant',
    'Administrative and delegated care-coordination role with no default unrestricted clinical-record access.',
    false
  ),
  (
    'laboratory_service',
    'service',
    'Laboratory service',
    'Service identity limited to laboratory orders, specimens and results required for laboratory processing.',
    false
  ),
  (
    'local_connector',
    'device',
    'IML Local Connector',
    'Device/integration principal limited to explicitly allowlisted local peripherals and connector payloads.',
    false
  ),
  (
    'ai_service',
    'ai_agent',
    'AI service',
    'Bounded AI principal restricted to minimized AI contexts. No identity, re-identification, export or break-glass rights.',
    false
  ),
  (
    'security_admin',
    'human',
    'Security administrator',
    'Administers policy, key metadata and security controls without implicit access to clinical or identity content.',
    false
  )
ON CONFLICT (role_code) DO UPDATE SET
  principal_class = EXCLUDED.principal_class,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  can_request_break_glass = EXCLUDED.can_request_break_glass,
  updated_at = clock_timestamp();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_security_role_binding_definition'
      AND conrelid = 'iml_security.role_binding'::regclass
  ) THEN
    ALTER TABLE iml_security.role_binding
      ADD CONSTRAINT fk_security_role_binding_definition
      FOREIGN KEY (role_code)
      REFERENCES iml_security.role_definition(role_code)
      ON UPDATE RESTRICT
      ON DELETE RESTRICT;
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS iml_security.emergency_access_grant (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requested_by uuid NOT NULL,
  subject_ref uuid NOT NULL,
  purpose_of_use text NOT NULL DEFAULT 'emergency_treatment'
    CHECK (purpose_of_use = 'emergency_treatment'),
  justification text NOT NULL
    CHECK (char_length(btrim(justification)) >= 12),
  step_up_auth_method text NOT NULL,
  step_up_authenticated_at timestamptz NOT NULL,
  activated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  expires_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN (
    'active',
    'revoked',
    'expired',
    'reviewed'
  )),
  alert_status text NOT NULL DEFAULT 'pending' CHECK (alert_status IN (
    'pending',
    'sent',
    'failed'
  )),
  alert_dispatched_at timestamptz NULL,
  revoked_by uuid NULL,
  revoked_at timestamptz NULL,
  reviewed_by uuid NULL,
  reviewed_at timestamptz NULL,
  review_outcome text NULL CHECK (
    review_outcome IS NULL OR review_outcome IN (
      'appropriate',
      'inappropriate',
      'needs_follow_up'
    )
  ),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  CHECK (expires_at > activated_at),
  CHECK (expires_at <= activated_at + interval '30 minutes'),
  CHECK (step_up_authenticated_at >= activated_at - interval '5 minutes'),
  CHECK (step_up_authenticated_at <= activated_at + interval '1 minute'),
  CHECK (
    (status <> 'revoked')
    OR (revoked_at IS NOT NULL AND revoked_by IS NOT NULL)
  ),
  CHECK (
    (status <> 'reviewed')
    OR (reviewed_at IS NOT NULL AND reviewed_by IS NOT NULL AND review_outcome IS NOT NULL)
  )
);

COMMENT ON TABLE iml_security.emergency_access_grant IS
'Human-only emergency read-access grant. Application policy must reject all service, device and AI principals before a row is created. Grant is subject-scoped, step-up authenticated, maximum 30 minutes, alerted and reviewed after use.';

COMMENT ON COLUMN iml_security.emergency_access_grant.subject_ref IS
'Opaque subject reference only. No direct identity attribute is stored here.';

CREATE INDEX IF NOT EXISTS idx_security_emergency_active
  ON iml_security.emergency_access_grant(requested_by, subject_ref, expires_at)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_security_emergency_review
  ON iml_security.emergency_access_grant(status, created_at DESC);

UPDATE iml_security.security_profile
SET
  requirements = requirements || '{
    "canonical_role_matrix": true,
    "break_glass_human_only": true,
    "break_glass_step_up_auth": true,
    "break_glass_max_minutes": 30,
    "break_glass_post_review": true
  }'::jsonb,
  updated_at = clock_timestamp()
WHERE profile_code = 'CORE';

DO $$
BEGIN
  IF to_regclass('iml_system.module_registry') IS NOT NULL THEN
    UPDATE iml_system.module_registry
    SET
      version = 'IML-SECURITY-01/0.2.0',
      description = 'Security primitives plus canonical access roles and human-only, step-up authenticated, time-limited emergency access.',
      updated_at = now()
    WHERE code = 'SECURITY_LAYER';
  END IF;
END
$$;

COMMIT;


\echo '=== IML SECURITY-03 ==='
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


\echo '=== IML SECURITY-04 ==='
-- IML SECURITY-04 v0.4
-- Envelope encryption metadata and external key-broker lifecycle.
--
-- SECURITY MODEL
--   plaintext -> random DEK -> AES-256-GCM ciphertext
--                     |
--                     +-> DEK wrapped by an external KEK
--
-- PostgreSQL may store the wrapped DEK and non-secret cryptographic metadata.
-- It must never store the plaintext DEK or the KEK.
--
-- INVARIANTS
-- 1. AES-256-GCM is the baseline data cipher.
-- 2. Each encrypted object/value uses a fresh nonce and a data key lifecycle
--    controlled by the Key Broker.
-- 3. AAD binds ciphertext to its opaque resource context.
-- 4. KEKs live in an external KMS/HSM/OS keystore, never in PostgreSQL.
-- 5. Key rotation may re-wrap a DEK without decrypting clinical payloads.
-- 6. The security schema stores no plaintext clinical payload.

BEGIN;

SELECT pg_advisory_xact_lock(hashtext('IML:197_security_crypto_envelopes'));

ALTER TABLE iml_security.key_reference
  ADD COLUMN IF NOT EXISTS provider_class text NULL,
  ADD COLUMN IF NOT EXISTS rotation_group text NULL,
  ADD COLUMN IF NOT EXISTS not_before timestamptz NULL,
  ADD COLUMN IF NOT EXISTS not_after timestamptz NULL,
  ADD COLUMN IF NOT EXISTS capabilities jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE iml_security.key_reference
  DROP CONSTRAINT IF EXISTS chk_security_key_reference_validity;
ALTER TABLE iml_security.key_reference
  ADD CONSTRAINT chk_security_key_reference_validity
  CHECK (not_after IS NULL OR not_before IS NULL OR not_after > not_before);

COMMENT ON COLUMN iml_security.key_reference.provider_key_ref IS
'Non-secret identifier/alias for a KEK held by an external KMS, HSM or OS-backed secure keystore. Raw key material is forbidden.';

COMMENT ON COLUMN iml_security.key_reference.capabilities IS
'Non-secret provider capabilities such as wrap, unwrap, rewrap and rotation metadata.';

CREATE TABLE IF NOT EXISTS iml_security.crypto_envelope (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_type text NOT NULL,
  resource_ref text NOT NULL,
  field_ref text NULL,
  classification_code text NOT NULL
    REFERENCES iml_security.data_classification_definition(classification_code)
    ON UPDATE RESTRICT
    ON DELETE RESTRICT,
  key_reference_id uuid NOT NULL
    REFERENCES iml_security.key_reference(id)
    ON UPDATE RESTRICT
    ON DELETE RESTRICT,
  key_purpose text NOT NULL CHECK (key_purpose IN (
    'identity',
    'clinical',
    'attachment',
    'export',
    'audit_signing',
    'pseudonymisation',
    'other'
  )),
  cipher_algorithm text NOT NULL DEFAULT 'AES-256-GCM'
    CHECK (cipher_algorithm = 'AES-256-GCM'),
  cipher_version text NOT NULL DEFAULT 'IML-CRYPTO-01',
  nonce bytea NOT NULL CHECK (octet_length(nonce) = 12),
  wrapped_dek bytea NOT NULL CHECK (octet_length(wrapped_dek) > 0),
  wrap_algorithm text NOT NULL,
  aad_hash char(64) NOT NULL CHECK (length(aad_hash) = 64),
  ciphertext_hash char(64) NOT NULL CHECK (length(ciphertext_hash) = 64),
  status text NOT NULL DEFAULT 'active' CHECK (status IN (
    'active',
    'rewrapped',
    'retired',
    'revoked'
  )),
  rewrapped_from uuid NULL
    REFERENCES iml_security.crypto_envelope(id)
    ON UPDATE RESTRICT
    ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  rewrapped_at timestamptz NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

COMMENT ON TABLE iml_security.crypto_envelope IS
'Non-secret envelope-encryption metadata. wrapped_dek is ciphertext under an external KEK; plaintext DEKs, KEKs and clinical payloads are forbidden in this table.';

COMMENT ON COLUMN iml_security.crypto_envelope.resource_ref IS
'Opaque resource reference only. Direct patient identifiers must not be placed here.';

COMMENT ON COLUMN iml_security.crypto_envelope.nonce IS
'96-bit AES-GCM nonce. Non-secret but must never be reused with the same DEK.';

CREATE INDEX IF NOT EXISTS idx_security_crypto_resource
  ON iml_security.crypto_envelope(resource_type, resource_ref, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_security_crypto_key
  ON iml_security.crypto_envelope(key_reference_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_security_key_rotation_group
  ON iml_security.key_reference(rotation_group, status)
  WHERE rotation_group IS NOT NULL;

CREATE TABLE IF NOT EXISTS iml_security.key_operation_event (
  seq bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  event_id uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  key_reference_id uuid NOT NULL
    REFERENCES iml_security.key_reference(id)
    ON UPDATE RESTRICT
    ON DELETE RESTRICT,
  envelope_id uuid NULL
    REFERENCES iml_security.crypto_envelope(id)
    ON UPDATE RESTRICT
    ON DELETE RESTRICT,
  actor_type text NOT NULL,
  actor_id uuid NULL,
  operation text NOT NULL CHECK (operation IN (
    'generate_data_key',
    'wrap_data_key',
    'unwrap_data_key',
    'rewrap_data_key',
    'rotate_kek_reference',
    'encrypt',
    'decrypt',
    'deny',
    'fail'
  )),
  purpose_of_use text NULL,
  outcome text NOT NULL CHECK (outcome IN (
    'allowed',
    'completed',
    'denied',
    'failed'
  )),
  detail_code text NULL,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);

COMMENT ON TABLE iml_security.key_operation_event IS
'Append-only key-operation metadata. No plaintext key material, ciphertext payload or clinical content may be recorded here.';

CREATE INDEX IF NOT EXISTS idx_security_key_operation_key
  ON iml_security.key_operation_event(key_reference_id, created_at DESC);

CREATE OR REPLACE FUNCTION iml_security.reject_key_operation_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'IML SECURITY key_operation_event is append-only';
END;
$$;

DROP TRIGGER IF EXISTS trg_security_key_operation_no_update
  ON iml_security.key_operation_event;
CREATE TRIGGER trg_security_key_operation_no_update
BEFORE UPDATE ON iml_security.key_operation_event
FOR EACH ROW EXECUTE FUNCTION iml_security.reject_key_operation_mutation();

DROP TRIGGER IF EXISTS trg_security_key_operation_no_delete
  ON iml_security.key_operation_event;
CREATE TRIGGER trg_security_key_operation_no_delete
BEFORE DELETE ON iml_security.key_operation_event
FOR EACH ROW EXECUTE FUNCTION iml_security.reject_key_operation_mutation();

REVOKE ALL ON TABLE iml_security.key_operation_event FROM PUBLIC;

UPDATE iml_security.security_profile
SET
  requirements = requirements || '{
    "envelope_encryption": true,
    "baseline_cipher": "AES-256-GCM",
    "external_kek_required": true,
    "plaintext_key_storage_forbidden": true,
    "aad_context_binding": true,
    "kek_rewrap_supported": true,
    "nonce_reuse_forbidden": true
  }'::jsonb,
  updated_at = clock_timestamp()
WHERE profile_code = 'CORE';

DO $$
BEGIN
  IF to_regclass('iml_system.module_registry') IS NOT NULL THEN
    UPDATE iml_system.module_registry
    SET
      version = 'IML-SECURITY-01/0.4.0',
      description = 'Security foundation through envelope encryption: external KEKs, wrapped DEKs, AES-256-GCM, contextual AAD and re-wrapping support.',
      updated_at = now()
    WHERE code = 'SECURITY_LAYER';
  END IF;
END
$$;

COMMIT;


\echo '=== IML SECURITY v0.4 bundle complete ==='
