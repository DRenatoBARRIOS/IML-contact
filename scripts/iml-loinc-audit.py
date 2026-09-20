#!/usr/bin/env python3
"""
IML LOINC 2.83 local audit.

Purpose
-------
Describe the official LOINC corpus before deciding what belongs in:
  * LOINC SOURCE
  * IML LAB CORE
  * IML LAB EXTENDED

The script is deliberately descriptive. It does not delete, import, sync,
or classify terms into CORE/EXTENDED automatically.

Inputs are read directly from the official ZIP:
  LoincTable/Loinc.csv
  AccessoryFiles/LinguisticVariants/frFR18LinguisticVariant.csv
  AccessoryFiles/LoincUniversalLabOrdersValueSet/LoincUniversalLabOrdersValueSet.csv

No network access. No Neon writes. No patient data.
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


def open_csv_from_zip(zf: zipfile.ZipFile, name: str):
    raw = zf.open(name, "r")
    text = io.TextIOWrapper(raw, encoding="utf-8-sig", newline="")
    return csv.DictReader(text), text


def clean(value: str | None) -> str:
    return (value or "").strip()


def detect_code_column(fieldnames: list[str] | None) -> str | None:
    fields = fieldnames or []
    for candidate in CODE_CANDIDATES:
        if candidate in fields:
            return candidate
    upper_map = {f.upper(): f for f in fields}
    for candidate in CODE_CANDIDATES:
        if candidate.upper() in upper_map:
            return upper_map[candidate.upper()]
    return None


def nonempty(value: str | None) -> bool:
    return bool(clean(value))


def int_or_zero(value: str | None) -> int:
    try:
        return int(clean(value))
    except (TypeError, ValueError):
        return 0


def pct(n: int, d: int) -> str:
    return "0.0%" if d == 0 else f"{100.0 * n / d:.1f}%"


def print_counter(title: str, counter: Counter, total: int, limit: int):
    print(f"\n## {title}")
    for value, count in counter.most_common(limit):
        label = value if value else "(vide)"
        print(f"{count:>8}  {pct(count, total):>7}  {label}")


def main() -> int:
    ap = argparse.ArgumentParser(
        description="Audit descriptif local du corpus officiel LOINC 2.83."
    )
    ap.add_argument(
        "zipfile",
        nargs="?",
        default=str(Path("~/Downloads/Loinc_2.83.zip").expanduser()),
        help="Chemin du ZIP officiel LOINC 2.83",
    )
    ap.add_argument(
        "--top",
        type=int,
        default=30,
        help="Nombre de valeurs affichées pour CLASS et SYSTEM (défaut: 30)",
    )
    args = ap.parse_args()

    zip_path = Path(args.zipfile).expanduser()
    if not zip_path.exists():
        print(f"ERREUR: fichier introuvable: {zip_path}", file=sys.stderr)
        return 2

    with zipfile.ZipFile(zip_path) as zf:
        names = set(zf.namelist())
        if MAIN_CSV not in names:
            print(f"ERREUR: {MAIN_CSV} absent du ZIP", file=sys.stderr)
            return 3

        # ----- French coverage -----
        french_codes: set[str] = set()
        french_rows = 0
        french_code_column = None

        if FR_CSV in names:
            fr_reader, fr_handle = open_csv_from_zip(zf, FR_CSV)
            french_code_column = detect_code_column(fr_reader.fieldnames)
            if french_code_column is None:
                print(
                    "ERREUR: impossible d'identifier la colonne LOINC de la variante française",
                    file=sys.stderr,
                )
                return 4
            for row in fr_reader:
                french_rows += 1
                code = clean(row.get(french_code_column))
                if code:
                    french_codes.add(code)
            fr_handle.close()

        # ----- Universal lab orders coverage -----
        order_codes: set[str] = set()
        order_rows = 0
        order_code_column = None
        order_headers: list[str] = []

        if ORDERS_CSV in names:
            order_reader, order_handle = open_csv_from_zip(zf, ORDERS_CSV)
            order_headers = order_reader.fieldnames or []
            order_code_column = detect_code_column(order_headers)
            if order_code_column is None:
                print(
                    "ERREUR: impossible d'identifier la colonne LOINC du Universal Lab Orders Value Set",
                    file=sys.stderr,
                )
                return 5
            for row in order_reader:
                order_rows += 1
                code = clean(row.get(order_code_column))
                if code:
                    order_codes.add(code)
            order_handle.close()

        # ----- Main LOINC table -----
        reader, main_handle = open_csv_from_zip(zf, MAIN_CSV)
        headers = reader.fieldnames or []

        required = {"LOINC_NUM", "STATUS", "CLASS", "SYSTEM", "ORDER_OBS"}
        missing = sorted(required.difference(headers))
        if missing:
            print(
                "ERREUR: colonnes attendues absentes: " + ", ".join(missing),
                file=sys.stderr,
            )
            return 6

        total = 0
        active = 0
        inactive = 0
        unknown_status = 0

        status_counts = Counter()
        class_counts = Counter()
        system_counts = Counter()
        order_obs_counts = Counter()
        class_type_counts = Counter()
        scale_counts = Counter()
        property_counts = Counter()

        with_method = 0
        methodless = 0
        common_test_ranked = 0
        common_order_ranked = 0
        with_example_ucum = 0
        with_fr = 0
        active_with_fr = 0
        in_universal_orders = 0
        active_in_universal_orders = 0

        active_orderish = 0
        active_observationish = 0
        active_both = 0
        active_unknown_order_obs = 0

        for row in reader:
            total += 1
            code = clean(row.get("LOINC_NUM"))
            status = clean(row.get("STATUS")) or "(vide)"
            cls = clean(row.get("CLASS")) or "(vide)"
            system = clean(row.get("SYSTEM")) or "(vide)"
            order_obs = clean(row.get("ORDER_OBS")) or "(vide)"
            class_type = clean(row.get("CLASSTYPE")) or "(vide)"
            scale = clean(row.get("SCALE_TYP")) or "(vide)"
            prop = clean(row.get("PROPERTY")) or "(vide)"

            status_counts[status] += 1
            class_counts[cls] += 1
            system_counts[system] += 1
            order_obs_counts[order_obs] += 1
            class_type_counts[class_type] += 1
            scale_counts[scale] += 1
            property_counts[prop] += 1

            is_active = status.upper() == "ACTIVE"
            if is_active:
                active += 1
            elif status:
                inactive += 1
            else:
                unknown_status += 1

            if nonempty(row.get("METHOD_TYP")):
                with_method += 1
            else:
                methodless += 1

            if int_or_zero(row.get("COMMON_TEST_RANK")) > 0:
                common_test_ranked += 1

            if int_or_zero(row.get("COMMON_ORDER_RANK")) > 0:
                common_order_ranked += 1

            if nonempty(row.get("EXAMPLE_UCUM_UNITS")):
                with_example_ucum += 1

            has_fr = code in french_codes
            if has_fr:
                with_fr += 1
                if is_active:
                    active_with_fr += 1

            is_order_value_set = code in order_codes
            if is_order_value_set:
                in_universal_orders += 1
                if is_active:
                    active_in_universal_orders += 1

            if is_active:
                oo = order_obs.upper()
                if oo == "ORDER":
                    active_orderish += 1
                elif oo == "OBSERVATION":
                    active_observationish += 1
                elif oo == "BOTH":
                    active_both += 1
                else:
                    active_unknown_order_obs += 1

        main_handle.close()

    print(f"IML LOINC local audit v{VERSION}")
    print(f"ZIP: {zip_path}")
    print(f"Source: {MAIN_CSV}")

    print("\n================ SYNTHÈSE ================")
    print(f"Total LOINC                         : {total}")
    print(f"ACTIVE                              : {active} ({pct(active, total)})")
    print(f"Non ACTIVE                          : {inactive} ({pct(inactive, total)})")
    if unknown_status:
        print(f"Statut inconnu                      : {unknown_status} ({pct(unknown_status, total)})")
    print(f"Avec METHOD_TYP                     : {with_method} ({pct(with_method, total)})")
    print(f"Sans METHOD_TYP                     : {methodless} ({pct(methodless, total)})")
    print(f"Avec COMMON_TEST_RANK > 0           : {common_test_ranked} ({pct(common_test_ranked, total)})")
    print(f"Avec COMMON_ORDER_RANK > 0          : {common_order_ranked} ({pct(common_order_ranked, total)})")
    print(f"Avec EXAMPLE_UCUM_UNITS             : {with_example_ucum} ({pct(with_example_ucum, total)})")

    if french_codes:
        print(
            f"Avec variante française             : {with_fr} ({pct(with_fr, total)})"
        )
        print(
            f"ACTIVE avec variante française      : {active_with_fr} ({pct(active_with_fr, active)})"
        )
        print(
            f"Fichier FR                          : {french_rows} lignes, {len(french_codes)} codes uniques"
        )
    else:
        print("Variante française                  : non analysée")

    if order_codes:
        print(
            f"Dans Universal Lab Orders           : {in_universal_orders} ({pct(in_universal_orders, total)})"
        )
        print(
            f"ACTIVE dans Universal Lab Orders    : {active_in_universal_orders} ({pct(active_in_universal_orders, active)})"
        )
        print(
            f"Universal Lab Orders                : {order_rows} lignes, {len(order_codes)} codes uniques"
        )
        print(
            f"Colonne code Universal Lab Orders   : {order_code_column}"
        )
    else:
        print("Universal Lab Orders                : non analysé")

    print("\n================ ACTIVE × ORDER_OBS ================")
    print(f"ORDER                               : {active_orderish}")
    print(f"OBSERVATION                         : {active_observationish}")
    print(f"BOTH                                : {active_both}")
    print(f"Autre / vide                        : {active_unknown_order_obs}")

    print_counter("STATUS", status_counts, total, 20)
    print_counter("ORDER_OBS", order_obs_counts, total, 20)
    print_counter("CLASSTYPE", class_type_counts, total, 20)
    print_counter("CLASS", class_counts, total, max(1, args.top))
    print_counter("SYSTEM", system_counts, total, max(1, args.top))
    print_counter("SCALE_TYP", scale_counts, total, 20)
    print_counter("PROPERTY", property_counts, total, 30)

    print("\n================ INTERPRÉTATION IML ================")
    print("Ce rapport est descriptif seulement.")
    print("Aucun code n'est classé automatiquement CORE ou EXTENDED.")
    print("Aucune donnée n'a été importée dans PostgreSQL.")
    print("Aucune donnée n'a été envoyée à Neon.")
    print("Étape suivante: définir les règles IML LAB CORE à partir de ces distributions.")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
