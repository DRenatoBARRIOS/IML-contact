# IML BMR / ECBU — consolidation canonique LAB/LOINC v0.2

Base de départ: commit `3d6282f`, démonstrateur validé dans `iml_workspace_bmr_test`.

## Architecture retenue

Aucune terminologie BMR parallèle n'est créée.

```text
lab_order
  -> lab_report
      -> lab_specimen
      -> lab_observation (LOINC / UCUM)
          -> iml_terminology.concept si le concept LOINC 2.83 est promu
      -> microbiology_isolate
          -> identification_observation_id -> lab_observation
          -> antimicrobial_susceptibility
      -> microbiology_context
      -> iml_clinical.microbiology_interpretation
```

`lab_specimen` représente un prélèvement réel. Il ne remplace pas les tables de
référence de type de prélèvement, container ou profil de collecte.

## Raccord LOINC

La migration `194_laboratory_terminology_foundation.sql` reste la fondation
canonique.

Le seed BMR v0.2 utilise notamment:

- `GP-URI-WBCQ` -> LOINC `30405-5`
- `GP-URI-CULT` -> LOINC `630-4`

`loinc_code` est toujours renseigné. `loinc_concept_id` est rempli seulement
si le concept LOINC 2.83 correspondant existe déjà dans
`iml_terminology.concept`.

Le compte de colonies reste dans `microbiology_isolate.organism_count`.
Aucun code LOINC n'est inventé pour ce champ.

## Fichiers

- `db/migrations/195_bmr_ecbu_canonical_v0_2.sql`
- `db/seeds/193_bmr_ecbu_demo_seed.sql`
- `db/seeds/194_bmr_ecbu_demo_treatment_followup.sql`
- `db/local/loinc/002_bmr_ecbu_trace_v0_1.sql`
- `db/tests/195_bmr_ecbu_canonical_assertions.sql`

L'ancien `192_bmr_ecbu_v0_1.sql` doit disparaître du dépôt afin de ne pas
entrer en collision avec `192_iml_sync_foundation.sql`.

## Mise à niveau de la base de test

```bash
cd ~/IML-contact

psql -d iml_workspace_bmr_test -v ON_ERROR_STOP=1 \
  -f db/migrations/194_laboratory_terminology_foundation.sql

psql -d iml_workspace_bmr_test -v ON_ERROR_STOP=1 \
  -f db/migrations/195_bmr_ecbu_canonical_v0_2.sql

psql -d iml_workspace_bmr_test -v ON_ERROR_STOP=1 \
  -f db/seeds/193_bmr_ecbu_demo_seed.sql

psql -d iml_workspace_bmr_test -v ON_ERROR_STOP=1 \
  -f db/seeds/194_bmr_ecbu_demo_treatment_followup.sql

psql -d iml_workspace_bmr_test -v ON_ERROR_STOP=1 \
  -f db/tests/195_bmr_ecbu_canonical_assertions.sql
```

La base `iml_workspace_bmr_test` issue du démonstrateur v0.1 peut précéder
la migration 194. Il faut donc appliquer d'abord la fondation LAB/LOINC 194,
puis la consolidation BMR 195.

Le seed 193 est ré-exécutable: les UUID synthétiques restent stables et les
anciennes lignes `DEMO-*` sont mises à niveau.

## Workbench LOINC local

À exécuter sur `iml_workspace`, où se trouve le corpus complet LOINC 2.83:

```bash
psql -d iml_workspace -v ON_ERROR_STOP=1 \
  -f db/local/loinc/002_bmr_ecbu_trace_v0_1.sql
```

Le jeu `BMR_ECBU_TRACE` contient 8 codes déjà retenus dans le catalogue GP v0.3:
bandelette, leucocyte-estérase, nitrites, leucocyturie quantitative,
hématurie quantitative, culture, antibiogramme et CMI.

Cette étape ne modifie pas Neon.
