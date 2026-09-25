# IML-BMR-IL-01 — Illinois BMR/UTI pathway demonstrator v0.1

**Date:** 25 September 2026  
**Status:** Research design draft, no patient data  
**Scope:** Reusable IML demonstrator, first validation candidate in Illinois  
**Clinical tracer:** suspected urinary tract infection with urine culture / antimicrobial susceptibility testing, including resistant E. coli when present

## 1. Purpose

The demonstrator tests IML as a **health-information pathway instrument**, not as a disease registry and not as an autonomous clinical decision system.

The unit of analysis is the information pathway:

```text
clinical presentation
    ↓
urine testing decision
    ↓
sample / laboratory order
    ↓
urinalysis / culture
    ↓
organism identification
    ↓
susceptibility / resistance result
    ↓
clinical interpretation
    ↓
treatment / change / no treatment
    ↓
follow-up
    ↓
reuse of information in later care
```

## 2. Why this tracer

Urinary infection is suitable because it can expose several information-quality problems within a compact pathway:

- symptoms and clinical context may be separated from laboratory results;
- positive cultures do not automatically represent symptomatic infection;
- susceptibility data may arrive after an initial treatment decision;
- treatment may need review after results;
- the same test may be repeated because prior results are not visible or reusable;
- resistant organisms make provenance and interpretation more important.

The demonstrator must preserve the distinction between:

- symptomatic infection;
- asymptomatic bacteriuria;
- colonisation;
- contamination;
- isolate/resistance result without sufficient clinical context.

## 3. Minimal dataset v0.1

### Clinical context

- opaque subject reference;
- encounter reference;
- age band;
- sex where scientifically justified;
- pregnancy status where relevant and authorized;
- urinary symptoms;
- systemic symptoms / fever;
- complication context;
- recent antibiotic exposure, if available and justified;
- relevant prior resistant-organism history as a structured yes/no/contextual field.

### Laboratory pathway

- order timestamp;
- specimen timestamp;
- result timestamp;
- urinalysis/leukocyturia where available;
- culture status;
- quantitative culture / colony-count representation where available;
- organism identification;
- antimicrobial susceptibility result;
- MIC where available;
- laboratory interpretation;
- amended/corrected result flag.

### Clinical action

- diagnosis/assessment category;
- treatment started before result: yes/no;
- antimicrobial selected, represented through the study's medication coding layer;
- treatment changed after result: yes/no;
- documented reason for change where available;
- follow-up performed: yes/no;
- specialist referral / ED / hospital escalation where relevant;
- repeat urine testing within a defined follow-up window.

### Provenance

Every clinically relevant item should retain:

- source system;
- author/source actor where allowed;
- event timestamp;
- ingestion timestamp;
- terminology/code system and version;
- correction status.

Direct identifiers are not part of the analytic dataset.

## 4. Primary outcomes

The first study should measure pathway properties, not clinical superiority.

### Completeness

Proportion of episodes with enough information to distinguish a clinically interpretable pathway from an isolated laboratory result.

### Timeliness

Intervals:

- encounter → order;
- order → specimen;
- specimen → preliminary/final result;
- final susceptibility → documented treatment review.

### Continuity

Whether the result and its interpretation are visible and reusable at the point where the next clinical decision occurs.

### Redundancy

Potentially repeated tests within a predefined interval, classified only after review of clinical justification.

### Correction / provenance

Frequency and visibility of amended results, changed assessments or treatment revisions.

### Minimum-necessary access

Whether each study component can be performed without exposing data not required for that component.

## 5. Secondary AI evaluation

AI is evaluated as a bounded research service.

Permitted initial functions:

- identify missing elements in the pathway;
- summarize structured timeline events;
- retrieve external evidence relevant to a clinician-defined question;
- flag discordance for human review, such as a susceptibility result arriving after an earlier empirical prescription;
- classify whether sufficient context exists to distinguish infection / colonisation / asymptomatic bacteriuria / contamination, without making the clinical diagnosis itself.

Not permitted in v0.1:

- autonomous antibiotic selection;
- autonomous diagnosis;
- autonomous re-identification;
- unrestricted chart search;
- fallback after a policy denial;
- web reconstruction of denied patient information.

IML SECURITY-01 `DENY_FINAL` applies.

## 6. Study phases

### Phase 0 — synthetic / de-identified pathway

Goal: validate data model, provenance, timing metrics, access controls and audit logic without identifiable patient data.

### Phase 1 — retrospective feasibility

After IRB/data-governance approval, use the minimum dataset needed to determine whether real outpatient pathways can be reconstructed reliably.

### Phase 2 — prospective observational validation

Observe whether the structured pathway improves visibility, auditability and timeliness. No autonomous AI intervention.

### Phase 3 — controlled AI-assistance study

Only after prior validation. Compare a bounded AI-assisted workflow with the same workflow without AI assistance using predefined outcomes.

## 7. Illinois fit

The study complements rather than duplicates existing Illinois infrastructure.

- IDPH XDRO supports surveillance and inter-facility communication for CRE and selected extensively drug-resistant organisms.
- Routine ESBL status alone does not place an Enterobacterales isolate into the CRE registry.
- CHARM focuses on outpatient antimicrobial-use stewardship and prescribing feedback.
- IML-BMR-IL-01 focuses on the information pathway joining clinical context, laboratory evidence, action, follow-up and provenance.

## 8. Candidate technical mappings

The implementation should reuse the current IML terminology/laboratory workstream.

Candidate LOINC-oriented elements already identified in IML work include:

- urine microbiology panel;
- leukocytes;
- erythrocytes;
- organism identified by culture;
- antimicrobial susceptibility;
- MIC.

Exact canonical codes must be revalidated against the IML LOINC 2.83 workbench before production use.

## 9. Success criteria for pilot v0.1

The pilot succeeds if it demonstrates that:

1. a common resistant-organism pathway can be reconstructed without copying an entire EHR;
2. missing and delayed information can be measured reproducibly;
3. data provenance and corrections remain visible;
4. AI can operate on minimized, authorized data;
5. a policy refusal remains terminal;
6. study outputs can be generated without exposing direct patient identifiers;
7. the model remains reusable outside Illinois and outside BMR.

## 10. Non-goals

This study does not claim to measure Illinois-wide prevalence of resistant E. coli.

It does not infer population prevalence from a convenience sample.

It does not replace IDPH, NHSN, XDRO or CHARM.

It tests IML as an interoperable, auditable research and care-information layer.
