# IML — Incident report: Preview drift and unsafe site-update workflow

**Date:** 28 September 2026  
**Scope:** USA / Illinois country-profile update  
**Severity:** Process failure with Preview UI regression; Production remained unchanged  
**Status:** Corrected in a new Preview based on the exact active Production commit

## Executive summary

During the USA patient-identity update, the first Preview branch was created from `main` instead of from the commit actually serving Production.

At the time of the incident, the active Production deployment was built from:

- branch/reference: `main-backup-25/09/2026`
- commit: `c6445b4988c561a36db979754577c2ac274b1a72`

The faulty Preview branch was instead created from the current `main` lineage. GitHub comparison later showed that this Preview was **47 commits behind the active Production baseline and 7 commits ahead on a divergent history**.

That divergence imported a different country-profile implementation and selector behavior. As a result, the Preview displayed interface elements that did not exist in Production, including the redundant jurisdiction label:

`United States — Federal — examined`

This was not an intended USA/Illinois change. It was collateral drift caused by using the wrong baseline.

## User-visible failures

### 1. Preview not based on the active Production version

The requested constraint was to update the site safely in Preview without breaking the existing site.

The first Preview did not satisfy that constraint because it was not a minimal delta from the currently deployed Production version.

### 2. Jurisdiction selector regression

The divergent Preview used a different selector architecture and introduced:

- `United States — Federal — examined`
- an unnecessary explicit federal entry in the jurisdiction selector
- a different presentation from the active Production interface

The Production implementation instead keeps the federal country profile as the default USA view and uses the jurisdiction selector only for subnational profiles such as Illinois.

### 3. Redundant Illinois patient-identity banner

The first update displayed the same patient-identity qualification on both:

- USA Federal
- Illinois

This duplicated information already represented in the Illinois score, watch points and evidence register.

The user correctly requested removal of the redundant Illinois banner.

### 4. Too many sequential Preview deployments

Several small commits were pushed one after another while correcting the initial mistake. Vercel consequently created multiple Preview deployments.

This adds noise, makes verification harder and increases the risk of reviewing the wrong deployment URL.

### 5. Architecture was modified before Production parity was verified

The country-profile code path in Production uses:

- `src/components/CountryExplorer.jsx`
- `src/services/profileService.js`
- the live `/api/countries` endpoint
- country and subnational jurisdiction records returned from the database

The first Preview instead modified a different/newer code path including:

- `src/features/countries/CountryExplorer.jsx`
- a locally imported Illinois JSON profile

That should have been detected before any site update was committed.

## Root cause

The primary root cause was a bad deployment assumption:

> treating `main` as equivalent to Production without first verifying the commit actually deployed by Vercel.

This assumption was false.

The active Vercel Production deployment identified `main-backup-25/09/2026` at commit `c6445b4...` as its source.

## Contributing failures

1. No mandatory **Production SHA check** before branching.
2. No **tree comparison** between Production and proposed Preview before editing.
3. No rule requiring **minimal changed-file set** for a content-only country-profile update.
4. No visual comparison of the Production selector before altering jurisdiction UI.
5. Client-side and database-backed country-profile implementations were not distinguished early enough.
6. Corrections were committed incrementally before the entire Preview delta had been reconciled.

## Corrective action performed

A new clean Preview branch was created directly from the exact active Production commit:

`preview/usa-identity-from-production-2026-09-28`

Base:

`c6445b4988c561a36db979754577c2ac274b1a72`

Only the intended USA/Illinois patient-identity changes are being reapplied.

The Production selector architecture is preserved unchanged.

### Intended functional changes only

#### USA Federal

- document the absence of an adopted national patient identifier standard usable across all health systems
- document reliance on patient matching across local identifiers and demographic attributes
- adjust Technical Interoperability modestly
- adjust Identity & Trust materially
- orientation signal: **77 → 75**
- display the patient-identity qualification on the USA federal profile

#### Illinois

- inherit the structural limitation as an evidence-based watch point, not the federal score
- Technical: **76 → 74**
- Identity & Trust: **72 → 62**
- orientation signal: **64 → 62**
- no duplicated patient-identity banner

## Required workflow from now on

For every site change requested as “Preview only”:

1. Query Vercel and record the active Production deployment.
2. Record the exact Production Git commit SHA.
3. Create the Preview branch **from that exact SHA**, never from an assumed branch name.
4. Compare the new branch against Production before editing.
5. Identify the actual Production code path used by the feature.
6. Make the smallest possible change set.
7. Do not modify selectors, navigation, API architecture or database paths unless explicitly required.
8. After editing, compare Production SHA → Preview HEAD.
9. Review the changed-file list. Any unrelated file is a stop condition.
10. Verify the final Preview deployment is `READY` and `target: null`.
11. Verify the active Production deployment SHA has not changed.
12. Only after user approval should any Production promotion be considered.

## Stop conditions

Do not proceed if any of the following occurs:

- Preview base is not the active Production SHA.
- More files changed than the requested feature requires.
- A country-profile change unexpectedly modifies routing, navigation, selectors or database migrations.
- Production and Preview use different profile architectures and the difference has not been reconciled.
- Vercel reports a Production target for a Preview-only task.
- The deployed Preview cannot be tied unambiguously to the intended commit.

## Responsibility

These failures were caused by the update workflow used on my side, not by the requested content change. The important correction is procedural: **Production must be treated as a deployed artifact identified by its exact SHA, not as a branch name inferred from repository convention.**

## Production safety

No change from this incident has been intentionally promoted to Production.

The clean replacement Preview is based on the active Production commit and is intended to preserve Production behavior except for the explicitly requested USA/Illinois qualification.
