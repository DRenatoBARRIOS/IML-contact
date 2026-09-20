#!/usr/bin/env python3
"""
IML Legacy -> Canonical transformation controller v1.0

Conservative local-only workflow:
- INSPECT: reports source headers/ordinals and counts, never patient values.
- PLAN: validates a JSON mapping profile against the imported legacy schema.
- TEST-PATIENTS: selects a deterministic local sample and reports only non-sensitive
  mapping-readiness flags. It writes no canonical rows.
- APPLY remains intentionally unavailable until the 5-patient test is reviewed.

No network access. No Neon access.
"""

from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
import subprocess
import sys

VERSION = "1.0.1"


def psql(db: str, sql: str) -> str:
    cp = subprocess.run(
        ["psql", "-X", "-v", "ON_ERROR_STOP=1", "-d", db, "-At", "-F", "\t", "-c", sql],
        text=True, capture_output=True
    )
    if cp.returncode != 0:
        raise RuntimeError(cp.stderr.strip() or cp.stdout.strip())
    return cp.stdout


def lit(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


def latest_completed_run(db: str) -> str:
    return psql(
        db,
        "SELECT import_run_id FROM iml_legacy.import_run "
        "WHERE status='completed' ORDER BY completed_at DESC LIMIT 1;"
    ).strip()


def inspect(db: str, run_id: str, dataset: str | None) -> int:
    condition = ""
    if dataset:
        condition = f" AND d.relative_path={lit(dataset)}"
    sql = (
        "SELECT d.relative_path,d.row_count,d.column_count,"
        "c.ordinal_position,c.source_column_name "
        "FROM iml_legacy.dataset d "
        "JOIN iml_legacy.dataset_column c ON c.dataset_id=d.dataset_id "
        f"WHERE d.import_run_id={lit(run_id)}::uuid{condition} "
        "ORDER BY d.relative_path,c.ordinal_position;"
    )
    rows = [x for x in psql(db, sql).splitlines() if x]
    if not rows:
        print("No matching dataset found.", file=sys.stderr)
        return 2

    current = None
    for line in rows:
        rel, row_count, col_count, ordinal, name = line.split("\t", 4)
        if rel != current:
            if current is not None:
                print()
            print(f"{rel}  rows={row_count} columns={col_count}")
            current = rel
        print(f"  {int(ordinal):>2}. {name}")
    return 0


def plan(db: str, run_id: str, profile_path: Path) -> int:
    profile = json.loads(profile_path.read_text(encoding="utf-8"))
    code = profile.get("profile_code")
    rules = profile.get("rules", [])
    if not code or not isinstance(rules, list):
        print("Invalid profile: profile_code and rules[] are required.", file=sys.stderr)
        return 2

    errors: list[str] = []
    for i, rule in enumerate(rules, 1):
        ds = rule.get("source_dataset")
        ordinal = rule.get("source_column_ordinal")
        expected_name = rule.get("source_column_name")
        target = rule.get("target")
        transform = rule.get("transform_code")
        if not ds or not ordinal or not target or not transform:
            errors.append(f"rule {i}: missing required field")
            continue

        found = psql(
            db,
            "SELECT c.source_column_name "
            "FROM iml_legacy.dataset d "
            "JOIN iml_legacy.dataset_column c ON c.dataset_id=d.dataset_id "
            f"WHERE d.import_run_id={lit(run_id)}::uuid "
            f"AND d.relative_path={lit(ds)} "
            f"AND c.ordinal_position={int(ordinal)};"
        ).strip()
        if not found:
            errors.append(f"rule {i}: source column not found: {ds} ordinal {ordinal}")
        elif expected_name is not None and found != expected_name:
            errors.append(
                f"rule {i}: header mismatch at {ds} ordinal {ordinal}: "
                f"expected {expected_name!r}, found {found!r}"
            )

    print(f"PROFILE={code}")
    print(f"RULES={len(rules)}")
    print(f"ERRORS={len(errors)}")
    for e in errors:
        print(f"ERROR: {e}")

    if errors:
        return 1

    print("PLAN=PASS")
    print("No canonical rows were written.")
    return 0


def test_patients(db: str, run_id: str, limit: int) -> int:
    if limit < 1 or limit > 20:
        print("--limit must be between 1 and 20", file=sys.stderr)
        return 2

    # Patients.csv is stored as an ordered JSON array. PostgreSQL JSONB arrays are 0-based:
    # 0 ID, 4 used given name, 5 used family name, 6 birth family name,
    # 7 birth date, 8 SSN, 11 sex, 16 archived, 17 deceased,
    # 18 death date, 26 address, 28 INS status, 30 INS matricule.
    #
    # Select a deterministic spread by source row number, then report only presence/flags.
    # No names, identifiers, dates, addresses, or clinical values are printed.
    sql = f"""
WITH src AS (
  SELECT r.raw_record_id, r.source_row_number, r.source_record
  FROM iml_legacy.raw_record r
  JOIN iml_legacy.dataset d ON d.dataset_id=r.dataset_id
  WHERE d.import_run_id={lit(run_id)}::uuid
    AND d.relative_path='Patients.csv'
),
ranked AS (
  SELECT *,
    row_number() OVER (ORDER BY source_row_number) AS rn,
    count(*) OVER () AS total
  FROM src
),
targets AS (
  SELECT DISTINCT ON (bucket) *
  FROM (
    SELECT *,
      CASE
        WHEN rn=1 THEN 1
        WHEN rn = GREATEST(1, floor(total*0.25)::bigint) THEN 2
        WHEN rn = GREATEST(1, floor(total*0.50)::bigint) THEN 3
        WHEN rn = GREATEST(1, floor(total*0.75)::bigint) THEN 4
        WHEN rn=total THEN 5
      END AS bucket
    FROM ranked
  ) q
  WHERE bucket IS NOT NULL
  ORDER BY bucket, source_row_number
)
SELECT
  source_row_number,
  CASE WHEN NULLIF(btrim(source_record->>0),'') IS NOT NULL THEN 'yes' ELSE 'no' END AS has_source_patient_id,
  CASE WHEN NULLIF(btrim(source_record->>5),'') IS NOT NULL OR NULLIF(btrim(source_record->>6),'') IS NOT NULL THEN 'yes' ELSE 'no' END AS has_family_name,
  CASE WHEN NULLIF(btrim(source_record->>4),'') IS NOT NULL OR NULLIF(btrim(source_record->>3),'') IS NOT NULL OR NULLIF(btrim(source_record->>2),'') IS NOT NULL THEN 'yes' ELSE 'no' END AS has_given_name,
  CASE WHEN NULLIF(btrim(source_record->>7),'') IS NOT NULL THEN 'yes' ELSE 'no' END AS has_birth_date,
  CASE WHEN NULLIF(btrim(source_record->>11),'') IS NOT NULL THEN 'yes' ELSE 'no' END AS has_sex,
  CASE WHEN lower(coalesce(source_record->>16,'')) IN ('1','true','vrai','oui','yes','o') THEN 'yes' ELSE 'no' END AS archived,
  CASE WHEN lower(coalesce(source_record->>17,'')) IN ('1','true','vrai','oui','yes','o') THEN 'yes' ELSE 'no' END AS deceased,
  CASE WHEN NULLIF(btrim(source_record->>26),'') IS NOT NULL THEN 'yes' ELSE 'no' END AS has_address,
  CASE WHEN NULLIF(btrim(source_record->>8),'') IS NOT NULL THEN 'yes' ELSE 'no' END AS has_ssn,
  CASE WHEN NULLIF(btrim(source_record->>30),'') IS NOT NULL THEN 'yes' ELSE 'no' END AS has_ins
FROM targets
ORDER BY source_row_number
LIMIT {int(limit)};
"""
    rows = [x for x in psql(db, sql).splitlines() if x]
    if not rows:
        print("No Patients.csv rows found.", file=sys.stderr)
        return 2

    print(f"TEST_PATIENTS={len(rows)}")
    print("WRITE_CANONICAL=no")
    print("PATIENT_VALUES_PRINTED=no")
    print("")
    print("case\tsource_row\tid\tname\tbirth_date\tsex\tarchived\tdeceased\taddress\tssn\tins")
    for idx, line in enumerate(rows, 1):
        parts = line.split("\t")
        print(
            f"T{idx}\t{parts[0]}\t{parts[1]}\t{parts[2]}/{parts[3]}\t"
            f"{parts[4]}\t{parts[5]}\t{parts[6]}\t{parts[7]}\t"
            f"{parts[8]}\t{parts[9]}\t{parts[10]}"
        )

    print("")
    print("TEST_SELECTION=PASS")
    print("No canonical rows were written.")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(description="IML Legacy -> Canonical transformation controller")
    ap.add_argument("--db", default=os.getenv("IML_LOCAL_DB", "iml_workspace"))
    ap.add_argument("--run-id")
    sub = ap.add_subparsers(dest="command", required=True)

    i = sub.add_parser("inspect", help="Show dataset metadata and source headers only")
    i.add_argument("--dataset", help="Exact relative CSV path, e.g. Patients.csv")

    p = sub.add_parser("plan", help="Validate a reviewed mapping profile without writing canonical data")
    p.add_argument("profile", type=Path)

    t = sub.add_parser("test-patients", help="Select a deterministic local test sample; no canonical writes")
    t.add_argument("--limit", type=int, default=5)

    args = ap.parse_args()
    run_id = args.run_id or latest_completed_run(args.db)
    if not run_id:
        print("No completed legacy import run found.", file=sys.stderr)
        return 2

    if args.command == "inspect":
        return inspect(args.db, run_id, args.dataset)
    if args.command == "plan":
        return plan(args.db, run_id, args.profile)
    if args.command == "test-patients":
        return test_patients(args.db, run_id, args.limit)
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
