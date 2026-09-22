# IML LOINC — local workbench

## Purpose

The complete LOINC release is kept in local PostgreSQL. Neon remains the
Clinical Workspace for curated/application data only.

This local workbench is deliberately outside `db/migrations` so that
`scripts/iml-sync.sh migrate neon` cannot create it remotely by accident.

## Data flow

```text
Loinc_2.83.zip
      |
      v
iml_loinc_workbench (LOCAL ONLY)
      |
      +-- SOURCE      complete release
      +-- EXTENDED    ACTIVE + CLASSTYPE=1 + Observation/Both
      +-- SEARCH      EXTENDED + COMMON_TEST_RANK > 0
      +-- ORDERS      active CLASSTYPE=1 Universal Lab Orders
      |
      +-- v_core_candidate_rank2500   descriptive candidate only
      |
      v
clinical curation
      |
      v
canonical IML terminology/laboratory subset
      |
      v
controlled local -> Neon synchronization (later step)
```

`LAB_CORE`, `GP_FIRST_LINE`, `GP_SECOND_LINE`, `GP_ACUTE_POCT`,
`ED_CORE` and `BMR_ECBU_TRACE` are created as empty sets. They are not
filled automatically from rank.

## Prerequisites

- local PostgreSQL reachable through a Unix socket or loopback address;
- `psql` available in PATH;
- local IML database, default `iml_workspace`;
- official LOINC 2.83 ZIP, default:
  `~/Downloads/Loinc_2.83.zip`.

No Python package beyond the standard library is required.

## Load LOINC 2.83

From the repository root:

```bash
cd ~/IML-contact
python3 scripts/iml-loinc-local-load.py
```

Explicit form:

```bash
python3 scripts/iml-loinc-local-load.py \
  --db iml_workspace \
  --zip ~/Downloads/Loinc_2.83.zip \
  --version-label 2.83
```

The loader refuses a non-local PostgreSQL server.

## Expected integrity checks for 2.83

The load is considered valid only when it reproduces the audited counts:

| Layer | Expected |
|---|---:|
| SOURCE | 112405 |
| LAB_EXTENDED | 60355 |
| LAB_SEARCH | 17829 |
| LAB_ORDERS | 1480 |
| CORE candidate rank <= 2500 | 2176 (reported, not promoted) |

If SOURCE / EXTENDED / SEARCH / ORDERS differ, the command exits non-zero.

## Tables

`iml_loinc_workbench.source_release`
: provenance, ZIP SHA-256 and row counts.

`iml_loinc_workbench.loinc_source`
: complete source release, with queryable LOINC axes plus the original source
row preserved as JSON.

`iml_loinc_workbench.fr_variant_raw`
: official French linguistic-variant rows, preserved without assuming one
specific display-name column.

`iml_loinc_workbench.universal_order_raw`
: official Universal Lab Orders rows.

`iml_loinc_workbench.reference_set`
and `reference_set_member`
: local layer/set curation.

## Views

- `v_source`
- `v_extended`
- `v_search`
- `v_core_candidate_rank2500`
- `v_ranked_common_systems`
- `v_orders_active`

## Safety

- no Neon URL is read or used;
- no patient table is queried or modified;
- no DELETE is issued against source LOINC rows;
- only derived memberships EXTENDED / SEARCH / ORDERS are rebuilt on rerun;
- SOURCE is not duplicated in the membership table;
- clinical CORE/GP/ED/BMR selections remain manual.

The next step after a successful local load is clinical curation, starting
with GP first-line and the BMR/ECBU tracer, before any promotion to Neon.


## Catalogue biologique GP complet

Le catalogue `data/loinc/gp-biological-catalog-v0.3.json` couvre la biologie
de médecine générale selon quatre niveaux:

- `GP_FIRST_LINE`
- `GP_SECOND_LINE`
- `GP_SPECIALIZED`
- `GP_ACUTE_POCT`

Il est rapproché du corpus LOINC local par:

```bash
python3 scripts/iml-loinc-gp-catalog.py --db iml_workspace
```

Le rapprochement produit des candidats et un rapport TSV dans
`~/Documents/IML_GP_CATALOG_LOINC_2.83.tsv`. Aucun mapping n'est déclaré
`VALIDATED` automatiquement et aucune donnée n'est envoyée à Neon.


### SINGLE vs FAMILY

Le catalogue GP distingue désormais deux types de mapping:

- `SINGLE`: un code LOINC principal peut être proposé pour le concept clinique;
- `FAMILY`: plusieurs codes LOINC sont légitimement nécessaires selon méthode,
  unité, cible, spécimen ou modalité de rendu. Aucun code unique n'est forcé.

Le statut `FAMILY` signifie donc « pluralité attendue et assumée », et non
« ambiguïté non résolue ». La justification est conservée dans les propriétés
du catalogue local.
