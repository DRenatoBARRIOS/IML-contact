# IML-OMRS-01 — OpenMRS O3 compatibility audit

Version 0.1.1 · 21 September 2026

## Purpose

This audit evaluates OpenMRS O3 as a clinical reference platform and interoperability target for the IML Open Clinical Workspace.

The objective is not to make IML dependent on OpenMRS. The objective is to identify what can be reused, extended or connected while preserving IML's vendor-neutral architecture, country packs, terminology model, provenance, correction, auditability and controlled local/remote data strategy.

## Current architectural position

OpenMRS O3 is treated as:

- a major open-source clinical reference;
- a potential interoperability target through FHIR and REST;
- a possible source of reusable workflow and interface patterns;
- not a mandatory runtime dependency of IML.

IML retains its own canonical PostgreSQL model, terminology layer, country-specific integration layer, controlled synchronization model and evidence/provenance architecture.

## Functional audit

| Domain | OpenMRS O3 | IML position | Direction |
| --- | --- | --- | --- |
| Patient identity | Mature, configurable identifiers and registration | Local and national identity, correction, provenance | Interoperate; retain IML trust layer |
| Patient search | Mature | UI still evolving | Reuse workflow patterns |
| Encounter / consultation | Mature | Canonical `iml_clinical.encounter` | Map rather than replace |
| Conditions / problem list | Native O3 patient-chart function | Conditions and diagnoses remain part of the IML clinical model | Interoperate and reuse interaction patterns |
| Antécédents / past medical history | No single native first-class O3 domain equivalent to the French clinical notion of structured antécédents. Information can be captured through conditions, notes, forms and implementation-specific history fields; procedure-history work also exists separately. | IML should represent structured longitudinal antecedents explicitly rather than treating them as a synonym for active conditions | IML clinical core |
| Allergies | Native structured O3 patient-chart function | Part of IML clinical core | Interoperate |
| Observations / vitals | Mature | Canonical IML clinical model | Map through FHIR Observation |
| Clinical forms | O3 Form Builder and React form engine | Significant work remains in IML UI | Strong reuse/reference candidate |
| Diagnoses / terminology | OpenMRS concept dictionary | KSH97-P, ICD-10, LOINC and deterministic mappings | IML remains canonical terminology layer |
| Medication workflow | Orders, medication and dispensing support | Medication knowledge, national rules and provenance | O3 workflow + IML knowledge/rules |
| Laboratory workflow | Orders, Laboratory App and results | LOINC/HPRIM workstream | High-value interoperability target |
| Imaging | Generic support, evolving workflows | Country connectors planned | Keep in IML integration layer |
| Appointments / queues | Mature modules | Not a current IML development priority | Do not rebuild unnecessarily |
| Generic billing | Available in O3 ecosystem | National billing is country-specific | Keep country billing in IML packs |
| France services | No native INS, CPS/e-CPS, Sesam-Vitale, SCOR, NGAP, CCAM, MSSanté, DMP/MES | France pack scope | IML |
| Audit trail | Stronger for create/update/delete than for all read access | Auditability and contextual access are core IML requirements | IML must remain stricter |
| Offline / local operation | Supported patterns exist | Local-first and controlled synchronization are explicit IML requirements | Evaluate, do not assume equivalence |
| Clinical AI | Experimental / evolving | `iml_ai` evidence retrieval, provenance and applicability | IML remains distinct |
| Country ecosystem assessment | Out of OpenMRS scope | IML Country Profiles and six-domain framework | IML |

## Important clinical distinction: conditions are not antécédents

For this audit, OpenMRS **Conditions** must not be treated as equivalent to the broader French primary-care notion of **antécédents**.

A condition/problem list is primarily a list of clinically relevant conditions. An antecedent record may include, depending on local clinical practice and configuration:

- previous diseases that are no longer active but remain relevant;
- surgical and procedural history;
- family history;
- obstetric or other domain-specific history;
- clinically important historical events that should remain visible even when they are not active problems.

OpenMRS can capture much of this information through forms, notes, observations, conditions and implementation-specific configuration, but O3 does not currently expose one standard, first-class patient-chart module that corresponds to this complete antecedent model.

For IML, antecedents should therefore remain an explicit clinical-domain requirement rather than being inferred from the OpenMRS condition list.

## Preferred interoperability boundary

The preferred boundary is FHIR when the OpenMRS resource is available, with REST used only for OpenMRS-specific operations that are not adequately represented in FHIR.

Initial mapping target:

| IML | FHIR | OpenMRS |
| --- | --- | --- |
| Person | Patient | Patient |
| Practitioner | Practitioner | Provider |
| Encounter | Encounter | Encounter / Visit |
| Diagnosis | Condition | Condition |
| Clinical observation | Observation | Obs |
| Allergy | AllergyIntolerance | Allergy |
| Laboratory order | ServiceRequest | Test order |
| Laboratory result | DiagnosticReport + Observation | Result / Obs |
| Prescription | MedicationRequest | Drug order |
| Dispensation | MedicationDispense | Dispensing |

Antecedents are intentionally not collapsed into a single Condition mapping. Their detailed representation must be defined in the IML clinical model before an OpenMRS/FHIR mapping is considered complete.

## Laboratory relevance

OpenMRS O3 is particularly relevant to the IML LOINC/HPRIM workstream because it already provides clinical ordering and laboratory-result workflows.

A future integration path may be:

```text
Clinician
  ↓
IML / OpenMRS clinical workflow
  ↓
FHIR ServiceRequest + LOINC
  ↓
IML France laboratory connector
  ↓
HPRIM
  ↓
Laboratory
  ↓
HPRIM result
  ↓
IML normalization / provenance
  ↓
FHIR DiagnosticReport + Observation
  ↓
IML and/or OpenMRS
```

This remains a design target only. LOINC/HPRIM must not be presented publicly as operational until an end-to-end order/result pathway is demonstrable and validated.

## Key architectural differences

### Deployment

OpenMRS O3 is normally deployed as a multi-component web stack. IML continues to target simpler local and remote deployment patterns suitable for primary care, universities and constrained environments.

### PostgreSQL

IML uses PostgreSQL as its reference clinical data platform. OpenMRS Platform has added PostgreSQL support, but compatibility with the complete O3 distribution must be tested rather than assumed.

### Audit and correction

IML requires strong provenance, correction visibility, contextual access rules and traceable reuse. OpenMRS audit capabilities are useful but do not currently replace the IML audit model.

### National interoperability

OpenMRS is primarily an EMR platform. IML additionally targets national identity, messaging, laboratory exchange, reimbursement, terminology, correction pathways, institutional accountability and cross-system continuity.

## Decision

**OpenMRS O3 remains an important clinical reference and interoperability target, not a mandatory dependency of the IML Open Clinical Workspace.**

The preferred next technical step, when appropriate, is a small proof of concept named **IML-OMRS-01** that exchanges a limited set of FHIR resources without changing the IML canonical core.

## Publication status

Internal architecture document.

Do not publish this audit on the IML website until a concrete OpenMRS interoperability test has been performed and reviewed.
