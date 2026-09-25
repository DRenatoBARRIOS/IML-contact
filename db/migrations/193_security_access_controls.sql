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
