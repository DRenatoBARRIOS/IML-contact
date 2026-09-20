# Legacy → IML canonical transformation layer

This layer begins only after a complete Legacy Import validation has passed.

## Non-negotiable rules

- The preserved legacy rows are never modified.
- Canonical IML is not redesigned around Easy Care limitations.
- Every canonical object must retain provenance back to one or more legacy raw rows.
- Missing relationships remain unresolved unless the source contains deterministic evidence.
- No patient-level data is sent to Neon.
- Transformation starts in DRY-RUN/PLAN mode.

## First canonical sequence

1. `Patients.csv` → `iml_identity.person`, names, demographics, contacts and source identifiers.
2. `Consultations.csv` → `iml_clinical.encounter` after patient and practitioner links are resolved.
3. Allergies, antecedents, pathologies and measurements.
4. Prescriptions and prescription lines.
5. Imported documents.
6. Billing/payments.
7. Longitudinal medical notes and other source-specific material.

Easy Care medical notes without an explicit encounter identifier are preserved as legacy records and are not assigned to a consultation by date inference.

## Commands

Inspect a source dataset without displaying patient values:

```bash
python3 scripts/iml-legacy-transform.py inspect --dataset "Patients.csv"
```

Validate a reviewed mapping profile:

```bash
python3 scripts/iml-legacy-transform.py plan \
  db/local/legacy/mappings/easycare_to_iml_v1.json
```

The first command reports only source column names, ordinal positions and counts. Its output is safe to use for designing the mapping profile.
