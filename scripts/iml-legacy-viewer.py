#!/usr/bin/env python3
"""
IML Easy Care Legacy Viewer v0.1

Minimal local-only viewer for the preserved Easy Care export in iml_legacy.
Goals:
- browse all imported datasets and rows;
- search Patients.csv by name or Easy Care patient identifier;
- display every legacy dataset row linked by an explicit "Identifiant patient" column;
- preserve iml_legacy as immutable;
- allow new local consultations only in iml_workspace_edit;
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
import uuid
from urllib.parse import parse_qs, urlparse

VERSION = "1.1.0"
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

    def workspace_ready(self) -> bool:
        return self.psql(
            "SELECT CASE WHEN to_regclass('iml_workspace_edit.consultation') IS NULL "
            "THEN 'f' ELSE 't' END;"
        ) == "t"

    def local_consultations(self, patient_id: str):
        if not self.workspace_ready():
            return []
        return self.rows_json(
            "SELECT consultation_id::text, patient_legacy_id, consultation_date::text, "
            "location, motif, examen_clinique, conduite_a_tenir, sections, status, "
            "created_at::text, updated_at::text "
            "FROM iml_workspace_edit.consultation "
            f"WHERE patient_legacy_id={sql_literal(patient_id)} "
            "ORDER BY consultation_date DESC, created_at DESC"
        )

    def save_local_consultation(self, patient_id: str, payload: dict):
        if not self.workspace_ready():
            raise RuntimeError(
                "Workspace éditable absent. Appliquer db/local/legacy/003_iml_workspace_edit_v1.sql."
            )
        consultation_id = str(uuid.uuid4())
        consultation_date = str(payload.get("consultation_date") or "").strip()
        if not consultation_date:
            raise ValueError("La date de consultation est obligatoire.")
        location = str(payload.get("location") or "").strip()
        motif = str(payload.get("motif") or "").strip()
        examen = str(payload.get("examen_clinique") or "").strip()
        conduite = str(payload.get("conduite_a_tenir") or "").strip()
        sections = payload.get("sections") or {}
        if not isinstance(sections, dict):
            raise ValueError("sections doit être un objet JSON.")
        sections_json = json.dumps(sections, ensure_ascii=False)
        self.psql(
            "INSERT INTO iml_workspace_edit.consultation "
            "(consultation_id, patient_legacy_id, consultation_date, location, motif, "
            "examen_clinique, conduite_a_tenir, sections, status) VALUES ("
            f"{sql_literal(consultation_id)}::uuid,"
            f"{sql_literal(patient_id)},"
            f"{sql_literal(consultation_date)}::date,"
            f"{sql_literal(location)},"
            f"{sql_literal(motif)},"
            f"{sql_literal(examen)},"
            f"{sql_literal(conduite)},"
            f"{sql_literal(sections_json)}::jsonb,"
            "'DRAFT');"
        )
        return {"consultation_id": consultation_id, "status": "DRAFT"}

    def structured_workspace_ready(self) -> bool:
        return self.psql(
            "SELECT CASE WHEN to_regclass('iml_workspace_edit.patient') IS NULL "
            "THEN 'f' ELSE 't' END;"
        ) == "t"

    def workspace_patient(self, patient_id: str):
        if not self.structured_workspace_ready():
            return None
        rows = self.rows_json(
            "SELECT patient_id, given_name, family_name, birth_date::text, "
            "sex_at_birth, fictional, notes "
            "FROM iml_workspace_edit.patient "
            f"WHERE patient_id={sql_literal(patient_id)} LIMIT 1"
        )
        return rows[0] if rows else None

    def workspace_bundle(self, patient_id: str):
        if not self.structured_workspace_ready():
            return {"diagnoses": [], "medications": [], "vitals": [], "labs": [], "lab_orders": []}
        diagnoses = self.rows_json(
            "SELECT diagnosis_id::text, label, coding_system, code, status, important, "
            "onset_date::text, comment FROM iml_workspace_edit.diagnosis "
            f"WHERE patient_id={sql_literal(patient_id)} ORDER BY important DESC, label"
        )
        medications = self.rows_json(
            "SELECT medication_statement_id::text, substance, atc_code, strength_value, "
            "strength_unit, dose_text, frequency_text, route, treatment_group, active, comment "
            "FROM iml_workspace_edit.medication_statement "
            f"WHERE patient_id={sql_literal(patient_id)} ORDER BY active DESC, treatment_group, substance"
        )
        vitals = self.rows_json(
            "SELECT observation_id::text, observed_at::text, observation_type, systolic, diastolic, "
            "value, unit, comment FROM iml_workspace_edit.vital_observation "
            f"WHERE patient_id={sql_literal(patient_id)} ORDER BY observed_at DESC"
        )
        labs = self.rows_json(
            "SELECT lab_result_id::text, result_date::text, panel, analyte, value, value_text, "
            "unit, reference_range, flag FROM iml_workspace_edit.lab_result "
            f"WHERE patient_id={sql_literal(patient_id)} ORDER BY result_date DESC, panel, analyte"
        )
        lab_orders = self.rows_json(
            "SELECT lab_order_id::text, consultation_id::text, ordered_date::text, panel, analyte, "
            "status, comment FROM iml_workspace_edit.lab_order "
            f"WHERE patient_id={sql_literal(patient_id)} ORDER BY ordered_date DESC, panel, analyte"
        )
        return {
            "diagnoses": diagnoses,
            "medications": medications,
            "vitals": vitals,
            "labs": labs,
            "lab_orders": lab_orders,
        }

    def patient_search(self, query: str, limit: int = 30):
        q = query.strip()
        if not q:
            return []
        pattern = "%" + q + "%"
        out = []
        if self.structured_workspace_ready():
            out.extend(self.rows_json(
                "SELECT 0 AS source_row_number, patient_id, "
                "coalesce(given_name,'') AS used_given_name, "
                "coalesce(family_name,'') AS used_family_name, "
                "coalesce(given_name,'') AS first_birth_given_name, "
                "coalesce(family_name,'') AS birth_family_name, "
                "coalesce(birth_date::text,'') AS birth_date, "
                "coalesce(sex_at_birth,'') AS sex "
                "FROM iml_workspace_edit.patient WHERE "
                f"patient_id ILIKE {sql_literal(pattern)} OR "
                f"coalesce(given_name,'') ILIKE {sql_literal(pattern)} OR "
                f"coalesce(family_name,'') ILIKE {sql_literal(pattern)} "
                "ORDER BY family_name, given_name "
                f"LIMIT {int(limit)}"
            ))
        remaining = max(0, int(limit) - len(out))
        if remaining:
            out.extend(self.rows_json(
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
                ") ORDER BY r.source_row_number "
                f"LIMIT {remaining}"
            ))
        return out

    def patient_detail(self, patient_id: str):
        """
        Return every row explicitly related to the selected patient.

        Pass 1: datasets carrying an explicit patient identifier.
        Pass 2: datasets carrying an explicit consultation identifier, restricted
        to consultations already belonging to the patient.

        No relationship is inferred from dates, text, names or ordering.
        """
        wp = self.workspace_patient(patient_id)
        if wp:
            cols = [
                {"ordinal_position": 1, "source_column_name": "Identifiant patient"},
                {"ordinal_position": 2, "source_column_name": "Prénom utilisé"},
                {"ordinal_position": 3, "source_column_name": "Nom utilisé"},
                {"ordinal_position": 4, "source_column_name": "Date de naissance"},
                {"ordinal_position": 5, "source_column_name": "Sexe"},
                {"ordinal_position": 6, "source_column_name": "Notes"},
            ]
            row = {
                "source_row_number": 0,
                "source_record": [
                    wp.get("patient_id") or "",
                    wp.get("given_name") or "",
                    wp.get("family_name") or "",
                    wp.get("birth_date") or "",
                    wp.get("sex_at_birth") or "",
                    wp.get("notes") or "",
                ],
            }
            return {
                "patient_id": patient_id,
                "groups": [{
                    "dataset": "Patients.csv",
                    "columns": cols,
                    "rows": [row],
                    "link_kind": "workspace",
                }],
                "linked_dataset_count": 1,
                "linked_row_count": 1,
                "workspace_patient": True,
                "workspace": self.workspace_bundle(patient_id),
            }
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

        # Follow additional explicit Easy Care foreign-key chains so that
        # clinically useful child rows are not lost merely because they do not
        # repeat Identifiant patient.
        def group_for(name):
            return next((g for g in grouped if g["dataset"] == name), None)

        def collect_values(group, candidate_columns):
            if not group:
                return []
            wanted = {x.strip().lower() for x in candidate_columns}
            idx = None
            for col in group["columns"]:
                if str(col["source_column_name"]).strip().lower() in wanted:
                    idx = int(col["ordinal_position"]) - 1
                    break
            if idx is None:
                return []
            out = []
            for row in group["rows"]:
                record = row.get("source_record") or []
                if idx < len(record):
                    value = str(record[idx] or "").strip()
                    if value and value not in out:
                        out.append(value)
            return out

        def append_dataset_by_values(dataset, candidate_columns, values, link_kind):
            if not values or dataset in datasets_seen:
                return
            columns = self.dataset_columns(dataset)
            if not columns:
                return
            wanted = {x.strip().lower() for x in candidate_columns}
            ordinal = None
            for col in columns:
                if str(col["source_column_name"]).strip().lower() in wanted:
                    ordinal = int(col["ordinal_position"])
                    break
            if ordinal is None:
                return
            value_list = ",".join(sql_literal(v) for v in values)
            rows = self.rows_json(
                "SELECT r.source_row_number, r.source_record "
                "FROM iml_legacy.raw_record r "
                "JOIN iml_legacy.dataset d ON d.dataset_id=r.dataset_id "
                f"WHERE d.import_run_id={sql_literal(self.import_run_id)}::uuid "
                f"AND d.relative_path={sql_literal(dataset)} "
                f"AND coalesce(r.source_record->>{ordinal - 1},'') IN ({value_list}) "
                "ORDER BY r.source_row_number LIMIT 10000"
            )
            if rows:
                grouped.append({
                    "dataset": dataset,
                    "columns": columns,
                    "rows": rows,
                    "link_kind": link_kind,
                })
                datasets_seen.add(dataset)

        # Ordonnance -> prescription lines.
        ordonnance_ids = collect_values(
            group_for("Ordonnances.csv"),
            {"Identifiant ordonnance", "Identifiant de l'ordonnance"},
        )
        for dataset in [
            "Ordonnances - Lignes de prescription - Actes.csv",
            "Ordonnances - Lignes de prescription - Médicaments conditionnés.csv",
            "Ordonnances - Lignes de prescription - Médicaments sous forme de spécialité virtuelle.csv",
            "Ordonnances - Lignes de prescription - Parapharmacie.csv",
            "Ordonnances - Lignes de prescription - Préparations magistrales.csv",
            "Ordonnances - Lignes de prescription - Produits Prestations libres.csv",
            "Ordonnances - Lignes de prescription - Produits Prestations LPP.csv",
        ]:
            append_dataset_by_values(
                dataset,
                {"Identifiant ordonnance", "Identifiant de l'ordonnance"},
                ordonnance_ids,
                "ordonnance",
            )

        # Patient keyword relation -> keyword definition.
        keyword_ids = collect_values(
            group_for("Patients - Relations entre Patients et Mots-clés.csv"),
            {"Identifiant mot-clé patient"},
        )
        append_dataset_by_values(
            "Patients - Mots-clés.csv",
            {"Identifiant mot-clé patient"},
            keyword_ids,
            "patient_keyword",
        )

        # Entourage -> addresses and coordinates.
        entourage_ids = collect_values(
            group_for("Entourage patient.csv"),
            {"Identifiant personne de l'entourage"},
        )
        append_dataset_by_values(
            "Entourage patient - Adresses.csv",
            {"Identifiant personne de l'entourage"},
            entourage_ids,
            "entourage",
        )
        append_dataset_by_values(
            "Entourage patient - Coordonnées.csv",
            {"Identifiant personne de l'entourage"},
            entourage_ids,
            "entourage",
        )

        # Patient correspondents -> contact master + contact coordinates.
        contact_ids = collect_values(
            group_for("Patients - Correspondants.csv"),
            {"Identifiant contact"},
        )
        append_dataset_by_values(
            "Contacts.csv",
            {"Identifiant contact"},
            contact_ids,
            "correspondant",
        )
        append_dataset_by_values(
            "Contacts - Coordonnées.csv",
            {"Identifiant contact"},
            contact_ids,
            "correspondant",
        )

        # Female-specific medical information is referenced from Patients.csv
        # instead of carrying Identifiant patient itself.
        female_info_ids = collect_values(
            group_for("Patients.csv"),
            {"Identifiant informations médicales spécifiques aux femmes"},
        )
        append_dataset_by_values(
            "Patients - Informations médicales spécifiques aux patients de sexe féminin.csv",
            {"Identifiant informations médicales"},
            female_info_ids,
            "patient_medical_info",
        )

        # Consultation location -> location details, useful in technical view.
        location_ids = collect_values(
            group_for("Consultations.csv"),
            {"Identifiant du lieu d'activité", "Identifiant lieu d'activité"},
        )
        append_dataset_by_values(
            "Lieux d'activité.csv",
            {"Identifiant lieu d'activité"},
            location_ids,
            "consultation_location",
        )

        return {
            "patient_id": patient_id,
            "groups": grouped,
            "linked_dataset_count": len(grouped),
            "linked_row_count": sum(len(g["rows"]) for g in grouped),
            "workspace_patient": False,
            "workspace": self.workspace_bundle(patient_id) if self.structured_workspace_ready() else {"diagnoses":[],"medications":[],"vitals":[],"labs":[],"lab_orders":[]},
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
.tabs{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 14px}
.tabbtn{border:1px solid #cfd7e8;background:white;border-radius:7px;padding:8px 11px;cursor:pointer;font-size:12px;color:var(--text)}
.tabbtn:hover,.tabbtn.active{background:var(--soft);font-weight:800;border-color:#b9c8ee}
.section-title{font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);margin:14px 0 8px}
.ec-section{border-top:1px solid var(--line)}
.ec-section>button{width:100%;border:0;background:#f7f9fe;color:var(--text);padding:10px 14px;text-align:left;font-weight:800;cursor:pointer;display:flex;justify-content:space-between}
.ec-section>button:hover{background:var(--soft)}
.ec-preview{padding:8px 14px;font-size:12px;color:#52648f;line-height:1.5}
.ec-preview .item{padding:3px 0}
.cons-section{border-top:1px solid #edf0f5;padding:8px 0}
.cons-label{font-weight:700;font-size:12px;color:#435783;cursor:pointer}
.cons-content{padding-top:7px}
.editor{background:white;border:1px solid var(--line);border-radius:10px;padding:16px}
.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.form-field{display:flex;flex-direction:column;gap:5px}
.form-field.full{grid-column:1/-1}
.form-field label{font-size:12px;font-weight:700;color:#52648f}
.form-field input,.form-field textarea{border:1px solid #cfd7e8;border-radius:7px;padding:9px;background:white;color:#222}
.form-field textarea{min-height:90px;resize:vertical}
.editor details{border-top:1px solid #edf0f5;padding:10px 0}
.editor summary{font-weight:800;cursor:pointer}
.notice{padding:10px 12px;border:1px solid #d8e1f5;background:#f7f9fe;border-radius:8px;font-size:12px;color:#52648f;margin-bottom:12px}
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
  <button id="modeTechnical" class="rawtoggle" onclick="setMode('technical')">IDENTITÉ / TECHNIQUE</button>
  <div class="local">LOCAL • legacy protégé</div>
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
function norm(s){
  return String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
}
function classify(name){
  const n=norm(name);
  if(n==="patients.csv")return"Identité";
  if(n==="consultations.csv")return"Consultations";
  if(n.includes("antecedents medicaux"))return"Antécédents";
  if(n.includes("pathologies"))return"Pathologies";
  if(n.includes("allergies"))return"Allergies";
  if(n.includes("traitements externes"))return"Traitements";
  if(n.includes("facteurs risque professionnel"))return"Risques professionnels";
  if(n.includes("informations medicales specifiques"))return"Santé de la femme";
  if(n.includes("vaccins"))return"Vaccinations";
  if(n.includes("notes medicales"))return"Notes";
  if(n.includes("mesures"))return"Mesures";
  if(n.includes("volets de synthese medicale"))return"Synthèse";
  if(n.includes("mots-cles")||n.includes("relations entre patients et mots-cles"))return"Mots-clés";
  if(n.includes("certificats"))return"Certificats";
  if(n.includes("documents"))return"Documents";
  if(n.includes("ordonnance")||n.includes("prescription"))return"Prescriptions";
  if(n.includes("correspondants"))return"Correspondants";
  if(n.includes("entourage"))return"Entourage";
  if(n.includes("rendez-vous patients"))return"Rendez-vous";
  if(n.includes("paiements")||n.includes("factur"))return"Administratif";
  if(n.includes("lieux d'activite")||n.includes("contacts"))return"Technique";
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
const CLINICAL_SECTIONS=[
  ["Historique médical","Consultations"],
  ["Remarques","Notes"],
  ["Antécédents","Antécédents"],
  ["Pathologies","Pathologies"],
  ["Allergies","Allergies"],
  ["Traitements en cours","Traitements"],
  ["Vaccinations","Vaccinations"],
  ["Données de suivi","Mesures"],
  ["Documents et ordonnances","Prescriptions"],
  ["Correspondants / entourage","Correspondants"],
  ["Autres données cliniques","Autres données"]
];
function clinicalCounts(d){
  const cats={};
  for(const g of d.groups){const k=classify(g.dataset);cats[k]=(cats[k]||0)+g.rows.length}
  const p=patientObject(d);
  if(val(p,"Notes")||val(p,"Remarques"))cats["Notes"]=(cats["Notes"]||0)+1;
  const w=d.workspace||{};
  if((w.diagnoses||[]).length)cats["Pathologies"]=(cats["Pathologies"]||0)+(w.diagnoses||[]).length;
  if((w.medications||[]).filter(x=>x.active).length)cats["Traitements"]=(cats["Traitements"]||0)+(w.medications||[]).filter(x=>x.active).length;
  if((w.vitals||[]).length||(w.labs||[]).length)cats["Mesures"]=(cats["Mesures"]||0)+(w.vitals||[]).length+(w.labs||[]).length;
  if((d.local_consultations||[]).length)cats["Consultations"]=(cats["Consultations"]||0)+(d.local_consultations||[]).length;
  return cats;
}
function clinicalPreview(d,category,limit=4){
  const groups=d.groups.filter(g=>classify(g.dataset)===category);
  const items=[];
  for(const g of groups){
    for(const r of g.rows){
      const o=objFrom(g,r);
      const values=Object.entries(o).filter(([k,v])=>{
        if(!String(v??"").trim())return false;
        const n=norm(k);
        return !n.startsWith("identifiant ") && !n.includes("nom patient") && !n.includes("prenom patient") &&
          !n.includes("fichier");
      });
      const preferred=values.find(([k])=>["nom de la pathologie","libelle","nom de l'allergie","produit","contenu note","nom de la mesure","valeur","description"].some(x=>norm(k).includes(x)));
      const pair=preferred||values[0];
      if(pair)items.push(String(pair[1]));
      if(items.length>=limit)break;
    }
    if(items.length>=limit)break;
  }
  const w=d.workspace||{};
  if(category==="Pathologies"){
    for(const x of (w.diagnoses||[]))items.unshift((x.label||"")+(x.code?" ["+x.code+"]":""));
  }
  if(category==="Traitements"){
    for(const x of (w.medications||[]).filter(m=>m.active))items.push((x.substance||"")+" "+(x.dose_text||""));
  }
  if(category==="Mesures" && (w.vitals||[]).length){
    const x=w.vitals[0];
    if(x.systolic&&x.diastolic)items.unshift("TA "+x.systolic+"/"+x.diastolic+" "+(x.unit||""));
  }
  if(category==="Notes"){
    const p=patientObject(d);
    const permanent=val(p,"Notes","Remarques");
    if(permanent)items.unshift(permanent);
  }
  return items.slice(0,category==="Traitements"?6:limit);
}
function buildNav(d){
  const cats=clinicalCounts(d);
  let html='<div class="section-title" style="padding:0 14px">Dossier clinique</div>';
  for(const [label,cat] of CLINICAL_SECTIONS){
    const n=cats[cat]||0;
    const preview=clinicalPreview(d,cat,3);
    html+='<div class="ec-section"><button onclick="showCategory('+JSON.stringify(cat).replace(/"/g,'&quot;')+')"><span>'+esc(label)+'</span><span class="count">'+n+'</span></button>';
    if(preview.length)html+='<div class="ec-preview">'+preview.map(x=>'<div class="item">• '+esc(x)+'</div>').join('')+'</div>';
    html+='</div>';
  }
  $('#patientNav').innerHTML=html;
  $('#rightCounts').innerHTML='<div class="pills">'+CLINICAL_SECTIONS.map(([label,cat])=>'<span class="pill">'+esc(label)+' '+(cats[cat]||0)+'</span>').join('')+'</div>';
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
    if(["Administratif","Identité","Autres données","Technique"].includes(cat))continue;
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
  const cid=consultationId(group,row);
  const exam=val(o,"Examen clinique");
  const plan=val(o,"Conduite à tenir");
  const childGroups=[];
  for(const g of current.groups){
    if(g.dataset==="Consultations.csv")continue;
    const rows=g.rows.filter(r=>consultationId(g,r)===cid);
    if(rows.length)childGroups.push({g,rows,cat:classify(g.dataset)});
  }
  const docsCount=childGroups.filter(x=>["Documents","Prescriptions","Certificats"].includes(x.cat)).reduce((n,x)=>n+x.rows.length,0);
  let sections="";
  if(exam)sections+='<details class="cons-section"><summary class="cons-label">Examen clinique</summary><div class="cons-content">'+esc(exam)+'</div></details>';
  if(plan)sections+='<details class="cons-section"><summary class="cons-label">Conduite à tenir</summary><div class="cons-content">'+esc(plan)+'</div></details>';
  if(docsCount){
    let inside="";
    for(const x of childGroups.filter(x=>["Documents","Prescriptions","Certificats"].includes(x.cat))){
      inside+='<div style="margin:6px 0"><strong>'+esc(x.cat)+'</strong> <span class="count">'+x.rows.length+'</span></div>';
      for(const r of x.rows.slice(0,8)){
        const obj=objFrom(x.g,r);
        const clean=Object.fromEntries(Object.entries(obj).filter(([k,v])=>{
          if(!String(v??"").trim())return false;
          const n=norm(k);
          return !n.startsWith("identifiant ") && !n.includes("nom patient") && !n.includes("prenom patient");
        }));
        inside+=fieldsHTML(clean);
      }
    }
    sections+='<details class="cons-section"><summary class="cons-label">Documents et ordonnances <span class="count">'+docsCount+'</span></summary><div class="cons-content">'+inside+'</div></details>';
  }
  if(!sections){
    const text=clinicalTextHTML(o);
    sections=text||'<div class="empty">Aucun détail clinique supplémentaire.</div>';
  }
  return '<div class="event"><div class="eventdate">'+esc(date||('Ligne source '+row.source_row_number))+(doctor?' • '+esc(doctor):'')+'</div><div class="card"><div class="cardhead"><span>'+esc(motif)+'</span><button class="rawtoggle" data-cid="'+esc(cid)+'" onclick="toggleConsultation(this)">Ouvrir</button></div><div class="cardbody hidden">'+sections+'</div></div></div>';
}
function toggleConsultation(btn){
  currentConsultationId=btn.dataset.cid||"";
  const body=btn.closest(".card").querySelector(".cardbody");
  body.classList.toggle("hidden");
  btn.textContent=body.classList.contains("hidden")?"Ouvrir":"Fermer";
}
function diagnosisTableHTML(rows){
  if(!rows.length)return "";
  return '<div class="card"><div class="cardhead"><span>Pathologies / diagnostics actifs</span></div><div class="cardbody"><div class="tablewrap"><table><thead><tr><th>Diagnostic</th><th>Système</th><th>Code</th><th>Statut</th><th>Commentaire</th></tr></thead><tbody>'+
    rows.map(x=>'<tr><td><strong>'+esc(x.label)+'</strong></td><td>'+esc(x.coding_system||"")+'</td><td>'+esc(x.code||"")+'</td><td>'+esc(x.status||"")+'</td><td>'+esc(x.comment||"")+'</td></tr>').join('')+
    '</tbody></table></div></div></div>';
}
function medicationTableHTML(rows){
  if(!rows.length)return "";
  return '<div class="card"><div class="cardhead"><span>Traitement en cours</span></div><div class="cardbody"><div class="tablewrap"><table><thead><tr><th>Médicament</th><th>Posologie</th><th>Rythme</th><th>Association / indication</th><th>ATC</th></tr></thead><tbody>'+
    rows.filter(x=>x.active).map(x=>'<tr><td><strong>'+esc(x.substance)+'</strong></td><td>'+esc(x.dose_text||"")+'</td><td>'+esc(x.frequency_text||"")+'</td><td>'+esc(x.treatment_group||"")+'</td><td>'+esc(x.atc_code||"")+'</td></tr>').join('')+
    '</tbody></table></div></div></div>';
}
function vitalTableHTML(rows){
  if(!rows.length)return "";
  return '<div class="card"><div class="cardhead"><span>Tension artérielle</span></div><div class="cardbody"><div class="tablewrap"><table><thead><tr><th>Date</th><th>TA</th><th>Commentaire</th></tr></thead><tbody>'+
    rows.map(x=>'<tr><td>'+esc(x.observed_at||"")+'</td><td><strong>'+esc((x.systolic??"")+"/"+(x.diastolic??""))+' '+esc(x.unit||"")+'</strong></td><td>'+esc(x.comment||"")+'</td></tr>').join('')+
    '</tbody></table></div></div></div>';
}
function labTableHTML(rows){
  if(!rows.length)return "";
  const dates=[...new Set(rows.map(x=>x.result_date))].sort().reverse();
  const analytes=[...new Set(rows.map(x=>x.analyte))];
  const cell=(a,d)=>rows.find(x=>x.analyte===a&&x.result_date===d);
  return '<div class="card"><div class="cardhead"><span>Résultats biologiques précédents</span></div><div class="cardbody"><div class="tablewrap"><table><thead><tr><th>Analyse</th>'+dates.map(d=>'<th>'+esc(d)+'</th>').join('')+'</tr></thead><tbody>'+
    analytes.map(a=>'<tr><td><strong>'+esc(a)+'</strong></td>'+dates.map(d=>{const x=cell(a,d);if(!x)return'<td></td>';const v=x.value_text||x.value||"";return'<td>'+esc(v)+' '+esc(x.unit||"")+(x.flag?' <strong>['+esc(x.flag)+']</strong>':'')+(x.reference_range?'<br><span class="sub">Réf. '+esc(x.reference_range)+'</span>':'')+'</td>';}).join('')+'</tr>').join('')+
    '</tbody></table></div></div></div>';
}
function labOrdersHTML(rows){
  if(!rows.length)return "";
  return '<div class="card"><div class="cardhead"><span>Examens biologiques demandés</span><span class="sub">'+rows.length+'</span></div><div class="cardbody"><div class="pills">'+rows.map(x=>'<span class="pill">'+esc(x.analyte)+' • '+esc(x.status)+'</span>').join('')+'</div></div></div>';
}
function showCategory(cat){
  if(!current)return;
  currentGroup=cat;
  if(cat==="Consultations"){showOverview();return;}
  const groups=current.groups.filter(g=>classify(g.dataset)===cat);
  const label=(CLINICAL_SECTIONS.find(x=>x[1]===cat)||[cat])[0];
  const w=current.workspace||{};
  const extraCount=cat==="Pathologies"?(w.diagnoses||[]).length:cat==="Traitements"?(w.medications||[]).filter(x=>x.active).length:cat==="Mesures"?((w.vitals||[]).length+(w.labs||[]).length):0;
  let body='<div class="titlebar"><div><h1>'+esc(label)+'</h1><div class="sub">'+(groups.reduce((n,g)=>n+g.rows.length,0)+extraCount)+' élément(s)</div></div></div>';
  if(cat==="Pathologies")body+=diagnosisTableHTML(w.diagnoses||[]);
  if(cat==="Traitements")body+=medicationTableHTML(w.medications||[]);
  if(cat==="Mesures")body+=vitalTableHTML(w.vitals||[])+labTableHTML(w.labs||[])+labOrdersHTML(w.lab_orders||[]);

  if(cat==="Notes"){
    const p=patientObject(current);
    const notes=val(p,"Notes");
    const remarks=val(p,"Remarques");
    if(notes||remarks){
      const clinical={};
      if(notes)clinical["Notes permanentes"]=notes;
      if(remarks)clinical["Remarques"]=remarks;
      body+='<div class="card"><div class="cardhead"><span>Remarques permanentes du dossier</span></div><div class="cardbody">'+fieldsHTML(clinical)+'</div></div>';
    }
  }

  for(const g of groups){
    body+='<div class="card"><div class="cardhead"><span>'+esc(g.dataset.replace(".csv",""))+'</span><span class="sub">'+g.rows.length+' ligne(s)</span></div><div class="cardbody">';
    for(const r of g.rows.slice(0,500)){
      const o=objFrom(g,r);
      const clean=Object.fromEntries(Object.entries(o).filter(([k,v])=>{
        if(!String(v??"").trim())return false;
        const n=norm(k);
        return !n.startsWith("identifiant ") && !n.includes("nom patient") && !n.includes("prenom patient") && !n.includes("fichier");
      }));
      body+='<div style="padding:9px 0;border-top:1px solid #eef1f6">'+fieldsHTML(clean)+'</div>';
    }
    body+='</div></div>';
  }
  const hasWorkspace=(cat==="Pathologies"&&(w.diagnoses||[]).length)||(cat==="Traitements"&&(w.medications||[]).length)||(cat==="Mesures"&&((w.vitals||[]).length||(w.labs||[]).length||(w.lab_orders||[]).length));
  if(!groups.length && !hasWorkspace && !(cat==="Notes" && (val(patientObject(current),"Notes")||val(patientObject(current),"Remarques")))){
    body+='<div class="card"><div class="cardbody empty">Aucune donnée dans cette rubrique pour ce patient.</div></div>';
  }
  $('#mainContent').innerHTML=body;
}
function localConsultationCard(x){
  const s=x.sections||{};
  const blocks=[];
  if(x.examen_clinique)blocks.push('<details class="cons-section"><summary class="cons-label">Examen clinique</summary><div class="cons-content">'+esc(x.examen_clinique)+'</div></details>');
  if(x.conduite_a_tenir)blocks.push('<details class="cons-section"><summary class="cons-label">Conduite à tenir</summary><div class="cons-content">'+esc(x.conduite_a_tenir)+'</div></details>');
  const labels={
    mesures:"Mesures",medicaments:"Médicaments",actes:"Actes",parapharmacie:"Parapharmacie",
    preparations:"Préparations magistrales",lpp:"Produits / prestations LPP",
    prestations_libres:"Produits / prestations libres",vaccins:"Vaccins",
    documents:"Documents",certificats:"Certificats",lettre_suivi:"Lettre de suivi",
    lettre_liaison:"Lettre de liaison",telemedecine:"Télémédecine",
    honoraires:"Honoraires",paiement:"Paiement"
  };
  for(const [k,label] of Object.entries(labels)){
    const v=s[k];
    if(v!==undefined && v!==null && String(v).trim()!==""){
      blocks.push('<details class="cons-section"><summary class="cons-label">'+esc(label)+'</summary><div class="cons-content">'+esc(v)+'</div></details>');
    }
  }
  return '<div class="event"><div class="eventdate">'+esc(x.consultation_date)+(x.location?' • '+esc(x.location):'')+' • IML local</div>'+
    '<div class="card"><div class="cardhead"><span>'+esc(x.motif||"Consultation sans motif")+'</span><span class="pill">'+esc(x.status||"DRAFT")+'</span></div>'+
    '<div class="cardbody">'+(blocks.join('')||'<div class="empty">Consultation locale enregistrée.</div>')+'</div></div></div>';
}
function editorField(id,label,type="textarea",full=true,value=""){
  const cls='form-field'+(full?' full':'');
  if(type==="input"||type==="date"||type==="number"){
    const htmlType=type==="input"?"text":type;
    return '<div class="'+cls+'"><label for="'+id+'">'+esc(label)+'</label><input id="'+id+'" type="'+htmlType+'" value="'+esc(value)+'"></div>';
  }
  return '<div class="'+cls+'"><label for="'+id+'">'+esc(label)+'</label><textarea id="'+id+'">'+esc(value)+'</textarea></div>';
}
function newConsultation(){
  if(!current)return;
  const today=new Date().toISOString().slice(0,10);
  let body='<div class="titlebar"><div><h1>Nouvelle consultation</h1><div class="sub">Workspace local IML • l\'import Easy Care reste intact</div></div></div>'+
    '<div class="notice">Cette consultation est enregistrée localement dans <strong>iml_workspace_edit</strong>. Aucune ligne de <strong>iml_legacy</strong> n\'est modifiée et rien n\'est envoyé à Neon.</div>'+
    '<div class="editor"><div class="form-grid">'+
    editorField("nc_date","Date","date",false,today)+editorField("nc_location","Lieu d’activité","input",false,"")+
    editorField("nc_motif","Motif de la consultation")+
    editorField("nc_examen","Examen clinique")+
    editorField("nc_conduite","Conduite à tenir")+
    '</div>'+
    '<details open><summary>Mesures</summary><div class="form-grid">'+editorField("nc_mesures","Mesures / constantes")+'</div></details>'+
    '<details><summary>Ordonnance / prescriptions</summary><div class="form-grid">'+
      editorField("nc_medicaments","Médicaments et posologie")+
      editorField("nc_actes","Actes")+
      editorField("nc_parapharmacie","Parapharmacie")+
      editorField("nc_preparations","Préparations magistrales")+
      editorField("nc_lpp","Produits / prestations LPP")+
      editorField("nc_prestations_libres","Produits / prestations libres")+
    '</div></details>'+
    '<details><summary>Vaccination</summary><div class="form-grid">'+editorField("nc_vaccins","Vaccin, lot, date, rappel")+'</div></details>'+
    '<details><summary>Documents et certificats</summary><div class="form-grid">'+
      editorField("nc_documents","Documents divers")+
      editorField("nc_certificats","Certificats")+
    '</div></details>'+
    '<details><summary>Courriers / télémédecine</summary><div class="form-grid">'+
      editorField("nc_lettre_suivi","Lettre de suivi")+
      editorField("nc_lettre_liaison","Lettre de liaison")+
      editorField("nc_telemedecine","Demande d’acte de télémédecine")+
    '</div></details>'+
    '<details><summary>Administratif</summary><div class="form-grid">'+
      editorField("nc_honoraires","Honoraires","number",false,"")+
      editorField("nc_paiement","Paiement","input",false,"")+
    '</div></details>'+
    '<div class="toolbar" style="margin-top:14px"><button class="rawtoggle" onclick="saveConsultation()">Enregistrer le brouillon</button><button class="rawtoggle" onclick="showOverview()">Annuler</button><span id="nc_status" class="sub"></span></div></div>';
  $('#mainContent').innerHTML=body;
}
function fieldValue(id){const e=document.getElementById(id);return e?e.value:"";}
async function saveConsultation(){
  if(!current)return;
  const payload={
    patient_id:current.patient_id,
    consultation_date:fieldValue("nc_date"),
    location:fieldValue("nc_location"),
    motif:fieldValue("nc_motif"),
    examen_clinique:fieldValue("nc_examen"),
    conduite_a_tenir:fieldValue("nc_conduite"),
    sections:{
      mesures:fieldValue("nc_mesures"),
      medicaments:fieldValue("nc_medicaments"),
      actes:fieldValue("nc_actes"),
      parapharmacie:fieldValue("nc_parapharmacie"),
      preparations:fieldValue("nc_preparations"),
      lpp:fieldValue("nc_lpp"),
      prestations_libres:fieldValue("nc_prestations_libres"),
      vaccins:fieldValue("nc_vaccins"),
      documents:fieldValue("nc_documents"),
      certificats:fieldValue("nc_certificats"),
      lettre_suivi:fieldValue("nc_lettre_suivi"),
      lettre_liaison:fieldValue("nc_lettre_liaison"),
      telemedecine:fieldValue("nc_telemedecine"),
      honoraires:fieldValue("nc_honoraires"),
      paiement:fieldValue("nc_paiement")
    }
  };
  const status=$('#nc_status');
  status.textContent="Enregistrement…";
  try{
    const r=await fetch('/api/local-consultation',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
    const data=await r.json();
    if(!r.ok)throw new Error(data.error||'Erreur');
    current.local_consultations=await api('/api/local-consultations?id='+encodeURIComponent(current.patient_id));
    showOverview();
  }catch(e){
    status.textContent="Erreur : "+e.message;
  }
}
function showOverview(){
  if(!current)return;
  const consult=current.groups.filter(g=>classify(g.dataset)==="Consultations");
  let out='<div class="titlebar"><div><h1>Historique médical</h1><div class="sub">Consultations et documents associés</div></div><button class="rawtoggle" onclick="newConsultation()">+ Nouvelle consultation</button></div>';
  const w=current.workspace||{};
  if((w.medications||[]).length)out+=medicationTableHTML(w.medications||[]);
  if((w.lab_orders||[]).length)out+=labOrdersHTML(w.lab_orders||[]);
  out+='<div class="toolbar"><input placeholder="Rechercher dans l\'historique médical…" oninput="filterHistory(this.value)"></div>';
  const locals=current.local_consultations||[];
  if(locals.length){
    out+='<div class="titlebar"><div><h1>Consultations IML locales</h1><div class="sub">'+locals.length+' brouillon(s)</div></div></div><div class="timeline">'+locals.map(localConsultationCard).join('')+'</div>';
  }
  if(consult.length){
    const items=consult.flatMap(g=>g.rows.map(r=>({g,r,date:consultationDate(g,r)})));
    items.sort((a,b)=>String(b.date||"").localeCompare(String(a.date||"")));
    out+='<div id="historyTimeline" class="timeline">'+items.map(x=>consultationCard(x.g,x.r)).join('')+'</div>';
  }else{
    out+='<div class="card"><div class="cardbody empty">Aucune consultation explicitement reliée à ce patient.</div></div>';
  }
  $('#mainContent').innerHTML=out;
  const rdv=current.groups.filter(g=>classify(g.dataset)==="Rendez-vous").reduce((n,g)=>n+g.rows.length,0);
  $('#rightSummary').innerHTML='<div class="panel"><h3>Rappels</h3><div class="body empty">Aucun rappel importé</div></div>'+
    '<div class="panel"><h3>Rendez-vous</h3><div class="body"><strong>'+rdv+'</strong> rendez-vous importé(s)</div></div>';
}
function filterHistory(q){
  const needle=norm(q);
  document.querySelectorAll('#historyTimeline .event').forEach(ev=>{
    ev.style.display=!needle||norm(ev.innerText).includes(needle)?"":"none";
  });
}
const TECH_TABS=["Identité","Consultation technique","Administratif","Sources liées"];
function technicalTabs(active){
  return '<div class="tabs">'+TECH_TABS.map(t=>'<button class="tabbtn '+(t===active?'active':'')+'" onclick="showTechnicalTab('+JSON.stringify(t).replace(/"/g,'&quot;')+')">'+esc(t)+'</button>').join('')+'</div>';
}
function technicalRecordHTML(group,row){
  const o=objFrom(group,row);
  return '<div class="card"><div class="cardhead"><span>'+esc(group.dataset)+'</span><span class="sub">ligne source '+esc(row.source_row_number)+'</span></div><div class="cardbody">'+fieldsHTML(o)+'</div></div>';
}
function technicalIdentityHTML(){
  if(!current)return "";
  const pg=current.groups.find(g=>g.dataset==="Patients.csv");
  if(!pg||!pg.rows.length)return '<div class="card"><div class="cardbody empty">Identité non trouvée.</div></div>';
  return '<div class="titlebar"><div><h1>Identité</h1><div class="sub">Données complètes du dossier patient Easy Care</div></div></div>'+technicalRecordHTML(pg,pg.rows[0]);
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
  let out='<div class="titlebar"><div><h1>Consultation technique</h1><div class="sub">'+esc(date)+' • '+esc(motif)+'</div></div></div>';
  out+=technicalRecordHTML(cg,row);
  for(const g of current.groups){
    if(g.dataset==="Consultations.csv")continue;
    const rows=g.rows.filter(r=>consultationId(g,r)===cid);
    for(const r of rows)out+=technicalRecordHTML(g,r);
  }
  return out;
}
function technicalAdminHTML(){
  if(!current)return "";
  const groups=current.groups.filter(g=>classify(g.dataset)==="Administratif");
  let out='<div class="titlebar"><div><h1>Administratif</h1><div class="sub">Paiements et informations non cliniques</div></div></div>';
  for(const g of groups)for(const r of g.rows)out+=technicalRecordHTML(g,r);
  if(!groups.length)out+='<div class="card"><div class="cardbody empty">Aucune donnée administrative liée.</div></div>';
  return out;
}
function technicalSourcesHTML(){
  if(!current)return "";
  let out='<div class="titlebar"><div><h1>Sources liées au patient</h1><div class="sub">'+current.linked_dataset_count+' datasets • '+current.linked_row_count+' lignes</div></div></div>';
  for(const g of current.groups){
    out+='<div class="card"><div class="cardhead"><span>'+esc(g.dataset)+'</span><span class="sub">'+g.rows.length+' ligne(s) • '+esc(g.link_kind||"")+'</span></div><div class="cardbody">';
    for(const r of g.rows.slice(0,100))out+=fieldsHTML(objFrom(g,r));
    if(g.rows.length>100)out+='<div class="empty">Affichage limité aux 100 premières lignes.</div>';
    out+='</div></div>';
  }
  return out;
}
function buildTechnicalNav(){
  if(!current){$('#patientNav').innerHTML="";return}
  const cg=current.groups.find(g=>g.dataset==="Consultations.csv");
  let html='<div class="section-title" style="padding:0 16px">Vue technique</div>';
  html+=TECH_TABS.map(t=>'<button class="navbtn" onclick="showTechnicalTab('+JSON.stringify(t).replace(/"/g,'&quot;')+')"><span>'+esc(t)+'</span></button>').join('');
  if(cg){
    const items=cg.rows.map(r=>({r,date:consultationDate(cg,r),id:consultationId(cg,r),o:objFrom(cg,r)}));
    items.sort((a,b)=>String(b.date||"").localeCompare(String(a.date||"")));
    html+='<div class="section-title" style="padding:0 16px">Consultations</div>'+
      items.map(x=>{
        const motif=val(x.o,"Motif de la consultation","Motif","Titre","Objet","Libellé")||"Sans motif";
        return '<button class="navbtn" onclick="currentConsultationId='+JSON.stringify(x.id).replace(/"/g,'&quot;')+';showTechnicalTab(\'Consultation technique\')"><span>'+esc(x.date||"Sans date")+'<br><span class="sub">'+esc(motif)+'</span></span></button>';
      }).join('');
    if(!currentConsultationId && items.length)currentConsultationId=items[0].id;
  }
  $('#patientNav').innerHTML=html;
}
function showTechnicalTab(tab){
  let body=technicalTabs(tab);
  if(tab==="Identité")body+=technicalIdentityHTML();
  else if(tab==="Consultation technique")body+=technicalConsultationHTML(currentConsultationId);
  else if(tab==="Administratif")body+=technicalAdminHTML();
  else body+=technicalSourcesHTML();
  $('#mainContent').innerHTML=body;
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
      showTechnicalTab("Identité");
    }else{
      $('#patientNav').innerHTML="";
      $('#mainContent').innerHTML=technicalTabs("Identité")+'<div class="titlebar"><h1>Identité / Technique</h1></div><div class="card"><div class="cardbody">Sélectionnez d’abord un patient.</div></div>';
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
  current.local_consultations=await api('/api/local-consultations?id='+encodeURIComponent(id));
  currentConsultationId="";
  $('#patientSummary').style.display="";
  patientHeader(current); $('#searchResults').innerHTML='';
  if(currentMode==="technical"){
    buildTechnicalNav();
    showTechnicalTab("Identité");
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
            if u.path == "/api/workspace-status":
                return self.send_json({"ready": self.db.workspace_ready()})
            if u.path == "/api/local-consultations":
                patient_id = q.get("id", [""])[0]
                if not patient_id:
                    return self.send_json({"error": "patient id required"}, 400)
                return self.send_json(self.db.local_consultations(patient_id))
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


    def do_POST(self):
        try:
            u = urlparse(self.path)
            if u.path != "/api/local-consultation":
                return self.send_json({"error": "not found"}, 404)
            length = int(self.headers.get("Content-Length", "0") or "0")
            if length <= 0 or length > 2_000_000:
                return self.send_json({"error": "invalid request body"}, 400)
            raw = self.rfile.read(length)
            payload = json.loads(raw.decode("utf-8"))
            patient_id = str(payload.pop("patient_id", "") or "").strip()
            if not patient_id:
                return self.send_json({"error": "patient id required"}, 400)
            result = self.db.save_local_consultation(patient_id, payload)
            return self.send_json(result, 201)
        except Exception as exc:
            return self.send_json({"error": str(exc)}, 500)


def main() -> int:
    ap = argparse.ArgumentParser(description="IML Easy Care Legacy Viewer + local consultation workspace")
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
    print("Local-only • legacy protected • no Neon")
    print("Editable workspace:", "READY" if db.workspace_ready() else "NOT INITIALIZED")
    print("Structured workspace:", "READY" if db.structured_workspace_ready() else "NOT INITIALIZED")
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
