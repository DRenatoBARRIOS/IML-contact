#!/usr/bin/env python3
"""
IML LOINC TEST-8 candidate explorer v0.2.

Reads the official LOINC ZIP locally, without extracting or uploading it.
It searches LoincTable/Loinc.csv for clinically compatible codes for the
8 laboratory observations used by the fictional TEST patient.

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

VERSION = "0.2.0"

MAIN_CSV = "LoincTable/Loinc.csv"
FR_CSV = "AccessoryFiles/LinguisticVariants/frFR18LinguisticVariant.csv"

TARGETS = {
    "Hémoglobine": {
        "terms": ["hemoglobin", "haemoglobin", "hémoglobine"],
        "component": ["Hemoglobin"],
        "property": ["MCnc"],
        "time": ["Pt"],
        "system": ["Bld"],
        "scale": ["Qn"],
        "prefer_methodless": True,
    },
    "Leucocytes": {
        "terms": ["leukocytes", "leucocytes", "white blood cells", "wbc"],
        "component": ["Leukocytes"],
        "property": ["NCnc"],
        "time": ["Pt"],
        "system": ["Bld"],
        "scale": ["Qn"],
        "prefer_methodless": True,
    },
    "Plaquettes": {
        "terms": ["platelets", "thrombocytes", "plaquettes"],
        "component": ["Platelets"],
        "property": ["NCnc"],
        "time": ["Pt"],
        "system": ["Bld"],
        "scale": ["Qn"],
        "prefer_methodless": True,
    },
    "Sodium": {
        "terms": ["sodium"],
        "component": ["Sodium"],
        "property": ["SCnc"],
        "time": ["Pt"],
        "system": ["Ser/Plas"],
        "scale": ["Qn"],
        "prefer_methodless": True,
    },
    "Potassium": {
        "terms": ["potassium"],
        "component": ["Potassium"],
        "property": ["SCnc"],
        "time": ["Pt"],
        "system": ["Ser/Plas"],
        "scale": ["Qn"],
        "prefer_methodless": True,
    },
    "Créatinine": {
        "terms": ["creatinine", "créatinine"],
        "component": ["Creatinine"],
        "property": ["SCnc"],
        "time": ["Pt"],
        "system": ["Ser/Plas"],
        "scale": ["Qn"],
        "prefer_methodless": True,
    },
    "DFG estimé": {
        "terms": [
            "glomerular filtration rate",
            "estimated glomerular filtration rate",
            "egfr",
            "filtration glomerulaire",
            "dfg",
        ],
        "component": ["Glomerular filtration rate"],
        "property": ["ArVRat"],
        "time": ["Pt"],
        "system": ["Ser/Plas/Bld"],
        "scale": ["Qn"],
        "method_contains": ["CKD-EPI 2021"],
        "method_prefer_contains": ["Creatinine-based formula"],
        "prefer_methodless": False,
    },
    "HbA1c": {
        "terms": [
            "hemoglobin a1c",
            "hba1c",
            "glycohemoglobin",
            "glycated hemoglobin",
            "hémoglobine glyquée",
        ],
        "component": ["Hemoglobin A1c/Hemoglobin.total"],
        "property": ["MFr"],
        "time": ["Pt"],
        "system": ["Bld"],
        "scale": ["Qn"],
        "prefer_methodless": True,
    },
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
    "EXAMPLE_UCUM_UNITS",
    "COMMON_TEST_RANK",
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
    ]
    parts = [row.get(k, "") for k in preferred if row.get(k)]
    if not parts:
        parts = [v for v in row.values() if v]
    return fold(" | ".join(parts))


def broad_score(row: dict[str, str], terms: list[str]) -> int:
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
    return score


def one_of(row: dict[str, str], field: str, wanted: list[str]) -> bool:
    actual = fold(row.get(field))
    return actual in {fold(x) for x in wanted}


def clinical_fit(row: dict[str, str], spec: dict):
    required = [
        ("COMPONENT", "component"),
        ("PROPERTY", "property"),
        ("TIME_ASPCT", "time"),
        ("SYSTEM", "system"),
        ("SCALE_TYP", "scale"),
    ]
    for field, key in required:
        wanted = spec.get(key) or []
        if wanted and not one_of(row, field, wanted):
            return False, 0, []

    method = fold(row.get("METHOD_TYP"))
    for needle in spec.get("method_contains") or []:
        if fold(needle) not in method:
            return False, 0, []

    score = 1000
    reasons = []

    if fold(row.get("STATUS")) == "active":
        score += 100

    if spec.get("prefer_methodless"):
        if not (row.get("METHOD_TYP") or "").strip():
            score += 80
            reasons.append("méthode non imposée")
        else:
            reasons.append("méthode spécifique")

    for needle in spec.get("method_prefer_contains") or []:
        if fold(needle) in method:
            score += 60
            reasons.append("méthode préférée: " + needle)

    rank_raw = (row.get("COMMON_TEST_RANK") or "").strip()
    try:
        rank = int(rank_raw) if rank_raw else 0
    except ValueError:
        rank = 0
    if rank > 0:
        score += max(0, 50 - min(rank, 50))
        reasons.append("COMMON_TEST_RANK=" + str(rank))

    return True, score, reasons


def best_french_label(row: dict[str, str] | None) -> str:
    if not row:
        return ""
    preferred = [
        "LONG_COMMON_NAME",
        "LongCommonName",
        "SHORTNAME",
        "ShortName",
        "COMPONENT",
        "Component",
        "LinguisticVariantDisplayName",
        "ConsumerName",
    ]
    for key in preferred:
        value = (row.get(key) or "").strip()
        if value:
            return value
    return ""


def print_row(row: dict[str, str], fr_by_code: dict[str, dict[str, str]], prefix: str):
    code = row.get("LOINC_NUM", "")
    print(prefix + " LOINC=" + code)
    for field in DISPLAY_FIELDS:
        value = (row.get(field) or "").strip()
        if value:
            print("      " + field + ": " + value)
    fr_label = best_french_label(fr_by_code.get(code))
    if fr_label:
        print("      FR: " + fr_label)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument(
        "zipfile",
        nargs="?",
        default=str(Path("~/Downloads/Loinc_2.83.zip").expanduser()),
        help="Chemin du ZIP officiel LOINC 2.83",
    )
    ap.add_argument("--top", type=int, default=12, help="Nombre maximal de candidats par analyse")
    args = ap.parse_args()

    zip_path = Path(args.zipfile).expanduser()
    if not zip_path.exists():
        print("ERREUR: fichier introuvable: " + str(zip_path), file=sys.stderr)
        return 2

    with zipfile.ZipFile(zip_path) as zf:
        names = set(zf.namelist())
        if MAIN_CSV not in names:
            print("ERREUR: " + MAIN_CSV + " absent du ZIP", file=sys.stderr)
            return 3

        reader, text_handle = open_csv_from_zip(zf, MAIN_CSV)
        headers = reader.fieldnames or []

        print("IML LOINC TEST-8 explorer v" + VERSION)
        print("ZIP: " + str(zip_path))
        print("Table principale: " + MAIN_CSV)
        print("Colonnes principales:")
        print("  " + " | ".join(headers))

        broad = defaultdict(list)
        exact = defaultdict(list)

        for row in reader:
            for target, spec in TARGETS.items():
                ok, fit_score, reasons = clinical_fit(row, spec)
                if ok:
                    exact[target].append((fit_score, row, reasons))
                s = broad_score(row, spec["terms"])
                if s > 0:
                    broad[target].append((s, row))
        text_handle.close()

        fr_by_code = {}
        if FR_CSV in names:
            fr_reader, fr_handle = open_csv_from_zip(zf, FR_CSV)
            print("\nVariante française:")
            print("  " + FR_CSV)
            print("Colonnes françaises:")
            print("  " + " | ".join(fr_reader.fieldnames or []))
            for row in fr_reader:
                code = (
                    row.get("LOINC_NUM")
                    or row.get("LoincNumber")
                    or row.get("LOINC")
                    or ""
                ).strip()
                if code:
                    fr_by_code[code] = row
            fr_handle.close()

        print("\n================ SÉLECTION CLINIQUE TEST-8 ================")

        for target, spec in TARGETS.items():
            print("\n### " + target)
            ranked = sorted(
                exact[target],
                key=lambda item: (-item[0], item[1].get("LOINC_NUM", "")),
            )

            if ranked:
                print("  Correspondances conformes au profil clinique demandé:")
                for idx, (fit_score, row, reasons) in enumerate(ranked[: max(1, args.top)], start=1):
                    print_row(row, fr_by_code, "  " + str(idx).rjust(2) + ". fit=" + str(fit_score))
                    if reasons:
                        print("      IML: " + "; ".join(reasons))
            else:
                print("  Aucune correspondance exacte selon COMPONENT/PROPERTY/TIME/SYSTEM/SCALE.")
                print("  Candidats textuels à examiner:")
                fallback = sorted(
                    broad[target],
                    key=lambda item: (-item[0], item[1].get("LOINC_NUM", "")),
                )[: max(1, args.top)]
                for idx, (score, row) in enumerate(fallback, start=1):
                    print_row(row, fr_by_code, "  " + str(idx).rjust(2) + ". score=" + str(score))

    print("\nAucune donnée n'a été envoyée à Neon.")
    print("Étape suivante: valider un code par analyse avant tout import.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
