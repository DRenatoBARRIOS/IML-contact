#!/usr/bin/env python3
"""
IML Legacy -> Canonical transformation controller v1.0

Conservative local-only workflow:
- INSPECT: reports source headers/ordinals and counts, never patient values.
- PLAN: validates a JSON mapping profile against the imported legacy schema.
- TEST-PATIENTS: selects a deterministic local sample and reports only non-sensitive
  mapping-readiness flags. It writes no canonical rows.
- APPLY-TEST-PATIENTS writes only the deterministic 5-patient local test set in one transaction.

No network access. No Neon access.
"""

from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
import subprocess
import sys
import uuid
from datetime import datetime

VERSION = "1.1.1"


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



def _truthy(value: str | None) -> bool:
    return (value or "").strip().lower() in {"1", "true", "vrai", "oui", "yes", "o"}


def _date_or_none(value: str | None) -> str | None:
    s = (value or "").strip()
    if not s:
        return None
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%Y-%m-%d %H:%M:%S", "%d/%m/%Y %H:%M:%S"):
        try:
            return datetime.strptime(s, fmt).date().isoformat()
        except ValueError:
            pass
    try:
        return datetime.fromisoformat(s.replace("Z", "+00:00")).date().isoformat()
    except ValueError:
        return None


def _sex_or_none(value: str | None) -> str | None:
    s = (value or "").strip().lower()
    if not s:
        return None
    if s in {"m", "masculin", "male", "homme", "1"}:
        return "M"
    if s in {"f", "féminin", "feminin", "female", "femme", "2"}:
        return "F"
    return None


def _arr(row: list, idx: int) -> str:
    if idx >= len(row) or row[idx] is None:
        return ""
    return str(row[idx]).strip()


def _uuid(kind: str, source_id: str, suffix: str = "") -> str:
    key = f"IML:EASYCARE:{kind}:{source_id}:{suffix}"
    return str(uuid.uuid5(uuid.NAMESPACE_URL, key))


