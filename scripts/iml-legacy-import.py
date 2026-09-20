#!/usr/bin/env python3
"""
IML Legacy Import v1.0
Local-only CSV importer for legacy clinical systems.

Design goals:
- import every CSV dataset found under a source root;
- preserve every source column and row, including duplicate column names;
- preserve column order, row order, file hash, row hash, encoding and delimiter;
- never infer missing relationships;
- never contact Neon or any network service.

Requires: PostgreSQL command-line client (psql) available in PATH.
Default local database: iml_workspace
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
import tempfile
import uuid

VERSION = "1.0.1"
ENCODINGS = ("utf-8-sig", "utf-8", "cp1252", "latin-1")


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


def detect_dialect(path: Path, encoding: str) -> csv.Dialect:
    with path.open("r", encoding=encoding, newline="") as f:
        sample = f.read(65536)
    try:
        return csv.Sniffer().sniff(sample, delimiters=",;\t|")
    except csv.Error:
        return csv.excel


def run_psql(db: str, sql: str, stdin_text: str | None = None) -> str:
    cmd = ["psql", "-X", "-v", "ON_ERROR_STOP=1", "-d", db, "-At", "-c", sql]
    cp = subprocess.run(cmd, input=stdin_text, text=True, capture_output=True)
    if cp.returncode != 0:
        raise RuntimeError(cp.stderr.strip() or cp.stdout.strip())
    return cp.stdout.strip()


def sql_literal(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


def ensure_schema(db: str, schema_file: Path) -> None:
    cp = subprocess.run(
        ["psql", "-X", "-v", "ON_ERROR_STOP=1", "-d", db, "-f", str(schema_file)],
        text=True,
    )
    if cp.returncode != 0:
        raise RuntimeError("Schema creation failed")


def main() -> int:
    ap = argparse.ArgumentParser(description="Import complete legacy CSV datasets into local IML.")
    ap.add_argument("source_root", type=Path)
    ap.add_argument("--db", default=os.getenv("IML_LOCAL_DB", "iml_workspace"))
    ap.add_argument("--source-system", default="Easy Care")
    ap.add_argument(
        "--schema-file",
        type=Path,
        default=Path(__file__).resolve().parents[1] / "db/local/legacy/001_iml_legacy_import_v1.sql",
    )
    args = ap.parse_args()

    root = args.source_root.expanduser().resolve()
    if not root.is_dir():
        print(f"ERROR: source root not found: {root}", file=sys.stderr)
        return 2

    csv_files = sorted(p for p in root.rglob("*.csv") if p.is_file())
    if not csv_files:
        print(f"ERROR: no CSV files found below {root}", file=sys.stderr)
        return 2

    ensure_schema(args.db, args.schema_file)

    run_id = str(uuid.uuid4())
    run_psql(
        args.db,
        "INSERT INTO iml_legacy.import_run "
        "(import_run_id,source_system,source_root,status,importer_version) VALUES ("
        f"{sql_literal(run_id)}::uuid,{sql_literal(args.source_system)},"
        f"{sql_literal(str(root))},'running',{sql_literal(VERSION)});"
    )

    total_rows = 0
    total_columns = 0

    try:
        for index, path in enumerate(csv_files, 1):
            rel = str(path.relative_to(root))
            encoding = detect_encoding(path)
            dialect = detect_dialect(path, encoding)
            dataset_id = str(uuid.uuid4())
            file_hash = sha256_file(path)

            with path.open("r", encoding=encoding, newline="") as f:
                reader = csv.reader(f, dialect=dialect)
                try:
                    header = next(reader)
                except StopIteration:
                    raise RuntimeError(f"Empty CSV without header: {rel}")

                fieldnames = [str(x) for x in header]

                run_psql(
                    args.db,
                    "INSERT INTO iml_legacy.dataset "
                    "(dataset_id,import_run_id,source_filename,dataset_name,relative_path,encoding,delimiter,"
                    "source_sha256,column_count) VALUES ("
                    f"{sql_literal(dataset_id)}::uuid,{sql_literal(run_id)}::uuid,"
                    f"{sql_literal(path.name)},{sql_literal(path.stem)},{sql_literal(rel)},"
                    f"{sql_literal(encoding)},{sql_literal(dialect.delimiter)},"
                    f"{sql_literal(file_hash)},{len(fieldnames)});"
                )

                if fieldnames:
                    column_values = ",".join(
                        "("
                        f"{sql_literal(dataset_id)}::uuid,{i},{sql_literal(name)}"
                        ")"
                        for i, name in enumerate(fieldnames, 1)
                    )
                    run_psql(
                        args.db,
                        "INSERT INTO iml_legacy.dataset_column "
                        "(dataset_id,ordinal_position,source_column_name) VALUES " + column_values + ";"
                    )

                total_columns += len(fieldnames)

                with tempfile.NamedTemporaryFile("w", encoding="utf-8", newline="", delete=False) as tmp:
                    tmp_path = Path(tmp.name)
                    writer = csv.writer(tmp)
                    row_count = 0
                    for source_row_number, row in enumerate(reader, start=2):
                        # Preserve the source row by ordinal position as an array.
                        # This keeps duplicate column names and extra/missing fields losslessly visible.
                        canonical = json.dumps(row, ensure_ascii=False, separators=(",", ":"))
                        row_hash = hashlib.sha256(canonical.encode("utf-8")).hexdigest()
                        writer.writerow([
                            str(uuid.uuid4()),
                            dataset_id,
                            source_row_number,
                            canonical,
                            row_hash,
                        ])
                        row_count += 1

                copy_sql = (
                    "COPY iml_legacy.raw_record "
                    "(raw_record_id,dataset_id,source_row_number,source_record,source_row_sha256) "
                    "FROM STDIN WITH (FORMAT csv);"
                )
                data = tmp_path.read_text(encoding="utf-8")
                tmp_path.unlink(missing_ok=True)
                run_psql(args.db, copy_sql, data)

                run_psql(
                    args.db,
                    "UPDATE iml_legacy.dataset SET row_count="
                    f"{row_count} WHERE dataset_id={sql_literal(dataset_id)}::uuid;"
                )
                total_rows += row_count
                duplicates = len(fieldnames) - len(set(fieldnames))
                dup_note = f", {duplicates} duplicate header name(s) preserved" if duplicates else ""
                print(
                    f"[{index}/{len(csv_files)}] {rel}: "
                    f"{row_count} rows, {len(fieldnames)} columns{dup_note}"
                )

        run_psql(
            args.db,
            "UPDATE iml_legacy.import_run SET "
            f"status='completed',completed_at=now(),dataset_count={len(csv_files)},"
            f"row_count={total_rows},column_count={total_columns} "
            f"WHERE import_run_id={sql_literal(run_id)}::uuid;"
        )
        print(f"IMPORT_RUN_ID={run_id}")
        print(f"COMPLETE datasets={len(csv_files)} rows={total_rows} dataset_columns={total_columns}")
        return 0
    except Exception as exc:
        run_psql(
            args.db,
            "UPDATE iml_legacy.import_run SET status='failed',completed_at=now(),notes="
            f"{sql_literal(str(exc))} WHERE import_run_id={sql_literal(run_id)}::uuid;"
        )
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
