# IML-SYNC-01

Version 0.1.2 · 6 September 2026

## Purpose

IML-SYNC-01 is the controlled synchronization layer between the local IML Clinical Workspace PostgreSQL database and the Neon clinical development database.

The safety principle is deliberately asymmetric:

**Mac `iml_workspace` is the development source. Neon receives only versioned schema migrations and explicitly allowlisted reference/configuration data. Patient-linked data and raw terminology staging are not synchronized by default.**

## Safety changes in v0.1.2

- fixes migration-ledger and sync-run parameter recording by sending psql variable-bearing SQL through stdin instead of `-c`;
- deterministic cross-platform digests use `LC_ALL=C sort`, avoiding false differences caused by macOS vs Neon/Linux collations;
- `VERIFY` terminology tables now require exact deterministic content digests, not row counts alone;
- remote preflight requires marker tables from the IML Clinical Workspace, reducing the risk of targeting the separate Country Profiles Neon project by mistake.

## Data policy

The manifest `db/sync/iml-sync-manifest.tsv` defines three policies:

- `SYNC`: reference/configuration tables allowed to move local → Neon. Comparison ignores only operational `created_at`, `updated_at`, and `loaded_at`; synchronization is UPSERT-only and never deletes target-only rows.
- `VERIFY`: canonical terminology tables are compared by exact deterministic count and content digest but are not automatically copied.
- `LOCAL`: raw terminology staging remains local-only. A non-zero Neon count is reported as an anomaly.

Anything not listed as `SYNC` cannot be copied by this tool.

## Commands

From the repository root:

```bash
chmod +x scripts/iml-sync.sh
./scripts/iml-sync.sh status
```

For commands that contact Neon, load the connection URL into the shell without printing it or committing it:

```bash
unset IML_NEON_URL
read -rs "IML_NEON_URL?Neon URL: "
echo
export IML_NEON_URL
```

Then:

```bash
./scripts/iml-sync.sh status
./scripts/iml-sync.sh backup
./scripts/iml-sync.sh migrate local
./scripts/iml-sync.sh migrate neon
./scripts/iml-sync.sh sync-reference --apply
```

## Backups

Before any Neon migration or reference write, the tool creates a safe backup under:

`~/Documents/IML_Backups/IML_SYNC_<timestamp>/`

It contains:

1. a complete schema-only Neon dump;
2. a data-only dump limited to the `SYNC` allowlist;
3. SHA-256 checksums.

It intentionally does not download non-allowlisted clinical data.

## Migration ledger

The runner bootstraps `iml_system.migration_history` and records the SHA-256 of each applied SQL migration. If a migration already recorded in the database changes on disk, execution stops with a checksum-drift error.

For the current databases, migrations 190 and 191 were already applied manually before the ledger existed. On the first migration pass they are deliberately replayed once using their conservative/idempotent behavior and then recorded, followed by migration 192.

## Explicit exclusions

IML-SYNC-01 v0.1.1 does not automatically synchronize persons, encounters, clinical observations/diagnoses, laboratory or imaging data, billing/coverage linked to persons, audit/access histories, patient-linked AI data, raw terminology staging, or the separate Country Profiles database.

## Current expected topology

- Local clinical development database: `iml_workspace`
- Neon clinical development database: `neondb`
- Country Profiles: separate project/database path, not managed by IML-SYNC-01
