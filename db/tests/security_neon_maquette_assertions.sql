-- IML SECURITY MAQUETTE ASSERTIONS v0.4
-- Read-only except for a transaction-local synthetic audit fixture that is rolled back.

\set ON_ERROR_STOP on

SELECT
  to_regnamespace('iml_security') IS NOT NULL AS security_schema_exists,
  to_regclass('iml_security.security_profile') IS NOT NULL AS security_profile_exists,
  to_regclass('iml_security.role_definition') IS NOT NULL AS role_definition_exists,
  to_regclass('iml_security.emergency_access_grant') IS NOT NULL AS emergency_access_exists,
  to_regclass('iml_security.data_classification_definition') IS NOT NULL AS classification_exists,
  to_regclass('iml_security.crypto_envelope') IS NOT NULL AS crypto_envelope_exists,
  to_regclass('iml_security.key_operation_event') IS NOT NULL AS key_operation_event_exists;

DO $$
BEGIN
  IF (SELECT count(*) FROM iml_security.role_definition) <> 6 THEN
    RAISE EXCEPTION 'SECURITY ASSERT: expected 6 canonical roles';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM iml_security.role_definition
    WHERE principal_class <> 'human'
      AND can_request_break_glass
  ) THEN
    RAISE EXCEPTION 'SECURITY ASSERT: non-human break-glass role detected';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM iml_security.data_classification_definition
    WHERE classification_code = 'HEALTH'
      AND encryption_required
  ) THEN
    RAISE EXCEPTION 'SECURITY ASSERT: HEALTH must require encryption';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM iml_security.data_classification_definition
    WHERE classification_code IN (
      'RESTRICTED_IDENTITY',
      'LINKAGE_RESTRICTED',
      'SECRET_MATERIAL'
    )
      AND generic_export_allowed
  ) THEN
    RAISE EXCEPTION 'SECURITY ASSERT: restricted classifications cannot use generic export';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM iml_security.security_profile
    WHERE profile_code = 'CORE'
      AND requirements @> '{
        "default_deny": true,
        "terminal_ai_denial": true,
        "break_glass_human_only": true,
        "controlled_export_gateway": true,
        "envelope_encryption": true,
        "external_kek_required": true
      }'::jsonb
  ) THEN
    RAISE EXCEPTION 'SECURITY ASSERT: CORE profile does not contain required v0.4 controls';
  END IF;
END
$$;

-- Exercise the SECURITY DEFINER audit function and rollback the synthetic row.
BEGIN;

SELECT iml_security.append_audit_event(
  'human',
  '11111111-1111-4111-8111-111111111111'::uuid,
  'security_maquette_validation',
  'security_fixture',
  'fixture-a',
  'completed',
  'security_validation',
  '22222222-2222-4222-8222-222222222222'::uuid,
  '{"source":"neon-maquette-assertion"}'::jsonb,
  NULL
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM iml_security.audit_event
    WHERE action = 'security_maquette_validation'
      AND resource_id = 'fixture-a'
  ) THEN
    RAISE EXCEPTION 'SECURITY ASSERT: append_audit_event did not append';
  END IF;
END
$$;

ROLLBACK;

SELECT
  code,
  status,
  version
FROM iml_system.module_registry
WHERE code = 'SECURITY_LAYER';

SELECT
  profile_code,
  enabled,
  requirements
FROM iml_security.security_profile
ORDER BY profile_code;

SELECT
  role_code,
  principal_class,
  can_request_break_glass
FROM iml_security.role_definition
ORDER BY role_code;

SELECT
  classification_code,
  sensitivity_rank,
  generic_export_allowed,
  encryption_required
FROM iml_security.data_classification_definition
ORDER BY sensitivity_rank;

SELECT 'IML SECURITY MAQUETTE ASSERTIONS: PASS' AS result;
