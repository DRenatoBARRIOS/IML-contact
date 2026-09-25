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
