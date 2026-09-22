#!/usr/bin/env python3
from __future__ import annotations
import argparse, csv, io, os, shutil, subprocess, sys
from pathlib import Path

def psql_base(db):
    return ["psql","-X","-v","ON_ERROR_STOP=1","-d",db]

def query_csv(db, sql):
    out = subprocess.run(psql_base(db)+["-c", f"COPY ({sql}) TO STDOUT WITH (FORMAT csv, HEADER true)"],
                         check=True, text=True, stdout=subprocess.PIPE).stdout
    return list(csv.DictReader(io.StringIO(out)))

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--db", default=os.environ.get("IML_LOCAL_DB","iml_workspace"))
    ap.add_argument("--out", default=str(Path("~/Documents/IML_GP_CATALOG_REVIEW.md").expanduser()))
    args = ap.parse_args()
    if not shutil.which("psql"):
        print("ERREUR: psql introuvable", file=sys.stderr); return 2

    rows = query_csv(args.db, """
      SELECT i.catalog_code, i.group_code, i.tier, i.label_fr, i.mapping_status,
             coalesce(i.known_loinc_hint,'') AS hint,
             coalesce(c.rank_order::text,'') AS candidate_rank,
             coalesce(c.loinc_num,'') AS loinc_num,
             coalesce(c.score::text,'') AS score,
             coalesce(c.candidate_label,'') AS candidate_label,
             coalesce(c.system_axis,'') AS system_axis,
             coalesce(c.method_typ,'') AS method_typ,
             coalesce(c.class_code,'') AS class_code,
             coalesce(c.common_test_rank::text,'') AS common_test_rank
      FROM iml_loinc_workbench.gp_catalog_item i
      LEFT JOIN iml_loinc_workbench.gp_catalog_candidate c
        ON c.catalog_code=i.catalog_code AND c.rank_order <= 3
      WHERE i.mapping_status IN ('AMBIGUOUS','ABSENT')
      ORDER BY i.group_code, i.tier, i.label_fr, c.rank_order
    """)

    by_item = {}
    for r in rows:
        by_item.setdefault(r["catalog_code"], {"meta":r, "cand":[]})
        if r["loinc_num"]:
            by_item[r["catalog_code"]]["cand"].append(r)

    out = Path(args.out).expanduser()
    out.parent.mkdir(parents=True, exist_ok=True)
    lines = ["# Revue GP ↔ LOINC 2.83", "",
             "Uniquement les entrées encore ambiguës ou sans candidat. Aucun choix n'est validé automatiquement.", ""]

    groups = {}
    for code, obj in by_item.items():
        groups.setdefault(obj["meta"]["group_code"], []).append(obj)

    for group, items in sorted(groups.items()):
        lines += [f"## {group}", ""]
        for obj in items:
            m = obj["meta"]
            lines += [f"### {m['label_fr']}  \`{m['catalog_code']}\`",
                      f"- Niveau: **{m['tier']}**",
                      f"- Statut: **{m['mapping_status']}**",
                      f"- Hint: \`{m['hint'] or '—'}\`"]
            if not obj["cand"]:
                lines += ["- Candidats: aucun trouvé par le moteur", ""]
            else:
                lines += ["", "|#|LOINC|Score|Libellé|Système|Méthode|Classe|Rang|",
                          "|---:|---|---:|---|---|---|---|---:|"]
                for c in obj["cand"]:
                    def esc(x): return (x or "").replace("|","\\\\|")
                    lines.append(f"|{c['candidate_rank']}|{c['loinc_num']}|{c['score']}|{esc(c['candidate_label'])}|{esc(c['system_axis'])}|{esc(c['method_typ'])}|{esc(c['class_code'])}|{c['common_test_rank']}|")
                lines.append("")
    out.write_text("\\n".join(lines)+"\\n", encoding="utf-8")
    print(f"Entrées à revoir: {len(by_item)}")
    print(f"Rapport: {out}")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
