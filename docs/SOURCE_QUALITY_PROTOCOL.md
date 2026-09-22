# IML Source Quality Protocol v2.0

## Purpose

The source-quality process protects the documentary credibility of IML Country Profiles. A source is not considered reliable merely because a URL exists or because an automated request returns HTTP 200.

The protocol separates four distinct questions:

1. **Database integrity** — is the source record complete and internally consistent?
2. **Public usability** — does the public link work for users?
3. **Documentary validity** — does the cited document actually support the statement or indicator?
4. **Surveillance** — has the source changed, moved, disappeared or become superseded since the last validated review?

These questions must not be collapsed into a single `url_status` observation.

## Layer 1 — Database and API integrity: all published sources

Run against the current Production `/api/countries` response.

Required for every source:

- title;
- publisher;
- documentary URL (`documentary_url`);
- URL status;
- at least one linked indicator;
- evidence level and support type for each linked indicator;
- evidence summary and limitation whenever available.

Public-link rules:

- only `verified` and `redirected` sources may expose a public link;
- `public_url = NULL` must remain hidden in the API and must never fall back automatically to the documentary URL;
- documentary-only sources may be retained when access is restricted, transiently unavailable or intentionally not exposed;
- an intentionally hidden source should have a recorded reason.

The structural audit is a publication gate. Structural errors fail the audit.

## Layer 2 — Automated transport probe: all public links

Every public link is probed from an independent CI environment with redirects followed.

Classification:

- **reachable** — HTTP 2xx/3xx and a usable final URL;
- **blocked** — HTTP 401, 403 or 412; this may reflect bot/WAF restrictions and is not by itself proof that the human-facing link is broken;
- **transient** — timeout, HTTP 408/425/429 or 5xx;
- **confirmed_broken** — HTTP 404 or 410 on two consecutive attempts;
- **inconclusive** — conflicting attempts or another unresolved client error.

Important rule: **blocked, transient and inconclusive automated probes do not automatically remove a public link.** They trigger an independent secondary check. Only a confirmed broken link, or a secondary check confirming failure, should lead to replacement/hiding.

The automated probe must use limited concurrency and retries. Serverless-function timeouts are not evidence about the source itself.

## Layer 3 — Semantic evidence verification

Transport success is not enough. A page can return HTTP 200 and still be the wrong publication, a generic landing page or unrelated content.

Each country must progressively receive an approved semantic manifest under `data/source-audits/`.

For each source the manifest records:

- stable source identifier;
- expected canonical domain(s);
- whether the source is intended as a public country-profile link;
- source-specific content markers that must be present;
- country-specificity requirement where appropriate.

Country-specificity rule:

- a public link presented as evidence for a country should normally land on country-specific evidence;
- a multi-country or international source may remain valid documentary evidence when it explicitly supports the country claim;
- such a general source should not be presented as the country-specific public link when a better national or country-specific source exists;
- on a dynamic site, the country must be encoded in the path or in an explicit query parameter and the link must load that country's evidence immediately;
- a landing page that requires the reader to select the country does not pass, even when country content is present elsewhere in the page source;
- semantic manifests should record required query parameters when they are necessary to preserve country routing.

## Layer 4 — Human/independent secondary verification

A secondary check is mandatory when:

- the automated probe is blocked, transient or inconclusive;
- a canonical source has moved;
- a page returns HTTP 200 but the semantic markers fail;
- an important A/B-level source is about to be replaced or hidden;
- a source materially changes the score or narrative of a country profile.

The secondary check must record:

- date;
- final URL;
- whether the page is usable in a normal browser or independent fetch environment;
- whether the relevant evidence is still present;
- replacement reason when the public URL changes.

No automated job should silently rewrite Production source metadata.

## Status and evidence are separate

`url_status` describes public-link handling. It does not prove evidentiary quality.

Evidence strength remains represented separately by:

- `evidence_level`;
- `support_type`;
- `evidence_summary`;
- `limitation_note`.

