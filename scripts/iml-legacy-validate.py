#!/usr/bin/env python3
"""
IML Legacy Import v1.0 validation report.
Compares the original CSV source tree with one completed local import run.

Outputs a Markdown report proving, dataset by dataset:
- source file hash preserved;
- source column names/count preserved;
- source row count preserved;
- imported row hashes match source rows;
- no canonical mapping is invented by the validator.

Requires psql in PATH. Does not contact Neon.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys

ENCODINGS = ("utf-8-sig", "utf-8", "cp1252", "latin-1")


def run_psql(db: str, sql: str) -> str:
    cp = subprocess.run(
        ["psql", "-X", "-v", "ON_ERROR_STOP=1", "-d", db, "-At", "-F", "\t", "-c", sql],
        text=True, capture_output=True
    )
    if cp.returncode != 0:
        raise RuntimeError(cp.stderr.strip() or cp.stdout.strip())
    return cp.stdout


def lit(s: str) -> str:
    return "'" + s.replace("'", "''") + "'"


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def detect_encoding(path: Path) -> str:
    sample = path.read_bytes()[:131072]
    for enc in ENCODINGS:
        try:
            sample.decode(enc)
            return enc
        except UnicodeDecodeError:
            pass
    return "latin-1"


def detect_dialect(path: Path, enc: str) -> csv.Dialect:
    with path.open("r", encoding=enc, newline="") as f:
        sample = f.read(65536)
    try:
        return csv.Sniffer().sniff(sample, delimiters=",;\t|")
    except csv.Error:
        return csv.excel


def source_metrics(path: Path) -> tuple[list[str], int, list[str]]:
    enc = detect_encoding(path)
    dialect = detect_dialect(path, enc)
    hashes: list[str] = []
    with path.open("r", encoding=enc, newline="") as f:
        r = csv.DictReader(f, dialect=dialect)
        fields = [str(x) for x in (r.fieldnames or [])]
        count = 0
        for row in r:
            if None in row:
                extras = row.pop(None)
                row["__IML_EXTRA_FIELDS__"] = extras
            canonical = json.dumps(row, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
            hashes.append(hashlib.sha256(canonical.encode("utf-8")).hexdigest())
            count += 1
    return fields, count, hashes


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("source_root", type=Path)
    ap.add_argument("--db", default=os.getenv("IML_LOCAL_DB", "iml_workspace"))
    ap.add_argument("--run-id", help="Import run UUID. Defaults to most recent completed run.")
    ap.add_argument("--output", type=Path, default=Path("IML_LEGACY_IMPORT_V1_VALIDATION.md"))
    args = ap.parse_args()

    root = args.source_root.expanduser().resolve()
    if args.run_id:
        run_id = args.run_id
    else:
        run_id = run_psql(
            args.db,
            "SELECT import_run_id FROM iml_legacy.import_run "
            "WHERE status='completed' ORDER BY completed_at DESC LIMIT 1;"
        ).strip()
    if not run_id:
        print("ERROR: no completed import run found", file=sys.stderr)
        return 2

    rows = run_psql(
        args.db,
        "SELECT dataset_id,relative_path,source_sha256,column_count,row_count "
        "FROM iml_legacy.dataset "
        f"WHERE import_run_id={lit(run_id)}::uuid ORDER BY relative_path;"
    ).splitlines()

    failures: list[str] = []
    report = [
        "# IML Legacy Import v1.0 — Validation report",
        "",
        f"- Import run: `{run_id}`",
        f"- Source root: `{root}`",
        "- Network/Neon transfer: **none**",
        "",
        "| Dataset | File hash | Columns | Rows | Row hashes | Result |",
        "|---|---:|---:|---:|---:|---|",
    ]

    total_source_rows = 0
    total_imported_rows = 0

    for line in rows:
        dataset_id, rel, imported_file_hash, imported_cols, imported_rows = line.split("\t")
        path = root / rel
        if not path.exists():
            failures.append(f"Missing source file: {rel}")
            report.append(f"| {rel} | ❌ | ❌ | ❌ | ❌ | FAIL |")
            continue

        fields, source_rows, source_hashes = source_metrics(path)
        source_file_hash = sha256_file(path)
        imported_hashes_text = run_psql(
            args.db,
            "SELECT source_row_sha256 FROM iml_legacy.raw_record "
            f"WHERE dataset_id={lit(dataset_id)}::uuid ORDER BY source_row_number;"
        )
        imported_hashes = [x for x in imported_hashes_text.splitlines() if x]

        file_ok = source_file_hash == imported_file_hash
        cols_ok = len(fields) == int(imported_cols)
        rows_ok = source_rows == int(imported_rows)
        hashes_ok = source_hashes == imported_hashes
        ok = file_ok and cols_ok and rows_ok and hashes_ok

        total_source_rows += source_rows
        total_imported_rows += int(imported_rows)
        if not ok:
            failures.append(rel)

        def mark(v: bool) -> str:
            return "✅" if v else "❌"

        report.append(
            f"| {rel} | {mark(file_ok)} | {mark(cols_ok)} | {mark(rows_ok)} | {mark(hashes_ok)} | "
            f"{'PASS' if ok else 'FAIL'} |"
        )

    source_files = sorted(p for p in root.rglob("*.csv") if p.is_file())
    dataset_count_ok = len(source_files) == len(rows)

    report += [
        "",
        "## Totals",
        "",
        f"- Source CSV files: **{len(source_files)}**",
        f"- Imported datasets: **{len(rows)}**",
        f"- Dataset coverage: **{'PASS' if dataset_count_ok else 'FAIL'}**",
        f"- Source rows: **{total_source_rows}**",
        f"- Imported rows: **{total_imported_rows}**",
        f"- Row preservation: **{'PASS' if total_source_rows == total_imported_rows else 'FAIL'}**",
        f"- Failed datasets: **{len(failures)}**",
        "",
        "## Invariants",
        "",
        "- No missing Easy Care relationship is inferred.",
        "- Raw source rows remain immutable evidence of the legacy database.",
        "- Mapping to canonical IML is a separate, explicit operation.",
        "- Patient-level legacy data remains local and is not synchronized to Neon.",
        "",
        f"## Final status: **{'PASS' if not failures and dataset_count_ok and total_source_rows == total_imported_rows else 'FAIL'}**",
        "",
    ]

    args.output.write_text("\n".join(report), encoding="utf-8")
    print(args.output)
    return 0 if not failures and dataset_count_ok and total_source_rows == total_imported_rows else 1


if __name__ == "__main__":
    raise SystemExit(main())
