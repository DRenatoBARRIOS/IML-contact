# AI-EVIDENCE-02

Version 0.2.0 · 6 September 2026

AI-EVIDENCE-02 adds a rights-aware access-resolution layer above AI-EVIDENCE-01.

It separates:
- discovery and bibliographic metadata;
- human full-text access;
- automated full-text retrieval;
- automated/AI processing;
- persistent full-text storage.

Institutional access does not imply machine-processing rights.

Migration 193 adds:
- `iml_ai.evidence_access_resolution`
- `iml_ai.evidence_access_resolution_current`

It seeds two disabled sources:
- `PMC_OPEN_ACCESS`
- `INSTITUTIONAL_RESOLVER`

It also seeds a disabled local institutional profile template:
- `INSTITUTIONAL_GENERIC`

The existing `PUBMED`, `EUROPE_PMC`, and `CROSSREF` source capability metadata is enriched without enabling connectors.

Security policy:
- no institutional passwords;
- no SAML assertions;
- no Shibboleth/OpenAthens session material;
- no proxy cookies;
- no publisher access tokens;
- no publisher article bodies or PDFs merely because a human user can access them institutionally.

Recommended connector order:
1. PubMed discovery/metadata.
2. PMID ↔ PMCID ↔ DOI resolution.
3. PMC Open Access rights/full-text locator.
4. Europe PMC secondary OA resolver.
5. Crossref DOI/licence enrichment.
6. Generic institutional link-out/OpenURL.
7. Institution-specific Shibboleth/OpenAthens configuration after local validation.

`evidence_access_resolution` is runtime provenance and must not be added to the IML-SYNC-01 reference-data allowlist.
