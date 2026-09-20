#!/usr/bin/env python3
"""
IML Easy Care Legacy Viewer v0.1

Minimal local-only viewer for the preserved Easy Care export in iml_legacy.
Goals:
- browse all imported datasets and rows;
- search Patients.csv by name or Easy Care patient identifier;
- display every legacy dataset row linked by an explicit "Identifiant patient" column;
- never write to PostgreSQL;
- never contact Neon or any network service;
- bind only to 127.0.0.1.

Requires:
- local PostgreSQL database containing iml_legacy (default: iml_workspace)
- psql available in PATH

Run:
    python3 scripts/iml-legacy-viewer.py
Then open:
    http://127.0.0.1:8765
"""

from __future__ import annotations

import argparse
import html
import json
import os
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import subprocess
import sys
from urllib.parse import parse_qs, urlparse

VERSION = "0.1.0"
DEFAULT_HOST = "127.0.0.1"
DEFAULT_PORT = 8765


def sql_literal(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


class DB:
    def __init__(self, database: str):
        self.database = database
        self.import_run_id = self._latest_completed_run()
        if not self.import_run_id:
            raise RuntimeError("Aucun import Legacy terminé n'a été trouvé dans iml_legacy.import_run.")

    def psql(self, sql: str) -> str:
        cp = subprocess.run(
            ["psql", "-X", "-v", "ON_ERROR_STOP=1", "-d", self.database, "-At", "-c", sql],
            text=True,
            capture_output=True,
        )
        if cp.returncode != 0:
            raise RuntimeError(cp.stderr.strip() or cp.stdout.strip())
        return cp.stdout.strip()

    def rows_json(self, sql: str):
        wrapped = (
            "SELECT COALESCE(json_agg(row_to_json(q)),'[]'::json)::text "
            f"FROM ({sql}) q;"
        )
        raw = self.psql(wrapped)
        return json.loads(raw or "[]")

    def _latest_completed_run(self) -> str:
        return self.psql(
            "SELECT import_run_id::text FROM iml_legacy.import_run "
            "WHERE status='completed' ORDER BY completed_at DESC LIMIT 1;"
        )

    def datasets(self):
        return self.rows_json(
            "SELECT relative_path, row_count, column_count "
            "FROM iml_legacy.dataset "
            f"WHERE import_run_id={sql_literal(self.import_run_id)}::uuid "
            "ORDER BY relative_path"
        )

    def dataset_columns(self, dataset_name: str):
        return self.rows_json(
            "SELECT c.ordinal_position, c.source_column_name "
            "FROM iml_legacy.dataset d "
            "JOIN iml_legacy.dataset_column c ON c.dataset_id=d.dataset_id "
            f"WHERE d.import_run_id={sql_literal(self.import_run_id)}::uuid "
            f"AND d.relative_path={sql_literal(dataset_name)} "
            "ORDER BY c.ordinal_position"
        )

    def dataset_page(self, dataset_name: str, offset: int, limit: int):
        columns = self.dataset_columns(dataset_name)
        rows = self.rows_json(
            "SELECT r.source_row_number, r.source_record "
            "FROM iml_legacy.raw_record r "
            "JOIN iml_legacy.dataset d ON d.dataset_id=r.dataset_id "
            f"WHERE d.import_run_id={sql_literal(self.import_run_id)}::uuid "
            f"AND d.relative_path={sql_literal(dataset_name)} "
            "ORDER BY r.source_row_number "
            f"OFFSET {int(offset)} LIMIT {int(limit)}"
        )
        total = self.psql(
            "SELECT row_count::text FROM iml_legacy.dataset "
            f"WHERE import_run_id={sql_literal(self.import_run_id)}::uuid "
            f"AND relative_path={sql_literal(dataset_name)};"
        )
        return {
            "dataset": dataset_name,
            "columns": columns,
            "rows": rows,
            "offset": offset,
            "limit": limit,
            "total": int(total or 0),
        }

    def patient_search(self, query: str, limit: int = 30):
        q = query.strip()
        if not q:
            return []
        pattern = "%" + q + "%"
        # Patients.csv array positions (0-based):
        # 0 Easy Care patient id, 2 first birth given name, 3 given names,
        # 4 used given name, 5 used family name, 6 birth family name.
        return self.rows_json(
            "SELECT "
            "r.source_row_number, "
            "r.source_record->>0 AS patient_id, "
            "r.source_record->>4 AS used_given_name, "
            "r.source_record->>5 AS used_family_name, "
            "r.source_record->>2 AS first_birth_given_name, "
            "r.source_record->>6 AS birth_family_name, "
            "r.source_record->>7 AS birth_date, "
            "r.source_record->>11 AS sex "
            "FROM iml_legacy.raw_record r "
            "JOIN iml_legacy.dataset d ON d.dataset_id=r.dataset_id "
            f"WHERE d.import_run_id={sql_literal(self.import_run_id)}::uuid "
            "AND d.relative_path='Patients.csv' "
            "AND ("
            f"coalesce(r.source_record->>0,'') ILIKE {sql_literal(pattern)} OR "
            f"coalesce(r.source_record->>2,'') ILIKE {sql_literal(pattern)} OR "
            f"coalesce(r.source_record->>3,'') ILIKE {sql_literal(pattern)} OR "
            f"coalesce(r.source_record->>4,'') ILIKE {sql_literal(pattern)} OR "
            f"coalesce(r.source_record->>5,'') ILIKE {sql_literal(pattern)} OR "
            f"coalesce(r.source_record->>6,'') ILIKE {sql_literal(pattern)}"
            ") "
            "ORDER BY r.source_row_number "
            f"LIMIT {int(limit)}"
        )

    def patient_detail(self, patient_id: str):
        # Build the explicit cross-dataset links only from columns literally named
        # "Identifiant patient". No date/content inference is performed.
        refs = self.rows_json(
            "SELECT d.relative_path, c.ordinal_position "
            "FROM iml_legacy.dataset d "
            "JOIN iml_legacy.dataset_column c ON c.dataset_id=d.dataset_id "
            f"WHERE d.import_run_id={sql_literal(self.import_run_id)}::uuid "
            "AND lower(c.source_column_name)=lower('Identifiant patient') "
            "ORDER BY d.relative_path, c.ordinal_position"
        )

        grouped = []
        seen = set()
        for ref in refs:
            dataset = ref["relative_path"]
            ordinal = int(ref["ordinal_position"])
            key = (dataset, ordinal)
            if key in seen:
                continue
            seen.add(key)
            columns = self.dataset_columns(dataset)
            rows = self.rows_json(
                "SELECT r.source_row_number, r.source_record "
                "FROM iml_legacy.raw_record r "
                "JOIN iml_legacy.dataset d ON d.dataset_id=r.dataset_id "
                f"WHERE d.import_run_id={sql_literal(self.import_run_id)}::uuid "
                f"AND d.relative_path={sql_literal(dataset)} "
                f"AND coalesce(r.source_record->>{ordinal - 1},'')={sql_literal(patient_id)} "
                "ORDER BY r.source_row_number "
                "LIMIT 5000"
            )
            if rows:
                grouped.append({
                    "dataset": dataset,
                    "columns": columns,
                    "rows": rows,
                })

        # Ensure Patients.csv itself is present even if metadata changes.
        if not any(x["dataset"] == "Patients.csv" for x in grouped):
            columns = self.dataset_columns("Patients.csv")
            rows = self.rows_json(
                "SELECT r.source_row_number, r.source_record "
                "FROM iml_legacy.raw_record r "
                "JOIN iml_legacy.dataset d ON d.dataset_id=r.dataset_id "
                f"WHERE d.import_run_id={sql_literal(self.import_run_id)}::uuid "
                "AND d.relative_path='Patients.csv' "
                f"AND coalesce(r.source_record->>0,'')={sql_literal(patient_id)} "
                "ORDER BY r.source_row_number"
            )
            if rows:
                grouped.insert(0, {"dataset": "Patients.csv", "columns": columns, "rows": rows})

        return {
            "patient_id": patient_id,
            "groups": grouped,
            "linked_dataset_count": len(grouped),
            "linked_row_count": sum(len(g["rows"]) for g in grouped),
        }


INDEX_HTML = r"""<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>IML — Easy Care Legacy Viewer</title>
<style>
:root{font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#1f2937;background:#f6f7f9}
*{box-sizing:border-box}
body{margin:0}
header{height:60px;background:#fff;border-bottom:1px solid #ddd;display:flex;align-items:center;padding:0 20px;gap:14px;position:sticky;top:0;z-index:5}
header strong{font-size:18px}.badge{font-size:12px;padding:4px 8px;border:1px solid #bbb;border-radius:999px}
main{display:grid;grid-template-columns:280px minmax(0,1fr);height:calc(100vh - 60px)}
aside{background:#fff;border-right:1px solid #ddd;overflow:auto;padding:14px}
section{overflow:auto;padding:18px}
input{width:100%;padding:10px 12px;border:1px solid #bbb;border-radius:8px;font-size:14px}
button{cursor:pointer;border:1px solid #ccc;background:#fff;border-radius:7px;padding:8px 10px}
button:hover{background:#f0f2f5}
.dataset{display:flex;justify-content:space-between;width:100%;text-align:left;margin:4px 0;gap:8px}
.dataset span:last-child{color:#6b7280;font-size:12px}
.card{background:#fff;border:1px solid #ddd;border-radius:10px;padding:14px;margin:0 0 14px}
.muted{color:#6b7280}.small{font-size:12px}
.results button{display:block;width:100%;text-align:left;margin:5px 0}
table{border-collapse:collapse;width:max-content;min-width:100%;font-size:13px;background:#fff}
th,td{border:1px solid #ddd;padding:6px 8px;vertical-align:top;white-space:pre-wrap;max-width:420px}
th{position:sticky;top:0;background:#f3f4f6;z-index:1}
.tablewrap{overflow:auto;max-height:62vh;border:1px solid #ddd;border-radius:8px}
.group h3{display:flex;justify-content:space-between;gap:20px}
.group{margin-bottom:18px}
.rowmeta{color:#6b7280;font-size:11px}
.toolbar{display:flex;gap:8px;align-items:center;margin-bottom:12px}
.toolbar input{max-width:520px}
h1,h2,h3{margin-top:0}
</style>
</head>
<body>
<header>
  <strong>IML — Easy Care Legacy Viewer</strong>
  <span class="badge">LOCAL • lecture seule</span>
  <span id="status" class="muted small"></span>
</header>
<main>
<aside>
  <input id="search" placeholder="Rechercher un patient…" autocomplete="off">
  <div id="searchResults" class="results"></div>
  <hr style="border:0;border-top:1px solid #eee;margin:16px 0">
  <div class="small muted" style="margin-bottom:8px">56 jeux de données Easy Care</div>
  <div id="datasets"></div>
</aside>
<section id="content">
  <div class="card">
    <h2>Visualiseur brut Easy Care</h2>
    <p>Choisissez un jeu de données à gauche, ou recherchez un patient. Cette interface lit directement la couche <code>iml_legacy</code>.</p>
    <p class="muted">Aucune transformation, aucune inférence, aucune écriture, aucun envoi vers Neon.</p>
  </div>
</section>
</main>
<script>
const $=s=>document.querySelector(s);
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
async function api(url){const r=await fetch(url);if(!r.ok)throw new Error(await r.text());return r.json()}
function uniqueHeaders(cols){
  const counts={}; for(const c of cols) counts[c.source_column_name]=(counts[c.source_column_name]||0)+1;
  return cols.map(c=>counts[c.source_column_name]>1?c.source_column_name+" ["+c.ordinal_position+"]":c.source_column_name);
}
function tableHTML(cols, rows){
  const headers=uniqueHeaders(cols);
  let out='<div class="tablewrap"><table><thead><tr><th># source</th>'+headers.map(h=>'<th>'+esc(h)+'</th>').join('')+'</tr></thead><tbody>';
  for(const r of rows){
    const a=Array.isArray(r.source_record)?r.source_record:[];
    out+='<tr><td class="rowmeta">'+esc(r.source_row_number)+'</td>';
    for(let i=0;i<cols.length;i++) out+='<td>'+esc(a[i]??"")+'</td>';
    out+='</tr>';
  }
  return out+'</tbody></table></div>';
}
async function loadDatasets(){
  const ds=await api('/api/datasets');
  $('#datasets').innerHTML=ds.map(d=>'<button class="dataset" onclick="openDataset('+JSON.stringify(d.relative_path).replace(/"/g,'&quot;')+')"><span>'+esc(d.relative_path)+'</span><span>'+d.row_count+'</span></button>').join('');
  $('#status').textContent=ds.length+' datasets';
}
async function openDataset(name, offset=0){
  $('#content').innerHTML='<div class="card">Chargement…</div>';
  const d=await api('/api/dataset?name='+encodeURIComponent(name)+'&offset='+offset+'&limit=100');
  const prev=Math.max(0,d.offset-d.limit), next=d.offset+d.limit;
  $('#content').innerHTML='<div class="card"><h2>'+esc(name)+'</h2><div class="toolbar"><button '+(d.offset===0?'disabled':'')+' onclick="openDataset('+JSON.stringify(name)+','+prev+')">← Précédent</button><button '+(next>=d.total?'disabled':'')+' onclick="openDataset('+JSON.stringify(name)+','+next+')">Suivant →</button><span class="muted small">'+(d.offset+1)+'–'+Math.min(d.offset+d.rows.length,d.total)+' / '+d.total+'</span></div>'+tableHTML(d.columns,d.rows)+'</div>';
}
let timer=null;
$('#search').addEventListener('input',e=>{
  clearTimeout(timer); const q=e.target.value.trim();
  if(!q){$('#searchResults').innerHTML='';return}
  timer=setTimeout(async()=>{
    const rows=await api('/api/patient-search?q='+encodeURIComponent(q));
    $('#searchResults').innerHTML=rows.length?rows.map(r=>{
      const given=r.used_given_name||r.first_birth_given_name||'';
      const fam=r.used_family_name||r.birth_family_name||'';
      const label=(fam+' '+given).trim()||('Patient '+r.patient_id);
      return '<button onclick="openPatient('+JSON.stringify(r.patient_id).replace(/"/g,'&quot;')+')"><strong>'+esc(label)+'</strong><br><span class="small muted">'+esc(r.birth_date||'')+' • '+esc(r.sex||'')+'</span></button>';
    }).join(''):'<div class="small muted" style="padding:8px">Aucun résultat</div>';
  },180);
});
async function openPatient(id){
  $('#content').innerHTML='<div class="card">Chargement du dossier…</div>';
  const d=await api('/api/patient?id='+encodeURIComponent(id));
  let out='<div class="card"><h2>Dossier Easy Care</h2><div class="muted">'+d.linked_dataset_count+' datasets • '+d.linked_row_count+' lignes explicitement reliées par Identifiant patient</div></div>';
  for(const g of d.groups){
    out+='<div class="group card"><h3><span>'+esc(g.dataset)+'</span><span class="muted small">'+g.rows.length+' ligne(s)</span></h3>'+tableHTML(g.columns,g.rows)+'</div>';
  }
  if(!d.groups.length) out+='<div class="card">Aucune donnée reliée trouvée.</div>';
  $('#content').innerHTML=out;
}
loadDatasets().catch(e=>$('#content').innerHTML='<div class="card">'+esc(e.message)+'</div>');
</script>
</body>
</html>
"""


class Handler(BaseHTTPRequestHandler):
    db: DB

    def log_message(self, fmt, *args):
        # Keep terminal quiet except errors.
        return

    def send_json(self, payload, status=200):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def send_html(self, text, status=200):
        body = text.encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        try:
            u = urlparse(self.path)
            q = parse_qs(u.query)
            if u.path == "/":
                return self.send_html(INDEX_HTML)
            if u.path == "/api/datasets":
                return self.send_json(self.db.datasets())
            if u.path == "/api/dataset":
                name = q.get("name", [""])[0]
                if not name:
                    return self.send_json({"error": "dataset name required"}, 400)
                offset = max(0, int(q.get("offset", ["0"])[0]))
                limit = min(200, max(1, int(q.get("limit", ["100"])[0])))
                return self.send_json(self.db.dataset_page(name, offset, limit))
            if u.path == "/api/patient-search":
                query = q.get("q", [""])[0]
                return self.send_json(self.db.patient_search(query))
            if u.path == "/api/patient":
                patient_id = q.get("id", [""])[0]
                if not patient_id:
                    return self.send_json({"error": "patient id required"}, 400)
                return self.send_json(self.db.patient_detail(patient_id))
            return self.send_json({"error": "not found"}, 404)
        except Exception as exc:
            return self.send_json({"error": str(exc)}, 500)


def main() -> int:
    ap = argparse.ArgumentParser(description="IML Easy Care Legacy Viewer, local and read-only")
    ap.add_argument("--db", default=os.getenv("IML_LOCAL_DB", "iml_workspace"))
    ap.add_argument("--host", default=DEFAULT_HOST)
    ap.add_argument("--port", type=int, default=DEFAULT_PORT)
    args = ap.parse_args()

    if args.host not in {"127.0.0.1", "localhost"}:
        print("ERROR: for patient-data safety, this viewer only binds to localhost.", file=sys.stderr)
        return 2

    try:
        db = DB(args.db)
    except Exception as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1

    Handler.db = db
    server = ThreadingHTTPServer((DEFAULT_HOST, args.port), Handler)
    print(f"IML Easy Care Legacy Viewer v{VERSION}")
    print(f"Database: {args.db}")
    print(f"Import run: {db.import_run_id}")
    print(f"Open: http://127.0.0.1:{args.port}")
    print("Local-only • read-only • no Neon")
    print("Stop with Ctrl-C")

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")
    finally:
        server.server_close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
