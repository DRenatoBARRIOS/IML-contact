#!/usr/bin/env python3
"""
IML LOINC local workbench loader.

Loads the complete official LOINC ZIP into LOCAL PostgreSQL only, under
iml_loinc_workbench. It never connects to Neon and never touches patient data.

Design:
  SOURCE    = complete release in loinc_source (no duplicate membership rows)
  EXTENDED  = generated membership: ACTIVE + CLASSTYPE=1 + Observation/Both
  SEARCH    = EXTENDED + COMMON_TEST_RANK > 0
  ORDERS    = active CLASSTYPE=1 members of Universal Lab Orders
  LAB_CORE / GP / ED / BMR sets are created EMPTY for clinical curation.

The rank <= 2500 cohort is exposed only as v_core_candidate_rank2500.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import io
import json
import os
import shutil
import subprocess
import sys
import tempfile
import zipfile
from pathlib import Path

VERSION = "0.1.0"

MAIN_CSV = "LoincTable/Loinc.csv"
FR_CSV = "AccessoryFiles/LinguisticVariants/frFR18LinguisticVariant.csv"
ORDERS_CSV = (
    "AccessoryFiles/LoincUniversalLabOrdersValueSet/"
    "LoincUniversalLabOrdersValueSet.csv"
)

CODE_CANDIDATES = (
    "LOINC_NUM", "LoincNumber", "LOINC", "LOINC_CODE", "LoincCode", "Code"
)

EXPECTED_283 = {
    "source": 112405,
    "extended": 60355,
    "search": 17829,
    "orders": 1480,
}


def clean(value):
    return (value or "").strip()


def int_or_none(value):
    value = clean(value)
    if not value:
        return None
    try:
        return int(value)
    except ValueError:
        return None


def detect_code_column(fieldnames):
    fields = fieldnames or []
    for candidate in CODE_CANDIDATES:
        if candidate in fields:
            return candidate
    upper = {f.upper(): f for f in fields}
    for candidate in CODE_CANDIDATES:
        if candidate.upper() in upper:
            return upper[candidate.upper()]
    raise RuntimeError("Impossible d'identifier la colonne LOINC")


def open_csv_from_zip(zf, name):
    raw = zf.open(name, "r")
    text = io.TextIOWrapper(raw, encoding="utf-8-sig", newline="")
    return csv.DictReader(text), text


def sha256_file(path):
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def psql_base(db):
    return ["psql", "-X", "-v", "ON_ERROR_STOP=1", "-d", db]


def run_psql(db, *, sql=None, file=None, variables=None, capture=False):
    cmd = psql_base(db)
    if variables:
        for key, value in variables.items():
            cmd += ["-v", f"{key}={value}"]
    if sql is not None:
        cmd += ["-c", sql]
    elif file is not None:
        cmd += ["-f", str(file)]
    else:
        raise ValueError("sql or file required")
    return subprocess.run(
        cmd,
        check=True,
        text=True,
        stdout=subprocess.PIPE if capture else None,
        stderr=None,
    )


def query_scalar(db, sql):
    cmd = psql_base(db)
    cmd.insert(2, "-qAt")
    cmd += ["-c", sql]
    out = subprocess.run(cmd, check=True, text=True, stdout=subprocess.PIPE).stdout
    return out.strip().splitlines()[-1] if out.strip() else ""


def assert_local_database(db):
    marker = query_scalar(
        db,
        "SELECT current_database() || '|' || "
        "coalesce(inet_server_addr()::text,'LOCAL_SOCKET');",
    )
    if "|" not in marker:
        raise RuntimeError("Impossible d'identifier PostgreSQL local")
    database, address = marker.split("|", 1)
    if address not in {"LOCAL_SOCKET", "127.0.0.1", "::1"}:
        raise RuntimeError(
            f"Refus: PostgreSQL ne semble pas local (base={database}, serveur={address})"
        )
    print(f"PostgreSQL local vérifié: {database} ({address})")


def sql_path_literal(path):
    return str(path).replace("'", "''")


def make_source_csv(zf, out_path):
    reader, handle = open_csv_from_zip(zf, MAIN_CSV)
    count = 0
    with out_path.open("w", encoding="utf-8", newline="") as out:
        writer = csv.writer(out)
        for row in reader:
            code = clean(row.get("LOINC_NUM"))
            if not code:
                continue
            count += 1
            writer.writerow([
                code,
                clean(row.get("COMPONENT")),
                clean(row.get("PROPERTY")),
                clean(row.get("TIME_ASPCT")),
                clean(row.get("SYSTEM")),
                clean(row.get("SCALE_TYP")),
                clean(row.get("METHOD_TYP")),
                clean(row.get("CLASS")),
                int_or_none(row.get("CLASSTYPE")),
                clean(row.get("STATUS")),
                clean(row.get("ORDER_OBS")),
                clean(row.get("LONG_COMMON_NAME")),
                clean(row.get("SHORTNAME")),
                int_or_none(row.get("COMMON_TEST_RANK")),
                int_or_none(row.get("COMMON_ORDER_RANK")),
                clean(row.get("EXAMPLE_UCUM_UNITS")),
                json.dumps(row, ensure_ascii=False, separators=(",", ":")),
            ])
    handle.close()
    return count


def make_raw_code_csv(zf, member_name, out_path):
    reader, handle = open_csv_from_zip(zf, member_name)
    code_col = detect_code_column(reader.fieldnames)
    count = 0
    with out_path.open("w", encoding="utf-8", newline="") as out:
        writer = csv.writer(out)
        for row in reader:
            code = clean(row.get(code_col))
            if not code:
                continue
            count += 1
            writer.writerow([
                code,
                json.dumps(row, ensure_ascii=False, separators=(",", ":")),
            ])
    handle.close()
    return count


def get_release_id(db, version, zip_name, zip_sha):
    sql = """
