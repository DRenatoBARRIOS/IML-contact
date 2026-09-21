#!/usr/bin/env python3
"""
IML LOINC 2.83 rank-profile audit.

Palier 3: quantify the natural cut points inside the laboratory corpus.
This script is descriptive only. It does not import, delete, classify, or sync.

It reports:
- ranked active laboratory observations, all specimen systems
- the same restricted to common GP specimens
- Universal Lab Orders
- overlap between orders and ranked observations
- COMMON_TEST_RANK threshold distributions
- class distributions at each threshold
- French/UCUM/methodless coverage

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
    "LOINC_NUM", "LoincNumber", "LOINC", "LOINC_CODE", "LoincCode", "Code"
)

COMMON_SYSTEMS = {"Ser", "Ser/Plas", "Plas", "Bld", "Urine"}
RESULT_ORDER_OBS = {"OBSERVATION", "BOTH"}
THRESHOLDS = (100, 250, 500, 1000, 2500, 5000, 10000, 20000)


def clean(value):
    return (value or "").strip()


def open_csv_from_zip(zf, name):
    raw = zf.open(name, "r")
    text = io.TextIOWrapper(raw, encoding="utf-8-sig", newline="")
    return csv.DictReader(text), text


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


def load_code_set(zf, path):
    if path not in zf.namelist():
        return set()
    reader, handle = open_csv_from_zip(zf, path)
    column = detect_code_column(reader.fieldnames)
    if not column:
        handle.close()
        raise RuntimeError(f"Impossible d'identifier la colonne LOINC dans {path}")
    codes = set()
    for row in reader:
        code = clean(row.get(column))
        if code:
            codes.add(code)
    handle.close()
    return codes


def int_or_zero(value):
    try:
        return int(clean(value))
    except (TypeError, ValueError):
        return 0


def pct(n, d):
    return "0.0%" if not d else f"{100.0*n/d:.1f}%"


def summarize(name, rows, fr_codes, order_codes):
    total = len(rows)
    fr = sum(1 for r in rows if clean(r.get("LOINC_NUM")) in fr_codes)
    ucum = sum(1 for r in rows if clean(r.get("EXAMPLE_UCUM_UNITS")))
    methodless = sum(1 for r in rows if not clean(r.get("METHOD_TYP")))
    in_orders = sum(1 for r in rows if clean(r.get("LOINC_NUM")) in order_codes)
    print(f"\n## {name}")
    print(f"N                 : {total}")
    print(f"FR                : {fr} ({pct(fr,total)})")
    print(f"UCUM example      : {ucum} ({pct(ucum,total)})")
    print(f"Sans METHOD_TYP   : {methodless} ({pct(methodless,total)})")
    print(f"Dans Universal Lab Orders : {in_orders} ({pct(in_orders,total)})")


def print_thresholds(title, rows, fr_codes):
    print(f"\n================ {title} ================")
    print(f"{'COMMON_TEST_RANK <=':>22} {'N':>8} {'FR':>8} {'UCUM':>8} {'sans méth.':>11}")
    for threshold in THRESHOLDS:
        subset = [r for r in rows if 0 < int_or_zero(r.get("COMMON_TEST_RANK")) <= threshold]
        n = len(subset)
        fr = sum(1 for r in subset if clean(r.get("LOINC_NUM")) in fr_codes)
        ucum = sum(1 for r in subset if clean(r.get("EXAMPLE_UCUM_UNITS")))
        methodless = sum(1 for r in subset if not clean(r.get("METHOD_TYP")))
        print(f"{threshold:>22} {n:>8} {fr:>8} {ucum:>8} {methodless:>11}")


def print_classes(title, rows, threshold):
    subset = [r for r in rows if 0 < int_or_zero(r.get("COMMON_TEST_RANK")) <= threshold]
    counts = Counter(clean(r.get("CLASS")) or "(vide)" for r in subset)
    print(f"\n================ {title} <= {threshold} : CLASSES ================")
    for cls, count in counts.most_common(30):
        print(f"{count:>8}  {cls}")


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
            fr_codes = load_code_set(zf, FR_CSV)
            order_codes = load_code_set(zf, ORDERS_CSV)
        except RuntimeError as exc:
            print("ERREUR:", exc, file=sys.stderr)
            return 3

        if MAIN_CSV not in zf.namelist():
            print(f"ERREUR: {MAIN_CSV} absent du ZIP", file=sys.stderr)
            return 4

        reader, handle = open_csv_from_zip(zf, MAIN_CSV)

        lab_active = []
        result_all = []
        result_ranked_all = []
        result_common = []
        result_ranked_common = []
        universal_active = []

        for row in reader:
            code = clean(row.get("LOINC_NUM"))
            active = clean(row.get("STATUS")).upper() == "ACTIVE"
            class1 = clean(row.get("CLASSTYPE")) == "1"
            order_obs = clean(row.get("ORDER_OBS")).upper()
            system = clean(row.get("SYSTEM"))
            rank = int_or_zero(row.get("COMMON_TEST_RANK"))

            if active and class1:
                lab_active.append(row)

                if code in order_codes:
                    universal_active.append(row)

                if order_obs in RESULT_ORDER_OBS:
                    result_all.append(row)

                    if rank > 0:
                        result_ranked_all.append(row)

                    if system in COMMON_SYSTEMS:
                        result_common.append(row)
                        if rank > 0:
                            result_ranked_common.append(row)

        handle.close()

    print(f"IML LOINC rank-profile audit v{VERSION}")
    print(f"ZIP: {zip_path}")

    summarize("ACTIVE + CLASSTYPE=1", lab_active, fr_codes, order_codes)
    summarize("Résultats Observation/Both, tous systèmes", result_all, fr_codes, order_codes)
    summarize("Résultats classés par COMMON_TEST_RANK, tous systèmes", result_ranked_all, fr_codes, order_codes)
    summarize("Résultats systèmes courants", result_common, fr_codes, order_codes)
    summarize("Résultats classés, systèmes courants", result_ranked_common, fr_codes, order_codes)
    summarize("Universal Lab Orders actifs", universal_active, fr_codes, order_codes)

    print_thresholds(
        "SEUILS RANK - RESULTATS TOUS SYSTEMES",
        result_ranked_all,
        fr_codes,
    )
    print_thresholds(
        "SEUILS RANK - SYSTEMES COURANTS",
        result_ranked_common,
        fr_codes,
    )

    for threshold in (250, 500, 1000, 2500):
        print_classes("TOUS SYSTEMES", result_ranked_all, threshold)

    order_and_result = {
        clean(r.get("LOINC_NUM"))
        for r in universal_active
        if clean(r.get("ORDER_OBS")).upper() in RESULT_ORDER_OBS
    }
    ranked_codes = {clean(r.get("LOINC_NUM")) for r in result_ranked_all}
    print("\n================ CHEVAUCHEMENTS ================")
    print(f"Universal Lab Orders actifs                    : {len(universal_active)}")
    print(f"Universal Lab Orders aussi Observation/Both    : {len(order_and_result)}")
    print(
        "Universal Lab Orders présents dans résultats rankés : "
        + str(len({clean(r.get('LOINC_NUM')) for r in universal_active} & ranked_codes))
    )

    print("\n================ INTERPRÉTATION ================")
    print("Le script mesure des seuils; il ne fixe aucune frontière IML.")
    print("Le filtre 'systèmes courants' n'est pas destiné à exclure microbiologie, LCR, tissus ou isolats.")
    print("Aucune donnée n'est importée dans PostgreSQL.")
    print("Aucune donnée n'est envoyée à Neon.")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
