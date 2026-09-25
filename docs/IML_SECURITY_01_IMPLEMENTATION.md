# IML-SECURITY-01 / 02 / 03 — Implementation v0.3

Status: implementation scaffold on `feat/iml-security-layer`.

## Scope

This change is additive. It does not alter validated IML clinical, terminology, laboratory, country-profile or interoperability protocols.

The implementation now establishes:

- default-deny policy decisions;
- RBAC/ABAC role bindings and contextual policy inputs;
- external key references with no secret key material in PostgreSQL;
- contextual pseudonym bindings using opaque subject references;
- AI boundary events and terminal denial;
- tamper-evident append-only audit chaining;
- canonical access roles and source-controlled baseline policy rules;
- human-only, step-up authenticated emergency access;
- canonical data classification;
- a controlled Export Gateway with field and volume limits;
- mandatory encryption before delivery of personal/health exports.

## Non-negotiable AI rule

`DENY_FINAL` is terminal.

When a policy decision returns `DENY_FINAL`, the current access plan stops immediately. The implementation must not:

- try another tool;
- try another data source;
- try another credential;
- rephrase the request to bypass policy;
- query the web to reconstruct denied information;
- switch model/provider to obtain the same denied data.

A fallback is allowed only after a candidate was explicitly `ALLOW`ed and then failed for a technical reason represented by `IML_TECHNICAL_UNAVAILABLE`. Every fallback candidate must receive its own explicit authorization decision before invocation.

## SECURITY-01 — Foundation

Migration: `db/migrations/192_security_layer.sql`

Schema: `iml_security`

Objects:

- `security_profile`
- `key_reference`
- `role_binding`
- `policy_decision`
- `ai_access_event`
- `export_authorization`
- `pseudonym_binding`
- `audit_event`
- `append_audit_event(...)`

## SECURITY-02 — Access matrix and emergency access

Migration: `db/migrations/193_security_access_controls.sql`

Adds:

- `role_definition`;
- canonical role catalogue;
- referential control from role bindings to roles;
- `emergency_access_grant`;
- maximum 30-minute emergency access;
- step-up authentication freshness requirement;
- alert state;
- revocation state;
- mandatory post-event review state.

### Canonical roles

- `physician`
- `medical_assistant`
- `laboratory_service`
- `local_connector`
- `ai_service`
- `security_admin`

### Important boundaries

- a medical assistant has no default unrestricted clinical-record read;
- a laboratory service cannot browse the full patient chart;
- the Local Connector is a device/integration principal, not a clinician;
- AI is limited to prepared/minimized `ai_context`;
- AI has explicit terminal denies for identity, re-identification, export and linkage material;
- a security administrator has no implicit clinical or identity access.

## Human emergency access / break-glass

`src/security/breakGlass.js` implements:

1. human principal only;
2. `physician` role only;
3. subject/patient scope;
4. meaningful justification;
5. recent step-up authentication;
6. maximum lifetime 30 minutes;
7. read-only emergency rule;
8. required alert;
9. required post-event review;
10. no AI/service/device use.

Break-glass is **not** a retry after an AI policy refusal.

It is a distinct human emergency authorization path with purpose `emergency_treatment`.

## SECURITY-03 — Data classification and Export Gateway

Migration: `db/migrations/196_security_data_export_controls.sql`.

The number 196 is intentional so the security branch does not collide with the parallel LAB/BMR migration sequence using 194/195.

### Canonical data classifications

- `PUBLIC`
- `INTERNAL`
- `PERSONAL`
- `HEALTH`
- `RESTRICTED_IDENTITY`
- `LINKAGE_RESTRICTED`
- `SECRET_MATERIAL`

### Generic export rules

The generic Export Gateway may export only classifications explicitly approved for that authorization.

The following are **never** permitted through the generic gateway:

- `RESTRICTED_IDENTITY`
- `LINKAGE_RESTRICTED`
- `SECRET_MATERIAL`

Direct patient identity export, if ever required for a lawful workflow, must use a separate specifically designed path. It must not be enabled by weakening the generic gateway.

### Export authorization requirements

Before an export may be approved:

- a non-empty field allowlist is required;
- a positive maximum record count is required;
- allowed classifications are explicit;
- destination class is explicit;
- sensitive data require encrypted delivery.

A completed export must record:

- record count;
- artifact hash;
- external encryption key reference when encryption is required.

`export_event` provides an append-only control trail without copying clinical payloads into the log.

### Application gateway

`src/security/exportGateway.js` ensures:

- every allowlisted field has a classification;
- fields outside the allowlist are omitted;
- restricted classifications cause a terminal denial;
- volume above `maxRecords` causes a terminal denial;
- expired authorization causes a terminal denial;
- AI principals cannot execute exports;
- PERSONAL/HEALTH rows are passed to `encrypt()` before `deliver()`;
- if encryption is absent or ineffective, `deliver()` is never invoked.

This is application-level exfiltration control. It cannot prevent photography of a screen or a user manually retyping visible information; those are separate physical/endpoint risks.

## Key management

`key_reference` stores identifiers and metadata for keys held by an external KMS/HSM or secure local keystore.

It must never contain:

- raw encryption keys;
- passwords;
- API secrets;
- recovery secrets;
- private signing keys.

The Export Gateway currently expects an external key reference for completed sensitive exports. Actual KMS/keystore binding remains a later gate.

## Audit

`audit_event` is hash chained and protected against ordinary UPDATE/DELETE through triggers.

This makes the database ledger tamper-evident, not absolutely immutable. A production deployment must export and/or sign audit events in a second trust domain so that a privileged database administrator cannot silently rewrite both data and history.

Audit metadata must not become a duplicate clinical record.

## Deployment boundary

The existence of these migrations does not authorize storage of patient or clinical data in Neon.

For the current IML architecture:

- local PostgreSQL remains the reference location for patient/clinical data;
- Neon remains a control/reference plane unless a jurisdiction-specific deployment has explicitly validated another arrangement;
- local-to-Neon synchronization remains whitelist based;
- pseudonymised data remain personal data and are not automatically eligible for cloud synchronization.

## Completed gates

Implemented and tested in source:

- terminal AI denial;
- minimum-necessary field selection;
- canonical access matrix;
- human emergency access;
- data classification;
- controlled export gateway;
- sensitive-export encryption-before-delivery invariant.

## Next implementation gates

Before connecting SECURITY to clinical routes:

1. inventory real PostgreSQL roles and service identities;
2. test migrations 192, 193 and 196 on an isolated database branch/clone;
3. bind a real MFA-capable identity provider;
4. select and bind the first external/local key provider;
5. create the audit sink outside the clinical database;
6. wrap one narrow clinical read path with the Policy Engine;
7. define offline/device trust and Local Connector isolation;
8. add backup/restore security controls;
9. add dependency/SBOM/signing controls;
10. only then expand coverage.

No production database migration should be applied until the security migrations have been tested on an isolated clone/branch and reviewed against the actual IML Clinical Workspace schema.
