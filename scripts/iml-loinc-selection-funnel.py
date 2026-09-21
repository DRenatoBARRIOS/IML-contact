#!/usr/bin/env python3
"""
IML LOINC 2.83 selection-funnel audit.

This is palier 2 of the LOINC audit. It does NOT decide the final IML LAB CORE.
It measures intersections that matter for a future selection policy.

No network access. No PostgreSQL writes. No Neon writes. No patient data.
"""

from __future__ import annotations

import argparse
import csv
import io
import sys
import zipfile
from collections import Counter
from pathlib import Path

VERSION = "0.1.0"

MAIN_CSV = "LoincTable/Loinc.csv"
FR_CSV = "AccessoryFiles/LinguisticVariants/frFR18LinguisticVariant.csv"
ORDERS_CSV = (
    "AccessoryFiles/LoincUniversalLabOrdersValueSet/"
    "LoincUniversalLabOrdersValueSet.csv"
)

CODE_CANDIDATES = (
    "LOINC_NUM",
    "LoincNumber",
    "LOINC",
    "LOINC_CODE",
    "LoincCode",
    "Code",
)

COMMON_SYSTEMS = {
    "Ser",
    "Ser/Plas",
    "Plas",
    "Bld",
    "Urine",
}

RESULT_ORDER_OBS = {"OBSERVATION", "BOTH"}


def open_csv_from_zip(zf: zipfile.ZipFile, name: str):
    raw = zf.open(name, "r")
    text = io.TextIOWrapper(raw, encoding="utf-8-sig", newline="")
    return csv.DictReader(text), text


def clean(value):
    return (value or "").strip()


def detect_code_column(fieldnames):
    fields = fieldnames or []
    for candidate in CODE_CANDIDATES:
        if candidate in fields:
            return candidate
    upper = {f.upper(): f for f in fields}
    for candidate in CODE_CANDIDATES:
        if candidate.upper() in upper:
            return upper[candidate.upper()]
    return None


def int_or_zero(value):
    try:
        return int(clean(value))
    except (TypeError, ValueError):
        return 0


def pct(n, d):
    return "0.0%" if not d else f"{100.0*n/d:.1f}%"


