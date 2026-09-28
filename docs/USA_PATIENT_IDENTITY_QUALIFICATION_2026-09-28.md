# IML USA — patient identity qualification

**Review date:** 28 September 2026  
**Scope:** United States federal profile and Illinois subnational profile  
**Deployment target:** Preview only

## Finding

The United States does not have an adopted national standard identifier for patients that can be used as a single transversal patient identifier across health systems. HHS explicitly distinguishes this from the National Provider Identifier and states that there is no adopted patient identifier standard.

ONC consequently treats patient matching as a critical interoperability function: records belonging to the same person are linked within and across systems by combining demographic attributes and local identifiers.

## IML interpretation

This is a structural limitation, not evidence that U.S. exchange infrastructure is absent. The scoring consequence is therefore deliberately concentrated:

- **Identity & Trust:** material downward adjustment because there is no universal patient identity layer.
- **Technical Interoperability:** smaller downward adjustment because matching across heterogeneous local identifiers adds complexity and residual mismatch risk.
- **Governance, Adoption, Security, Learning:** unchanged by this finding alone.

## Preview score effect

- **United States federal:** orientation signal expected to move from **77/100 to 75/100** under the current six-domain profile, by applying -10 points to Identity and -2 points to Technical before recomputing the arithmetic mean.
- **Illinois:** **64/100 to 62/100**. Technical changes from 76 to 74 and Identity from 72 to 62; other domains remain unchanged.

These are methodological orientation signals, not rankings or certifications.

## Sources

1. U.S. Department of Health and Human Services / CMS, *Unique Identifiers Overview*: https://www.hhs.gov/guidance/document/unique-identifiers-overview
2. ASTP/ONC, *Patient Identity and Patient Record Matching*: https://healthit.gov/standards-and-technology/patient-identity-and-patient-record-matching/

## Safety condition

No Production branch, production deployment, or database record is modified by this Preview change.
