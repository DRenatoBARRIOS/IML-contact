# IML-SECURITY-01 / 02 / 03 / 04 — Implementation v0.4

Status: implementation scaffold on `feat/iml-security-layer`.

## Scope

This security stack is additive. It does not alter validated IML clinical, terminology, laboratory, country-profile or interoperability protocols.

Implemented layers:

- SECURITY-01: policy foundation, key references, pseudonymisation, audit and AI terminal denial;
- SECURITY-02: canonical access matrix and human-only emergency access;
- SECURITY-03: data classification and controlled exports;
- SECURITY-04: envelope encryption with external KEKs and wrapped DEKs.

## Non-negotiable AI rule

`DENY_FINAL` remains terminal.

A denial must never trigger another tool, source, credential, provider, web reconstruction or alternate route.

Technical fallback is distinct and only follows an explicit `ALLOW`.

## SECURITY-01 — Foundation

Migration: `db/migrations/192_security_layer.sql`.

Core objects include:

- `security_profile`
- `key_reference`
- `role_binding`
- `policy_decision`
- `ai_access_event`
- `export_authorization`
- `pseudonym_binding`
- `audit_event`

## SECURITY-02 — Access control

Migration: `db/migrations/193_security_access_controls.sql`.

Canonical roles:

- `physician`
- `medical_assistant`
- `laboratory_service`
- `local_connector`
- `ai_service`
- `security_admin`

Break-glass is human-only, physician-only, subject-scoped, step-up authenticated, read-only, maximum 30 minutes, alerted and reviewed.

## SECURITY-03 — Data classification and exports

Migration: `db/migrations/196_security_data_export_controls.sql`.

Classifications:

- `PUBLIC`
- `INTERNAL`
- `PERSONAL`
- `HEALTH`
- `RESTRICTED_IDENTITY`
- `LINKAGE_RESTRICTED`
- `SECRET_MATERIAL`

`RESTRICTED_IDENTITY`, `LINKAGE_RESTRICTED` and `SECRET_MATERIAL` are forbidden in the generic Export Gateway.

PERSONAL/HEALTH exports must be encrypted before delivery.

## SECURITY-04 — Envelope encryption and key independence

Migration: `db/migrations/197_security_crypto_envelopes.sql`.

### Core model

IML uses envelope encryption:

```text
plaintext
   ↓
fresh data-encryption key (DEK)
   ↓
AES-256-GCM ciphertext
   │
   └── DEK wrapped by an external key-encryption key (KEK)
```

PostgreSQL may hold:

- ciphertext in the functional data store;
- a 96-bit GCM nonce;
- the wrapped DEK;
- the external KEK reference;
- cipher/wrap algorithms;
- AAD hash;
- ciphertext hash;
- lifecycle metadata.

PostgreSQL must never hold:

- plaintext DEKs;
- KEKs;
- KMS/HSM credentials;
- recovery secrets;
- private signing keys.

### Key Broker

`src/security/keyBroker.js` defines the provider-neutral Key Broker contract.

A provider adapter must implement:

- `withGeneratedDataKey()`;
- `withUnwrappedDataKey()`;
- optionally `rewrapDataKey()`.

The crypto layer only accepts **non-extractable 256-bit AES-GCM CryptoKeys**.

This deliberately prevents SECURITY-04 from becoming coupled to one provider. A later deployment adapter can target an OS keystore, HSM or cloud KMS without changing the clinical encryption format.

### Crypto envelope

`src/security/cryptoEnvelope.js` implements:

- `encryptEnvelope()`;
- `decryptEnvelope()`;
- `rewrapEnvelope()`;
- canonical Additional Authenticated Data (AAD);
- SHA-256 AAD/ciphertext fingerprints;
- 96-bit random AES-GCM nonces;
- 128-bit GCM authentication tags.

The returned envelope contains no plaintext key material.

### Context binding

AAD binds ciphertext to an opaque context:

- resource type;
- opaque resource reference;
- optional field reference;
- data classification;
- purpose;
- crypto schema version.

This means ciphertext encrypted for one patient/resource context cannot simply be moved to another context and decrypted successfully.

Direct identifiers must not be placed into the AAD/resource reference. References are opaque.

### Key rotation

`rewrapEnvelope()` changes the KEK protecting a DEK without changing:

- clinical ciphertext;
- GCM nonce;
- AAD;
- clinical payload.

The preferred provider implementation performs a secure re-wrap operation inside its key-management boundary.

This avoids mass decryption/re-encryption of patient records merely because a KEK is rotated.

### Database metadata

`crypto_envelope` stores non-secret envelope metadata and the wrapped DEK.

`key_operation_event` is append-only and records key-operation metadata without storing plaintext keys or clinical content.

### What SECURITY-04 does not yet do

It does not yet:

- choose the production key provider;
- place keys into Neon;
- encrypt an existing clinical column;
- migrate existing plaintext clinical data;
- solve OS/device key custody for offline clients;
- define disaster-recovery key escrow.

Those are separate deployment gates.

## Deployment boundary

The existence of these migrations still does not authorize patient/clinical data storage in Neon.

Current architectural default remains:

- patient/clinical store local;
- Neon control/reference plane;
- synchronization whitelist-based;
- sensitive data remain subject to jurisdiction-specific deployment review.

## Tests currently enforced

The security CI covers, among other invariants:

- default deny;
- terminal AI denial;
- no AI break-glass;
- subject-scoped emergency access;
- no restricted identity in generic export;
- encryption before sensitive delivery;
- envelope encrypt/decrypt round trip;
- randomized ciphertext;
- AAD patient/resource binding;
- ciphertext tamper detection;
- KEK re-wrap without clinical ciphertext change;
- inactive/revoked key-reference rejection.

## Next implementation gates

Before encrypting any real clinical field:

1. test migrations 192, 193, 196 and 197 on an isolated PostgreSQL/Neon branch;
2. inspect the actual IML clinical and identity schemas;
3. select the first Key Broker provider for local development;
4. select the production/hosted key-provider strategy per jurisdiction;
5. define recovery and key-loss procedures;
6. define key rotation cadence and ownership;
7. encrypt one deliberately narrow non-production field;
8. verify backup/restore with keys unavailable to the database alone;
9. only then extend field/document encryption.

No production clinical migration should be applied before these gates are completed.