def load_code_set(zf, path):
    if path not in zf.namelist():
        return set(), None, 0
    reader, handle = open_csv_from_zip(zf, path)
    column = detect_code_column(reader.fieldnames)
    if not column:
        handle.close()
        raise RuntimeError(f"Impossible d'identifier la colonne LOINC dans {path}")
    codes = set()
    rows = 0
    for row in reader:
        rows += 1
        code = clean(row.get(column))
        if code:
            codes.add(code)
    handle.close()
    return codes, column, rows


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument(
        "zipfile",
        nargs="?",
        default=str(Path("~/Downloads/Loinc_2.83.zip").expanduser()),
    )
    args = ap.parse_args()

    zip_path = Path(args.zipfile).expanduser()
    if not zip_path.exists():
        print(f"ERREUR: fichier introuvable: {zip_path}", file=sys.stderr)
        return 2

    with zipfile.ZipFile(zip_path) as zf:
        try:
            fr_codes, fr_col, fr_rows = load_code_set(zf, FR_CSV)
            order_codes, order_col, order_rows = load_code_set(zf, ORDERS_CSV)
        except RuntimeError as exc:
            print("ERREUR:", exc, file=sys.stderr)
            return 3

        if MAIN_CSV not in zf.namelist():
            print(f"ERREUR: {MAIN_CSV} absent du ZIP", file=sys.stderr)
            return 4

        reader, handle = open_csv_from_zip(zf, MAIN_CSV)

        total = 0

        funnel = Counter()
        fr_funnel = Counter()
        methodless_funnel = Counter()
        ucum_funnel = Counter()
        ranked_funnel = Counter()

        active_class1_by_class = Counter()
        active_result_by_class = Counter()
        active_result_by_system = Counter()

        universal_active_by_class = Counter()
        universal_active_by_system = Counter()

        for row in reader:
            total += 1
            code = clean(row.get("LOINC_NUM"))
            status = clean(row.get("STATUS")).upper()
            class_type = clean(row.get("CLASSTYPE"))
            order_obs = clean(row.get("ORDER_OBS")).upper()
            system = clean(row.get("SYSTEM"))
            cls = clean(row.get("CLASS")) or "(vide)"
            methodless = not clean(row.get("METHOD_TYP"))
            has_ucum = bool(clean(row.get("EXAMPLE_UCUM_UNITS")))
            ranked = int_or_zero(row.get("COMMON_TEST_RANK")) > 0
            has_fr = code in fr_codes

            stages = ["TOTAL"]

            if status == "ACTIVE":
                stages.append("ACTIVE")

                if class_type == "1":
                    stages.append("ACTIVE_CLASS1")
                    active_class1_by_class[cls] += 1

                    if order_obs in RESULT_ORDER_OBS:
                        stages.append("ACTIVE_CLASS1_RESULT")
                        active_result_by_class[cls] += 1
                        active_result_by_system[system or "(vide)"] += 1

                        if system in COMMON_SYSTEMS:
                            stages.append("ACTIVE_CLASS1_RESULT_COMMON_SYSTEM")

                            if ranked:
                                stages.append("ACTIVE_CLASS1_RESULT_COMMON_SYSTEM_RANKED")

            for stage in stages:
                funnel[stage] += 1
                if has_fr:
                    fr_funnel[stage] += 1
                if methodless:
                    methodless_funnel[stage] += 1
                if has_ucum:
                    ucum_funnel[stage] += 1
                if ranked:
                    ranked_funnel[stage] += 1

            if status == "ACTIVE" and code in order_codes:
                funnel["ACTIVE_UNIVERSAL_ORDER"] += 1
                if has_fr:
                    fr_funnel["ACTIVE_UNIVERSAL_ORDER"] += 1
                if methodless:
                    methodless_funnel["ACTIVE_UNIVERSAL_ORDER"] += 1
                if has_ucum:
                    ucum_funnel["ACTIVE_UNIVERSAL_ORDER"] += 1
                if ranked:
                    ranked_funnel["ACTIVE_UNIVERSAL_ORDER"] += 1
                universal_active_by_class[cls] += 1
                universal_active_by_system[system or "(vide)"] += 1

                if class_type == "1":
                    funnel["ACTIVE_UNIVERSAL_ORDER_CLASS1"] += 1
                    if has_fr:
                        fr_funnel["ACTIVE_UNIVERSAL_ORDER_CLASS1"] += 1
                    if methodless:
                        methodless_funnel["ACTIVE_UNIVERSAL_ORDER_CLASS1"] += 1
                    if has_ucum:
                        ucum_funnel["ACTIVE_UNIVERSAL_ORDER_CLASS1"] += 1
                    if ranked:
                        ranked_funnel["ACTIVE_UNIVERSAL_ORDER_CLASS1"] += 1

        handle.close()

    stages = [
        ("TOTAL", "Tous les concepts"),
        ("ACTIVE", "ACTIVE"),
        ("ACTIVE_CLASS1", "ACTIVE + CLASSTYPE=1"),
        ("ACTIVE_CLASS1_RESULT", "… + ORDER_OBS Observation/Both"),
        ("ACTIVE_CLASS1_RESULT_COMMON_SYSTEM", "… + système courant Ser/Ser-Plas/Plas/Bld/Urine"),
        ("ACTIVE_CLASS1_RESULT_COMMON_SYSTEM_RANKED", "… + COMMON_TEST_RANK > 0"),
        ("ACTIVE_UNIVERSAL_ORDER", "ACTIVE + Universal Lab Orders"),
        ("ACTIVE_UNIVERSAL_ORDER_CLASS1", "… + CLASSTYPE=1"),
    ]

    print(f"IML LOINC selection-funnel audit v{VERSION}")
    print(f"ZIP: {zip_path}")
    print("\n================ ENTONNOIR ================")
    print(f"{'Étape':58} {'N':>8} {'% total':>9} {'FR':>8} {'sans méth.':>11} {'UCUM':>8} {'ranked':>8}")
    for key, label in stages:
        n = funnel[key]
        print(
            f"{label:58} {n:>8} {pct(n,total):>9} "
            f"{fr_funnel[key]:>8} {methodless_funnel[key]:>11} "
            f"{ucum_funnel[key]:>8} {ranked_funnel[key]:>8}"
        )

    print("\n================ ACTIVE CLASSTYPE=1 PAR CLASS ================")
    for value, count in active_class1_by_class.most_common(30):
        print(f"{count:>8}  {value}")

    print("\n================ RESULTATS CANDIDATS PAR CLASS ================")
    for value, count in active_result_by_class.most_common(30):
        print(f"{count:>8}  {value}")

    print("\n================ RESULTATS CANDIDATS PAR SYSTEM ================")
    for value, count in active_result_by_system.most_common(30):
        print(f"{count:>8}  {value}")

    print("\n================ UNIVERSAL LAB ORDERS ACTIFS PAR CLASS ================")
    for value, count in universal_active_by_class.most_common(30):
        print(f"{count:>8}  {value}")

    print("\n================ UNIVERSAL LAB ORDERS ACTIFS PAR SYSTEM ================")
    for value, count in universal_active_by_system.most_common(30):
        print(f"{count:>8}  {value}")

    print("\n================ NOTES ================")
    print("CLASSTYPE=1 est mesuré ici comme un filtre candidat, pas encore déclaré règle IML.")
    print("Les systèmes courants sont un scénario volontairement strict, pas une exclusion définitive.")
    print("Le rang COMMON_TEST_RANK n'est jamais utilisé seul comme critère de conservation.")
    print("Aucune ligne LOINC n'est supprimée.")
    print("Aucune donnée n'est importée dans PostgreSQL.")
    print("Aucune donnée n'est envoyée à Neon.")
    print("Étape suivante: choisir les frontières SOURCE / EXTENDED / CORE sur chiffres réels.")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
