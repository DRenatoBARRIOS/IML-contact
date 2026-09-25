# IML-SECURITY-01 / SECURITY-02 — Implementation v0.2

Status: implementation scaffold on `feat/iml-security-layer`.

## Scope

This change is additive. It does not alter validated IML clinical, terminology, laboratory, country-profile or interoperability protocols.

The implementation establishes reusable security primitives for the Open Clinical Workspace:

- default-deny policy decisions;
- RBAC/ABAC role bindings and contextual policy inputs;
- external key references with no secret key material in PostgreSQL;
- contextual pseudonym bindings using opaque subject references;
- export authorization records;
- AI boundary events;
- tamper-evident append-only audit chaining;
- application-side terminal-denial enforcement;
- minimum-necessary outbound field selection;
- canonical access roles and source-controlled baseline policy rules;
- human-only, step-up authenticated emergency access.

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

## Database objects

### SECURITY-01

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

### SECURITY-02

Migration: `db/migrations/193_security_access_controls.sql`

Adds:

- `role_definition`;
- canonical role definitions;
- referential control from role bindings to the canonical role catalogue;
- `emergency_access_grant`;
- maximum 30-minute emergency access;
- step-up authentication freshness requirement;
- alert state;
- revocation state;
- mandatory post-event review state.

### Canonical roles

The current baseline contains six roles:

- `physician`;
- `medical_assistant`;
- `laboratory_service`;
- `local_connector`;
- `ai_service`;
- `security_admin`.

These roles are deliberately narrow.

A security administrator does not acquire clinical access by virtue of being a security administrator.

An AI principal has no identity, re-identification, export or emergency-access entitlement.

## Access matrix

`src/security/accessMatrix.js` is the source-controlled baseline policy bundle.

Version: `IML-SECURITY-02/0.2.0`.

The initial matrix implements:

### Physician

For `treatment`:

- read minimum identity summary;
- read clinical record, encounter, laboratory order and laboratory result;
- create/update clinical record, encounter and laboratory order.

### Medical assistant

For `administration` and `care_coordination`:

- read identity summary and administrative record;
- create/update administrative record.

There is no default unrestricted clinical-record read.

A deployment may later add a narrower delegated clinical permission, but it must be explicit.

### Laboratory service

For `laboratory_processing`:

- read laboratory orders;
- create/update laboratory results.

It receives no general patient-record browsing right.

### Local Connector

For `device_integration`:

- execute allowlisted connector jobs;
- handle minimum connector payloads.

The Local Connector is not treated as a clinical user.

### AI service

For `clinical_support`:

- read only a prepared/minimized `ai_context`.

Explicit terminal denies cover:

- identity access;
- re-identification;
- export;
- pseudonym linkage material.

### Security administrator

For `security_operations`:

- read audit events, key references and policy configuration;
- administer key-reference metadata and policy configuration.

Explicit terminal denies cover clinical and identity content.

## Human emergency access / break-glass

`src/security/breakGlass.js` implements the application-side safeguards.

Current baseline:

1. human principal only;
2. `physician` role only;
3. subject/patient scoped;
4. meaningful justification required;
5. recent step-up authentication required;
6. maximum lifetime 30 minutes;
7. read-only emergency rule;
8. alert required;
9. post-event review required;
10. cannot be created by an AI, service or device principal.

Break-glass is **not** a retry after an AI policy refusal.

It is a separate human emergency authorization flow with its own purpose of use: `emergency_treatment`.

The first implementation is intentionally read-only. Write permissions should not be added until a real emergency clinical workflow demonstrates the need and its audit requirements are defined.

## Key management

`key_reference` stores identifiers and metadata for keys held by an external KMS/HSM or secure local keystore.

It must never contain:

- raw encryption keys;
- passwords;
- API secrets;
- recovery secrets;
- private signing keys.

## Audit

`audit_event` is hash chained and protected against ordinary UPDATE/DELETE through triggers.

This makes the database ledger tamper-evident, not absolutely immutable. A production deployment must export and/or sign audit events in a second trust domain so that a privileged database administrator cannot silently rewrite both data and history.

Audit metadata must not become a duplicate clinical record.

## Application objects

`src/security/policyEngine.js`

Provides:

- `evaluateAccess()`
- `assertAllowed()`
- `executeAuthorized()`
- `pickAllowedFields()`
- `PolicyDeniedError`

Policy semantics:

1. malformed context -> `DENY_FINAL`;
2. matching deny overrides matching allow;
3. matching explicit allow -> `ALLOW`;
4. no rule -> `DENY_FINAL`.

`src/security/aiBoundary.js`

Provides:

- `executeAiAccessPlan()`
- `TechnicalUnavailableError`

Its control flow deliberately distinguishes policy denial from technical unavailability.

## Deployment boundary

The existence of these migrations does not authorize storage of patient or clinical data in Neon.

For the current IML architecture:

- local PostgreSQL remains the reference location for patient/clinical data;
- Neon remains a control/reference plane unless a jurisdiction-specific deployment has explicitly validated another arrangement;
- the local-to-Neon synchronization remains whitelist based;
- pseudonymised data are still personal data in the GDPR sense and are not automatically eligible for cloud synchronization.

## Completed implementation gate

The first canonical application access matrix is now defined for:

- physician;
- medical assistant;
- laboratory service;
- Local Connector;
- AI service;
- security administrator.

The first emergency-access model is also defined and tested.

## Next implementation gates

Before connecting SECURITY to clinical routes:

1. inventory real PostgreSQL roles and service identities;
2. test migrations 192 and 193 on an isolated database branch/clone;
3. bind a real MFA-capable identity provider;
4. select the first external/local key provider;
5. create the audit sink outside the clinical database;
6. wrap one narrow clinical read path with the Policy Engine;
7. implement the Export Gateway around `export_authorization`;
8. test denial, export restriction, emergency access and offline scenarios;
9. only then expand coverage.

No production database migration should be applied until migrations 192 and 193 have been tested on an isolated clone/branch and reviewed against the actual IML Clinical Workspace schema.
