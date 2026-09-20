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

VERSION = "0.5.0"
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
        """
        Return every row explicitly related to the selected patient.

        Pass 1: datasets carrying an explicit patient identifier.
        Pass 2: datasets carrying an explicit consultation identifier, restricted
        to consultations already belonging to the patient.

        No relationship is inferred from dates, text, names or ordering.
        """
        patient_aliases = (
            "'identifiant patient','identifiant du patient','id patient','patient id'"
        )
        consultation_aliases = (
            "'identifiant consultation','identifiant de consultation',"
            "'identifiant de la consultation','id consultation'"
        )

        patient_refs = self.rows_json(
            "SELECT d.relative_path, c.ordinal_position "
            "FROM iml_legacy.dataset d "
            "JOIN iml_legacy.dataset_column c ON c.dataset_id=d.dataset_id "
            f"WHERE d.import_run_id={sql_literal(self.import_run_id)}::uuid "
            f"AND lower(trim(c.source_column_name)) IN ({patient_aliases}) "
            "ORDER BY d.relative_path, c.ordinal_position"
        )

        grouped = []
        datasets_seen = set()

        for ref in patient_refs:
            dataset = ref["relative_path"]
            ordinal = int(ref["ordinal_position"])
            if dataset in datasets_seen:
                continue
            columns = self.dataset_columns(dataset)
            rows = self.rows_json(
                "SELECT r.source_row_number, r.source_record "
                "FROM iml_legacy.raw_record r "
                "JOIN iml_legacy.dataset d ON d.dataset_id=r.dataset_id "
                f"WHERE d.import_run_id={sql_literal(self.import_run_id)}::uuid "
                f"AND d.relative_path={sql_literal(dataset)} "
                f"AND coalesce(r.source_record->>{ordinal - 1},'')={sql_literal(patient_id)} "
                "ORDER BY r.source_row_number "
                "LIMIT 10000"
            )
            if rows:
                grouped.append({
                    "dataset": dataset,
                    "columns": columns,
                    "rows": rows,
                    "link_kind": "patient",
                })
                datasets_seen.add(dataset)

        # Ensure Patients.csv itself is present.
        if "Patients.csv" not in datasets_seen:
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
                grouped.insert(0, {
                    "dataset": "Patients.csv",
                    "columns": columns,
                    "rows": rows,
                    "link_kind": "patient",
                })
                datasets_seen.add("Patients.csv")

        # Collect explicit consultation identifiers for this patient's consultations.
        consultation_ids = []
        consult_group = next((g for g in grouped if g["dataset"] == "Consultations.csv"), None)
        if consult_group:
            id_ordinal = None
            for col in consult_group["columns"]:
                n = str(col["source_column_name"]).strip().lower()
                if n in {
                    "identifiant consultation",
                    "identifiant de consultation",
                    "identifiant de la consultation",
                    "id consultation",
                }:
                    id_ordinal = int(col["ordinal_position"]) - 1
                    break
            if id_ordinal is not None:
                for row in consult_group["rows"]:
                    record = row.get("source_record") or []
                    if id_ordinal < len(record):
                        value = str(record[id_ordinal] or "").strip()
                        if value and value not in consultation_ids:
                            consultation_ids.append(value)

        # Pull child rows that are explicitly linked to one of those consultations,
        # even when the child dataset itself has no patient identifier.
        if consultation_ids:
            consultation_refs = self.rows_json(
                "SELECT d.relative_path, c.ordinal_position "
                "FROM iml_legacy.dataset d "
                "JOIN iml_legacy.dataset_column c ON c.dataset_id=d.dataset_id "
                f"WHERE d.import_run_id={sql_literal(self.import_run_id)}::uuid "
                f"AND lower(trim(c.source_column_name)) IN ({consultation_aliases}) "
                "ORDER BY d.relative_path, c.ordinal_position"
            )
            id_list = ",".join(sql_literal(v) for v in consultation_ids)
            for ref in consultation_refs:
                dataset = ref["relative_path"]
                if dataset == "Consultations.csv" or dataset in datasets_seen:
                    continue
                ordinal = int(ref["ordinal_position"])
                columns = self.dataset_columns(dataset)
                rows = self.rows_json(
                    "SELECT r.source_row_number, r.source_record "
                    "FROM iml_legacy.raw_record r "
                    "JOIN iml_legacy.dataset d ON d.dataset_id=r.dataset_id "
                    f"WHERE d.import_run_id={sql_literal(self.import_run_id)}::uuid "
                    f"AND d.relative_path={sql_literal(dataset)} "
                    f"AND coalesce(r.source_record->>{ordinal - 1},'') IN ({id_list}) "
                    "ORDER BY r.source_row_number "
                    "LIMIT 10000"
                )
                if rows:
                    grouped.append({
                        "dataset": dataset,
                        "columns": columns,
                        "rows": rows,
                        "link_kind": "consultation",
                    })
                    datasets_seen.add(dataset)

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
<title>IML — Dossier patient</title>
<style>
:root{
  font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
  color:#24345f;background:#f5f7fb;
  --nav:#314782;--accent:#4f7df3;--line:#dfe5f1;--soft:#edf2ff;--text:#24345f;--muted:#7b88a8;
}
*{box-sizing:border-box} body{margin:0;background:#f5f7fb}
button,input{font:inherit}
.topbar{height:58px;background:var(--nav);color:white;display:flex;align-items:center;padding:0 18px;gap:22px;position:sticky;top:0;z-index:20}
.brand{font-weight:800;font-size:20px;letter-spacing:.2px}.topitem{font-size:12px;opacity:.92}.topitem.active{border-bottom:3px solid white;height:58px;display:flex;align-items:center}
.local{margin-left:auto;font-size:11px;border:1px solid rgba(255,255,255,.35);padding:5px 9px;border-radius:999px}
.shell{display:grid;grid-template-columns:320px minmax(520px,1fr) 310px;height:calc(100vh - 58px)}
.left,.right{background:white;overflow:auto}.left{border-right:1px solid var(--line)}.right{border-left:1px solid var(--line);padding:16px}
.lefthead{padding:16px;border-bottom:1px solid var(--line);position:sticky;top:0;background:white;z-index:8}
.search{width:100%;padding:10px 12px;border:1px solid #cfd7e8;border-radius:8px;outline:none}
.search:focus{border-color:var(--accent);box-shadow:0 0 0 3px rgba(79,125,243,.12)}
.results button{display:block;width:100%;text-align:left;border:0;background:white;padding:10px 12px;border-bottom:1px solid #eef1f6;cursor:pointer}.results button:hover{background:#f5f8ff}
.patientbox{padding:16px;border-bottom:1px solid var(--line)}.patientname{font-size:17px;font-weight:800;margin-bottom:8px}.patientmeta{font-size:12px;color:var(--muted);line-height:1.6}
.navgroup{padding:10px 0}.navbtn{display:flex;width:100%;border:0;background:white;color:var(--text);padding:10px 16px;text-align:left;cursor:pointer;justify-content:space-between}.navbtn:hover,.navbtn.active{background:var(--soft);font-weight:700}.count{font-size:11px;color:var(--muted)}
.main{overflow:auto;padding:20px 22px}.titlebar{display:flex;align-items:center;gap:14px;margin-bottom:14px}.titlebar h1{font-size:22px;margin:0}.sub{color:var(--muted);font-size:12px}
.toolbar{display:flex;gap:8px;margin-bottom:14px}.toolbar input{flex:1;padding:10px 12px;border:1px solid #cfd7e8;border-radius:8px}
.card{background:white;border:1px solid var(--line);border-radius:10px;box-shadow:0 2px 8px rgba(38,54,93,.04);margin-bottom:12px}
.cardhead{padding:12px 14px;font-weight:800;border-bottom:1px solid #edf0f5;display:flex;justify-content:space-between;gap:12px}.cardbody{padding:12px 14px}
.timeline{position:relative;padding-left:28px}.timeline:before{content:"";position:absolute;left:9px;top:8px;bottom:8px;width:2px;background:#d7def1}
.event{position:relative;margin-bottom:14px}.event:before{content:"";position:absolute;left:-23px;top:15px;width:8px;height:8px;background:white;border:2px solid #9cb2ec;border-radius:50%}
.eventdate{font-size:12px;color:#556b9d;margin:0 0 6px}.eventtitle{font-weight:800;font-size:13px}.kv{display:grid;grid-template-columns:180px 1fr;gap:7px 12px;font-size:13px}.k{color:var(--muted)}.v{color:#222;white-space:pre-wrap;word-break:break-word}
.panel{background:white;border:1px solid var(--line);border-radius:10px;margin-bottom:14px}.panel h3{font-size:14px;margin:0;padding:12px 14px;border-bottom:1px solid var(--line)}.panel .body{padding:12px 14px;font-size:13px}.empty{color:var(--muted);font-size:12px}
.pills{display:flex;flex-wrap:wrap;gap:7px}.pill{background:var(--soft);padding:6px 9px;border-radius:999px;font-size:12px}
.rawtoggle{border:1px solid #cfd7e8;background:white;border-radius:7px;padding:7px 10px;cursor:pointer}
table{border-collapse:collapse;width:max-content;min-width:100%;font-size:12px;background:white}th,td{border:1px solid #e3e7ef;padding:6px 8px;vertical-align:top;white-space:pre-wrap;max-width:360px}th{background:#f4f6fa;position:sticky;top:0}.tablewrap{overflow:auto;max-height:60vh}.hidden{display:none}
@media(max-width:1050px){.shell{grid-template-columns:280px 1fr}.right{display:none}}
</style>
</head>
<body>
<div class="topbar">
  <div class="brand">IML</div>
  <div class="topitem">ACCUEIL</div><div class="topitem">AGENDA</div><div class="topitem active">PATIENTS</div>
  <div class="topitem">CONTACTS</div><div class="topitem">MESSAGERIE</div><div class="topitem">GESTION</div>
  <button id="modeClinical" class="rawtoggle" onclick="setMode('clinical')">CLINIQUE</button>
  <button id="modeTechnical" class="rawtoggle" onclick="setMode('technical')">TECHNIQUE CONSULTATION</button>
  <div class="local">LOCAL • lecture seule</div>
</div>
<div class="shell">
  <aside class="left">
    <div class="lefthead">
      <input id="search" class="search" placeholder="Rechercher un patient…" autocomplete="off">
      <div id="searchResults" class="results"></div>
    </div>
    <div id="patientSummary" class="patientbox">
      <div class="patientname">Aucun patient sélectionné</div>
      <div class="patientmeta">Recherchez un patient pour ouvrir son dossier.</div>
    </div>
    <div id="patientNav" class="navgroup"></div>
  </aside>

  <main class="main" id="mainContent">
    <div class="titlebar"><h1>Dossier patient</h1></div>
    <div class="card"><div class="cardbody">Cette vue rassemble les informations Easy Care importées, sans les modifier.</div></div>
  </main>

  <aside class="right">
    <div class="panel"><h3>Résumé</h3><div id="rightSummary" class="body empty">Aucun patient sélectionné</div></div>
    <div class="panel"><h3>Données disponibles</h3><div id="rightCounts" class="body empty">Aucune donnée</div></div>
    <div class="panel"><h3>Provenance</h3><div class="body"><span class="pill">Easy Care</span> <span class="pill">iml_legacy</span><p class="empty">Aucune inférence automatique dans cette vue.</p></div></div>
  </aside>
</div>

<script>
const $=s=>document.querySelector(s);
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
async function api(url){const r=await fetch(url);if(!r.ok)throw new Error(await r.text());return r.json()}
let current=null,currentGroup=null,currentMode="clinical",currentConsultationId="";

function objFrom(group,row){
  const o={};
  (group.columns||[]).forEach((c,i)=>{
    const key=c.source_column_name || ('col_'+c.ordinal_position);
    if(o[key]===undefined)o[key]=(row.source_record||[])[i]??"";
    else o[key+' ['+c.ordinal_position+']']=(row.source_record||[])[i]??"";
  });
  return o;
}
function val(o,...names){for(const n of names){if(o[n]!==undefined && String(o[n]).trim()!=="")return o[n]}return""}
function classify(name){
  const n=name.toLowerCase();
  if(n==="patients.csv")return"Identité";

  // Specific child datasets must be classified before their parent prefix.
  if(n.includes("document"))return"Documents";
  if(n.includes("ordonnance")||n.includes("prescription"))return"Prescriptions";
  if(n.includes("note"))return"Notes";
  if(n.includes("mesure"))return"Mesures";
  if(n.includes("patholog")||n.includes("antéc")||n.includes("anteced")||n.includes("problème")||n.includes("probleme")||n.includes("affection"))return"Antécédents";
  if(n.includes("allerg"))return"Allergies";
  if(n.includes("correspond")||n.includes("entourage"))return"Correspondants";
  if(n.includes("paiement")||n.includes("factur"))return"Administratif";

  // Only the consultation dataset itself is a consultation.
  if(n==="consultations.csv")return"Consultations";

  return"Autres données";
}
function patientObject(d){
  const g=d.groups.find(x=>x.dataset==="Patients.csv");
  return g&&g.rows.length?objFrom(g,g.rows[0]):{};
}
function displayName(p){
  const given=val(p,"Prénom utilisé","Premier prénom de naissance","Prénoms");
  const fam=val(p,"Nom utilisé","Nom de naissance");
  return [given,fam].filter(Boolean).join(" ")||"Patient";
}
function patientHeader(d){
  const p=patientObject(d);
  const birth=val(p,"Date de naissance");
  const sex=val(p,"Sexe")||"non renseigné";
  const addr=val(p,"Adresse");
  const doctor=val(p,"Identifiant médecin traitant (contact)");
  $('#patientSummary').innerHTML='<div class="patientname">'+esc(displayName(p))+'</div>'+
    '<div class="patientmeta">'+(birth?'Né(e) le '+esc(birth)+'<br>':'')+
    'Sexe : '+esc(sex)+(doctor?'<br>Médecin traitant : '+esc(doctor):'')+(addr?'<br>'+esc(addr):'')+'</div>';
  $('#rightSummary').innerHTML='<strong>'+esc(displayName(p))+'</strong><br><span class="sub">'+esc(birth||'Date de naissance non renseignée')+'</span>';
}
function buildNav(d){
  const cats={};
  for(const g of d.groups){const c=classify(g.dataset);cats[c]=(cats[c]||0)+g.rows.length}
  const order=["Consultations","Antécédents","Allergies","Notes","Mesures","Prescriptions","Documents","Correspondants","Identité","Autres données"];
  $('#patientNav').innerHTML=order.filter(c=>cats[c]).map(c=>'<button class="navbtn" onclick="showCategory('+JSON.stringify(c).replace(/"/g,'&quot;')+')"><span>'+esc(c)+'</span><span class="count">'+cats[c]+'</span></button>').join('');
  $('#rightCounts').innerHTML='<div class="pills">'+order.filter(c=>cats[c]).map(c=>'<span class="pill">'+esc(c)+' '+cats[c]+'</span>').join('')+'</div>';
}
function fieldsHTML(o){
  const entries=Object.entries(o).filter(([k,v])=>String(v??"").trim()!=="");
  if(!entries.length)return'<div class="empty">Aucune valeur renseignée.</div>';
  return '<div class="kv">'+entries.map(([k,v])=>'<div class="k">'+esc(k)+'</div><div class="v">'+esc(v)+'</div>').join('')+'</div>';
}
function consultationDate(group,row){
  const o=objFrom(group,row);
  return val(o,"Date de consultation","Date consultation","Date","Début","Date début","Date creation","Date création")||"";
}
function consultationId(group,row){
  const o=objFrom(group,row);
  return val(o,"Identifiant consultation","Identifiant de consultation","Identifiant de la consultation","ID consultation");
}
function clinicalTextHTML(o){
  const wanted=Object.entries(o).filter(([k,v])=>{
    if(!String(v??"").trim())return false;
    const n=k.toLowerCase();
    if(/^identifiant\b/.test(n))return false;
    return ["texte","contenu","observation","examen","histoire","anamn","conclusion",
      "diagnostic","commentaire","note","compte rendu","résultat","resultat","conduite",
      "traitement","prescription","motif"].some(x=>n.includes(x));
  });
  if(!wanted.length)return "";
  return '<div style="display:grid;gap:10px">'+wanted.map(([k,v])=>
    '<div><div class="k" style="margin-bottom:3px">'+esc(k)+'</div><div class="v" style="font-size:14px;line-height:1.5">'+esc(v)+'</div></div>'
  ).join('')+'</div>';
}
function consultationChildrenHTML(consultId){
  if(!current||!consultId)return"";
  const blocks=[];
  for(const g of current.groups){
    if(g.dataset==="Consultations.csv")continue;
    const cat=classify(g.dataset);
    if(["Administratif","Identité","Autres données"].includes(cat))continue;
    const rows=g.rows.filter(r=>consultationId(g,r)===consultId);
    if(!rows.length)continue;
    const rendered=rows.map(r=>{
      const o=objFrom(g,r);
      const txt=clinicalTextHTML(o);
      const clean=Object.fromEntries(Object.entries(o).filter(([k,v])=>{
        if(!String(v??"").trim())return false;
        const n=k.toLowerCase();
        return !/^identifiant\b/.test(n) && !n.includes("fichier") && !n.includes("nom patient") && !n.includes("prénom patient");
      }));
      return '<div style="padding:8px 0;border-top:1px solid #eef1f6">'+(txt||fieldsHTML(clean))+'</div>';
    }).join('');
    blocks.push('<details open style="margin-top:10px"><summary><strong>'+esc(cat)+
      '</strong> <span class="sub">('+rows.length+')</span></summary>'+rendered+'</details>');
  }
  return blocks.join('');
}
function consultationCard(group,row){
  const o=objFrom(group,row);
  const date=consultationDate(group,row);
  const motif=val(o,"Motif de la consultation","Motif","Titre","Objet","Libellé")||"Consultation sans motif";
  const doctor=val(o,"Lieu d'activité","Médecin","Praticien","Professionnel");
  const technical=Object.entries(o).filter(([k,v])=>String(v??"").trim()!=="");
  const visible=technical.filter(([k])=>!/^Identifiant\b/i.test(k));
  const compactObj=Object.fromEntries(visible);
  const text=clinicalTextHTML(o);
  const cid=consultationId(group,row);
  const children=consultationChildrenHTML(cid);
  const mainClinical=text||fieldsHTML(compactObj);
  const openAction="currentConsultationId="+JSON.stringify(cid)+";this.parentElement.nextElementSibling.classList.toggle('hidden')";
  return '<div class="event"><div class="eventdate">'+esc(date||('Ligne source '+row.source_row_number))+(doctor?' • '+esc(doctor):'')+'</div><div class="card"><div class="cardhead"><span>'+esc(motif)+'</span><button class="rawtoggle" onclick='+JSON.stringify(openAction)+'>Ouvrir</button></div><div class="cardbody hidden">'+mainClinical+children+'</div></div></div>';
}
function showCategory(cat){
  if(!current)return;
  currentGroup=cat;
  const groups=current.groups.filter(g=>classify(g.dataset)===cat);
  document.querySelectorAll('.navbtn').forEach(b=>b.classList.toggle('active',b.textContent.trim().startsWith(cat)));
  let body='<div class="titlebar"><div><h1>'+esc(cat)+'</h1><div class="sub">'+groups.reduce((n,g)=>n+g.rows.length,0)+' élément(s) importé(s)</div></div></div>';
  if(cat==="Consultations"){
    const items=groups.flatMap(g=>g.rows.map(r=>({g,r,date:consultationDate(g,r)})));
    items.sort((a,b)=>String(b.date||"").localeCompare(String(a.date||"")));
    body+='<div class="timeline">'+items.map(x=>consultationCard(x.g,x.r)).join('')+'</div>';
  }else{
    for(const g of groups){
      body+='<div class="card"><div class="cardhead"><span>'+esc(g.dataset)+'</span><span class="sub">'+g.rows.length+' ligne(s)</span></div><div class="cardbody">';
      g.rows.slice(0,250).forEach((r,i)=>{body+='<div style="padding:9px 0;'+(i?'border-top:1px solid #eef1f6':'')+'">'+fieldsHTML(objFrom(g,r))+'</div>'});
      if(g.rows.length>250)body+='<div class="empty">Affichage limité aux 250 premières lignes de ce jeu.</div>';
      body+='</div></div>';
    }
  }
  if(!groups.length)body+='<div class="card"><div class="cardbody empty">Aucune donnée dans cette rubrique.</div></div>';
  $('#mainContent').innerHTML=body;
}
function showOverview(){
  if(!current)return;
  const cats={};
  for(const g of current.groups){const c=classify(g.dataset);cats[c]=(cats[c]||0)+g.rows.length}
  let out='<div class="titlebar"><div><h1>Historique médical</h1><div class="sub">Vue de consultation issue de l\'export Easy Care</div></div></div>';
  const consult=current.groups.filter(g=>classify(g.dataset)==="Consultations");
  if(consult.length){
    const items=consult.flatMap(g=>g.rows.map(r=>({g,r,date:consultationDate(g,r)})));
    items.sort((a,b)=>String(b.date||"").localeCompare(String(a.date||"")));
    out+='<div class="timeline">'+items.slice(0,20).map(x=>consultationCard(x.g,x.r)).join('')+'</div>';
  }else{
    out+='<div class="card"><div class="cardbody empty">Aucune consultation explicitement reliée à ce patient dans l\'export.</div></div>';
  }
  $('#mainContent').innerHTML=out;
}

function technicalRecordHTML(group,row){
  const o=objFrom(group,row);
  return '<div class="card"><div class="cardhead"><span>'+esc(group.dataset)+'</span><span class="sub">ligne source '+esc(row.source_row_number)+'</span></div><div class="cardbody">'+fieldsHTML(o)+'</div></div>';
}
function technicalConsultationHTML(consultId){
  if(!current)return '<div class="card"><div class="cardbody empty">Aucun patient sélectionné.</div></div>';
  const cg=current.groups.find(g=>g.dataset==="Consultations.csv");
  if(!cg)return '<div class="card"><div class="cardbody empty">Aucune consultation trouvée.</div></div>';
  const row=cg.rows.find(r=>consultationId(cg,r)===consultId) || cg.rows[0];
  if(!row)return '<div class="card"><div class="cardbody empty">Aucune consultation trouvée.</div></div>';
  const cid=consultationId(cg,row);
  currentConsultationId=cid;
  const o=objFrom(cg,row);
  const date=consultationDate(cg,row);
  const motif=val(o,"Motif de la consultation","Motif","Titre","Objet","Libellé")||"Consultation sans motif";
  let out='<div class="titlebar"><div><h1>Technique consultation</h1><div class="sub">'+esc(date)+' • '+esc(motif)+'</div></div></div>';
  out+=technicalRecordHTML(cg,row);
  for(const g of current.groups){
    if(g.dataset==="Consultations.csv")continue;
    const rows=g.rows.filter(r=>consultationId(g,r)===cid);
    for(const r of rows)out+=technicalRecordHTML(g,r);
  }
  return out;
}
function buildTechnicalNav(){
  if(!current){$('#patientNav').innerHTML="";return}
  const cg=current.groups.find(g=>g.dataset==="Consultations.csv");
  if(!cg){$('#patientNav').innerHTML='<div class="empty" style="padding:12px">Aucune consultation</div>';return}
  const items=cg.rows.map(r=>({r,date:consultationDate(cg,r),id:consultationId(cg,r),o:objFrom(cg,r)}));
  items.sort((a,b)=>String(b.date||"").localeCompare(String(a.date||"")));
  $('#patientNav').innerHTML=items.map(x=>{
    const motif=val(x.o,"Motif de la consultation","Motif","Titre","Objet","Libellé")||"Sans motif";
    return '<button class="navbtn" onclick="showTechnicalConsultation('+JSON.stringify(x.id).replace(/"/g,'&quot;')+')"><span>'+esc(x.date||"Sans date")+'<br><span class="sub">'+esc(motif)+'</span></span></button>';
  }).join('');
  if(!currentConsultationId && items.length)currentConsultationId=items[0].id;
}
function showTechnicalConsultation(id){
  currentConsultationId=id;
  $('#mainContent').innerHTML=technicalConsultationHTML(id);
}
async function setMode(mode){
  currentMode=mode;
  $('#modeClinical').style.fontWeight=mode==="clinical"?"800":"400";
  $('#modeTechnical').style.fontWeight=mode==="technical"?"800":"400";
  $('#search').placeholder="Rechercher un patient…";
  $('#patientSummary').style.display="";
  if(mode==="clinical"){
    if(current){patientHeader(current);buildNav(current);showOverview();}
    else{
      $('#patientNav').innerHTML="";
      $('#mainContent').innerHTML='<div class="titlebar"><h1>Dossier patient</h1></div><div class="card"><div class="cardbody">Recherchez un patient pour ouvrir son dossier clinique.</div></div>';
    }
  }else{
    if(current){
      patientHeader(current);
      buildTechnicalNav();
      $('#mainContent').innerHTML=technicalConsultationHTML(currentConsultationId);
      $('#rightCounts').innerHTML='<div class="pills"><span class="pill">Sources consultation</span><span class="pill">Identifiants</span><span class="pill">Paiements</span><span class="pill">Documents</span></div>';
    }else{
      $('#patientNav').innerHTML="";
      $('#mainContent').innerHTML='<div class="titlebar"><h1>Technique consultation</h1></div><div class="card"><div class="cardbody">Sélectionnez d’abord un patient. La vue technique restera centrée sur ses consultations.</div></div>';
    }
  }
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
      const label=(given+' '+fam).trim()||('Patient '+r.patient_id);
      return '<button onclick="openPatient('+JSON.stringify(r.patient_id).replace(/"/g,'&quot;')+')"><strong>'+esc(label)+'</strong><br><span class="sub">'+esc(r.birth_date||'')+' • '+esc(r.sex||'')+'</span></button>';
    }).join(''):'<div class="empty" style="padding:10px">Aucun résultat</div>';
  },180);
});
async function openPatient(id){
  $('#mainContent').innerHTML='<div class="card"><div class="cardbody">Chargement du dossier…</div></div>';
  current=await api('/api/patient?id='+encodeURIComponent(id));
  currentConsultationId="";
  $('#patientSummary').style.display="";
  patientHeader(current); $('#searchResults').innerHTML='';
  if(currentMode==="technical"){
    buildTechnicalNav();
    $('#mainContent').innerHTML=technicalConsultationHTML(currentConsultationId);
  }else{
    buildNav(current);
    showOverview();
  }
}
setMode("clinical");
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
