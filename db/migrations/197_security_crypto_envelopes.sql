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
