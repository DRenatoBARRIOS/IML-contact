# IML — Illinois subnational profile v0.1

**Assessment date:** 24 September 2026  
**Jurisdiction:** Illinois, United States  
**Code:** US-IL / internal selector USA-IL  
**Status:** Published, independently scored  
**Parent-score inheritance:** prohibited

## Scope

This profile evaluates the Illinois health-information environment as a subnational jurisdiction. It does **not** inherit the United States federal profile. Federal rules are included only when Illinois implementation is directly documented.

The world map remains country-level. Illinois is selected through the United States jurisdiction selector.

## Six-domain orientation

| Domain | Illinois v0.1 | Main evidence |
|---|---:|---|
| Governance and standards | 62 | HFS ADT governance; HIE privacy law; repeal/dissolution of former state HIE office |
| Technical interoperability | 76 | Statewide HL7 ADT; IDPH surveillance; EVV aggregation; explicit data-quality standards |
| Identity and trust | 72 | IMPACT identity proofing and NPI; statutory HIE opt-out and meaningful notice |
| Adoption and clinical use | 78 | All MCOs onboarded; mandatory provider groups; 185 acute-care hospitals in syndromic surveillance |
| Security and resilience | 42 | Repeated 2026 HFS and IDPH cyber-control findings; realized HFS phishing incidents |
| Feedback, correction and learning | 52 | Public audits, management responses and collaboration mechanisms, offset by high repeat-finding rates |

**Overall orientation signal: 64/100**, the rounded arithmetic mean of the six domain scores.

This is not a ranking or certification.

## Key interpretation

Illinois has substantial operational exchange capacity. The strongest evidence is not a statewide general-purpose HIE, but a set of concrete data flows: Medicaid ADT, public-health surveillance, EVV aggregation, provider enrollment/identity, and vendor-mediated exchange.

The main structural limitation is governance fragmentation. Illinois' former dedicated state HIE model was discontinued; the enabling HIE Act was repealed and the HIE Office/Fund dissolved in 2023. Current exchange functions are distributed across HFS, IDPH, federal requirements and vendor networks.

Security materially reduces the orientation signal. The 2026 HFS compliance examination reported repeated cybersecurity weaknesses, inadequate IT general controls and data-protection weaknesses. The 2026 IDPH examination also reported repeated cybersecurity weaknesses; IDPH stated that a cybersecurity plan became effective in 2026. HFS additionally disclosed phishing incidents in 2024 and 2025 involving potentially sensitive Medicaid or other personal data.

## Learning-domain caution

The audit environment is strong enough to document deficiencies and management responses, and some prior findings have been corrected or not repeated. However, repeated findings remain substantial: HFS reported 13 current findings with 11 repeated, while IDPH reported 40 current findings with 34 repeated.

**LRN-5 remains Not assessed.** Audit responses and stakeholder forums are evidence of formal answerability, but they are not representative evidence of response times to external documented inquiries across the Illinois health-information environment.

## Principal sources

1. Illinois HFS — HealthChoice Illinois ADT.
2. Illinois HFS — HealthChoice Illinois ADT FAQ.
3. Illinois HFS — HL7 ADT Data Quality Standards.
4. Illinois IDPH — Syndromic Surveillance.
5. Illinois HFS — Electronic Visit Verification.
6. Illinois HFS — IMPACT Login / identity proofing.
7. Illinois General Assembly — 740 ILCS 110/9.6 HIE opt-out.
8. Illinois General Assembly — dissolution of the HIE Office and Fund.
9. Illinois HFS — State Medicaid Health Information Technology Plan Update (2022), historical context only.
10. Illinois Auditor General — HFS State Compliance Examination, released 18 Aug 2026.
11. Illinois Auditor General — IDPH State Compliance Examination, released 23 Jul 2026.
12. Illinois HFS — 6 Jun 2025 phishing-incident notice.

## Research continuation — NIU / BMR

The Illinois audit is now being used as the environmental context for a separate research-design workstream:

- `docs/ILLINOIS_NIU_RESEARCH_NOTE_v0.1.md`
- `docs/IML_BMR_ILLINOIS_PILOT_v0.1.md`
- `docs/IML_NIU_HUGHES_MEETING_BRIEF.md`

This research workstream does **not** modify the Illinois v0.1 scores or scoring methodology.

## Promotion condition

Before Production, retain the Illinois profile only if:
- the public source links still pass independent verification;
- the source-quality manifest passes;
- the UI continues to distinguish USA Federal from Illinois;
- no federal score is inherited by Illinois;
- the map remains country-level;
- Production country profiles remain unchanged.

## Source-quality review — 24 September 2026

The Illinois evidence register was rechecked under the IML Source Quality Protocol v2.0 after public-link failures were reported.

- The six HFS/IDPH operational pages used for ADT, ADT FAQ, HL7 data quality, syndromic surveillance, EVV and IMPACT were independently reopened and their key evidence markers confirmed.
- The direct ILGA link for 740 ILCS 110/9.6 was not publicly usable in the secondary check. The statutory evidence is retained as documentary evidence, but the public button is hidden pending revalidation.
- The obsolete/failing ILGA details link for dissolution of the former HIE Office/Fund was replaced by the current official ILCS Articles page containing 20 ILCS 2205/2205-40.
- The HFS State Medicaid Health Information Technology Plan Update is dated 30 March 2022; the earlier 2021 label was corrected.
- The HFS and IDPH Auditor General entries now expose stable audit-index pages publicly while retaining the full report PDFs as documentary sources.
- The HFS phishing PDF path that failed in a normal browser was replaced by the official Illinois.gov mirror that independently opened and preserved the same notice.
- No score or substantive conclusion was changed solely because a public URL moved or was hidden. Documentary validity and public usability remain separate fields under the protocol.
