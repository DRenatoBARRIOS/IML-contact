#!/usr/bin/env python3
"""
IML GP biological catalog -> local LOINC 2.83 candidate mapper.

This command is LOCAL ONLY. It:
  1. ensures the local LOINC workbench schema is current;
  2. loads the curated GP catalog definition;
  3. searches the active current LOINC release;
  4. stores the top candidate mappings locally;
  5. writes a TSV review report.

It NEVER marks a LOINC mapping VALIDATED automatically.
It NEVER connects to Neon.
"""

from __future__ import annotations

import argparse
import csv
import io
import json
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path

VERSION = "0.3.0"


def clean(value):
    return (value or "").strip()


def normalize(value):
    value = clean(value).lower()
    value = (
        value.replace("é", "e").replace("è", "e").replace("ê", "e")
        .replace("ë", "e").replace("à", "a").replace("â", "a")
        .replace("ä", "a").replace("î", "i").replace("ï", "i")
        .replace("ô", "o").replace("ö", "o").replace("ù", "u")
        .replace("û", "u").replace("ü", "u").replace("ç", "c")
    )
    value = re.sub(r"[^a-z0-9]+", " ", value)
    return re.sub(r"\s+", " ", value).strip()


def psql_base(db):
    return ["psql", "-X", "-v", "ON_ERROR_STOP=1", "-d", db]


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


def ensure_schema(db, schema_sql):
    subprocess.run(psql_base(db) + ["-f", str(schema_sql)], check=True)


def read_active_loinc(db, release_id):
    sql = f"""
COPY (
  SELECT loinc_num,
         coalesce(component,'') AS component,
         coalesce(long_common_name,'') AS long_common_name,
         coalesce(shortname,'') AS shortname,
         coalesce(system_axis,'') AS system_axis,
         coalesce(class_code,'') AS class_code,
         coalesce(method_typ,'') AS method_typ,
         coalesce(common_test_rank::text,'') AS common_test_rank
  FROM iml_loinc_workbench.loinc_source
  WHERE release_id={release_id}
    AND upper(status)='ACTIVE'
) TO STDOUT WITH (FORMAT csv, HEADER true)
"""
    out = subprocess.run(
        psql_base(db) + ["-c", sql],
        check=True,
        text=True,
        stdout=subprocess.PIPE,
    ).stdout
    rows = []
    reader = csv.DictReader(io.StringIO(out))
    for r in reader:
        combined = " ".join(
            [r["component"], r["long_common_name"], r["shortname"]]
        )
        rows.append({
            **r,
            "_text": normalize(combined),
            "_component": normalize(r["component"]),
        })
    return rows


LAB_CLASS_PREFIXES = (
    "CHEM", "HEM", "MICRO", "SERO", "COAG", "ALLERGY",
    "DRUG/TOX", "PANEL.CHEM", "PANEL.HEM", "PANEL.MICRO",
    "PANEL.COAG", "PANEL.SERO", "PANEL.ALLERGY", "CHAL",
)


def phrase_in(text, phrase):
    """Whole-token/whole-phrase match on normalized strings."""
    return f" {phrase} " in f" {text} "


def system_compatible(system_axis, preferred_systems):
    if not preferred_systems:
        return True
    system = clean(system_axis)
    preferred = set(preferred_systems)
    if system in preferred:
        return True
    parts = set(re.split(r"[/+]", system))
    if parts & preferred:
        return True
    # Common LOINC compact system forms used for point-of-care blood.
    if "Bld" in preferred and system in {"BldC", "Ser/Plas/Bld"}:
        return True
    if ({"Ser", "Plas"} & preferred) and system == "Ser/Plas":
        return True
    return False


def lab_class_compatible(class_code):
    cls = clean(class_code).upper()
    return any(cls.startswith(prefix) for prefix in LAB_CLASS_PREFIXES)