INSERT INTO iml_loinc_workbench.source_release(
    version_label, source_zip_name, source_zip_sha256, is_current
)
VALUES (:'version_label', :'zip_name', :'zip_sha', false)
ON CONFLICT (version_label) DO UPDATE SET
    source_zip_name = EXCLUDED.source_zip_name,
    source_zip_sha256 = EXCLUDED.source_zip_sha256,
    imported_at = now()
RETURNING id;
"""
    cmd = psql_base(db)
    cmd.insert(2, "-qAt")
    cmd += [
        "-v", f"version_label={version}",
        "-v", f"zip_name={zip_name}",
        "-v", f"zip_sha={zip_sha}",
        "-c", sql,
    ]
    out = subprocess.run(cmd, check=True, text=True, stdout=subprocess.PIPE).stdout
    ids = [line.strip() for line in out.splitlines() if line.strip().isdigit()]
    if not ids:
        raise RuntimeError("Impossible de récupérer l'identifiant de release")
    return int(ids[-1])


def load_source(db, release_id, csv_path):
    path = sql_path_literal(csv_path)
    script = f"""
BEGIN;
CREATE TEMP TABLE _loinc_stage (
    loinc_num text,
    component text,
    property text,
    time_aspect text,
    system_axis text,
    scale_typ text,
    method_typ text,
    class_code text,
    classtype smallint,
    status text,
    order_obs text,
    long_common_name text,
    shortname text,
    common_test_rank integer,
    common_order_rank integer,
    example_ucum_units text,
    raw_payload text
) ON COMMIT DROP;
\\copy _loinc_stage FROM '{path}' WITH (FORMAT csv)
INSERT INTO iml_loinc_workbench.loinc_source(
    release_id, loinc_num, component, property, time_aspect, system_axis,
    scale_typ, method_typ, class_code, classtype, status, order_obs,
    long_common_name, shortname, common_test_rank, common_order_rank,
    example_ucum_units, raw_payload
)
SELECT
    {release_id}, loinc_num, nullif(component,''), nullif(property,''),
    nullif(time_aspect,''), nullif(system_axis,''), nullif(scale_typ,''),
    nullif(method_typ,''), nullif(class_code,''), classtype,
    nullif(status,''), nullif(order_obs,''), nullif(long_common_name,''),
    nullif(shortname,''), common_test_rank, common_order_rank,
    nullif(example_ucum_units,''), raw_payload::jsonb