A source can therefore be technically reachable but weak evidence, or technically blocked to automation but strong documentary evidence.

## Review cadence

### Weekly

- run the all-country API/integrity audit;
- probe all exposed public links;
- run every approved semantic manifest;
- review warnings for blocked/transient links and redirects.

### Monthly or when a warning persists

- perform independent secondary verification;
- update `last_checked_at` only after a validated review, not merely after a robot probe;
- update `replacement_reason` whenever a public URL is changed or hidden.

### Immediate review

Required when:

- two probes return 404/410;
- semantic markers disappear;
- a source is replaced by a materially different document;
- a regulatory or policy source is superseded;
- a source affects a published high-confidence claim.

## Promotion gate

A Country Profile update should not be promoted to Production unless:

1. database/API integrity passes;
2. every new public URL has been independently validated;
3. every new source has a documentary URL and indicator mapping;
4. important claims have explicit evidence summaries and limitations;
5. country-specific public-link selection has been reviewed;
6. no confirmed-broken public link remains exposed;
7. the relevant semantic manifest has been created or updated for material new evidence.

## Coverage

The weekly Production/API audit covers every published country and source. Romania, Tunisia and Uzbekistan have source-specific semantic manifests. The remaining country profiles should be migrated progressively to the same content-level verification standard.

## Evidence hierarchy A/B/C/D

`evidence_level` and `support_type` are separate dimensions.

`evidence_level` describes documentary authority, proximity and directness.  
`support_type` describes how the source supports the specific proposition or indicator.

A source may therefore be **A + context_only** without contradiction.

### A — primary or directly authoritative evidence

Country-specific or otherwise directly applicable primary evidence from an authoritative source, including legislation, official national systems, official technical documentation, competent audit/control bodies, official national data, and official international sources explicitly reporting on the country.

Level A does **not** mean that implementation is complete. Scope, implementation status, evidence summary, support type and limitation still control what can be concluded.

### B — authoritative or credible but indirect/partial evidence

Reliable institutional or high-quality secondary evidence that is relevant but less direct, narrower in scope or partly derivative.

Typical examples include republished official announcements, institutional guidance/toolkits, sectoral or international assessments, pilots, first-phase implementation evidence, or corroborative documents that do not establish full national coverage.

### C — credible contextual evidence

Useful contextual or secondary evidence that helps document a trajectory, project, implementation pathway or hypothesis, but is insufficient on its own to justify a strong claim or score.

It should normally be paired with `context_only` or an explicit limitation.

### D — indicative or legacy evidence

Evidence retained for discovery, orientation or historical continuity, but with low probative weight for a current conclusion.

A D-level source must not determine a score by itself, must not be used to infer nationwide implementation, and should progressively be replaced by stronger evidence when available.

### Current support types

- `supports` — directly supports the stated proposition;
- `partially_supports` — supports only part of the proposition or with limited scope;
- `context_only` — provides useful context but does not validate the proposition or score by itself.

Never infer `support_type` automatically from `evidence_level`, or vice versa.

### Anti-overclaim rule

Even A-level evidence must not turn:

- a project into a completed implementation;
- a pilot into national coverage;
- a legal obligation into demonstrated compliance;
- an existing platform into routine adoption;
- an announced architecture into operational interoperability;
- a complaint channel into demonstrated institutional responsiveness.

Every material claim must preserve scope, implementation status, evidence summary and limitation.

## Change-control rule for source-quality documentation

Before changing this protocol or a CURRENT production document:

1. read the current canonical file first;
2. retrieve the related canonical protocol files before rewriting;
3. do not replace a validated rule with a shorter summary unless explicitly requested;
4. flag contradictions before changing an established rule;
5. keep one canonical CURRENT document in the Library instead of parallel versions;
6. verify after writing that the mandatory sections remain present;
7. treat a documentation change as complete only after the final file and relevant CI checks have been reviewed.

