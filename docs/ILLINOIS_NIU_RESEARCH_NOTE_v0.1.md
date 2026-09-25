# IML — Illinois / NIU research note v0.1

**Date:** 25 September 2026  
**Status:** Internal working document  
**Purpose:** Define a realistic institutional entry point for an Illinois IML validation study without changing the Illinois v0.1 score or methodology.

## 1. Starting point

Illinois v0.1 already documents a mixed environment:

- substantial operational exchange capacity;
- distributed governance rather than one general-purpose statewide HIE;
- strong public-health and Medicaid data flows;
- material cybersecurity/control weaknesses documented by state audits;
- active antimicrobial-resistance and stewardship infrastructure.

This note does **not** rescore Illinois.

## 2. Why Northern Illinois University is relevant

M. Courtney Hughes, Ph.D., is Professor of Public Health and Interim Associate Dean for Research and Administration at Northern Illinois University (NIU), College of Health and Human Sciences.

Her current research profile explicitly includes:

- AI and health;
- quality in health care;
- determinants of health;
- health education and training.

In August 2026 she published a harm-reduction framework for responsible AI in public-health research. The framework emphasizes responsible population selection, data governance, public engagement and transparent dissemination, with the stated objective of reducing AI-related harms without unnecessarily slowing innovation.

This is directly compatible with the IML research position:

> AI should be studied as part of the health-information pathway, with governance and minimisation built into the study design rather than added after deployment.

## 3. Existing NIU AMR capacity

NIU already has AMR-related work outside the Hughes programme.

### Pallavi Singh / Biological Sciences

NIU lists an active pilot study on antibiotic-resistant genes in urban and rural Illinois. The Singh Biome Lab studies antimicrobial-resistance genes in environmental samples and their transmission across rural and urban settings.

### Brenda Omburo / Health Sciences Ph.D.

NIU lists Brenda Omburo as a graduate researcher advised by Courtney Hughes. Her stated research interest is community spread of antimicrobial resistance using mosquitoes as a model system.

These activities are not the same as the proposed IML clinical-pathway study. They show that NIU already has AMR expertise that could potentially complement a clinical information-flow project.

## 4. Illinois public-health context

The Illinois Department of Public Health (IDPH) HAI/AR Prevention Program identifies antimicrobial stewardship and multidrug-resistant organisms as strategic priorities in its 2025–2030 action plan.

Illinois also operates the XDRO Registry for extensively drug-resistant organisms. CRE reporting is mandatory for qualifying first positive cultures per patient stay. The registry is designed for surveillance and inter-facility communication.

Important boundary for IML:

- routine ESBL-producing Enterobacterales are not reportable to the XDRO Registry solely because they are ESBL producers unless they also meet the CRE definition;
- therefore a common outpatient urinary E. coli resistance pathway is not simply a duplicate of XDRO surveillance.

IDPH also operates the CHARM outpatient stewardship project, which collects antimicrobial-use data from outpatient settings and provides prescribing feedback.

This creates a useful research niche for IML:

> study the **clinical information pathway** linking symptoms, laboratory data, susceptibility, treatment, follow-up and reuse of information, rather than building another surveillance registry.

## 5. Proposed NIU role

The first discussion with Professor Hughes should not ask NIU to adopt IML or host a complete clinical platform.

The proposed role is narrower:

1. review whether the IML research question is scientifically useful;
2. help define an ethically and institutionally acceptable validation design;
3. identify the appropriate NIU collaborators in public health, laboratory sciences, data science and/or antimicrobial resistance;
4. determine whether NIU could act as the academic home for a pilot;
5. determine the IRB/data-governance pathway;
6. explore whether responsible-AI research partnerships could later be widened to external technology partners.

## 6. First study hypothesis

A structured, interoperable information pathway for outpatient urinary infection / resistant E. coli can improve the **visibility and evaluability** of the care process without requiring a new clinical surveillance system.

Primary research question:

> Can IML reconstruct and audit, from minimum necessary structured data, the pathway from clinical presentation to urine testing, microbiological result, susceptibility, treatment decision and follow-up, while preserving patient privacy and documenting where information is delayed, duplicated, missing or difficult to reuse?

Secondary question:

> Can an AI layer operating only on authorized, minimized data improve identification of pathway gaps and evidence retrieval without becoming an autonomous clinical decision-maker?

## 7. Deliberate exclusions for v0.1

The first pilot should not attempt to:

- predict individual resistance before laboratory results;
- replace clinician judgment;
- recommend autonomous treatment;
- build a statewide AMR registry;
- ingest unrestricted EHR records;
- re-identify pseudonymised patients through AI;
- use patient-level data before IRB and data-governance approval.

## 8. Potential internal NIU collaborators after the Hughes meeting

These are **potential** collaborators, not proposed first contacts:

- Public Health / Professor Hughes: study design, health-services research, responsible AI;
- Biological Sciences / Pallavi Singh: AMR and resistance-gene expertise;
- Medical Laboratory Sciences: laboratory workflow and microbiology interpretation;
- Health Sciences doctoral programme: student research capacity.

The first institutional door remains Professor Hughes.

## Sources checked

- Northern Illinois University, M. Courtney Hughes faculty profile.
- Northern Illinois University, AI research profile for M. Courtney Hughes.
- Hughes MC. *A harm-reduction framework for responsible AI in public health research*. npj Digital Public Health. Published 4 August 2026.
- Northern Illinois University, Current Research, Northern Illinois Center for Community Sustainability.
- Northern Illinois University, Health Sciences Ph.D. cohort.
- Northern Illinois University, Singh Biome Lab, Antimicrobial Resistance.
- Illinois Department of Public Health, HAI/AR Prevention Program and 2025–2030 Action Plan.
- Illinois Department of Public Health, XDRO Registry / CRE reporting.
- Illinois Department of Public Health, CHARM outpatient antimicrobial stewardship project.
