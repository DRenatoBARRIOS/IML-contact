#!/usr/bin/env python3
"""
IML Legacy -> Canonical transformation controller v1.0

This first controller is deliberately conservative:
- INSPECT: reports source headers/ordinals and counts, never patient values.
- PLAN: validates a JSON mapping profile against the imported legacy schema.
- APPLY is intentionally unavailable until a reviewed mapping profile exists.

No network access. No Neon access. No patient values are printed.
"""

from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
import subprocess
import sys


VERSION = "1.0.0"


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


def main() -> int:
    ap = argparse.ArgumentParser(description="IML Legacy -> Canonical transformation controller")
    ap.add_argument("--db", default=os.getenv("IML_LOCAL_DB", "iml_workspace"))
    ap.add_argument("--run-id")
    sub = ap.add_subparsers(dest="command", required=True)

    i = sub.add_parser("inspect", help="Show dataset metadata and source headers only")
    i.add_argument("--dataset", help="Exact relative CSV path, e.g. Patients.csv")

    p = sub.add_parser("plan", help="Validate a reviewed mapping profile without writing canonical data")
    p.add_argument("profile", type=Path)

    args = ap.parse_args()
    run_id = args.run_id or latest_completed_run(args.db)
    if not run_id:
        print("No completed legacy import run found.", file=sys.stderr)
        return 2

    if args.command == "inspect":
        return inspect(args.db, run_id, args.dataset)
    if args.command == "plan":
        return plan(args.db, run_id, args.profile)
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