FROM _loinc_stage
ON CONFLICT (release_id, loinc_num) DO UPDATE SET
    component=EXCLUDED.component,
    property=EXCLUDED.property,
    time_aspect=EXCLUDED.time_aspect,
    system_axis=EXCLUDED.system_axis,
    scale_typ=EXCLUDED.scale_typ,
    method_typ=EXCLUDED.method_typ,
    class_code=EXCLUDED.class_code,
    classtype=EXCLUDED.classtype,
    status=EXCLUDED.status,
    order_obs=EXCLUDED.order_obs,
    long_common_name=EXCLUDED.long_common_name,
    shortname=EXCLUDED.shortname,
    common_test_rank=EXCLUDED.common_test_rank,
    common_order_rank=EXCLUDED.common_order_rank,
    example_ucum_units=EXCLUDED.example_ucum_units,
    raw_payload=EXCLUDED.raw_payload;
COMMIT;
"""
    subprocess.run(psql_base(db), input=script, text=True, check=True)


def load_raw_codes(db, release_id, csv_path, target_table):
    if target_table not in {"fr_variant_raw", "universal_order_raw"}:
        raise ValueError(target_table)
    path = sql_path_literal(csv_path)
    script = f"""
BEGIN;
CREATE TEMP TABLE _raw_stage (
    loinc_num text,
    raw_payload text
) ON COMMIT DROP;
\\copy _raw_stage FROM '{path}' WITH (FORMAT csv)
INSERT INTO iml_loinc_workbench.{target_table}(release_id, loinc_num, raw_payload)
SELECT {release_id}, s.loinc_num, s.raw_payload::jsonb
FROM _raw_stage s
JOIN iml_loinc_workbench.loinc_source l
  ON l.release_id = {release_id}
 AND l.loinc_num = s.loinc_num
ON CONFLICT (release_id, loinc_num) DO UPDATE SET
    raw_payload=EXCLUDED.raw_payload;
COMMIT;
"""
    subprocess.run(psql_base(db), input=script, text=True, check=True)


def refresh_sets(db, release_id, main_rows, fr_rows, order_rows):
    sql = f"""
BEGIN;
UPDATE iml_loinc_workbench.source_release
SET is_current = false
WHERE is_current AND id <> {release_id};

UPDATE iml_loinc_workbench.source_release
SET is_current = true,
    main_row_count = {main_rows},
    french_row_count = {fr_rows},
    universal_order_row_count = {order_rows},
    imported_at = now()
WHERE id = {release_id};

INSERT INTO iml_loinc_workbench.reference_set(
    release_id, set_code, name_fr, set_kind, status, rule_description
)
VALUES
({release_id}, 'LOINC_SOURCE', 'SOURCE LOINC', 'source', 'active',
 'Release LOINC complète; membership implicite via loinc_source.'),
({release_id}, 'LAB_EXTENDED', 'LAB EXTENDED', 'terminology_layer', 'draft',
 'ACTIVE + CLASSTYPE=1 + ORDER_OBS Observation/Both.'),
({release_id}, 'LAB_SEARCH', 'LAB SEARCH', 'terminology_layer', 'draft',
 'LAB_EXTENDED + COMMON_TEST_RANK > 0.'),
({release_id}, 'LAB_CORE', 'LAB CORE', 'clinical_layer', 'draft',
 'Sélection clinique manuelle; ne pas déduire automatiquement du rank.'),
({release_id}, 'LAB_ORDERS', 'LAB ORDERS', 'terminology_layer', 'draft',
 'Universal Lab Orders actifs avec CLASSTYPE=1.'),
