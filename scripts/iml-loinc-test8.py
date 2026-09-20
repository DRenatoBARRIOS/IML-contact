#!/usr/bin/env python3
"""
IML LOINC TEST-8 candidate explorer.

Reads the official LOINC ZIP locally, without extracting or uploading it.
It searches the LoincTable/Loinc.csv file for candidate codes for the
eight laboratory observations used by the fictional TEST patient.

No network access. No Neon writes. No patient data.
"""

from __future__ import annotations

import argparse
import csv
import io
import re
import sys
import unicodedata
import zipfile
from collections import defaultdict
from pathlib import Path

VERSION = "0.1.0"

MAIN_CSV = "LoincTable/Loinc.csv"
FR_CSV = "AccessoryFiles/LinguisticVariants/frFR18LinguisticVariant.csv"

TARGETS = {
    "Hémoglobine": ["hemoglobin", "haemoglobin", "hémoglobine"],
    "Leucocytes": ["leukocyte", "leucocyte", "white blood cell", "wbc"],
    "Plaquettes": ["platelet", "thrombocyte", "plaquette"],
    "Sodium": ["sodium"],
    "Potassium": ["potassium"],
    "Créatinine": ["creatinine", "créatinine"],
    "DFG estimé": [
        "glomerular filtration rate",
        "estimated glomerular filtration rate",
        "egfr",
        "filtration glomerulaire",
        "dfg",
    ],
    "HbA1c": [
        "hemoglobin a1c",
        "hba1c",
        "glycohemoglobin",
        "glycated hemoglobin",
        "hémoglobine glyquée",
    ],
}

DISPLAY_FIELDS = [
    "LOINC_NUM",
    "COMPONENT",
    "PROPERTY",
    "TIME_ASPCT",
    "SYSTEM",
    "SCALE_TYP",
    "METHOD_TYP",
    "CLASS",
    "LONG_COMMON_NAME",
    "SHORTNAME",
    "STATUS",
]


def fold(value: str | None) -> str:
    value = value or ""
    value = unicodedata.normalize("NFKD", value)
    value = "".join(ch for ch in value if not unicodedata.combining(ch))
    return re.sub(r"\s+", " ", value).casefold().strip()


def open_csv_from_zip(zf: zipfile.ZipFile, name: str):
    raw = zf.open(name, "r")
    text = io.TextIOWrapper(raw, encoding="utf-8-sig", newline="")
    return csv.DictReader(text), text


def row_text(row: dict[str, str]) -> str:
    preferred = [
        "COMPONENT",
        "LONG_COMMON_NAME",
        "SHORTNAME",
        "RELATEDNAMES2",
        "CONSUMER_NAME",
        "DisplayName",
        "LONG_COMMON_NAME_FR",
        "SHORTNAME_FR",
    ]
    parts = [row.get(k, "") for k in preferred if row.get(k)]
    if not parts:
        parts = [v for v in row.values() if v]
    return fold(" | ".join(parts))


def score_row(row: dict[str, str], terms: list[str]) -> int:
    text = row_text(row)
    score = 0
    for term in terms:
        t = fold(term)
        if not t:
            continue
        if t in text:
            score += 20
        component = fold(row.get("COMPONENT"))
        long_name = fold(row.get("LONG_COMMON_NAME"))
        short = fold(row.get("SHORTNAME"))
        if component == t:
            score += 80
        elif component.startswith(t):
            score += 45
        if t in long_name:
            score += 25
        if t in short:
            score += 15
    if fold(row.get("STATUS")) == "active":
        score += 5
    # Favor common quantitative lab observations, but do not exclude others.
    if fold(row.get("SCALE_TYP")) in {"qn", "ord"}:
        score += 2
    return score


def best_french_label(row: dict[str, str] | None) -> str:
    if not row:
        return ""
    preferred = [
        "LONG_COMMON_NAME",
        "LongCommonName",
        "LONG_COMMON_NAME_FR",
        "SHORTNAME",
        "ShortName",
        "COMPONENT",
        "Component",
        "DisplayName",
    ]
    for key in preferred:
        value = (row.get(key) or "").strip()
        if value:
            return value
    for key, value in row.items():
        if value and "name" in fold(key):
            return value.strip()
    return ""


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument(
        "zipfile",
        nargs="?",
        default=str(Path("~/Downloads/Loinc_2.83.zip").expanduser()),
        help="Chemin du ZIP officiel LOINC 2.83",
    )
    ap.add_argument("--top", type=int, default=12, help="Nombre de candidats par analyse")
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

        reader, text_handle = open_csv_from_zip(zf, MAIN_CSV)
        headers = reader.fieldnames or []
        print(f"IML LOINC TEST-8 explorer v{VERSION}")
        print(f"ZIP: {zip_path}")
        print(f"Table principale: {MAIN_CSV}")
        print("Colonnes principales:")
        print("  " + " | ".join(headers))

        candidates: dict[str, list[tuple[int, dict[str, str]]]] = defaultdict(list)
        rows_by_code: dict[str, dict[str, str]] = {}

        for row in reader:
            code = (row.get("LOINC_NUM") or "").strip()
            if code:
                rows_by_code[code] = row
            for target, terms in TARGETS.items():
                s = score_row(row, terms)
                if s > 0:
                    candidates[target].append((s, row))
        text_handle.close()

        fr_by_code: dict[str, dict[str, str]] = {}
        if FR_CSV in names:
            fr_reader, fr_handle = open_csv_from_zip(zf, FR_CSV)
            fr_headers = fr_reader.fieldnames or []
            print("\nVariante française:")
            print(f"  {FR_CSV}")
            print("Colonnes françaises:")
            print("  " + " | ".join(fr_headers))
            for row in fr_reader:
                code = (
                    row.get("LOINC_NUM")
                    or row.get("LoincNumber")
                    or row.get("LOINC")
                    or row.get("LOINC_NUMERIC")
                    or ""
                ).strip()
                if code:
                    fr_by_code[code] = row
            fr_handle.close()
        else:
            print(f"\nNOTE: {FR_CSV} absent du ZIP.")

        print("\n================ CANDIDATS TEST-8 ================")
        for target in TARGETS:
            print(f"\n### {target}")
            ranked = sorted(
                candidates[target],
                key=lambda item: (-item[0], item[1].get("LOINC_NUM", "")),
            )[: max(1, args.top)]
            if not ranked:
                print("  Aucun candidat trouvé.")
                continue
            for idx, (score, row) in enumerate(ranked, start=1):
                code = row.get("LOINC_NUM", "")
                print(f"\n  {idx:>2}. score={score}  LOINC={code}")
                for field in DISPLAY_FIELDS:
                    value = (row.get(field) or "").strip()
                    if value:
                        print(f"      {field}: {value}")
                fr_label = best_french_label(fr_by_code.get(code))
                if fr_label:
                    print(f"      FR: {fr_label}")

    print("\nAucune donnée n'a été envoyée à Neon.")
    print("Étape suivante: valider manuellement un code par analyse avant tout import.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