def score_candidate(item, row):
    score = 0
    hint = clean(item.get("known_loinc_hint"))
    if hint and row["loinc_num"] == hint:
        score += 10000

    # GP biological catalogue: exclude imaging, surveys, administrative,
    # pathology and other non-laboratory classes before lexical scoring.
    if not lab_class_compatible(row.get("class_code")) and not (
        hint and row["loinc_num"] == hint
    ):
        return 0

    preferred = set(item.get("preferred_systems") or [])
    if preferred and not system_compatible(row.get("system_axis"), preferred) and not (
        hint and row["loinc_num"] == hint
    ):
        return 0

    text = row["_text"]
    component = row["_component"]
    text_tokens = set(text.split())
    matched_terms = 0

    for term in item.get("search_terms", []):
        nt = normalize(term)
        if not nt:
            continue

        if nt == component:
            score += 260
            matched_terms += 1
        elif phrase_in(component, nt):
            score += 200
            matched_terms += 1
        elif phrase_in(text, nt):
            score += 130
            matched_terms += 1
        else:
            # Exact-token fallback only. This intentionally prevents:
            # FSH->FSHD, ANA->Zanca, PTH->Depth, TRAb->trabeculoplasty,
            # FIT->benefit and similar substring collisions.
            tokens = [t for t in nt.split() if len(t) > 1]
            if tokens and all(t in text_tokens for t in tokens):
                score += 55 + 10 * len(tokens)
                matched_terms += 1

    if preferred:
        score += 35

    # Prefer the requested analyte over derived ratios or panels unless the
    # catalogue item explicitly asks for a ratio/panel.
    intent_text = normalize(
        " ".join([
            item.get("label_fr", ""),
            item.get("clinical_intent", ""),
            " ".join(item.get("search_terms", [])),
        ])
    )
    ratio_intent = any(x in intent_text.split() for x in ("ratio", "rapport"))
    panel_intent = "panel" in intent_text.split()
    component_has_ratio = "/" in clean(row.get("component")) or " ratio " in f" {text} "
    if component_has_ratio and not ratio_intent:
        score -= 140
    if clean(row.get("class_code")).upper().startswith("PANEL.") and not panel_intent:
        score -= 90

    rank = clean(row.get("common_test_rank"))
    if rank:
        try:
            r = int(rank)
            if r > 0:
                score += max(0, 25 - min(25, r // 500))
        except ValueError:
            pass

    if matched_terms == 0 and not (hint and row["loinc_num"] == hint):
        return 0
    return score


def top_candidates(item, rows, limit=5):
    scored = []
    hint = clean(item.get("known_loinc_hint"))

    # If a known hint exists and is present, retain it regardless of text ranking.
    if hint:
        for row in rows:
            if row["loinc_num"] == hint:
                scored.append((score_candidate(item, row), row))
                break

    for row in rows:
        if hint and row["loinc_num"] == hint:
            continue
        score = score_candidate(item, row)
        if score > 0:
            scored.append((score, row))

    scored.sort(
        key=lambda x: (
            -x[0],
            int(x[1]["common_test_rank"])
            if clean(x[1]["common_test_rank"]).isdigit()
            else 10**9,
            x[1]["loinc_num"],
        )
    )
    return scored[:limit]


def sql_quote(value):
    if value is None:
        return "NULL"
    return "'" + str(value).replace("'", "''") + "'"


def sql_text_array(values):
    values = values or []
    if not values:
        return "ARRAY[]::text[]"
    return "ARRAY[" + ",".join(sql_quote(v) for v in values) + "]::text[]"


def seed_catalog(db, catalog):
    statements = ["BEGIN;"]
    for item in catalog["items"]:
        statements.append(f"""
INSERT INTO iml_loinc_workbench.gp_catalog_item(
  catalog_code, group_code, tier, label_fr, clinical_intent,
  preferred_systems, search_terms, known_loinc_hint, mapping_kind, mapping_status,
  selected_loinc_num, properties, updated_at
)
VALUES (
  {sql_quote(item['catalog_code'])},
  {sql_quote(item['group_code'])},
  {sql_quote(item['tier'])},
  {sql_quote(item['label_fr'])},
  {sql_quote(item.get('clinical_intent'))},
  {sql_text_array(item.get('preferred_systems'))},
  {sql_text_array(item.get('search_terms'))},
  {sql_quote(item.get('known_loinc_hint'))},
  {sql_quote(item.get('mapping_kind', 'SINGLE'))},
  'UNMAPPED',
  NULL,
  '{{}}'::jsonb,
  now()
)
ON CONFLICT (catalog_code) DO UPDATE SET
  group_code=EXCLUDED.group_code,
  tier=EXCLUDED.tier,
  label_fr=EXCLUDED.label_fr,
  clinical_intent=EXCLUDED.clinical_intent,
  preferred_systems=EXCLUDED.preferred_systems,
  search_terms=EXCLUDED.search_terms,
  known_loinc_hint=EXCLUDED.known_loinc_hint,
  mapping_kind=EXCLUDED.mapping_kind,
  updated_at=now();
""")
    statements.append("COMMIT;")
    subprocess.run(psql_base(db), input="\n".join(statements), text=True, check=True)


def save_candidates(db, release_id, catalog, rows, report_path):
    statements = [
        "BEGIN;",
        f"DELETE FROM iml_loinc_workbench.gp_catalog_candidate WHERE release_id={release_id};",
    ]
    report_rows = []
    summary = {
        "hint_present": 0,
        "candidate": 0,
        "ambiguous": 0,
        "absent": 0,
        "family": 0,
    }

    for item in catalog["items"]:
        candidates = top_candidates(item, rows, 5)
        hint = clean(item.get("known_loinc_hint"))
        hint_present = bool(hint and any(r["loinc_num"] == hint for r in rows))

        mapping_kind = item.get("mapping_kind", "SINGLE")
        if mapping_kind == "FAMILY":
            status = "FAMILY"
            summary["family"] += 1
        elif hint_present:
            status = "CANDIDATE"
            summary["hint_present"] += 1
            summary["candidate"] += 1
        elif not candidates:
            status = "ABSENT"
            summary["absent"] += 1
        elif len(candidates) == 1:
            status = "CANDIDATE"
            summary["candidate"] += 1
        else:
            first = candidates[0][0]
            second = candidates[1][0]
            if first >= 220 and first >= second + 80:
                status = "CANDIDATE"
                summary["candidate"] += 1
            else:
                status = "AMBIGUOUS"
                summary["ambiguous"] += 1

        statements.append(
            "UPDATE iml_loinc_workbench.gp_catalog_item "
            f"SET mapping_status={sql_quote(status)}, selected_loinc_num=NULL, updated_at=now() "
            f"WHERE catalog_code={sql_quote(item['catalog_code'])};"
        )

        for rank_order, (score, row) in enumerate(candidates, 1):
            statements.append(f"""
INSERT INTO iml_loinc_workbench.gp_catalog_candidate(
  catalog_code, release_id, loinc_num, score, rank_order,
  candidate_label, system_axis, class_code, method_typ, common_test_rank
)
VALUES (
  {sql_quote(item['catalog_code'])},
  {release_id},
  {sql_quote(row['loinc_num'])},
  {score},
  {rank_order},
  {sql_quote(row['long_common_name'] or row['component'])},
  {sql_quote(row['system_axis'])},
  {sql_quote(row['class_code'])},
  {sql_quote(row['method_typ'])},
  {row['common_test_rank'] if clean(row['common_test_rank']).isdigit() else 'NULL'}
)
ON CONFLICT (catalog_code, release_id, loinc_num) DO UPDATE SET
  score=EXCLUDED.score,
  rank_order=EXCLUDED.rank_order,
  candidate_label=EXCLUDED.candidate_label,
  system_axis=EXCLUDED.system_axis,
  class_code=EXCLUDED.class_code,
  method_typ=EXCLUDED.method_typ,
  common_test_rank=EXCLUDED.common_test_rank;
""")

        for rank_order in range(1, 6):
            if rank_order <= len(candidates):
                score, row = candidates[rank_order - 1]
                report_rows.append([
                    item["catalog_code"],
                    item["group_code"],
                    item["tier"],
                    item["label_fr"],
                    status,
                    hint or "",
                    rank_order,
                    row["loinc_num"],
                    score,
                    row["long_common_name"] or row["component"],
                    row["system_axis"],
                    row["class_code"],
                    row["method_typ"],
                    row["common_test_rank"],
                ])
            elif rank_order == 1:
                report_rows.append([
                    item["catalog_code"], item["group_code"], item["tier"],
                    item["label_fr"], status, hint or "", "", "", "", "", "", "", "", ""
                ])

    statements.append("COMMIT;")
    subprocess.run(psql_base(db), input="\n".join(statements), text=True, check=True)

    report_path.parent.mkdir(parents=True, exist_ok=True)
    with report_path.open("w", encoding="utf-8", newline="") as f:
        w = csv.writer(f, delimiter="\t")
        w.writerow([
            "catalog_code","group_code","tier","label_fr","status","known_loinc_hint",
            "candidate_rank","loinc_num","score","candidate_label","system_axis",
            "class_code","method_typ","common_test_rank"
        ])
        w.writerows(report_rows)

    return summary


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument(
        "--db",
        default=os.environ.get("IML_LOCAL_DB", "iml_workspace"),
        help="Base PostgreSQL locale",
    )
    ap.add_argument(
        "--catalog",
        default=None,
        help="Catalogue JSON; par défaut data/loinc/gp-biological-catalog-v0.3.json",
    )
    ap.add_argument(
        "--report",
        default=str(Path("~/Documents/IML_GP_CATALOG_LOINC_2.83.tsv").expanduser()),
        help="Rapport TSV de candidats",
    )
    args = ap.parse_args()

    if not shutil.which("psql"):
        print("ERREUR: psql introuvable", file=sys.stderr)
        return 2

    repo_root = Path(__file__).resolve().parents[1]
    catalog_path = Path(args.catalog) if args.catalog else (
        repo_root / "data/loinc/gp-biological-catalog-v0.3.json"
    )
    schema_sql = repo_root / "db/local/loinc/001_loinc_workbench.sql"
    report_path = Path(args.report).expanduser()

    print(f"IML GP biological catalog mapper v{VERSION}")
    assert_local_database(args.db)
    ensure_schema(args.db, schema_sql)

    if not catalog_path.exists():
        print(f"ERREUR: catalogue introuvable: {catalog_path}", file=sys.stderr)
        return 3

    catalog = json.loads(catalog_path.read_text(encoding="utf-8"))
    release_id = query_scalar(
        args.db,
        "SELECT id FROM iml_loinc_workbench.source_release "
        "WHERE is_current ORDER BY id DESC LIMIT 1;",
    )
    if not release_id:
        print("ERREUR: aucune release LOINC locale courante", file=sys.stderr)
        return 4
    release_id = int(release_id)

    print(f"Catalogue: {catalog['title']} ({len(catalog['items'])} entrées)")
    print(f"Release LOINC locale courante: id={release_id}")

    seed_catalog(args.db, catalog)
    print("Lecture du corpus LOINC actif...")
    rows = read_active_loinc(args.db, release_id)
    print(f"Concepts ACTIVE examinés: {len(rows)}")

    print("Recherche des candidats LOINC...")
    summary = save_candidates(args.db, release_id, catalog, rows, report_path)

    print("\n================ CATALOGUE GP ================")
    print(f"Entrées GP                  : {len(catalog['items'])}")
    print(f"Hints LOINC présents        : {summary['hint_present']}")
    print(f"Candidats exploitables      : {summary['candidate']}")
    print(f"Familles multi-LOINC        : {summary['family']}")
    print(f"Ambigus à revoir            : {summary['ambiguous']}")
    print(f"Sans candidat               : {summary['absent']}")
    print(f"Rapport                     : {report_path}")
    print("\nAucun mapping n'a été VALIDÉ automatiquement.")
    print("Aucune donnée n'a été envoyée à Neon.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