({release_id}, 'GP_FIRST_LINE', 'Médecine générale — première ligne', 'clinical_layer', 'draft', null),
({release_id}, 'GP_SECOND_LINE', 'Médecine générale — deuxième ligne', 'clinical_layer', 'draft', null),
({release_id}, 'GP_ACUTE_POCT', 'Médecine générale — aigu / POCT', 'clinical_layer', 'draft', null),
({release_id}, 'ED_CORE', 'Urgences — noyau', 'clinical_layer', 'draft', null),
({release_id}, 'BMR_ECBU_TRACE', 'BMR / ECBU — cas traceur', 'workflow_trace', 'draft', null)
ON CONFLICT (release_id, set_code) DO UPDATE SET
    name_fr=EXCLUDED.name_fr,
    set_kind=EXCLUDED.set_kind,
    rule_description=EXCLUDED.rule_description;

DELETE FROM iml_loinc_workbench.reference_set_member
WHERE release_id = {release_id}
  AND set_code IN ('LAB_EXTENDED','LAB_SEARCH','LAB_ORDERS');

INSERT INTO iml_loinc_workbench.reference_set_member(
    release_id, set_code, loinc_num, selection_reason
)
SELECT release_id, 'LAB_EXTENDED', loinc_num,
       'ACTIVE + CLASSTYPE=1 + Observation/Both'
FROM iml_loinc_workbench.loinc_source
WHERE release_id = {release_id}
  AND upper(status)='ACTIVE'
  AND classtype=1
  AND upper(order_obs) IN ('OBSERVATION','BOTH');

INSERT INTO iml_loinc_workbench.reference_set_member(
    release_id, set_code, loinc_num, selection_reason
)
SELECT release_id, 'LAB_SEARCH', loinc_num,
       'LAB_EXTENDED + COMMON_TEST_RANK > 0'
FROM iml_loinc_workbench.loinc_source
WHERE release_id = {release_id}
  AND upper(status)='ACTIVE'
  AND classtype=1
  AND upper(order_obs) IN ('OBSERVATION','BOTH')
  AND common_test_rank > 0;

INSERT INTO iml_loinc_workbench.reference_set_member(
    release_id, set_code, loinc_num, selection_reason
)
SELECT l.release_id, 'LAB_ORDERS', l.loinc_num,
       'Universal Lab Orders active + CLASSTYPE=1'
FROM iml_loinc_workbench.loinc_source l
JOIN iml_loinc_workbench.universal_order_raw o
  ON o.release_id=l.release_id AND o.loinc_num=l.loinc_num
WHERE l.release_id = {release_id}
  AND upper(l.status)='ACTIVE'
  AND l.classtype=1;
COMMIT;
"""
    subprocess.run(psql_base(db), input=sql, text=True, check=True)


def report_counts(db, release_id):
    sql = f"""
SELECT 'source', count(*) FROM iml_loinc_workbench.loinc_source
 WHERE release_id={release_id}
UNION ALL
SELECT 'extended', count(*) FROM iml_loinc_workbench.reference_set_member
 WHERE release_id={release_id} AND set_code='LAB_EXTENDED'
UNION ALL
SELECT 'search', count(*) FROM iml_loinc_workbench.reference_set_member
 WHERE release_id={release_id} AND set_code='LAB_SEARCH'
UNION ALL
SELECT 'orders', count(*) FROM iml_loinc_workbench.reference_set_member
 WHERE release_id={release_id} AND set_code='LAB_ORDERS'
UNION ALL
SELECT 'core_candidate_rank2500', count(*) FROM iml_loinc_workbench.loinc_source
 WHERE release_id={release_id}
   AND upper(status)='ACTIVE' AND classtype=1
   AND upper(order_obs) IN ('OBSERVATION','BOTH')
   AND common_test_rank BETWEEN 1 AND 2500
