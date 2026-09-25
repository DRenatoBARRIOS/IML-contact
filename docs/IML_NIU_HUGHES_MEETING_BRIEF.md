# IML — Meeting brief for Professor M. Courtney Hughes / NIU

**Date prepared:** 25 September 2026  
**Purpose:** First scientific discussion  
**Style:** Conceptual and clinical, not technical

## 1. One-minute introduction

IML is an open-source health-information environment built around two ideas:

1. an open clinical workspace usable across settings;
2. an interoperability layer that connects existing systems instead of replacing them.

The research question is not whether another EHR can be built. It is whether information can remain clinically interpretable, traceable and reusable across the care pathway, and whether AI can help without creating a new source of opacity or unsafe access.

## 2. Why Illinois

Illinois is scientifically interesting because it combines:

- real operational health-information exchange;
- multiple specialized statewide data flows;
- distributed rather than unified governance;
- active antimicrobial-resistance and stewardship programmes;
- documented security/control challenges.

This creates a realistic environment in which to test an interoperability methodology rather than demonstrate it in an artificially clean system.

## 3. Why Professor Hughes

Professor Hughes' recent work on responsible AI in public-health research provides a strong conceptual match.

Her 2026 harm-reduction framework places safeguards upstream in study design through:

- responsible population selection;
- data governance;
- public engagement;
- transparent dissemination.

IML proposes the same direction at the information-system level: minimum necessary data, explicit provenance, controlled access, and AI that cannot bypass an authorization refusal.

## 4. First case: BMR / resistant urinary E. coli pathway

The first case is deliberately modest.

We are not proposing an Illinois AMR registry.

We propose to study whether a small structured dataset can reconstruct:

```text
symptoms/context
→ urine test
→ culture
→ organism
→ susceptibility
→ treatment decision
→ follow-up
```

and reveal:

- missing data;
- delays;
- redundant tests;
- loss of prior results;
- difficulty linking susceptibility to later clinical action;
- conditions under which AI helps or adds risk.

## 5. Five questions for Professor Hughes

1. **Scientific relevance**  
   Does this information-pathway question merit a formal health-services/public-health study?

2. **Study design**  
   Should the first validation be retrospective, prospective observational, or staged from synthetic data to real data?

3. **NIU team**  
   Which NIU collaborators should join after the initial concept is accepted, particularly AMR, laboratory sciences, informatics/data science and research methods?

4. **Governance**  
   What is the appropriate NIU IRB/data-governance route for a pilot using minimized clinical data?

5. **Responsible AI collaboration**  
   Could this become a practical test bed for responsible AI research in which innovation continues, but privacy, authorization and provenance are enforced by design?

## 6. What we are asking from NIU today

Not funding.

Not a commitment to deploy IML.

Not access to patient data.

The immediate request is:

> scientific review and identification of a feasible institutional pathway for a small validation study.

## 7. What we should show

Only three things are needed in the first meeting:

### A. IML in one diagram

```text
Existing clinical systems / labs / registries
              ↕
      IML interoperability layer
              ↕
      Open Clinical Workspace
              ↕
  audit / evidence / bounded AI
```

### B. Illinois v0.1

One slide showing the six domains and why Illinois is a useful real-world test environment.

### C. BMR pathway

One slide showing:

```text
presentation → ECBU → organism → antibiogram → action → follow-up
```

The meeting should not begin with PostgreSQL, Neon, FHIR, LOINC, HPRIM or encryption details.

Those are implementation questions for later.

## 8. Likely NIU extensions if Hughes is interested

Potential second-circle collaborators at NIU include:

- AMR / microbiology expertise in Biological Sciences;
- Medical Laboratory Sciences;
- Health Sciences doctoral researchers;
- AI/data-science collaborators.

Professor Hughes remains the first institutional entry point because the core question is a health-services and responsible-AI research question, not only a microbiology project.

## 9. Desired end of meeting

A successful meeting ends with one of these concrete next steps:

- Hughes agrees to review a 2–3 page protocol;
- she identifies the appropriate NIU co-investigator(s);
- NIU identifies the IRB/data-governance route;
- a small synthetic/de-identified proof of concept is defined.

No broader partnership needs to be agreed during the first conversation.
