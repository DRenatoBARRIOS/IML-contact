# AI-EVIDENCE-02A — Clinical Evidence Provenance & Applicability
## with MEDICATION-DECISION-01 scaffold

Version 0.3.2 · 6 September 2026

IML is not a publication library. Its operational path is:

**source → read/import → clinically useful structured claim → provenance → applicability to the person → concise clinician support**

Patient-specific matching remains local/runtime and clinician-controlled.

## Distinguish application priority from scientific certainty

A nationally applicable legal or regulatory rule may have to be considered first for action. That does not make it the strongest scientific evidence. Conversely, high-certainty international evidence does not erase national regulatory constraints.

IML therefore stores both:
- authority / jurisdiction / binding status;
- GRADE certainty / provenance / applicability.

## GRADE

GRADE is an external methodological layer, not an IML-created score. Certainty is stored per outcome when available: high, moderate, low, very low. Recommendation strength remains separate. GRADE domains can be preserved in structured metadata.

## MAGIC Evidence

MAGIC is treated as a structured evidence provider. When available, IML should import structured PICO, recommendations, evidence summaries and identifiers through the API rather than asking AI to reconstruct what is already structured.

## EMA

EMA has two roles.

**EMA ePI / SmPC** supplies authorised regulatory product information relevant to indications, posology, contraindications, warnings, interactions and other medication-safety decisions. EU ePI provides a structured FHIR route.

**EMA Clinical Data Publication** is a deeper provenance layer for clinical study reports, protocols and statistical-method documentation.

## Trial populations and external validity

The model records the population actually studied: inclusion/exclusion criteria, age, sex, pregnancy, renal/hepatic context, comorbidities, concomitant treatments, sample size and follow-up.

The future runtime can then distinguish:
- directly applicable;
- partially applicable;
- important extrapolation;
- population not studied.

A scientifically valid result can still be poorly applicable to an individual patient.

## Meta-analysis

IML does not automatically rank a meta-analysis above other evidence. It can preserve study count, participants, I², population/intervention/outcome heterogeneity, publication-bias concerns, selective reporting, indirectness and industry-funding concerns. No home-made global quality score is created.

## Sponsorship and provenance

Industry funding does not automatically invalidate evidence, but it must remain visible. The provenance layer can store sponsor identity/role, trial registration, protocol availability, statistical analysis plan availability and clinical study report availability.

## Medication decision engine

The consultation cannot wait for a fresh literature review. Heavy reading and normalization occur beforehand. Runtime work should be rapid.

### Fixed-dose combinations

Products are decomposed into active ingredients. Four boxes may contain six pharmacologically active substances. The engine reasons primarily at ingredient level.

### Beyond pairwise interactions

Rules can represent cumulative risk involving several medicines and patient factors such as renal function, age, laboratory values and comorbidities. Relevant domains include hyperkalaemia, hypotension, bradycardia, bleeding, QT prolongation, hypoglycaemia, sedation/falls, anticholinergic burden and kidney injury.

### Consultation target

The future UI should compress results into:
- **Red**: hard/regulatory stop, major interaction, dangerous duplication, incompatible dose;
- **Amber**: cumulative risk, adjustment, missing monitoring, important precaution;
- **Green**: no blocking issue detected and expected monitoring present.

Every signal should have a “Why?” path back to its source.

## Source order for action

Default routing:
1. nationally applicable legal/regulatory information, preferably from the official national product-information source when available;
2. national guidance and practical references;
3. international guidelines;
4. structured evidence / GRADE;
5. evidence syntheses;
6. primary research and deep regulatory evidence.

This is a routing strategy, not a hierarchy of truth. Conflicts must remain visible.

## Seeded sources

All remain disabled until validated:
- GRADE Working Group;
- MAGIC Evidence / MAGICapp;
- EMA ePI;
- EMA Clinical Data Publication;
- France: Base de Données Publique des Médicaments (official national source);
- Sweden: Läkemedelsverket product information/open-data XML;
- ADA; AHA/ACC; ESC; WHO;
- HAS; NICE; Socialstyrelsen;
- Läkemedelsboken;
- VIDAL France;
- FASS Vård;
- Janusmed.

## Next demonstration

A useful first end-to-end case is **hypertension + type 2 diabetes + polypharmacy**. It exercises fixed-dose combinations, national rules, international guidance, renal/biological monitoring, cumulative medication risk and patient/population applicability.
