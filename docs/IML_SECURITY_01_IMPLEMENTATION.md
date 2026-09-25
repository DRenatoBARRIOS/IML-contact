# IML-SECURITY-01 — Implementation v0.1

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
- minimum-necessary outbound field selection.

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

### Key management

`key_reference` stores identifiers and metadata for keys held by an external KMS/HSM or secure local keystore.

It must never contain:

- raw encryption keys;
- passwords;
- API secrets;
- recovery secrets;
- private signing keys.

### Audit

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

The existence of this migration does not authorize storage of patient or clinical data in Neon.

For the current IML architecture:

- local PostgreSQL remains the reference location for patient/clinical data;
- Neon remains a control/reference plane unless a jurisdiction-specific deployment has explicitly validated another arrangement;
- the local-to-Neon synchronization remains whitelist based;
- pseudonymised data are still personal data in the GDPR sense and are not automatically eligible for cloud synchronization.

## Next implementation gates

Before connecting SECURITY to clinical routes:

1. inventory real PostgreSQL roles and service identities;
2. define the first access matrix for physician, assistant, laboratory, local connector and AI service;
3. bind a real MFA-capable identity provider;
4. select the first external/local key provider;
5. create the audit sink outside the clinical database;
6. wrap one narrow clinical read path with the Policy Engine;
7. test denial, export restriction and emergency-access scenarios;
8. only then expand coverage.

No production database migration should be applied until the migration has been tested on an isolated clone/branch and reviewed against the actual IML Clinical Workspace schema.