ORDER BY 1;
"""
    cmd = psql_base(db)
    cmd.insert(2, "-qAt")
    cmd += ["-F", "|", "-c", sql]
    out = subprocess.run(cmd, check=True, text=True, stdout=subprocess.PIPE).stdout
    result = {}
    for line in out.splitlines():
        if "|" not in line:
            continue
        key, value = line.split("|", 1)
        result[key] = int(value)
    return result


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument(
        "--zip",
        default=str(Path("~/Downloads/Loinc_2.83.zip").expanduser()),
        help="ZIP officiel LOINC (défaut: ~/Downloads/Loinc_2.83.zip)",
    )
    ap.add_argument(
        "--db",
        default=os.environ.get("IML_LOCAL_DB", "iml_workspace"),
        help="Base PostgreSQL locale (défaut: IML_LOCAL_DB ou iml_workspace)",
    )
    ap.add_argument("--version-label", default="2.83")
    args = ap.parse_args()

    if not shutil.which("psql"):
        print("ERREUR: psql introuvable", file=sys.stderr)
        return 2

    zip_path = Path(args.zip).expanduser().resolve()
    if not zip_path.exists():
        print(f"ERREUR: ZIP introuvable: {zip_path}", file=sys.stderr)
        return 3

    repo_root = Path(__file__).resolve().parents[1]
    schema_sql = repo_root / "db/local/loinc/001_loinc_workbench.sql"
    if not schema_sql.exists():
        print(f"ERREUR: schéma local introuvable: {schema_sql}", file=sys.stderr)
        return 4

    print(f"IML LOINC local loader v{VERSION}")
    print(f"ZIP: {zip_path}")
    print(f"DB locale: {args.db}")
    assert_local_database(args.db)

    with zipfile.ZipFile(zip_path) as zf:
        names = set(zf.namelist())
        missing = [p for p in (MAIN_CSV, FR_CSV, ORDERS_CSV) if p not in names]
        if missing:
            print("ERREUR: fichiers absents du ZIP: " + ", ".join(missing), file=sys.stderr)
            return 5

        with tempfile.TemporaryDirectory(prefix="iml-loinc-") as td:
            td = Path(td)
            source_csv = td / "source.csv"
            fr_csv = td / "fr.csv"
            orders_csv = td / "orders.csv"

            print("Préparation des fichiers de chargement...")
            main_rows = make_source_csv(zf, source_csv)
            fr_rows = make_raw_code_csv(zf, FR_CSV, fr_csv)
            order_rows = make_raw_code_csv(zf, ORDERS_CSV, orders_csv)

            if args.version_label == "2.83" and main_rows != EXPECTED_283["source"]:
                print(
                    f"ERREUR: LOINC 2.83 attendu={EXPECTED_283['source']} obtenu={main_rows}",
                    file=sys.stderr,
                )
                return 6

            zip_sha = sha256_file(zip_path)
            print("Création/vérification du workbench local...")
            run_psql(args.db, file=schema_sql)

            release_id = get_release_id(
                args.db, args.version_label, zip_path.name, zip_sha
            )
            print(f"Release locale: {args.version_label} (id={release_id})")

            print(f"Chargement SOURCE: {main_rows} concepts...")
            load_source(args.db, release_id, source_csv)

            print(f"Chargement variante FR: {fr_rows} lignes...")
            load_raw_codes(args.db, release_id, fr_csv, "fr_variant_raw")

            print(f"Chargement Universal Lab Orders: {order_rows} lignes...")
            load_raw_codes(args.db, release_id, orders_csv, "universal_order_raw")

    print("Matérialisation EXTENDED / SEARCH / ORDERS...")
    refresh_sets(args.db, release_id, main_rows, fr_rows, order_rows)
    counts = report_counts(args.db, release_id)

    print("\n================ RÉSULTAT LOCAL ================")
    for key in ("source", "extended", "search", "orders", "core_candidate_rank2500"):
        print(f"{key:28} {counts.get(key, 0):>8}")

    if args.version_label == "2.83":
        mismatches = []
        for key in ("source", "extended", "search", "orders"):
            if counts.get(key) != EXPECTED_283[key]:
                mismatches.append(
                    f"{key}: attendu {EXPECTED_283[key]}, obtenu {counts.get(key)}"
                )
        if mismatches:
            print("\nERREUR: contrôle LOINC 2.83 non conforme:", file=sys.stderr)
            for item in mismatches:
                print(" - " + item, file=sys.stderr)
            return 7

    print("\nOK: corpus complet conservé localement.")
    print("LAB_CORE / GP / ED / BMR restent vides pour curation clinique.")
    print("Aucune connexion Neon n'a été utilisée.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