def apply_test_patients(db: str, run_id: str, limit: int) -> int:
    if limit < 1 or limit > 5:
        print("--limit must be between 1 and 5 for apply-test-patients", file=sys.stderr)
        return 2

    required = [
        "iml_identity.person",
        "iml_identity.person_name",
        "iml_identity.person_demographics",
        "iml_identity.person_address",
        "iml_legacy.transform_run",
        "iml_legacy.canonical_link",
    ]
    for table in required:
        exists = psql(db, f"SELECT to_regclass({lit(table)}) IS NOT NULL;").strip()
        if exists != "t":
            print(f"ERROR: required local table missing: {table}", file=sys.stderr)
            return 2

    # Same deterministic 5 positions used by test-patients.
    sql = f"""
WITH src AS (
  SELECT r.raw_record_id, r.source_row_number, r.source_record
  FROM iml_legacy.raw_record r
  JOIN iml_legacy.dataset d ON d.dataset_id=r.dataset_id
  WHERE d.import_run_id={lit(run_id)}::uuid
    AND d.relative_path='Patients.csv'
),
ranked AS (
  SELECT *, row_number() OVER (ORDER BY source_row_number) AS rn, count(*) OVER () AS total
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
SELECT raw_record_id,source_row_number,
       encode(convert_to(source_record::text,'UTF8'),'hex')
FROM targets
ORDER BY source_row_number
LIMIT {int(limit)};
"""
    selected = [x for x in psql(db, sql).splitlines() if x]
    if len(selected) != limit:
        print(f"ERROR: expected {limit} test patients, found {len(selected)}", file=sys.stderr)
        return 2

    transform_run_id = str(uuid.uuid4())
    statements = [
        "BEGIN;",
        "SET LOCAL statement_timeout = '60s';",
        (
            "INSERT INTO iml_legacy.transform_run "
            "(transform_run_id,import_run_id,profile_code,transformer_version,mode,status,source_record_count) VALUES ("
            f"{lit(transform_run_id)}::uuid,{lit(run_id)}::uuid,'EASYCARE_TO_IML_V1',"
            f"{lit(VERSION)},'APPLY','running',{limit});"
        ),
    ]

    created = {"person": 0, "person_name": 0, "person_demographics": 0, "person_address": 0}
    skipped_name = 0
    invalid_birth_date = 0
    unknown_sex = 0

    for line in selected:
        raw_id, source_row, hex_payload = line.split("\t", 2)
        row = json.loads(bytes.fromhex(hex_payload).decode("utf-8"))

        source_id = _arr(row, 0)
        if not source_id:
            print(f"ERROR: test source row {source_row} has no Easy Care patient identifier; no writes performed.", file=sys.stderr)
            return 1

        person_id = _uuid("PATIENT", source_id)
        status = "INACTIVE" if _truthy(_arr(row, 16)) else "ACTIVE"

        statements.append(
            "INSERT INTO iml_identity.person (id,status) VALUES "
            f"({lit(person_id)}::uuid,{lit(status)}) ON CONFLICT (id) DO NOTHING;"
        )
        created["person"] += 1

        used_family = _arr(row, 5)
        used_given = _arr(row, 4)
        birth_family = _arr(row, 6)
        birth_given_full = _arr(row, 3)
        birth_given_first = _arr(row, 2)

        if used_family:
            name_id = _uuid("PATIENT_NAME", source_id, "USUAL")
            given_array = "ARRAY[]::text[]" if not used_given else f"ARRAY[{lit(used_given)}]::text[]"
            statements.append(
                "INSERT INTO iml_identity.person_name "
                "(id,person_id,use,family_name,given_names) VALUES "
                f"({lit(name_id)}::uuid,{lit(person_id)}::uuid,'USUAL',{lit(used_family)},{given_array}) "
                "ON CONFLICT (id) DO NOTHING;"
            )
            created["person_name"] += 1
        else:
            skipped_name += 1

        if birth_family:
            name_id = _uuid("PATIENT_NAME", source_id, "BIRTH")
            given = birth_given_full or birth_given_first
            given_array = "ARRAY[]::text[]" if not given else f"ARRAY[{lit(given)}]::text[]"
            statements.append(
                "INSERT INTO iml_identity.person_name "
                "(id,person_id,use,family_name,given_names) VALUES "
                f"({lit(name_id)}::uuid,{lit(person_id)}::uuid,'BIRTH',{lit(birth_family)},{given_array}) "
                "ON CONFLICT (id) DO NOTHING;"
            )
            created["person_name"] += 1

        birth_raw = _arr(row, 7)
        birth_date = _date_or_none(birth_raw)
        if birth_raw and birth_date is None:
            invalid_birth_date += 1
        sex_raw = _arr(row, 11)
        sex = _sex_or_none(sex_raw)
        if sex_raw and sex is None:
            unknown_sex += 1

        bd_sql = "NULL" if birth_date is None else f"{lit(birth_date)}::date"
        sex_sql = "NULL" if sex is None else lit(sex)
        statements.append(
            "INSERT INTO iml_identity.person_demographics "
            "(person_id,birth_date,sex_at_birth,address) VALUES "
            f"({lit(person_id)}::uuid,{bd_sql},{sex_sql},'{{}}'::jsonb) "
            "ON CONFLICT (person_id) DO NOTHING;"
        )
        created["person_demographics"] += 1

        address = _arr(row, 26)
        if address:
            address_id = _uuid("PATIENT_ADDRESS", source_id, "HOME")
            statements.append(
                "INSERT INTO iml_identity.person_address "
                "(id,person_id,address_type,address_line1) VALUES "
                f"({lit(address_id)}::uuid,{lit(person_id)}::uuid,'HOME',{lit(address)}) "
                "ON CONFLICT (id) DO NOTHING;"
            )
            created["person_address"] += 1

        statements.append(
            "INSERT INTO iml_legacy.canonical_link "
            "(transform_run_id,raw_record_id,target_schema,target_table,target_id,status,resolution_code,evidence) VALUES ("
            f"{lit(transform_run_id)}::uuid,{lit(raw_id)}::uuid,'iml_identity','person',"
            f"{lit(person_id)}::uuid,'created','EASYCARE_PATIENT_ID',"
            f"jsonb_build_object('source_dataset','Patients.csv','source_row_number',{int(source_row)})) "
            "ON CONFLICT DO NOTHING;"
        )

    statements.append(
        "UPDATE iml_legacy.transform_run SET status='completed',completed_at=now(),"
        f"mapped_count={limit},unresolved_count=0,ambiguous_count=0,error_count=0 "
        f"WHERE transform_run_id={lit(transform_run_id)}::uuid;"
    )
    statements.append("COMMIT;")

    try:
        psql(db, "\n".join(statements))
    except Exception as exc:
        print(f"ERROR: transaction rolled back: {exc}", file=sys.stderr)
        return 1

    print(f"TRANSFORM_RUN_ID={transform_run_id}")
    print(f"TEST_PATIENTS_APPLIED={limit}")
    print("LOCAL_ONLY=yes")
    print("NEON_WRITE=no")
    print(f"person_planned={created['person']}")
    print(f"person_name_planned={created['person_name']}")
    print(f"person_demographics_planned={created['person_demographics']}")
    print(f"person_address_planned={created['person_address']}")
    print(f"name_skipped_missing_family={skipped_name}")
    print(f"birth_date_unparsed={invalid_birth_date}")
    print(f"sex_unrecognized={unknown_sex}")
    print("APPLY_TEST=PASS")
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

    a = sub.add_parser("apply-test-patients", help="Apply canonical identity mapping to at most 5 deterministic local test patients")
    a.add_argument("--limit", type=int, default=5)

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
    if args.command == "apply-test-patients":
        return apply_test_patients(args.db, run_id, args.limit)
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
