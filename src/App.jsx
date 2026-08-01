import React, { useEffect, useMemo, useState } from "react";
import logoImage from "./assets/iml-logo.png";
import worldCountries from "./world-countries.json";
import { loadGlobalMapProfiles } from "./services/countriesApi.js";
const BASE_CSS = ":root {\n    font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif;\n    color: #0f172a;\n    background: #ffffff;\n    line-height: 1.5;\n    font-weight: 400;\n  }\n  * { box-sizing: border-box; }\n  html, body, #root { margin: 0; min-height: 100%; }\n  body { background: #ffffff; color: #0f172a; }\n  button, input, textarea, select { font: inherit; }\n  .app-shell { min-height: 100vh; background: #ffffff; }\n  .container { width: min(1180px, calc(100% - 40px)); margin: 0 auto; }\n  .topbar { position: sticky; top: 0; z-index: 50; border-bottom: 1px solid #e2e8f0; background: rgba(255,255,255,0.92); backdrop-filter: blur(10px); }\n  .topbar-inner { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 16px 0; }\n  .brand-button { display: flex; align-items: center; gap: 12px; border: 0; background: transparent; cursor: pointer; text-align: left; padding: 0; }\n  .brand-title { font-size: 14px; color: #334155; }\n  .logo-box { height: 56px; width: 56px; display: flex; align-items: center; justify-content: center; overflow: hidden; border-radius: 18px; border: 1px solid #dbe2ea; background: #ffffff; box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06); }\n  .logo-svg { display: block; width: 52px; height: 52px; object-fit: contain; }\n  .eyebrow { font-size: 12px; text-transform: uppercase; letter-spacing: 0.2em; color: #64748b; }\n  .topnav, .mobile-nav { display: flex; gap: 8px; flex-wrap: wrap; }\n  .mobile-nav { display: none; padding-bottom: 16px; overflow-x: auto; }\n  .nav-button, .secondary-button { border: 0; cursor: pointer; }\n  .nav-button { border-radius: 18px; background: #0f172a; color: white; padding: 10px 16px; font-size: 14px; font-weight: 700; transition: transform 180ms ease, box-shadow 180ms ease, background 180ms ease; }\n  .nav-button:hover { background: #1e293b; }\n  .nav-button-active { padding: 12px 20px; font-size: 16px; transform: scale(1.08); box-shadow: 0 10px 24px rgba(15, 23, 42, 0.18); outline: 2px solid #cbd5e1; }\n  .hero { overflow: hidden; border-bottom: 1px solid #e2e8f0; background: radial-gradient(circle at top left, rgba(15,23,42,0.06), transparent 34%), radial-gradient(circle at bottom right, rgba(15,23,42,0.05), transparent 30%); }\n  .hero-grid, .split-grid, .footer-grid, .profile-grid { display: grid; gap: 28px; }\n  .hero-grid { grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.85fr); padding: 72px 0 88px; }\n  .hero-copy h1, .section-heading h2 { margin: 0; line-height: 1.05; letter-spacing: -0.03em; }\n  .hero-copy h1 { max-width: 760px; font-size: clamp(2.7rem, 5vw, 4.4rem); }\n  .hero-text, .section-heading p, .content-block p, .value-card p, .muted-copy, .footer-copy, .list-box, .plain-list, .form-note { color: #475569; }\n  .hero-text { max-width: 720px; font-size: 19px; line-height: 1.8; }\n  .section { padding: 72px 0; }\n  .section-heading { max-width: 820px; margin-bottom: 32px; }\n  .section-heading h2 { font-size: clamp(2rem, 3vw, 3rem); margin-bottom: 12px; }\n  .section-heading p { font-size: 18px; line-height: 1.75; margin: 0; }\n  .section-badge { display: inline-flex; align-items: center; border-radius: 999px; border: 1px solid #dbe2ea; background: #ffffff; padding: 6px 12px; margin-bottom: 14px; font-size: 12px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: #64748b; }\n  .card { border: 1px solid #e2e8f0; border-radius: 28px; background: #ffffff; box-shadow: 0 10px 32px rgba(15, 23, 42, 0.05); }\n  .soft-card { background: #f8fafc; }\n  .highlight-card { border-color: #fde68a; background: #fef3c7; }\n  .content-block { padding: 28px; }\n  .content-block h3, .value-card h3, .profile-head h3 { margin: 0 0 14px; font-size: 1.32rem; letter-spacing: -0.02em; }\n  .content-block p, .value-card p, .plain-list li, .list-box, .metric-subtitle, .form-note { font-size: 15px; line-height: 1.8; }\n  .note-box { padding: 22px 24px; max-width: 860px; }\n  .note-box p { margin: 0; }\n  .metric-grid, .tile-grid, .form-grid, .stack-list { display: grid; gap: 18px; }\n  .metric-grid.two-up, .form-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }\n  .tile-grid.three-up, .tile-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }\n  .value-card, .metric-card, .mini-tile { padding: 24px; }\n  .metric-card { display: flex; gap: 16px; align-items: flex-start; }\n  .metric-symbol { display: inline-flex; align-items: center; justify-content: center; flex: 0 0 auto; width: 44px; height: 44px; border-radius: 16px; border: 1px solid #dbe2ea; background: #f1f5f9; color: #0f172a; font-weight: 800; }\n  .metric-title { font-size: 14px; color: #64748b; }\n  .metric-value { margin-top: 2px; font-size: 30px; font-weight: 800; letter-spacing: -0.03em; }\n  .metric-subtitle { margin-top: 4px; }\n  .overview-card { padding: 30px; }\n  .overview-top { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }\n  .overview-title, .mail-box { font-size: 1.2rem; font-weight: 800; color: #0f172a; letter-spacing: -0.02em; }\n  .mini-tile { border: 1px solid #e2e8f0; border-radius: 22px; }\n  .mini-tile-title { margin-bottom: 8px; font-size: 14px; font-weight: 800; }\n  .mini-tile-text { font-size: 14px; color: #475569; line-height: 1.7; }\n  .top-gap { margin-top: 36px; }\n  .top-gap-small { margin-top: 20px; }\n  .split-grid, .footer-grid, .profile-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }\n  .stack-layout { display: grid; gap: 18px; }\n  .list-box, .code-box { border: 1px solid #e2e8f0; border-radius: 20px; padding: 16px 18px; background: #ffffff; }\n  .code-box { margin-top: 18px; background: #f8fafc; }\n  .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace; }\n  .hex-chart { display: block; width: 100%; max-width: 390px; margin: 0 auto; }\n  .mini-hex { width: 88px; height: 88px; }\n  .world-box { position: relative; overflow: hidden; border-radius: 32px; border: 1px solid #e2e8f0; background: linear-gradient(180deg, #fbfdff 0%, #f2f6fb 100%); padding: 20px; box-shadow: 0 20px 60px rgba(15, 23, 42, 0.08); }\n  .world-box-head { display: flex; align-items: center; justify-content: space-between; gap: 18px; margin-bottom: 14px; }\n  .helper-pill { border-radius: 999px; border: 1px solid #e2e8f0; background: white; padding: 10px 14px; color: #64748b; font-size: 12px; }\n  .world-map-wrap { position: relative; width: 100%; aspect-ratio: 900 / 430; }\n  .world-map { width: 100%; height: 100%; }\n  .marker-group { cursor: pointer; }\n  .tooltip-anchor { pointer-events: auto; position: absolute; z-index: 10; }\n  .map-tooltip { width: 160px; border-radius: 22px; border: 1px solid rgba(226,232,240,0.95); background: rgba(255,255,255,0.95); padding: 12px; box-shadow: 0 18px 50px rgba(15, 23, 42, 0.18); backdrop-filter: blur(8px); }\n  .map-tooltip-top, .profile-head, .form-actions { display: flex; align-items: center; justify-content: space-between; gap: 12px; }\n  .map-tooltip-title { font-size: 14px; font-weight: 800; }\n  .map-tooltip-score, .score-pill { border-radius: 999px; background: #0f172a; color: white; padding: 6px 10px; font-size: 12px; font-weight: 700; }\n  .muted-copy { margin-top: 0; margin-bottom: 12px; }\n  .select-wrap { max-width: 360px; }\n  .select-wrap label { display: block; font-size: 14px; font-weight: 700; color: #334155; margin-bottom: 8px; }\n  .select-wrap select { width: 100%; border: 1px solid #cbd5e1; border-radius: 18px; background: #ffffff; padding: 14px 16px; color: #0f172a; outline: none; }\n  .contact-form { display: grid; gap: 16px; }\n  .contact-form label { display: block; font-size: 14px; font-weight: 700; color: #334155; margin-bottom: 8px; }\n  .contact-form input, .contact-form textarea { width: 100%; border: 1px solid #cbd5e1; border-radius: 18px; background: #ffffff; padding: 14px 16px; color: #0f172a; outline: none; }\n  .contact-form textarea { resize: vertical; }\n  .primary-button { border: 0; cursor: pointer; border-radius: 16px; padding: 12px 16px; font-weight: 700; background: #0f172a; color: white; }\n  .secondary-button { border: 0; cursor: pointer; border-radius: 16px; padding: 12px 16px; font-weight: 700; background: #ffffff; color: #0f172a; border: 1px solid #dbe2ea; }\n  .mail-box { border-radius: 18px; border: 1px solid #e2e8f0; background: white; padding: 14px 16px; }\n  .footer { border-top: 1px solid #e2e8f0; background: #f8fafc; margin-top: 40px; }\n  .footer-grid { padding: 36px 0; }\n  .footer-brand { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }\n  .footer-title { font-size: 14px; color: #334155; }\n  .footer-label { margin-bottom: 12px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.2em; color: #64748b; font-weight: 800; }\n  .plain-list { margin: 0; padding: 0; list-style: none; }\n\n  .button-row { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; margin-top: 22px; }\n  .primary-button, .secondary-button { display: inline-flex; align-items: center; justify-content: center; text-decoration: none; }\n  .text-link { color: #0f172a; font-weight: 800; text-decoration: underline; text-decoration-color: #cbd5e1; text-underline-offset: 4px; }\n  .text-link:hover { text-decoration-color: #0f172a; }\n  .principle-stack { display: grid; gap: 10px; margin-top: 22px; }\n  .principle-line { border-left: 3px solid #0f172a; padding: 4px 0 4px 14px; font-size: 16px; font-weight: 700; color: #334155; }\n  .compact-list { display: grid; gap: 8px; margin: 0; padding: 0; list-style: none; color: #475569; }\n  .compact-list li { line-height: 1.65; }\n  .status-pill { display: inline-flex; align-items: center; border-radius: 999px; background: #f1f5f9; color: #334155; padding: 7px 11px; font-size: 12px; font-weight: 800; }\n\n  .map-controls { display: grid; grid-template-columns: minmax(0, 320px); gap: 16px; align-items: end; }\n  .control-field label { display: block; margin-bottom: 8px; font-size: 13px; font-weight: 800; color: #334155; }\n  .control-field select { width: 100%; border: 1px solid #cbd5e1; border-radius: 16px; background: #ffffff; padding: 12px 14px; color: #0f172a; outline: none; }\n  .map-stage { overflow: hidden; border-radius: 24px; background: #f8fbff; }\n  .country-shape { cursor: pointer; transition: fill 150ms ease, stroke 150ms ease, opacity 150ms ease; outline: none; }\n  .country-shape:hover, .country-shape:focus { stroke: #0f172a; stroke-width: 1.4; opacity: 0.94; }\n  .country-shape-profile { cursor: pointer; }\n  .country-shape-selected { filter: drop-shadow(0 0 5px rgba(217, 119, 6, 0.42)); }\n  .map-tooltip-floating { position: absolute; z-index: 12; display: grid; gap: 3px; width: max-content; max-width: 220px; pointer-events: none; border: 1px solid rgba(203, 213, 225, 0.95); border-radius: 14px; background: rgba(255,255,255,0.96); padding: 9px 11px; box-shadow: 0 14px 36px rgba(15,23,42,0.18); font-size: 12px; }\n  .map-tooltip-floating span { color: #64748b; }\n  .map-legend { display: flex; align-items: center; justify-content: flex-end; gap: 10px; margin-top: 14px; color: #64748b; font-size: 11px; }\n  .legend-swatches { display: grid; grid-template-columns: repeat(6, 24px); overflow: hidden; border: 1px solid #cbd5e1; border-radius: 999px; }\n  .legend-swatches span { height: 10px; }\n  .legend-selected { display: inline-flex; align-items: center; gap: 6px; margin-left: 8px; color: #92400e; font-weight: 800; }\n  .legend-selected-swatch { width: 14px; height: 14px; border-radius: 4px; border: 2px solid #92400e; background: #f59e0b; }\n  .data-source-pill { display: inline-flex; align-items: center; gap: 8px; flex: 0 0 auto; border: 1px solid #cbd5e1; border-radius: 999px; background: white; padding: 8px 12px; color: #475569; font-size: 12px; font-weight: 800; }\n  .data-source-live { color: #14532d; border-color: #86efac; background: #f0fdf4; }\n  .status-dot { width: 8px; height: 8px; border-radius: 50%; background: currentColor; }\n  .profile-meta { display: flex; gap: 8px; flex-wrap: wrap; margin: 16px 0 4px; }\n  .profile-meta span { border-radius: 999px; background: #f1f5f9; padding: 6px 9px; color: #475569; font-size: 11px; font-weight: 700; }\n  .profile-stat-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }\n  .profile-stat { display: flex; align-items: center; justify-content: space-between; gap: 8px; border: 1px solid #e2e8f0; border-radius: 12px; padding: 9px 10px; font-size: 12px; color: #64748b; }\n  .profile-stat strong { color: #0f172a; font-size: 15px; }\n  .map-empty { max-width: 760px; }\n  .profile-title-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }\n  .profile-title-row h3 { margin: 0; }\n  .country-report { margin-top: 28px; overflow: hidden; }\n  .country-report > summary { display: flex; align-items: center; justify-content: space-between; gap: 14px; cursor: pointer; list-style: none; padding: 22px 28px; font-weight: 800; color: #0f172a; }\n  .country-report > summary::-webkit-details-marker { display: none; }\n  .country-report > summary::after { content: \"Open\"; border-radius: 999px; background: #0f172a; color: white; padding: 6px 10px; font-size: 12px; }\n  .country-report[open] > summary { border-bottom: 1px solid #e2e8f0; }\n  .country-report[open] > summary::after { content: \"Close\"; }\n  .report-body { padding: 28px; background: #ffffff; }\n  .report-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 18px; flex-wrap: wrap; }\n  .report-heading h2 { margin: 4px 0 6px; font-size: 2rem; letter-spacing: -0.03em; }\n  .report-overall { border-radius: 22px; background: #0f172a; color: white; padding: 14px 18px; min-width: 112px; text-align: center; }\n  .report-overall strong { display: block; font-size: 1.7rem; line-height: 1; }\n  .report-overall span { font-size: 11px; opacity: 0.78; }\n  .report-actions { display: flex; gap: 10px; flex-wrap: wrap; margin: 20px 0 4px; }\n  .report-section { margin-top: 28px; }\n  .report-section h3 { margin-bottom: 12px; }\n  .report-score-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }\n  .report-domain { border: 1px solid #e2e8f0; border-radius: 18px; padding: 16px; background: #f8fafc; break-inside: avoid; }\n  .report-domain-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 8px; }\n  .report-domain-head strong { font-size: 15px; }\n  .report-domain-score { border-radius: 999px; background: #0f172a; color: white; padding: 4px 8px; font-size: 12px; font-weight: 800; }\n  .report-domain p { margin: 0; font-size: 14px; line-height: 1.65; }\n  .report-domain-evidence { margin-top: 12px; border-top: 1px solid #e2e8f0; padding-top: 10px; }\n  .report-domain-evidence ul { margin: 7px 0 0; padding-left: 18px; color: #475569; }\n  .report-domain-evidence li { margin-bottom: 7px; font-size: 13px; line-height: 1.55; }\n  .report-source { border: 1px solid #e2e8f0; border-radius: 18px; padding: 16px; background: #ffffff; break-inside: avoid; }\n  .report-source + .report-source { margin-top: 12px; }\n  .report-source-title { font-weight: 800; color: #0f172a; }\n  .report-source-meta { margin-top: 3px; color: #64748b; font-size: 12px; }\n  .report-indicator { margin-top: 12px; border-left: 3px solid #cbd5e1; padding-left: 12px; }\n  .report-disclaimer { border-left: 3px solid #0f172a; padding-left: 14px; color: #475569; }\n\n  \n\n  @media (max-width: 1100px) {\n    .hero-grid, .split-grid, .footer-grid, .profile-grid, .metric-grid.two-up, .tile-grid, .tile-grid.three-up, .form-grid { grid-template-columns: 1fr; }\n    .map-controls { grid-template-columns: 1fr; }\n    .helper-pill { display: none; }\n  }\n  @media (max-width: 820px) {\n    .desktop-nav { display: none; }\n    .mobile-nav { display: flex; }\n    .container { width: min(100% - 28px, 1180px); }\n    .section, .hero-grid { padding-top: 56px; padding-bottom: 56px; }\n    .hero-grid { gap: 22px; }\n    .map-legend { justify-content: flex-start; flex-wrap: wrap; }\n    .profile-stat-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }\n  }\n  @media (max-width: 820px) {\n    .report-score-grid { grid-template-columns: 1fr; }\n  }\n  @media print {\n    body * { visibility: hidden !important; }\n    .country-report, .country-report * { visibility: visible !important; }\n    .country-report { position: absolute; inset: 0 auto auto 0; width: 100%; margin: 0; border: 0; border-radius: 0; box-shadow: none; }\n    .country-report > summary, .report-actions { display: none !important; }\n    .report-body { display: block !important; padding: 0; }\n    .report-score-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }\n    .report-domain, .report-source { background: white; }\n    a { color: #0f172a !important; text-decoration: none !important; }\n  }\n\n.database-stat-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; margin-top: 16px; }\n.database-stat { display: flex; align-items: center; justify-content: space-between; gap: 8px; border: 1px solid #e2e8f0; border-radius: 12px; background: #fff; padding: 9px 10px; font-size: 12px; color: #64748b; }\n.database-stat strong { color: #0f172a; font-size: 15px; }\n.evidence-level-row, .source-audit-line { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 12px; }\n.evidence-level-row span, .source-audit-line span { border-radius: 999px; border: 1px solid #dbe2ea; background: #fff; padding: 6px 9px; color: #475569; font-size: 11px; font-weight: 700; }\n@media (max-width: 620px) { .database-stat-grid { grid-template-columns: 1fr; } }\n\n/* =========================================================\n     IML visual refresh — Palier 1\n     Presentation only: typography, palette, spacing, navigation,\n     buttons and cards. No content, route, API or data change.\n     ========================================================= */\n\n  :root {\n    --iml-ink: #102433;\n    --iml-ink-soft: #294150;\n    --iml-muted: #5a6d78;\n    --iml-line: #d9e2e7;\n    --iml-paper: #ffffff;\n    --iml-wash: #f3f7f8;\n    --iml-wash-deep: #e8f0f2;\n    --iml-navy: #102d42;\n    --iml-teal: #246f78;\n    --iml-teal-soft: #dcebed;\n    --iml-amber: #d59422;\n    --iml-shadow: 0 18px 48px rgba(16, 45, 66, 0.08);\n    color: var(--iml-ink);\n    background: var(--iml-wash);\n  }\n\n  body {\n    color: var(--iml-ink);\n    background:\n      radial-gradient(circle at 8% 0%, rgba(36, 111, 120, 0.06), transparent 28rem),\n      linear-gradient(180deg, #f8fbfb 0%, #ffffff 30%, #ffffff 100%);\n  }\n\n  .container {\n    width: min(1220px, calc(100% - 48px));\n  }\n\n  .topbar {\n    border-bottom: 1px solid rgba(16, 45, 66, 0.10);\n    background: rgba(248, 251, 251, 0.90);\n    box-shadow: 0 8px 28px rgba(16, 45, 66, 0.035);\n  }\n\n  .topbar-inner {\n    padding: 12px 0;\n  }\n\n  .brand-button {\n    gap: 11px;\n  }\n\n  .brand-title {\n    color: var(--iml-ink-soft);\n    font-size: 13px;\n    font-weight: 700;\n    letter-spacing: 0.01em;\n  }\n\n  .logo-box {\n    width: 50px;\n    height: 50px;\n    border-color: rgba(36, 111, 120, 0.18);\n    border-radius: 14px;\n    box-shadow: 0 9px 24px rgba(16, 45, 66, 0.07);\n  }\n\n  .logo-svg {\n    width: 46px;\n    height: 46px;\n  }\n\n  .eyebrow {\n    color: var(--iml-teal);\n    font-weight: 800;\n    letter-spacing: 0.18em;\n  }\n\n  .nav-button {\n    border: 1px solid transparent;\n    border-radius: 999px;\n    background: transparent;\n    color: var(--iml-ink-soft);\n    padding: 8px 12px;\n    font-size: 13px;\n    font-weight: 700;\n    box-shadow: none;\n    transform: none;\n  }\n\n  .nav-button:hover {\n    border-color: rgba(36, 111, 120, 0.16);\n    background: var(--iml-teal-soft);\n    color: var(--iml-navy);\n  }\n\n  .nav-button-active {\n    border-color: var(--iml-navy);\n    background: var(--iml-navy);\n    color: #ffffff;\n    padding: 8px 13px;\n    font-size: 13px;\n    transform: none;\n    outline: none;\n    box-shadow: 0 7px 18px rgba(16, 45, 66, 0.16);\n  }\n\n  .hero {\n    border-bottom-color: var(--iml-line);\n    background:\n      radial-gradient(circle at 12% 5%, rgba(36, 111, 120, 0.12), transparent 32rem),\n      radial-gradient(circle at 88% 22%, rgba(213, 148, 34, 0.08), transparent 24rem),\n      linear-gradient(145deg, #f7fbfb 0%, #ffffff 56%, #f4f8f8 100%);\n  }\n\n  .hero-grid {\n    align-items: start;\n    gap: 48px;\n    padding: 88px 0 100px;\n  }\n\n  .hero-copy h1,\n  .section-heading h2,\n  .report-heading h2 {\n    font-family: \"Iowan Old Style\", \"Palatino Linotype\", \"Book Antiqua\", Georgia, serif;\n    color: var(--iml-navy);\n    font-weight: 650;\n  }\n\n  .hero-copy h1 {\n    max-width: 820px;\n    font-size: clamp(3rem, 5.2vw, 5rem);\n    line-height: 0.99;\n    letter-spacing: -0.045em;\n  }\n\n  .hero-text {\n    max-width: 760px;\n    color: var(--iml-ink-soft);\n    font-size: 18px;\n    line-height: 1.78;\n  }\n\n  .principle-stack {\n    grid-template-columns: repeat(3, minmax(0, 1fr));\n    gap: 10px;\n    margin-top: 28px;\n  }\n\n  .principle-line {\n    border-left: 0;\n    border-top: 3px solid var(--iml-teal);\n    padding: 12px 2px 0;\n    color: var(--iml-ink-soft);\n    font-size: 12px;\n    font-weight: 800;\n    letter-spacing: 0.08em;\n    line-height: 1.45;\n    text-transform: uppercase;\n  }\n\n  .section {\n    padding: 84px 0;\n  }\n\n  .section-heading {\n    margin-bottom: 38px;\n  }\n\n  .section-heading h2 {\n    margin-bottom: 15px;\n    font-size: clamp(2.25rem, 3.4vw, 3.5rem);\n    line-height: 1.04;\n  }\n\n  .section-heading p {\n    max-width: 780px;\n    color: var(--iml-muted);\n    font-size: 17px;\n    line-height: 1.76;\n  }\n\n  .section-badge {\n    border-color: rgba(36, 111, 120, 0.18);\n    background: var(--iml-teal-soft);\n    color: var(--iml-teal);\n    padding: 7px 12px;\n    font-size: 11px;\n    font-weight: 800;\n  }\n\n  .card {\n    border-color: var(--iml-line);\n    border-radius: 21px;\n    background: rgba(255, 255, 255, 0.94);\n    box-shadow: var(--iml-shadow);\n  }\n\n  .soft-card {\n    background: linear-gradient(145deg, #f7fafb 0%, #f1f6f7 100%);\n  }\n\n  .highlight-card {\n    border-color: rgba(213, 148, 34, 0.34);\n    background: #fff8e8;\n  }\n\n  .content-block {\n    padding: 32px;\n  }\n\n  .content-block h3,\n  .value-card h3,\n  .profile-head h3 {\n    color: var(--iml-navy);\n    font-size: 1.28rem;\n    line-height: 1.25;\n  }\n\n  .content-block p,\n  .value-card p,\n  .plain-list li,\n  .list-box,\n  .metric-subtitle,\n  .form-note,\n  .muted-copy,\n  .footer-copy {\n    color: var(--iml-muted);\n  }\n\n  .metric-grid,\n  .tile-grid,\n  .form-grid,\n  .stack-list {\n    gap: 20px;\n  }\n\n  .value-card,\n  .metric-card,\n  .mini-tile,\n  .overview-card {\n    transition: transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease;\n  }\n\n  .value-card:hover,\n  .metric-card:hover,\n  .overview-card:hover {\n    transform: translateY(-2px);\n    border-color: rgba(36, 111, 120, 0.24);\n    box-shadow: 0 22px 56px rgba(16, 45, 66, 0.105);\n  }\n\n  .metric-card {\n    align-items: center;\n    padding: 22px;\n  }\n\n  .metric-symbol {\n    border-color: rgba(36, 111, 120, 0.18);\n    border-radius: 14px;\n    background: var(--iml-teal-soft);\n    color: var(--iml-teal);\n  }\n\n  .metric-title {\n    color: var(--iml-muted);\n    font-size: 12px;\n    font-weight: 800;\n    letter-spacing: 0.05em;\n    text-transform: uppercase;\n  }\n\n  .metric-value {\n    color: var(--iml-navy);\n    font-size: 27px;\n  }\n\n  .overview-card {\n    padding: 32px;\n    border-color: rgba(36, 111, 120, 0.17);\n    background:\n      linear-gradient(155deg, rgba(255,255,255,0.98), rgba(242,247,248,0.96));\n  }\n\n  .overview-title,\n  .mail-box {\n    color: var(--iml-navy);\n  }\n\n  .mini-tile {\n    border-color: var(--iml-line);\n    border-radius: 16px;\n    background: rgba(255,255,255,0.72);\n  }\n\n  .mini-tile-title {\n    color: var(--iml-navy);\n  }\n\n  .list-box,\n  .code-box {\n    border-color: var(--iml-line);\n    border-radius: 15px;\n  }\n\n  .primary-button,\n  .secondary-button {\n    min-height: 44px;\n    border-radius: 999px;\n    padding: 11px 18px;\n    font-size: 14px;\n    transition: transform 160ms ease, box-shadow 160ms ease, background 160ms ease, border-color 160ms ease;\n  }\n\n  .primary-button {\n    background: var(--iml-navy);\n    box-shadow: 0 8px 20px rgba(16, 45, 66, 0.14);\n  }\n\n  .primary-button:hover {\n    transform: translateY(-1px);\n    background: #173c56;\n    box-shadow: 0 11px 26px rgba(16, 45, 66, 0.19);\n  }\n\n  .secondary-button {\n    border-color: rgba(36, 111, 120, 0.22);\n    background: rgba(255,255,255,0.84);\n    color: var(--iml-navy);\n  }\n\n  .secondary-button:hover {\n    transform: translateY(-1px);\n    border-color: rgba(36, 111, 120, 0.40);\n    background: var(--iml-teal-soft);\n  }\n\n  .text-link {\n    color: var(--iml-teal);\n    text-decoration-color: rgba(36, 111, 120, 0.32);\n  }\n\n  .text-link:hover {\n    color: var(--iml-navy);\n    text-decoration-color: var(--iml-navy);\n  }\n\n  .note-box {\n    border-left: 4px solid var(--iml-teal);\n    border-radius: 12px 20px 20px 12px;\n    background: rgba(255,255,255,0.74);\n    box-shadow: none;\n  }\n\n  .status-pill,\n  .profile-meta span {\n    background: var(--iml-teal-soft);\n    color: var(--iml-teal);\n  }\n\n  .select-wrap select,\n  .control-field select,\n  .contact-form input,\n  .contact-form textarea,\n  .mail-box {\n    border-color: var(--iml-line);\n    border-radius: 14px;\n    background: rgba(255,255,255,0.92);\n  }\n\n  .world-box {\n    border-color: var(--iml-line);\n    border-radius: 24px;\n    background: linear-gradient(180deg, #fafdfe 0%, #eef4f6 100%);\n    box-shadow: 0 22px 60px rgba(16, 45, 66, 0.09);\n  }\n\n  .helper-pill,\n  .data-source-pill {\n    border-color: var(--iml-line);\n    background: rgba(255,255,255,0.90);\n  }\n\n  .score-pill,\n  .map-tooltip-score,\n  .report-domain-score,\n  .report-overall {\n    background: var(--iml-navy);\n  }\n\n  .country-shape-selected {\n    filter: drop-shadow(0 0 5px rgba(213, 148, 34, 0.46));\n  }\n\n  .footer {\n    border-top-color: var(--iml-line);\n    background: linear-gradient(180deg, #f4f8f8 0%, #edf3f4 100%);\n  }\n\n  .footer-grid {\n    padding: 44px 0;\n  }\n\n  .footer-label {\n    color: var(--iml-teal);\n  }\n\n  @media (max-width: 820px) {\n    .container {\n      width: min(100% - 30px, 1220px);\n    }\n\n    .hero-grid {\n      padding-top: 62px;\n      padding-bottom: 68px;\n    }\n\n    .hero-copy h1 {\n      font-size: clamp(2.55rem, 12vw, 3.7rem);\n    }\n\n    .principle-stack {\n      grid-template-columns: 1fr;\n      gap: 8px;\n    }\n\n    .principle-line {\n      border-top: 0;\n      border-left: 3px solid var(--iml-teal);\n      padding: 4px 0 4px 12px;\n    }\n\n    .section {\n      padding: 62px 0;\n    }\n\n    .content-block,\n    .overview-card {\n      padding: 24px;\n    }\n  }\n\n  @media (prefers-reduced-motion: reduce) {\n    .value-card,\n    .metric-card,\n    .overview-card,\n    .primary-button,\n    .secondary-button,\n    .nav-button {\n      transition: none;\n    }\n  }\n\n/* =========================================================\n   IML visual refresh — Palier 2\n   Homepage composition and section hierarchy only.\n   No text, route, API, score, source or PostgreSQL change.\n   Append after Palier 1 in src/App.css.\n   ========================================================= */\n\n.hero {\n  position: relative;\n  isolation: isolate;\n}\n\n.hero::before,\n.hero::after {\n  content: \"\";\n  position: absolute;\n  z-index: -1;\n  pointer-events: none;\n  border-radius: 999px;\n}\n\n.hero::before {\n  top: 76px;\n  right: -150px;\n  width: 430px;\n  height: 430px;\n  border: 1px solid rgba(36, 111, 120, 0.10);\n  box-shadow:\n    0 0 0 44px rgba(36, 111, 120, 0.025),\n    0 0 0 88px rgba(36, 111, 120, 0.018);\n}\n\n.hero::after {\n  left: 7%;\n  bottom: -78px;\n  width: 156px;\n  height: 156px;\n  background: radial-gradient(\n    circle,\n    rgba(213, 148, 34, 0.10) 0%,\n    rgba(213, 148, 34, 0.035) 44%,\n    transparent 72%\n  );\n}\n\n.hero .hero-grid {\n  grid-template-columns: minmax(0, 1.34fr) minmax(330px, 0.66fr);\n  gap: clamp(38px, 5vw, 76px);\n  align-items: start;\n}\n\n.hero-copy {\n  position: relative;\n  padding-left: clamp(0px, 2.2vw, 26px);\n}\n\n.hero-copy::before {\n  content: \"\";\n  position: absolute;\n  top: 4px;\n  bottom: 8px;\n  left: 0;\n  width: 1px;\n  background: linear-gradient(\n    180deg,\n    rgba(36, 111, 120, 0.55),\n    rgba(36, 111, 120, 0.09) 58%,\n    transparent\n  );\n}\n\n.hero-copy > .section-badge {\n  margin-bottom: 24px;\n}\n\n.hero-copy > h1 {\n  text-wrap: balance;\n}\n\n.hero-copy > .principle-stack {\n  margin-top: 34px;\n  margin-bottom: 34px;\n}\n\n.hero-copy > .hero-text {\n  margin-top: 0;\n  margin-bottom: 18px;\n}\n\n.hero-copy > .hero-text:first-of-type {\n  color: var(--iml-ink-soft, #294150);\n  font-size: clamp(18px, 1.55vw, 21px);\n  line-height: 1.72;\n}\n\n.hero-copy > .hero-text + .hero-text {\n  max-width: 700px;\n  color: var(--iml-muted, #5a6d78);\n  font-size: 16px;\n}\n\n.hero-copy > .note-box {\n  position: relative;\n  margin-top: 30px;\n  padding: 24px 26px;\n  overflow: hidden;\n}\n\n.hero-copy > .note-box::after {\n  content: \"\";\n  position: absolute;\n  right: -46px;\n  bottom: -54px;\n  width: 138px;\n  height: 138px;\n  border: 1px solid rgba(36, 111, 120, 0.11);\n  border-radius: 50%;\n}\n\n.hero-copy > .note-box p {\n  position: relative;\n  z-index: 1;\n  max-width: 720px;\n  color: var(--iml-ink-soft, #294150);\n  font-size: 15px;\n  font-weight: 650;\n  line-height: 1.68;\n}\n\n.hero-copy > .button-row {\n  margin-top: 28px;\n}\n\n.hero-copy > .metric-grid {\n  position: relative;\n  margin-top: 38px;\n  padding-top: 24px;\n}\n\n.hero-copy > .metric-grid::before {\n  content: \"\";\n  position: absolute;\n  top: 0;\n  left: 0;\n  right: 0;\n  height: 1px;\n  background: linear-gradient(\n    90deg,\n    rgba(36, 111, 120, 0.26),\n    rgba(36, 111, 120, 0.04)\n  );\n}\n\n.hero-copy > .metric-grid .metric-card {\n  min-height: 128px;\n  box-shadow: 0 12px 30px rgba(16, 45, 66, 0.055);\n}\n\n.hero .overview-card {\n  position: sticky;\n  top: 96px;\n  overflow: hidden;\n  min-height: 100%;\n}\n\n.hero .overview-card::before {\n  content: \"\";\n  position: absolute;\n  top: -100px;\n  right: -85px;\n  width: 230px;\n  height: 230px;\n  border-radius: 50%;\n  background:\n    radial-gradient(\n      circle,\n      rgba(36, 111, 120, 0.11) 0%,\n      rgba(36, 111, 120, 0.035) 48%,\n      transparent 72%\n    );\n  pointer-events: none;\n}\n\n.hero .overview-top {\n  position: relative;\n  z-index: 1;\n  align-items: flex-start;\n  padding-bottom: 23px;\n  border-bottom: 1px solid rgba(36, 111, 120, 0.14);\n}\n\n.hero .overview-title {\n  max-width: 270px;\n  margin-top: 5px;\n  font-family: \"Iowan Old Style\", \"Palatino Linotype\", \"Book Antiqua\", Georgia, serif;\n  font-size: clamp(1.55rem, 2vw, 2.05rem);\n  font-weight: 650;\n  line-height: 1.08;\n}\n\n.hero .overview-card .tile-grid.three-up {\n  position: relative;\n  z-index: 1;\n  grid-template-columns: 1fr;\n  gap: 0;\n  margin-top: 8px;\n}\n\n.hero .overview-card .mini-tile {\n  position: relative;\n  border: 0;\n  border-bottom: 1px solid rgba(36, 111, 120, 0.13);\n  border-radius: 0;\n  background: transparent;\n  padding: 23px 6px 23px 42px;\n}\n\n.hero .overview-card .mini-tile:last-child {\n  border-bottom: 0;\n}\n\n.hero .overview-card .mini-tile::before {\n  content: \"\";\n  position: absolute;\n  top: 28px;\n  left: 7px;\n  width: 18px;\n  height: 18px;\n  border: 1px solid rgba(36, 111, 120, 0.34);\n  border-radius: 50%;\n  background:\n    radial-gradient(\n      circle,\n      var(--iml-teal, #246f78) 0 3px,\n      transparent 4px\n    );\n}\n\n.hero .overview-card .mini-tile-title {\n  margin-bottom: 7px;\n  color: var(--iml-navy, #102d42);\n  font-size: 14px;\n  letter-spacing: 0.01em;\n}\n\n.hero .overview-card .mini-tile-text {\n  max-width: 330px;\n  color: var(--iml-muted, #5a6d78);\n  line-height: 1.62;\n}\n\n.hero + .section {\n  position: relative;\n  z-index: 2;\n  padding-top: 0;\n  padding-bottom: 88px;\n  background: transparent;\n}\n\n.hero + .section .container {\n  transform: translateY(-28px);\n}\n\n.hero + .section .soft-card {\n  position: relative;\n  overflow: hidden;\n  border-color: rgba(36, 111, 120, 0.18);\n  background:\n    linear-gradient(\n      125deg,\n      rgba(255, 255, 255, 0.98),\n      rgba(235, 244, 245, 0.96)\n    );\n  box-shadow: 0 24px 60px rgba(16, 45, 66, 0.095);\n}\n\n.hero + .section .soft-card::after {\n  content: \"\";\n  position: absolute;\n  top: 0;\n  right: 0;\n  width: min(32%, 320px);\n  height: 100%;\n  background:\n    linear-gradient(\n      135deg,\n      transparent,\n      rgba(36, 111, 120, 0.055)\n    );\n  clip-path: polygon(38% 0, 100% 0, 100% 100%, 0 100%);\n  pointer-events: none;\n}\n\n.hero + .section .content-block {\n  position: relative;\n  z-index: 1;\n  display: grid;\n  grid-template-columns: minmax(170px, 0.34fr) minmax(0, 1.66fr);\n  column-gap: clamp(28px, 5vw, 72px);\n  align-items: start;\n  padding: clamp(30px, 4vw, 48px);\n}\n\n.hero + .section .content-block .section-badge {\n  grid-column: 1;\n  grid-row: 1 / span 2;\n  justify-self: start;\n  margin: 2px 0 0;\n}\n\n.hero + .section .content-block h3 {\n  grid-column: 2;\n  margin-bottom: 13px;\n  font-family: \"Iowan Old Style\", \"Palatino Linotype\", \"Book Antiqua\", Georgia, serif;\n  font-size: clamp(1.55rem, 2.3vw, 2.25rem);\n  font-weight: 650;\n  line-height: 1.12;\n}\n\n.hero + .section .content-block p {\n  grid-column: 2;\n  max-width: 780px;\n  margin: 0;\n  color: var(--iml-muted, #5a6d78);\n  font-size: 16px;\n  line-height: 1.74;\n}\n\n@media (max-width: 1100px) {\n  .hero .hero-grid {\n    grid-template-columns: 1fr;\n    gap: 34px;\n  }\n\n  .hero .overview-card {\n    position: relative;\n    top: auto;\n    min-height: auto;\n  }\n\n  .hero .overview-card .tile-grid.three-up {\n    grid-template-columns: repeat(3, minmax(0, 1fr));\n    gap: 14px;\n    margin-top: 20px;\n  }\n\n  .hero .overview-card .mini-tile {\n    border: 1px solid rgba(36, 111, 120, 0.13);\n    border-radius: 15px;\n    padding: 20px;\n  }\n\n  .hero .overview-card .mini-tile::before {\n    display: none;\n  }\n}\n\n@media (max-width: 820px) {\n  .hero::before {\n    top: 90px;\n    right: -230px;\n  }\n\n  .hero-copy {\n    padding-left: 0;\n  }\n\n  .hero-copy::before {\n    display: none;\n  }\n\n  .hero-copy > .principle-stack {\n    margin-top: 28px;\n    margin-bottom: 28px;\n  }\n\n  .hero-copy > .metric-grid {\n    margin-top: 30px;\n  }\n\n  .hero .overview-card .tile-grid.three-up {\n    grid-template-columns: 1fr;\n    gap: 0;\n  }\n\n  .hero .overview-card .mini-tile {\n    border: 0;\n    border-bottom: 1px solid rgba(36, 111, 120, 0.13);\n    border-radius: 0;\n    padding: 20px 4px;\n  }\n\n  .hero + .section {\n    padding-bottom: 62px;\n  }\n\n  .hero + .section .container {\n    transform: translateY(-16px);\n  }\n\n  .hero + .section .content-block {\n    grid-template-columns: 1fr;\n    gap: 13px;\n    padding: 27px 24px;\n  }\n\n  .hero + .section .content-block .section-badge,\n  .hero + .section .content-block h3,\n  .hero + .section .content-block p {\n    grid-column: 1;\n    grid-row: auto;\n  }\n\n  .hero + .section .content-block .section-badge {\n    margin-bottom: 2px;\n  }\n}\n\n@media (prefers-reduced-motion: reduce) {\n  .hero + .section .container {\n    transform: none;\n  }\n}\n\n/* =========================================================\n   IML visual refresh — Palier 3\n   World Map, country profiles and evidence presentation only.\n   No text, route, API, score, source or PostgreSQL change.\n   Append after Paliers 1 and 2 in src/App.css.\n   ========================================================= */\n\n/* ---------- Global Map frame ---------- */\n\n.world-box {\n  position: relative;\n  isolation: isolate;\n  overflow: hidden;\n  border-color: rgba(36, 111, 120, 0.18);\n  background:\n    radial-gradient(circle at 82% 14%, rgba(36, 111, 120, 0.10), transparent 24rem),\n    linear-gradient(180deg, #fbfdfe 0%, #edf4f5 100%);\n  box-shadow:\n    0 28px 72px rgba(16, 45, 66, 0.11),\n    inset 0 1px 0 rgba(255,255,255,0.92);\n}\n\n.world-box::before {\n  content: \"\";\n  position: absolute;\n  z-index: -1;\n  top: -170px;\n  right: -160px;\n  width: 390px;\n  height: 390px;\n  border: 1px solid rgba(36, 111, 120, 0.11);\n  border-radius: 50%;\n  box-shadow:\n    0 0 0 44px rgba(36, 111, 120, 0.025),\n    0 0 0 88px rgba(36, 111, 120, 0.015);\n  pointer-events: none;\n}\n\n.world-box-head {\n  position: relative;\n  z-index: 2;\n  align-items: flex-start;\n  margin-bottom: 18px;\n  padding: 4px 4px 18px;\n  border-bottom: 1px solid rgba(36, 111, 120, 0.14);\n}\n\n.world-box-head .overview-title {\n  margin-top: 4px;\n  font-family: \"Iowan Old Style\", \"Palatino Linotype\", \"Book Antiqua\", Georgia, serif;\n  color: var(--iml-navy, #102d42);\n  font-size: clamp(1.42rem, 2vw, 2rem);\n  font-weight: 650;\n  line-height: 1.1;\n}\n\n.world-box-head .helper-pill {\n  max-width: 310px;\n  border-color: rgba(36, 111, 120, 0.18);\n  background: rgba(255,255,255,0.74);\n  color: var(--iml-muted, #5a6d78);\n  line-height: 1.45;\n  backdrop-filter: blur(10px);\n}\n\n.world-map-wrap {\n  position: relative;\n  overflow: hidden;\n  border: 1px solid rgba(36, 111, 120, 0.13);\n  border-radius: 20px;\n  background:\n    linear-gradient(180deg, rgba(255,255,255,0.76), rgba(238,246,247,0.92));\n  box-shadow:\n    inset 0 1px 0 rgba(255,255,255,0.90),\n    inset 0 -22px 60px rgba(16, 45, 66, 0.035);\n}\n\n.world-map {\n  display: block;\n  filter: saturate(0.94) contrast(1.015);\n}\n\n.country-shape {\n  transition:\n    fill 160ms ease,\n    stroke 160ms ease,\n    opacity 160ms ease,\n    filter 160ms ease,\n    transform 160ms ease;\n  transform-box: fill-box;\n  transform-origin: center;\n}\n\n.country-shape:not(.country-shape-profile) {\n  opacity: 0.82;\n}\n\n.country-shape-profile {\n  opacity: 1;\n}\n\n.country-shape:hover,\n.country-shape:focus-visible {\n  opacity: 1;\n  filter: brightness(0.98) saturate(1.08);\n}\n\n.country-shape-profile:hover,\n.country-shape-profile:focus-visible {\n  stroke: var(--iml-navy, #102d42);\n  stroke-width: 1.45;\n}\n\n.country-shape-selected {\n  filter:\n    drop-shadow(0 0 6px rgba(213, 148, 34, 0.55))\n    drop-shadow(0 8px 13px rgba(146, 64, 14, 0.15));\n}\n\n.map-tooltip-floating {\n  overflow: hidden;\n  min-width: 168px;\n  border-color: rgba(36, 111, 120, 0.20);\n  border-radius: 14px;\n  background: rgba(255,255,255,0.96);\n  padding: 11px 13px;\n  box-shadow: 0 18px 44px rgba(16,45,66,0.17);\n  backdrop-filter: blur(12px);\n}\n\n.map-tooltip-floating::before {\n  content: \"\";\n  position: absolute;\n  inset: 0 auto 0 0;\n  width: 3px;\n  background: var(--iml-teal, #246f78);\n}\n\n.map-tooltip-floating strong {\n  color: var(--iml-navy, #102d42);\n  font-size: 13px;\n}\n\n.map-tooltip-floating span {\n  margin-top: 2px;\n  color: var(--iml-muted, #5a6d78);\n  font-size: 11px;\n}\n\n.map-legend {\n  position: relative;\n  z-index: 2;\n  justify-content: space-between;\n  gap: 12px;\n  margin-top: 16px;\n  padding: 0 3px 2px;\n  color: var(--iml-muted, #5a6d78);\n}\n\n.legend-swatches {\n  flex: 1 1 180px;\n  max-width: 220px;\n  border-color: rgba(36, 111, 120, 0.16);\n  box-shadow: inset 0 0 0 1px rgba(255,255,255,0.62);\n}\n\n.legend-selected {\n  margin-left: auto;\n  color: #8a4c08;\n  font-size: 11px;\n}\n\n.legend-selected-swatch {\n  box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.12);\n}\n\n/* ---------- Selected country profile ---------- */\n\n.profile-grid {\n  align-items: start;\n  gap: 24px;\n}\n\n.profile-grid > .card:first-child {\n  position: sticky;\n  top: 92px;\n  overflow: hidden;\n  border-color: rgba(36, 111, 120, 0.18);\n  background:\n    radial-gradient(circle at 82% 8%, rgba(36, 111, 120, 0.09), transparent 17rem),\n    linear-gradient(160deg, #ffffff 0%, #f5f9fa 100%);\n}\n\n.profile-grid > .card:first-child::after {\n  content: \"\";\n  position: absolute;\n  right: -56px;\n  bottom: -72px;\n  width: 180px;\n  height: 180px;\n  border: 1px solid rgba(36, 111, 120, 0.10);\n  border-radius: 50%;\n  pointer-events: none;\n}\n\n.profile-grid > .card:first-child .content-block {\n  position: relative;\n  z-index: 1;\n}\n\n.profile-head {\n  align-items: flex-start;\n  padding-bottom: 18px;\n  border-bottom: 1px solid rgba(36, 111, 120, 0.13);\n}\n\n.profile-title-row {\n  gap: 12px;\n  margin-top: 4px;\n}\n\n.profile-title-row h3 {\n  font-family: \"Iowan Old Style\", \"Palatino Linotype\", \"Book Antiqua\", Georgia, serif;\n  color: var(--iml-navy, #102d42);\n  font-size: clamp(1.8rem, 2.8vw, 2.7rem);\n  font-weight: 650;\n  line-height: 1.04;\n}\n\n.score-pill {\n  border: 1px solid rgba(255,255,255,0.18);\n  box-shadow: 0 8px 18px rgba(16,45,66,0.14);\n}\n\n.profile-grid .muted-copy {\n  margin-top: 18px;\n  margin-bottom: 6px;\n  color: var(--iml-muted, #5a6d78);\n  line-height: 1.68;\n}\n\n.hex-chart {\n  max-width: 420px;\n  margin-top: 10px;\n  margin-bottom: 8px;\n  filter: drop-shadow(0 10px 22px rgba(16,45,66,0.045));\n}\n\n.profile-stat-grid {\n  gap: 9px;\n  margin-top: 6px;\n}\n\n.profile-stat {\n  position: relative;\n  overflow: hidden;\n  min-height: 58px;\n  border-color: rgba(36, 111, 120, 0.14);\n  background: rgba(255,255,255,0.77);\n  transition:\n    transform 160ms ease,\n    border-color 160ms ease,\n    box-shadow 160ms ease;\n}\n\n.profile-stat::before {\n  content: \"\";\n  position: absolute;\n  inset: 0 auto 0 0;\n  width: 3px;\n  background: rgba(36, 111, 120, 0.50);\n}\n\n.profile-stat:hover {\n  transform: translateY(-1px);\n  border-color: rgba(36, 111, 120, 0.28);\n  box-shadow: 0 9px 22px rgba(16,45,66,0.075);\n}\n\n.profile-stat span {\n  color: var(--iml-muted, #5a6d78);\n  font-size: 11px;\n  font-weight: 750;\n  letter-spacing: 0.02em;\n}\n\n.profile-stat strong {\n  color: var(--iml-navy, #102d42);\n  font-size: 18px;\n}\n\n/* ---------- Evidence and supporting cards ---------- */\n\n.profile-grid > .stack-layout {\n  gap: 18px;\n}\n\n.profile-grid > .stack-layout > .card {\n  border-radius: 18px;\n  box-shadow: 0 14px 34px rgba(16,45,66,0.06);\n}\n\n.profile-grid > .stack-layout > .card:nth-child(2) {\n  border-left: 4px solid rgba(36, 111, 120, 0.62);\n}\n\n.profile-grid > .stack-layout > .card:nth-child(3) {\n  border-left: 4px solid rgba(213, 148, 34, 0.62);\n}\n\n.database-stat-grid {\n  gap: 10px;\n}\n\n.database-stat {\n  min-height: 62px;\n  border-color: rgba(36, 111, 120, 0.14);\n  border-radius: 14px;\n  background: rgba(255,255,255,0.82);\n  box-shadow: inset 0 1px 0 rgba(255,255,255,0.88);\n}\n\n.database-stat span {\n  color: var(--iml-muted, #5a6d78);\n  font-size: 11px;\n  font-weight: 750;\n  letter-spacing: 0.02em;\n}\n\n.database-stat strong {\n  color: var(--iml-navy, #102d42);\n  font-size: 21px;\n}\n\n.evidence-level-row,\n.source-audit-line {\n  gap: 7px;\n}\n\n.evidence-level-row span,\n.source-audit-line span {\n  border-color: rgba(36, 111, 120, 0.16);\n  background: var(--iml-teal-soft, #dcebed);\n  color: var(--iml-teal, #246f78);\n}\n\n.profile-grid details.list-box {\n  overflow: hidden;\n  border-color: rgba(36, 111, 120, 0.15);\n  border-radius: 15px;\n  background: rgba(255,255,255,0.80);\n  padding: 0;\n  transition:\n    border-color 160ms ease,\n    box-shadow 160ms ease,\n    background 160ms ease;\n}\n\n.profile-grid details.list-box[open] {\n  border-color: rgba(36, 111, 120, 0.28);\n  background: #ffffff;\n  box-shadow: 0 14px 32px rgba(16,45,66,0.075);\n}\n\n.profile-grid details.list-box > summary {\n  position: relative;\n  list-style: none;\n  padding: 17px 48px 17px 18px;\n  color: var(--iml-navy, #102d42);\n  line-height: 1.45;\n}\n\n.profile-grid details.list-box > summary::-webkit-details-marker {\n  display: none;\n}\n\n.profile-grid details.list-box > summary::after {\n  content: \"+\";\n  position: absolute;\n  top: 50%;\n  right: 17px;\n  display: grid;\n  width: 24px;\n  height: 24px;\n  place-items: center;\n  transform: translateY(-50%);\n  border: 1px solid rgba(36, 111, 120, 0.18);\n  border-radius: 50%;\n  background: rgba(255,255,255,0.80);\n  color: var(--iml-teal, #246f78);\n  font-size: 16px;\n  font-weight: 700;\n}\n\n.profile-grid details.list-box[open] > summary::after {\n  content: \"−\";\n}\n\n.profile-grid details.list-box > .top-gap-small {\n  margin-top: 0;\n  padding: 0 18px 18px;\n  border-top: 1px solid rgba(36, 111, 120, 0.11);\n}\n\n.profile-grid details.list-box .mini-tile {\n  border-color: rgba(36, 111, 120, 0.13);\n  background: #f7fafb;\n}\n\n.profile-grid details.list-box .button-row {\n  margin-top: 16px;\n}\n\n/* ---------- Explanation report entry point ---------- */\n\n.country-report {\n  border-color: rgba(36, 111, 120, 0.18);\n  border-radius: 18px;\n  box-shadow: 0 16px 38px rgba(16,45,66,0.075);\n}\n\n.country-report > summary {\n  position: relative;\n  overflow: hidden;\n  padding: 22px 78px 22px 26px;\n  background:\n    linear-gradient(120deg, rgba(255,255,255,0.98), rgba(235,244,245,0.94));\n  color: var(--iml-navy, #102d42);\n}\n\n.country-report > summary::before {\n  content: \"\";\n  position: absolute;\n  inset: 0 auto 0 0;\n  width: 4px;\n  background: var(--iml-teal, #246f78);\n}\n\n.country-report > summary::after {\n  right: 22px;\n  background: var(--iml-navy, #102d42);\n  box-shadow: 0 7px 18px rgba(16,45,66,0.14);\n}\n\n.country-report[open] > summary {\n  background: #f3f8f8;\n}\n\n.report-body {\n  background:\n    linear-gradient(180deg, #ffffff 0%, #f8fbfb 100%);\n}\n\n.report-heading {\n  padding-bottom: 20px;\n  border-bottom: 1px solid rgba(36, 111, 120, 0.14);\n}\n\n.report-heading h2 {\n  font-family: \"Iowan Old Style\", \"Palatino Linotype\", \"Book Antiqua\", Georgia, serif;\n  color: var(--iml-navy, #102d42);\n}\n\n.report-domain,\n.report-source {\n  border-color: rgba(36, 111, 120, 0.14);\n  border-radius: 15px;\n  box-shadow: 0 8px 22px rgba(16,45,66,0.04);\n}\n\n.report-domain {\n  background: #f5f9fa;\n}\n\n.report-disclaimer {\n  border-left-color: var(--iml-teal, #246f78);\n  color: var(--iml-muted, #5a6d78);\n}\n\n/* ---------- Empty country state ---------- */\n\n.map-empty {\n  position: relative;\n  overflow: hidden;\n  min-height: 210px;\n}\n\n.map-empty::after {\n  content: \"\";\n  position: absolute;\n  right: -66px;\n  bottom: -76px;\n  width: 190px;\n  height: 190px;\n  border: 1px solid rgba(36, 111, 120, 0.12);\n  border-radius: 50%;\n}\n\n/* ---------- Responsive behaviour ---------- */\n\n@media (max-width: 1100px) {\n  .profile-grid > .card:first-child {\n    position: relative;\n    top: auto;\n  }\n\n  .map-legend {\n    justify-content: flex-start;\n    flex-wrap: wrap;\n  }\n\n  .legend-selected {\n    margin-left: 0;\n  }\n}\n\n@media (max-width: 820px) {\n  .world-box {\n    padding: 14px;\n    border-radius: 19px;\n  }\n\n  .world-box-head {\n    padding-bottom: 14px;\n  }\n\n  .world-map-wrap {\n    border-radius: 15px;\n  }\n\n  .map-tooltip-floating {\n    display: none;\n  }\n\n  .map-legend {\n    gap: 8px;\n    font-size: 10px;\n  }\n\n  .legend-swatches {\n    order: 3;\n    flex-basis: 100%;\n    max-width: none;\n  }\n\n  .profile-grid > .card:first-child .content-block {\n    padding: 22px;\n  }\n\n  .profile-title-row {\n    align-items: flex-start;\n    flex-direction: column;\n  }\n\n  .profile-stat-grid {\n    grid-template-columns: repeat(2, minmax(0, 1fr));\n  }\n\n  .country-report > summary {\n    align-items: flex-start;\n    padding: 19px 72px 19px 20px;\n    line-height: 1.4;\n  }\n\n  .report-body {\n    padding: 22px;\n  }\n}\n\n@media (max-width: 520px) {\n  .profile-stat-grid {\n    grid-template-columns: 1fr;\n  }\n\n  .database-stat-grid {\n    grid-template-columns: 1fr;\n  }\n}\n\n@media (prefers-reduced-motion: reduce) {\n  .country-shape,\n  .profile-stat,\n  .profile-grid details.list-box {\n    transition: none;\n  }\n}\n\n/* =========================================================\n   IML visual refresh — Palier 4\n   Responsive refinement, accessibility and final polish.\n   CSS only. No text, route, API, score, source or database change.\n   ========================================================= */\n\n/* ---------- Global resilience ---------- */\n\n:root {\n  color-scheme: light;\n  text-rendering: optimizeLegibility;\n  -webkit-font-smoothing: antialiased;\n  -moz-osx-font-smoothing: grayscale;\n}\n\nhtml {\n  min-width: 320px;\n  scroll-padding-top: 96px;\n}\n\nbody {\n  min-width: 320px;\n  overflow-x: hidden;\n}\n\n.app-shell {\n  min-height: 100dvh;\n}\n\nimg,\nsvg {\n  max-width: 100%;\n}\n\nbutton,\na,\nselect,\nsummary {\n  -webkit-tap-highlight-color: transparent;\n}\n\nbutton,\n.nav-button,\n.primary-button,\n.secondary-button,\n.brand-button,\n.text-link,\n.country-shape,\n.country-report > summary,\n.profile-grid details.list-box > summary {\n  touch-action: manipulation;\n}\n\nh1,\nh2,\nh3,\np,\nli,\na,\nspan {\n  overflow-wrap: anywhere;\n}\n\n.section,\n.hero,\n.country-report,\n.world-box {\n  scroll-margin-top: 96px;\n}\n\n::selection {\n  background: rgba(36, 111, 120, 0.20);\n  color: var(--iml-navy, #102d42);\n}\n\n/* ---------- Keyboard focus ---------- */\n\n:where(\n  button,\n  a,\n  select,\n  textarea,\n  input,\n  summary,\n  [tabindex]:not([tabindex=\"-1\"])\n):focus {\n  outline: none;\n}\n\n:where(\n  button,\n  a,\n  select,\n  textarea,\n  input,\n  summary,\n  [tabindex]:not([tabindex=\"-1\"])\n):focus-visible {\n  outline: 3px solid rgba(36, 111, 120, 0.42);\n  outline-offset: 3px;\n  box-shadow: 0 0 0 5px rgba(220, 235, 237, 0.76);\n}\n\n.country-shape:focus-visible {\n  outline: none;\n  stroke: var(--iml-navy, #102d42);\n  stroke-width: 2.2;\n  filter:\n    drop-shadow(0 0 4px rgba(36, 111, 120, 0.44))\n    brightness(0.98);\n}\n\n.text-link {\n  text-decoration-thickness: 1.5px;\n  text-underline-offset: 4px;\n}\n\n.text-link:focus-visible {\n  border-radius: 4px;\n}\n\n/* ---------- Header and navigation ---------- */\n\n.topbar {\n  padding-top: env(safe-area-inset-top, 0px);\n}\n\n.topbar-inner {\n  min-height: 72px;\n}\n\n.brand-button {\n  min-height: 48px;\n  border-radius: 14px;\n}\n\n.nav-button,\n.primary-button,\n.secondary-button {\n  min-height: 44px;\n}\n\n.mobile-nav {\n  scrollbar-width: thin;\n  scrollbar-color: rgba(36, 111, 120, 0.35) transparent;\n  overscroll-behavior-x: contain;\n}\n\n.mobile-nav::-webkit-scrollbar {\n  height: 5px;\n}\n\n.mobile-nav::-webkit-scrollbar-thumb {\n  border-radius: 999px;\n  background: rgba(36, 111, 120, 0.28);\n}\n\n.mobile-nav::-webkit-scrollbar-track {\n  background: transparent;\n}\n\n/* ---------- Interaction polish ---------- */\n\n.primary-button,\n.secondary-button,\n.nav-button,\n.card,\n.profile-stat,\n.database-stat,\n.mini-tile {\n  will-change: auto;\n}\n\n.primary-button:active,\n.secondary-button:active,\n.nav-button:active {\n  transform: translateY(0);\n}\n\n.brand-button:hover .logo-box {\n  border-color: rgba(36, 111, 120, 0.30);\n  box-shadow: 0 12px 28px rgba(16, 45, 66, 0.11);\n}\n\n.card,\n.world-box,\n.country-report,\n.list-box,\n.mini-tile,\n.database-stat,\n.profile-stat {\n  backface-visibility: hidden;\n}\n\n.mail-box,\n.code-box,\n.list-box,\n.report-source-meta,\n.report-domain p,\n.report-source,\n.mini-tile-text {\n  overflow-wrap: anywhere;\n}\n\n/* ---------- Form and control clarity ---------- */\n\nselect,\ninput,\ntextarea {\n  min-height: 44px;\n}\n\nselect:hover,\ninput:hover,\ntextarea:hover {\n  border-color: rgba(36, 111, 120, 0.34);\n}\n\nselect:focus-visible,\ninput:focus-visible,\ntextarea:focus-visible {\n  border-color: var(--iml-teal, #246f78);\n}\n\nbutton:disabled,\n.primary-button[aria-disabled=\"true\"],\n.secondary-button[aria-disabled=\"true\"] {\n  cursor: not-allowed;\n  opacity: 0.55;\n  transform: none;\n  box-shadow: none;\n}\n\n/* ---------- Reading comfort ---------- */\n\n.content-block p,\n.hero-text,\n.section-heading p,\n.footer-copy,\n.mini-tile-text,\n.report-domain p,\n.report-domain-evidence li,\n.report-source-meta,\n.plain-list li,\n.compact-list li {\n  hanging-punctuation: first last;\n}\n\n.plain-list li + li,\n.compact-list li + li {\n  margin-top: 5px;\n}\n\n.report-section h3,\n.content-block h3,\n.value-card h3 {\n  text-wrap: balance;\n}\n\n.report-source-title,\n.mini-tile-title,\n.metric-title,\n.profile-stat span,\n.database-stat span {\n  line-height: 1.35;\n}\n\n/* ---------- Tablet refinement ---------- */\n\n@media (max-width: 1100px) {\n  .topbar-inner {\n    min-height: 68px;\n  }\n\n  .hero-grid,\n  .split-grid,\n  .profile-grid {\n    gap: 24px;\n  }\n\n  .hero .overview-card {\n    max-width: none;\n  }\n\n  .profile-grid > .stack-layout {\n    gap: 16px;\n  }\n\n  .world-box-head {\n    gap: 14px;\n  }\n\n  .report-heading {\n    gap: 14px;\n  }\n}\n\n/* ---------- Mobile refinement ---------- */\n\n@media (max-width: 820px) {\n  html {\n    scroll-padding-top: 138px;\n  }\n\n  .section,\n  .hero,\n  .country-report,\n  .world-box {\n    scroll-margin-top: 138px;\n  }\n\n  .topbar {\n    backdrop-filter: blur(14px);\n  }\n\n  .topbar-inner {\n    min-height: 64px;\n    padding: 10px 0 8px;\n  }\n\n  .logo-box {\n    width: 46px;\n    height: 46px;\n    border-radius: 13px;\n  }\n\n  .logo-svg {\n    width: 42px;\n    height: 42px;\n  }\n\n  .brand-title {\n    max-width: 190px;\n    font-size: 12px;\n    line-height: 1.25;\n  }\n\n  .mobile-nav {\n    gap: 7px;\n    padding: 0 0 10px;\n    flex-wrap: nowrap;\n  }\n\n  .mobile-nav .nav-button {\n    flex: 0 0 auto;\n    min-height: 40px;\n    padding: 8px 12px;\n    white-space: nowrap;\n  }\n\n  .container {\n    width: min(100% - 28px, 1220px);\n  }\n\n  .hero-copy h1 {\n    font-size: clamp(2.45rem, 11vw, 3.45rem);\n    line-height: 1.01;\n  }\n\n  .hero-text,\n  .section-heading p {\n    font-size: 16px;\n    line-height: 1.68;\n  }\n\n  .section-heading h2 {\n    font-size: clamp(2rem, 9vw, 2.75rem);\n  }\n\n  .card,\n  .world-box,\n  .country-report {\n    border-radius: 18px;\n  }\n\n  .content-block,\n  .overview-card,\n  .report-body {\n    padding: 23px;\n  }\n\n  .button-row,\n  .form-actions {\n    align-items: stretch;\n  }\n\n  .button-row .primary-button,\n  .button-row .secondary-button,\n  .form-actions .primary-button,\n  .form-actions .secondary-button {\n    flex: 1 1 220px;\n    text-align: center;\n  }\n\n  .metric-grid.two-up,\n  .tile-grid,\n  .tile-grid.three-up,\n  .form-grid,\n  .report-score-grid {\n    gap: 14px;\n  }\n\n  .metric-card {\n    min-height: auto;\n    padding: 20px;\n  }\n\n  .metric-value {\n    font-size: 24px;\n  }\n\n  .world-box-head {\n    display: grid;\n    grid-template-columns: 1fr;\n  }\n\n  .world-box-head .helper-pill {\n    display: none;\n  }\n\n  .world-map-wrap {\n    min-height: 250px;\n    aspect-ratio: 16 / 10;\n  }\n\n  .world-map {\n    min-width: 680px;\n    transform: translateX(-11%);\n  }\n\n  .world-map-wrap {\n    overflow-x: auto;\n    scrollbar-width: thin;\n    scrollbar-color: rgba(36, 111, 120, 0.28) transparent;\n  }\n\n  .world-map-wrap::-webkit-scrollbar {\n    height: 5px;\n  }\n\n  .world-map-wrap::-webkit-scrollbar-thumb {\n    border-radius: 999px;\n    background: rgba(36, 111, 120, 0.28);\n  }\n\n  .map-legend {\n    align-items: flex-start;\n  }\n\n  .profile-grid > .card:first-child {\n    position: relative;\n  }\n\n  .profile-stat-grid,\n  .database-stat-grid {\n    gap: 8px;\n  }\n\n  .profile-stat,\n  .database-stat {\n    min-height: 54px;\n  }\n\n  .country-report > summary {\n    min-height: 64px;\n  }\n\n  .report-heading h2 {\n    font-size: 1.75rem;\n  }\n\n  .report-overall {\n    min-width: 98px;\n    padding: 12px 14px;\n  }\n\n  .report-overall strong {\n    font-size: 1.45rem;\n  }\n\n  .footer {\n    margin-top: 22px;\n  }\n\n  .footer-grid {\n    gap: 22px;\n    padding: 30px 0 calc(30px + env(safe-area-inset-bottom, 0px));\n  }\n}\n\n/* ---------- Small phones ---------- */\n\n@media (max-width: 520px) {\n  .container {\n    width: min(100% - 22px, 1220px);\n  }\n\n  .hero-grid {\n    padding-top: 44px;\n    padding-bottom: 52px;\n  }\n\n  .section {\n    padding-top: 52px;\n    padding-bottom: 52px;\n  }\n\n  .section-badge {\n    max-width: 100%;\n    white-space: normal;\n    line-height: 1.35;\n  }\n\n  .hero-copy h1 {\n    font-size: clamp(2.18rem, 12vw, 3rem);\n  }\n\n  .principle-line {\n    font-size: 11px;\n  }\n\n  .content-block,\n  .overview-card,\n  .report-body {\n    padding: 20px;\n  }\n\n  .metric-card {\n    align-items: flex-start;\n  }\n\n  .metric-symbol {\n    width: 40px;\n    height: 40px;\n    border-radius: 12px;\n  }\n\n  .primary-button,\n  .secondary-button {\n    width: 100%;\n  }\n\n  .world-box {\n    padding: 10px;\n  }\n\n  .world-map {\n    min-width: 620px;\n    transform: translateX(-14%);\n  }\n\n  .map-legend {\n    font-size: 9px;\n  }\n\n  .legend-selected {\n    width: 100%;\n  }\n\n  .profile-title-row h3 {\n    font-size: 2rem;\n  }\n\n  .profile-stat-grid,\n  .database-stat-grid {\n    grid-template-columns: 1fr;\n  }\n\n  .profile-grid details.list-box > summary {\n    padding-left: 15px;\n  }\n\n  .country-report > summary {\n    padding-left: 18px;\n    font-size: 14px;\n  }\n\n  .report-body {\n    padding: 18px;\n  }\n\n  .mail-box {\n    font-size: 14px;\n  }\n}\n\n/* ---------- Very narrow screens ---------- */\n\n@media (max-width: 370px) {\n  .brand-title {\n    display: none;\n  }\n\n  .hero-copy h1 {\n    font-size: 2.05rem;\n  }\n\n  .content-block,\n  .overview-card,\n  .report-body {\n    padding: 17px;\n  }\n\n  .mobile-nav .nav-button {\n    padding-inline: 10px;\n    font-size: 12px;\n  }\n}\n\n/* ---------- Touch devices ---------- */\n\n@media (hover: none) and (pointer: coarse) {\n  .value-card:hover,\n  .metric-card:hover,\n  .overview-card:hover,\n  .profile-stat:hover,\n  .primary-button:hover,\n  .secondary-button:hover {\n    transform: none;\n  }\n\n  .country-shape:hover {\n    filter: none;\n  }\n}\n\n/* ---------- Reduced motion ---------- */\n\n@media (prefers-reduced-motion: reduce) {\n  html {\n    scroll-behavior: auto;\n  }\n\n  *,\n  *::before,\n  *::after {\n    animation-duration: 0.001ms !important;\n    animation-iteration-count: 1 !important;\n    scroll-behavior: auto !important;\n    transition-duration: 0.001ms !important;\n  }\n}\n\n/* ---------- Increased contrast ---------- */\n\n@media (prefers-contrast: more) {\n  :root {\n    --iml-muted: #3f505a;\n    --iml-line: #aebfc7;\n  }\n\n  .card,\n  .world-box,\n  .country-report,\n  .list-box,\n  .mini-tile,\n  .database-stat,\n  .profile-stat {\n    border-width: 2px;\n  }\n\n  .text-link {\n    text-decoration-thickness: 2px;\n  }\n\n  .nav-button-active,\n  .primary-button,\n  .score-pill,\n  .report-domain-score,\n  .report-overall {\n    background: #071d2b;\n  }\n}\n\n/* ---------- Forced colours ---------- */\n\n@media (forced-colors: active) {\n  .card,\n  .world-box,\n  .country-report,\n  .list-box,\n  .mini-tile,\n  .database-stat,\n  .profile-stat,\n  .logo-box,\n  .mail-box {\n    border: 1px solid CanvasText;\n    box-shadow: none;\n  }\n\n  .nav-button,\n  .primary-button,\n  .secondary-button,\n  .score-pill,\n  .report-domain-score,\n  .report-overall {\n    forced-color-adjust: auto;\n  }\n\n  .country-shape {\n    forced-color-adjust: auto;\n  }\n}\n";

// Keep this replacement self-contained: site-test currently has an incompatible
// App.css left by the abandoned multipage experiment.
if (typeof document !== "undefined") {
  let style = document.getElementById("iml-single-file-styles");
  if (!style) {
    style = document.createElement("style");
    style.id = "iml-single-file-styles";
    document.head.appendChild(style);
  }
  style.textContent = BASE_CSS;
}
const MANUSCRIPT_URL = `${import.meta.env.BASE_URL}IML_Founding_Manuscript.pdf`;
const TECHNICAL_MANUSCRIPT_URL = `${import.meta.env.BASE_URL}IML_Technical_Manuscript.pdf`;

const ROUTES = [
  ["home", "Home"],
  ["id4d", "Identity & Trust"],
  ["evaluation", "From assessment to action"],
  ["methodology", "Methodology"],
  ["world", "World Map"],
  ["manuscripts", "Manuscripts"],
  ["contact", "Scientific Review"],
].map(([key, label]) => ({ key, label }));

const IML_DOMAINS = [
  {
    key: "governance",
    short: "GOV",
    axis: "Governance",
    title: "Governance and Standards",
    description: "Responsibilities, standards, legal clarity and accountable ecosystem governance.",
  },
  {
    key: "technical",
    short: "TEC",
    axis: "Technical",
    title: "Technical Interoperability",
    description: "Secure, reliable and maintainable exchange across heterogeneous systems.",
  },
  {
    key: "identity",
    short: "ID",
    axis: "Identity",
    title: "Identity, Consent and Trust",
    description: "Reliable identification, appropriate consent, provenance and confidence.",
  },
  {
    key: "adoption",
    short: "USE",
    axis: "Adoption",
    title: "Adoption and Use",
    description: "Integration into workflows, training, access rights and professional roles.",
  },
  {
    key: "security",
    short: "SEC",
    axis: "Security",
    title: "Security and Resilience",
    description: "Protection, availability, recovery, traceability and continuity.",
  },
  {
    key: "learning",
    short: "LRN",
    axis: "Learning",
    title: "Feedback, Correction and Learning",
    description: "Correction pathways, evaluation and institutional learning.",
  },
];

const AXES = IML_DOMAINS.map((domain) => domain.axis);
const AXIS_KEYS = IML_DOMAINS.map((domain) => domain.key);
const MAP_WIDTH = 1000;
const MAP_HEIGHT = 500;
const MAP_VISIBLE_HEIGHT = 420;

// Country codes are handled consistently as ISO 3166-1 alpha-3 values.
function normalizeIso3(value) {
  return String(value || "").trim().toUpperCase();
}

const cls = (...items) => items.filter(Boolean).join(" ");
const asArray = (value) => (Array.isArray(value) ? value : []);
const firstDefined = (...values) => values.find((value) => value !== undefined && value !== null && value !== "");

function Card({ children, className = "" }) {
  return <div className={cls("card", className)}>{children}</div>;
}

function LogoMark() {
  return (
    <div className="logo-box">
      <img src={logoImage} className="logo-svg" alt="IML logo" />
    </div>
  );
}

function NavButton({ active, children, onClick }) {
  return (
    <button type="button" onClick={onClick} className={cls("nav-button", active && "nav-button-active")}>
      {children}
    </button>
  );
}

function SectionTitle({ badge, title, text }) {
  return (
    <div className="section-heading">
      {badge ? <div className="section-badge">{badge}</div> : null}
      <h2>{title}</h2>
      <p>{text}</p>
    </div>
  );
}

function MetricCard({ symbol, title, value, subtitle }) {
  return (
    <Card className="metric-card">
      <div className="metric-symbol">{symbol}</div>
      <div>
        <div className="metric-title">{title}</div>
        <div className="metric-value">{value}</div>
        <div className="metric-subtitle">{subtitle}</div>
      </div>
    </Card>
  );
}

function polar(angle, radius, center) {
  const rad = (angle - 90) * (Math.PI / 180);
  return { x: center + radius * Math.cos(rad), y: center + radius * Math.sin(rad) };
}

function HexagonChart({ values }) {
  const size = 360;
  const center = size / 2;
  const radius = 118;
  const safe = AXES.map((_, index) => Math.max(0, Math.min(100, Number(values?.[index]) || 0)));
  const polygon = (scale) =>
    AXES.map((_, index) => {
      const point = polar((360 / AXES.length) * index, radius * scale, center);
      return `${point.x},${point.y}`;
    }).join(" ");
  const data = safe.map((value, index) => {
    const point = polar((360 / AXES.length) * index, radius * (value / 100), center);
    return `${point.x},${point.y}`;
  }).join(" ");

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="hex-chart" aria-label="IML six-domain profile">
      {Array.from({ length: 5 }).map((_, index) => (
        <polygon key={index} points={polygon((index + 1) / 5)} fill="none" stroke="#d8dee7" strokeWidth="1" />
      ))}
      {AXES.map((axis, index) => {
        const end = polar((360 / AXES.length) * index, radius, center);
        const label = polar((360 / AXES.length) * index, radius + 30, center);
        return (
          <g key={axis}>
            <line x1={center} y1={center} x2={end.x} y2={end.y} stroke="#d8dee7" strokeWidth="1" />
            <text x={label.x} y={label.y} textAnchor="middle" style={{ fontSize: 11, fontWeight: 600, fill: "#64748b" }}>
              {axis}
            </text>
          </g>
        );
      })}
      <polygon points={data} fill="rgba(15,23,42,0.14)" stroke="#0f172a" strokeWidth="2" />
      {safe.map((value, index) => {
        const point = polar((360 / AXES.length) * index, radius * (value / 100), center);
        return <circle key={AXES[index]} cx={point.x} cy={point.y} r="4" fill="#0f172a" />;
      })}
    </svg>
  );
}

function projectCoordinate([longitude, latitude]) {
  return [((longitude + 180) / 360) * MAP_WIDTH, ((90 - latitude) / 180) * MAP_HEIGHT];
}

function ringToPath(coordinates = []) {
  let path = "";
  let previousX = null;
  coordinates.forEach((coordinate, index) => {
    const [x, y] = projectCoordinate(coordinate);
    const dateLine = previousX !== null && Math.abs(x - previousX) > MAP_WIDTH / 2;
    path += index === 0 || dateLine ? ` M ${x.toFixed(2)} ${y.toFixed(2)}` : ` L ${x.toFixed(2)} ${y.toFixed(2)}`;
    previousX = x;
  });
  return path ? `${path} Z` : "";
}

function geometryToPath(geometry) {
  if (geometry?.type === "Polygon") return geometry.coordinates.map(ringToPath).join(" ");
  if (geometry?.type === "MultiPolygon") return geometry.coordinates.flatMap((polygon) => polygon.map(ringToPath)).join(" ");
  return "";
}

function featureIso3(feature) {
  const properties = feature?.properties || {};
  return normalizeIso3(
    properties.iso3 || properties.ISO_A3 || properties.adm0_a3 || properties.ADM0_A3 || ""
  );
}

function featureName(feature) {
  const properties = feature?.properties || {};
  return String(properties.name || properties.NAME || properties.admin || properties.ADMIN || "Unknown country").trim();
}

function isAntarcticaFeature(feature) {
  const properties = feature?.properties || {};
  const name = featureName(feature).toLowerCase();
  const continent = String(properties.continent || properties.CONTINENT || "").toLowerCase();
  return featureIso3(feature) === "ATA" || name.includes("antarctica") || continent === "antarctica";
}

function averageScore(values = []) {
  return values.length ? Math.round(values.reduce((total, value) => total + Number(value || 0), 0) / values.length) : 0;
}

function metricScore(profile, metric = "overall") {
  if (!profile) return null;
  if (metric === "overall") return averageScore(asArray(profile.values));
  const index = AXIS_KEYS.indexOf(metric);
  return index >= 0 ? Number(profile.values?.[index] || 0) : null;
}

function scoreFill(score, hasProfile) {
  if (!hasProfile || score === null) return "#e6edf5";
  if (score >= 85) return "#164e63";
  if (score >= 70) return "#0e7490";
  if (score >= 55) return "#67a8bb";
  if (score >= 40) return "#a8ced8";
  return "#d8e8ed";
}

function normaliseEvidenceLevel(level) {
  const match = String(level || "").toUpperCase().match(/[A-D]/);
  return match ? match[0] : null;
}

function collectIndicators(profile) {
  return asArray(profile?.sources).flatMap((source) =>
    asArray(source.indicators).map((indicator) => ({ ...indicator, source }))
  );
}

function evidenceAudit(profile) {
  const sources = asArray(profile?.sources);
  const indicators = collectIndicators(profile);
  const domainCodes = new Set(
    indicators
      .map((indicator) => String(firstDefined(indicator.domain_code, indicator.domain, indicator.code, "")).split(/[.-]/)[0].toUpperCase())
      .filter(Boolean)
  );
  const levels = { A: 0, B: 0, C: 0, D: 0 };
  indicators.forEach((indicator) => {
    const level = normaliseEvidenceLevel(indicator.evidence_level);
    if (level) levels[level] += 1;
  });
  return {
    sourceCount: Number(firstDefined(profile?.source_count, profile?.sources_count, sources.length)),
    evidenceLinkCount: Number(firstDefined(profile?.evidence_link_count, profile?.evidence_links_count, indicators.length)),
    coveredDomainCount: Number(firstDefined(profile?.covered_domain_count, profile?.covered_domains_count, domainCodes.size)),
    levels,
  };
}

function humanLabel(value, fallback = "Not recorded") {
  if (!value) return fallback;
  return String(value).replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(date);
}

function WorldMap({ profiles, selectedCountry, onSelect }) {
  const [hovered, setHovered] = useState(null);
  const profileByIso3 = useMemo(
    () =>
      Object.fromEntries(
        profiles
          .map((profile) => [normalizeIso3(profile?.iso3), profile])
          .filter(([iso3]) => Boolean(iso3))
      ),
    [profiles]
  );

  // Draw Germany last so its border cannot be visually swallowed by neighbouring
  // polygons. This changes layer order only, not geography, scores or behaviour.
  const mapFeatures = useMemo(
    () =>
      worldCountries.features
        .filter((feature) => !isAntarcticaFeature(feature))
        .slice()
        .sort((left, right) => {
          const leftIso3 = featureIso3(left);
          const rightIso3 = featureIso3(right);
          if (leftIso3 === "DEU" && rightIso3 !== "DEU") return 1;
          if (rightIso3 === "DEU" && leftIso3 !== "DEU") return -1;
          return 0;
        }),
    []
  );

  const showTooltip = (event, feature) => {
    const svg = event.currentTarget.ownerSVGElement;
    const bounds = svg.getBoundingClientRect();
    const iso3 = featureIso3(feature);
    const profile = profileByIso3[iso3];
    setHovered({
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
      name: profile?.name || featureName(feature),
      score: metricScore(profile),
      hasProfile: Boolean(profile),
    });
  };

  const selectFeature = (feature) => {
    const iso3 = featureIso3(feature);
    if (!iso3 || iso3 === "-99") return;
    onSelect({ iso3, name: profileByIso3[iso3]?.name || featureName(feature) });
  };

  return (
    <div className="world-box">
      <div className="world-box-head">
        <div>
          <div className="eyebrow">Country profiles</div>
          <div className="overview-title">Evidence-linked country profiles</div>
        </div>
        <div className="helper-pill">Amber outline = selected country, not a score.</div>
      </div>
      <div className="world-map-wrap map-stage" style={{ width: "100%" }}>
        <svg viewBox={`0 0 ${MAP_WIDTH} ${MAP_VISIBLE_HEIGHT}`} className="world-map" style={{ display: "block", width: "100%", minHeight: 430 }} aria-label="Interactive IML world map">
          <rect width={MAP_WIDTH} height={MAP_VISIBLE_HEIGHT} rx="26" fill="#f8fbff" />
          <g>
            {mapFeatures.map((feature) => {
              const iso3 = featureIso3(feature);
              const profile = profileByIso3[iso3];
              const selected = normalizeIso3(selectedCountry?.iso3) === iso3;
              const score = metricScore(profile);
              return (
                <path
                  key={`${iso3}-${featureName(feature)}`}
                  d={geometryToPath(feature.geometry)}
                  className={cls("country-shape", profile && "country-shape-profile", selected && "country-shape-selected")}
                  fill={scoreFill(score, Boolean(profile))}
                  stroke={selected ? "#d97706" : iso3 === "DEU" ? "#64748b" : "#9fb0c4"}
                  strokeWidth={selected ? 2.8 : iso3 === "DEU" ? 1.15 : 0.65}
                  vectorEffect="non-scaling-stroke"
                  data-country-iso3={iso3}
                  tabIndex={iso3 && iso3 !== "-99" ? 0 : undefined}
                  role={iso3 && iso3 !== "-99" ? "button" : undefined}
                  aria-label={`${profile?.name || featureName(feature)}${profile ? ", IML profile available" : ", profile not yet available"}`}
                  onMouseEnter={(event) => showTooltip(event, feature)}
                  onMouseMove={(event) => showTooltip(event, feature)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => selectFeature(feature)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") selectFeature(feature);
                  }}
                >
                  <title>{profile?.name || featureName(feature)}</title>
                </path>
              );
            })}
          </g>
        </svg>
        {hovered ? (
          <div className="map-tooltip-floating" style={{ left: Math.min(hovered.x + 14, 820), top: Math.max(12, hovered.y - 18) }}>
            <strong>{hovered.name}</strong>
            <span>{hovered.hasProfile ? `${hovered.score}/100 · documented working profile` : "Profile not yet available"}</span>
          </div>
        ) : null}
      </div>
      <div className="map-legend" aria-label="Map legend">
        <span>No profile</span>
        <div className="legend-swatches">
          {["#e6edf5", "#d8e8ed", "#a8ced8", "#67a8bb", "#0e7490", "#164e63"].map((color) => (
            <span key={color} style={{ background: color }} />
          ))}
        </div>
        <span>Higher maturity signal</span>
        <span className="legend-selected"><span className="legend-selected-swatch" />Amber outline · selected country</span>
      </div>
    </div>
  );
}

function DatabaseProfileSummary({ profile }) {
  const audit = evidenceAudit(profile);
  const assessment = profile?.assessment || {};
  const status = firstDefined(assessment.status, assessment.assessment_status, profile?.assessment_status, profile?.status);
  const method = firstDefined(assessment.method, assessment.assessment_method, profile?.assessment_method);
  const confidence = firstDefined(assessment.confidence, assessment.confidence_level, profile?.confidence_level);
  const verifiedAt = formatDate(firstDefined(assessment.last_verified_at, profile?.last_verified_at, profile?.updated_at));

  return (
    <Card className="soft-card">
      <div className="content-block">
        <h3>Database and evidence record</h3>
        <p className="muted-copy">The PostgreSQL test model separates country scores from the documentary confidence supporting them.</p>
        <div className="database-stat-grid">
          <div className="database-stat"><span>Sources</span><strong>{audit.sourceCount}</strong></div>
          <div className="database-stat"><span>Evidence links</span><strong>{audit.evidenceLinkCount}</strong></div>
          <div className="database-stat"><span>Domains covered</span><strong>{audit.coveredDomainCount}/6</strong></div>
        </div>
        <div className="evidence-level-row" aria-label="Evidence links by level">
          {Object.entries(audit.levels).map(([level, count]) => <span key={level}>Level {level}: <strong>{count}</strong></span>)}
        </div>
        <ul className="compact-list top-gap-small">
          <li><strong>Assessment status:</strong> {humanLabel(status)}</li>
          <li><strong>Documentary confidence:</strong> {humanLabel(confidence)}</li>
          <li><strong>Method:</strong> {humanLabel(method, "Documentary audit with human validation")}</li>
          {verifiedAt ? <li><strong>Last verification:</strong> {verifiedAt}</li> : null}
        </ul>
      </div>
    </Card>
  );
}

function SourceRecord({ source, index }) {
  const indicators = asArray(source.indicators);
  const status = firstDefined(source.link_status, source.url_status, source.access_status, source.status);
  const verifiedAt = formatDate(firstDefined(source.last_verified_at, source.checked_at, source.updated_at));
  const publisher = firstDefined(source.publisher, source.institution, source.organisation);
  return (
    <details className="list-box" key={`${source.url || source.title || "source"}-${index}`}>
      <summary style={{ cursor: "pointer", fontWeight: 800 }}>
        {source.title || `Source ${index + 1}`}{publisher ? ` — ${publisher}` : ""}
      </summary>
      <div className="top-gap-small">
        <div className="source-audit-line">
          {status ? <span>{humanLabel(status)}</span> : null}
          {verifiedAt ? <span>Checked {verifiedAt}</span> : null}
          {source.source_type ? <span>{humanLabel(source.source_type)}</span> : null}
        </div>
        {source.note ? <p>{source.note}</p> : null}
        {source.scope ? <p><strong>Scope:</strong> {source.scope}</p> : null}
        {indicators.length ? (
          <div className="stack-list">
            {indicators.map((indicator, indicatorIndex) => (
              <div className="mini-tile" key={`${indicator.code || "indicator"}-${indicatorIndex}`}>
                <div className="mini-tile-title">
                  {indicator.code || "IML indicator"}
                  {indicator.evidence_level ? ` · Evidence ${indicator.evidence_level}` : ""}
                  {indicator.support_type ? ` · ${indicator.support_type}` : ""}
                </div>
                {indicator.summary ? <div className="mini-tile-text">{indicator.summary}</div> : null}
                {indicator.limitation ? <div className="mini-tile-text top-gap-small"><strong>Limitation:</strong> {indicator.limitation}</div> : null}
              </div>
            ))}
          </div>
        ) : null}
        {source.url ? (
          <div className="button-row"><a className="text-link" href={source.url} target="_blank" rel="noopener noreferrer">Open precise institutional source ↗</a></div>
        ) : null}
      </div>
    </details>
  );
}


const DOMAIN_REPORT_GUIDANCE = {
  Governance:
    "Examines whether standards, responsibilities, oversight and institutional decisions produce accountable and coordinated action.",
  Technical:
    "Examines whether systems can exchange structured information securely, reliably and without avoidable document-only barriers.",
  Identity:
    "Examines identification, trusted professional access, consent, provenance and confidence in the information exchanged.",
  Adoption:
    "Examines whether infrastructure and standards are actually integrated into routine clinical, organisational and public-health workflows.",
  Security:
    "Examines protection, availability, traceability, recovery and continuity under disruption.",
  Learning:
    "Examines whether errors, complaints, audits and outcomes lead to timely correction, propagation of corrections and durable institutional learning.",
};

const DOMAIN_INDICATOR_PREFIX = {
  Governance: "GOV",
  Technical: "TEC",
  Identity: "IDT",
  Adoption: "ADP",
  Security: "SEC",
  Learning: "LRN",
};

function domainEvidence(profile, axis) {
  const prefix = DOMAIN_INDICATOR_PREFIX[axis];
  if (!prefix || !Array.isArray(profile?.sources)) return [];

  return profile.sources.flatMap((source) =>
    (Array.isArray(source.indicators) ? source.indicators : [])
      .filter((indicator) =>
        String(indicator.code || "")
          .toUpperCase()
          .startsWith(prefix)
      )
      .map((indicator) => ({ source, indicator }))
  );
}

function scoreInterpretation(score) {
  const value = Number(score || 0);
  if (value >= 80) {
    return "Strong documented foundations are present, but the score should still be read alongside implementation limits and source coverage.";
  }
  if (value >= 60) {
    return "The profile indicates substantial foundations with material variation, incomplete adoption or unresolved operational gaps.";
  }
  if (value >= 40) {
    return "The profile indicates partial maturity: formal structures exist, but delivery, consistency or practical implementation remains limited.";
  }
  return "The profile indicates major unresolved gaps and limited evidence that correction, continuity or implementation works reliably in practice.";
}

function countryReportText(profile) {
  const lines = [
    `IML EXPLANATION REPORT — ${profile.name}`,
    `ISO3: ${profile.iso3}`,
    `Overall exploratory signal: ${averageScore(profile.values)}/100`,
    `Version: ${profile.version || "pending"}`,
    `Evidence status: ${profile.evidenceLevel || "Exploratory working profile"}`,
    `Updated: ${profile.updatedAt || "Review date pending"}`,
    "",
    "STATUS AND SCOPE",
    "This profile is an exploratory IML assessment. It is not a country ranking, certification or substitute for indicator-by-indicator review.",
    "",
    "PROFILE SUMMARY",
    profile.subtitle || "No profile summary is available.",
    "",
    "DOMAIN SCORES",
  ];

  AXES.forEach((axis, index) => {
    const score = Number(profile.values?.[index] || 0);
    const linkedEvidence = domainEvidence(profile, axis);

    lines.push(`${axis}: ${score}/100`);
    lines.push(`${DOMAIN_REPORT_GUIDANCE[axis]} ${scoreInterpretation(score)}`);

    if (linkedEvidence.length) {
      lines.push("Linked evidence:");
      linkedEvidence.forEach(({ source, indicator }) => {
        lines.push(
          `• ${indicator.code || "Indicator"} — ${source.title || "Untitled source"}`
        );
        if (indicator.summary) lines.push(`  Support: ${indicator.summary}`);
        if (indicator.limitation) {
          lines.push(`  Limitation: ${indicator.limitation}`);
        }
      });
    } else {
      lines.push(
        "Linked evidence: no source-indicator link is currently attached to this domain."
      );
    }

    lines.push("");
  });

  lines.push("STRENGTHS");
  (profile.strengths || []).forEach((item) => lines.push(`• ${item}`));

  lines.push("", "POINTS TO WATCH");
  (profile.watch || []).forEach((item) => lines.push(`• ${item}`));

  lines.push("", "EVIDENCE REGISTER");

  if (profile.sources?.length) {
    profile.sources.forEach((source, sourceIndex) => {
      lines.push(
        `${sourceIndex + 1}. ${source.title || "Untitled source"}${
          source.publisher ? ` — ${source.publisher}` : ""
        }`
      );

      if (source.note) lines.push(`   Note: ${source.note}`);
      if (source.url) lines.push(`   URL: ${source.url}`);

      if (Array.isArray(source.indicators)) {
        source.indicators.forEach((indicator) => {
          lines.push(
            `   Indicator ${indicator.code || "not specified"}${
              indicator.evidence_level
                ? `, evidence ${indicator.evidence_level}`
                : ""
            }${indicator.support_type ? `, ${indicator.support_type}` : ""}`
          );

          if (indicator.summary) {
            lines.push(`   Support: ${indicator.summary}`);
          }

          if (indicator.limitation) {
            lines.push(`   Limitation: ${indicator.limitation}`);
          }
        });
      }

      lines.push("");
    });
  } else {
    lines.push("No documentary sources are attached to this profile.");
  }

  lines.push(
    "METHODOLOGICAL NOTE",
    "The overall signal is the rounded arithmetic mean of the six current domain scores. It summarises the profile but does not replace the underlying evidence, limitations and review process."
  );

  return lines.join("\n");
}

async function copyCountryReport(profile) {
  try {
    await navigator.clipboard.writeText(countryReportText(profile));
  } catch {
    window.alert(
      "The report could not be copied automatically. Please use Print or save as PDF."
    );
  }
}

function CountryReport({ profile }) {
  if (!profile) return null;

  const overall = averageScore(profile.values);

  return (
    <details className="card soft-card country-report">
      <summary>
        <span>Generate explanation report for {profile.name}</span>
      </summary>

      <article className="report-body">
        <div className="report-heading">
          <div>
            <div className="eyebrow">
              IML explanation report · {profile.iso3}
            </div>
            <h2>{profile.name}</h2>
            <p className="muted-copy">
              Generated from the current country profile, domain scores,
              strengths, points to watch and attached documentary evidence.
            </p>
          </div>

          <div className="report-overall">
            <strong>{overall}/100</strong>
            <span>Exploratory signal</span>
          </div>
        </div>

        <div className="report-actions">
          <button
            type="button"
            className="primary-button"
            onClick={() => window.print()}
          >
            Print or save as PDF
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={() => copyCountryReport(profile)}
          >
            Copy report
          </button>
        </div>

        <section className="report-section">
          <h3>Status and scope</h3>
          <p className="report-disclaimer">
            This is an exploratory IML profile. It is not a country ranking,
            certification or substitute for an indicator-by-indicator review.
            The overall signal is the rounded arithmetic mean of the six
            current domain scores.
          </p>
        </section>

        <section className="report-section">
          <h3>Profile summary</h3>
          <p>{profile.subtitle || "No profile summary is available."}</p>
          <div className="profile-meta">
            <span>Version {profile.version || "pending"}</span>
            <span>
              {profile.evidenceLevel || "Exploratory working profile"}
            </span>
            <span>
              {profile.updatedAt
                ? `Updated ${profile.updatedAt}`
                : "Review date pending"}
            </span>
          </div>
        </section>

        <section className="report-section">
          <h3>Domain explanations</h3>
          <div className="report-score-grid">
            {AXES.map((axis, index) => {
              const score = Number(profile.values?.[index] || 0);
              const linkedEvidence = domainEvidence(profile, axis);

              return (
                <div className="report-domain" key={axis}>
                  <div className="report-domain-head">
                    <strong>{axis}</strong>
                    <span className="report-domain-score">
                      {score}/100
                    </span>
                  </div>

                  <p>
                    {DOMAIN_REPORT_GUIDANCE[axis]}{" "}
                    {scoreInterpretation(score)}
                  </p>

                  <div className="report-domain-evidence">
                    <strong>Linked evidence</strong>

                    {linkedEvidence.length ? (
                      <ul>
                        {linkedEvidence.map(
                          ({ source, indicator }, evidenceIndex) => (
                            <li
                              key={`${axis}-${
                                indicator.code || "indicator"
                              }-${evidenceIndex}`}
                            >
                              <strong>
                                {indicator.code || "Indicator"}:
                              </strong>{" "}
                              {source.title || "Untitled source"}
                              {indicator.summary
                                ? ` — ${indicator.summary}`
                                : ""}
                              {indicator.limitation
                                ? ` Limitation: ${indicator.limitation}`
                                : ""}
                            </li>
                          )
                        )}
                      </ul>
                    ) : (
                      <p>
                        No source-indicator link is currently attached to this
                        domain.
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="report-section">
          <h3>Strengths</h3>
          <ul className="plain-list">
            {(profile.strengths || []).map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </section>

        <section className="report-section">
          <h3>Points to watch</h3>
          <ul className="plain-list">
            {(profile.watch || []).map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </section>

        <section className="report-section">
          <h3>Evidence register</h3>

          {profile.sources?.length ? (
            profile.sources.map((source, sourceIndex) => (
              <div
                className="report-source"
                key={`${source.url || source.title || "source"}-${sourceIndex}`}
              >
                <div className="report-source-title">
                  {source.title || `Source ${sourceIndex + 1}`}
                </div>

                <div className="report-source-meta">
                  {source.publisher || "Publisher not specified"}
                  {source.publication_date
                    ? ` · ${source.publication_date}`
                    : ""}
                </div>

                {source.note ? <p>{source.note}</p> : null}

                {Array.isArray(source.indicators) &&
                source.indicators.length > 0
                  ? source.indicators.map((indicator, indicatorIndex) => (
                      <div
                        className="report-indicator"
                        key={`${indicator.code || "indicator"}-${indicatorIndex}`}
                      >
                        <strong>
                          {indicator.code || "IML indicator"}
                          {indicator.evidence_level
                            ? ` · Evidence ${indicator.evidence_level}`
                            : ""}
                          {indicator.support_type
                            ? ` · ${indicator.support_type}`
                            : ""}
                        </strong>

                        {indicator.summary ? (
                          <p>{indicator.summary}</p>
                        ) : null}

                        {indicator.limitation ? (
                          <p>
                            <strong>Limitation:</strong>{" "}
                            {indicator.limitation}
                          </p>
                        ) : null}
                      </div>
                    ))
                  : null}

                {source.url ? (
                  <p>
                    <a
                      className="text-link"
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Open official source
                    </a>
                  </p>
                ) : null}
              </div>
            ))
          ) : (
            <p>No documentary sources are attached to this profile yet.</p>
          )}
        </section>
      </article>
    </details>
  );
}


function CountryProfile({ selectedCountry, profile }) {
  if (!selectedCountry) return null;
  if (!profile) {
    return (
      <Card className="soft-card">
        <div className="content-block map-empty">
          <div className="section-badge">Profile not yet available</div>
          <h3>{selectedCountry.name}</h3>
          <p><strong>Not yet examined.</strong> The amber outline means only that this country is selected; it is not an assessment.</p>
          <p>A profile can be added once documentary sources and local review are available.</p>
        </div>
      </Card>
    );
  }

  return (
    <>
      <div className="split-grid profile-grid">
        <Card>
          <div className="content-block">
            <div className="profile-head">
              <div>
                <div className="eyebrow">{profile.iso3}</div>
                <div className="profile-title-row">
                  <h3>{profile.name}</h3>
                  <div className="score-pill" title="Overall maturity signal, not a country ranking">{averageScore(asArray(profile.values))}/100</div>
                </div>
              </div>
            </div>
            <p className="muted-copy">{profile.subtitle}</p>
            <HexagonChart values={profile.values} />
            <div className="profile-stat-grid">
              {IML_DOMAINS.map((domain, index) => (
                <div className="profile-stat" key={domain.key}>
                  <span>{domain.axis}</span>
                  <strong>{profile.values?.[index] ?? 0}</strong>
                </div>
              ))}
            </div>
          </div>
        </Card>
        <div className="stack-layout">
          <DatabaseProfileSummary profile={profile} />
          <Card><div className="content-block"><h3>Strengths</h3><ul className="plain-list">{asArray(profile.strengths).map((item) => <li key={item}>• {item}</li>)}</ul></div></Card>
          <Card><div className="content-block"><h3>Points to watch</h3><ul className="plain-list">{asArray(profile.watch).map((item) => <li key={item}>• {item}</li>)}</ul></div></Card>
          <Card className="soft-card">
            <div className="content-block">
              <h3>Evidence</h3>
              <p className="muted-copy">Each source should point to the precise institutional page supporting a defined indicator. Homepage links are used only when no more specific official page exists.</p>
              {asArray(profile.sources).length ? <div className="stack-layout">{profile.sources.map((source, index) => <SourceRecord source={source} index={index} key={`${source.url || source.title}-${index}`} />)}</div> : <p>No documentary sources are attached to this profile yet.</p>}
            </div>
          </Card>
        </div>
      </div>
      <CountryReport profile={profile} />
    </>
  );
}

function HomePage() {
  return (
    <>
      <section className="hero"><div className="container hero-grid">
        <div className="hero-copy">
          <div className="section-badge">Open for scientific review</div>
          <h1>A scientific framework for trusted Health Information Ecosystems.</h1>
          <div className="principle-stack">
            <div className="principle-line">Health is the objective.</div>
            <div className="principle-line">Trustworthy information is the foundation.</div>
            <div className="principle-line">Interoperability is the path.</div>
          </div>
          <p className="hero-text">IML helps clinicians, researchers and institutions understand how health information is generated, trusted, exchanged and used.</p>
          <Card className="note-box"><p>IML is an orientation framework, not a certification system. It makes information pathways, gaps and possible next investigations visible. Human review remains necessary when a result is used as validated evidence or to support a decision.</p></Card>
          <div className="button-row">
            <a className="primary-button" href={MANUSCRIPT_URL} download>Download the Founding Manuscript</a>
            <a className="secondary-button" href="#methodology">Explore the methodology</a>
          </div>
          <div className="metric-grid two-up top-gap-small">
            <MetricCard symbol="5L" title="Interoperability" value="5 layers" subtitle="Technical, semantic, organisational, institutional, and clinical/public health." />
            <MetricCard symbol="6D" title="Assessment" value="6 domains" subtitle="A health-oriented maturity profile linked to documentary evidence." />
          </div>
        </div>
        <Card className="overview-card"><div className="overview-top"><div><div className="eyebrow">IML Health</div><div className="overview-title">From information to better health</div></div></div>
          <p className="muted-copy">The first demonstrator links clinical care, microbiology and public-health learning around urinary infection and multidrug-resistant <em>E. coli</em>.</p>
        </Card>
      </div></section>
      <section className="section"><div className="container"><Card className="soft-card"><div className="content-block"><div className="section-badge">Positioning</div><h3>Complementary to digital health maturity initiatives</h3><p>IML does not duplicate national digital health dashboards. It asks a narrower question: whether documented capacity preserves clinical meaning, context, trust, correction and usefulness across Health Information Ecosystems.</p></div></Card></div></section>
    </>
  );
}

function MethodologyPage() {
  return (
    <section className="section"><div className="container">
      <SectionTitle badge="IML Framework" title="Evidence-guided, human-validated country profiles" text="The PostgreSQL model records countries, profile versions, six domain scores, indicators, institutional sources, evidence links, limitations and review status." />
      <Card className="soft-card"><div className="content-block">
        <h3>What the country engine does</h3>
        <p>It provides a documented starting point for research, not an automatic verdict. Documentary discovery and link checks can be assisted by software, while source selection, interpretation, score attribution and publication remain human responsibilities.</p>
        <p>Each indicator should be linked to the most precise available institutional page: a programme, register, implementation guide, legal text, technical specification, audit or evaluation. A general homepage is insufficient when a specific source exists.</p>
        <p>The audit records whether a link is valid, redirected, dead, temporarily unavailable or technically blocked by Cloudflare, CloudFront, anti-bot protection or another access barrier. A technical block must not be misclassified as absence of evidence.</p>
        <p>Country performance and documentary confidence are separate. Strong evidence can support a low score, while a high-looking score may remain uncertain when implementation is poorly documented. Sources are linked to specific indicators, with limitations stated openly.</p>
        <div className="button-row"><a className="primary-button" href={TECHNICAL_MANUSCRIPT_URL} download>Download the Technical Manuscript</a><a className="secondary-button" href={MANUSCRIPT_URL} download>Download the Founding Manuscript</a></div>
      </div></Card>
      <div className="tile-grid three-up top-gap-small">
        {IML_DOMAINS.map((domain) => (
          <Card key={domain.key} className="value-card">
            <div className="metric-symbol">{domain.short}</div>
            <h3>{domain.title}</h3>
            <p>{domain.description}</p>
          </Card>
        ))}
      </div>
      <div className="split-grid top-gap">
        <Card className="soft-card"><div className="content-block"><h3>Five interacting layers</h3><ul className="compact-list"><li><strong>Technical:</strong> secure and reliable exchange.</li><li><strong>Semantic:</strong> preservation of meaning and context.</li><li><strong>Organisational:</strong> workflows and responsibilities.</li><li><strong>Institutional:</strong> readiness, responsiveness and collaboration.</li><li><strong>Clinical and public health:</strong> usefulness for care, prevention, surveillance and learning.</li></ul></div></Card>
        <Card className="soft-card"><div className="content-block"><h3>Cross-cutting dimensions</h3><ul className="compact-list"><li><strong>Institutional Engagement</strong></li><li><strong>Payer Interoperability</strong></li><li><strong>AI Readiness</strong></li><li><strong>Professional role alignment</strong></li></ul></div></Card>
      </div>
    </div></section>
  );
}
function ManuscriptsPage() {
  return <section className="section"><div className="container">
    <SectionTitle badge="Reference documents" title="IML manuscripts" text="The founding vision and technical architecture documents of the IML project." />
    <div className="split-grid profile-grid">
      <Card className="soft-card"><div className="content-block"><h3>Founding Manuscript</h3><p>The vision, principles and scope of IML as an open health information environment.</p><a className="primary-button" href={MANUSCRIPT_URL} download>Download PDF</a></div></Card>
      <Card className="soft-card"><div className="content-block"><h3>Technical Manuscript</h3><p>The proposed architecture, evidence model and implementation approach.</p><a className="primary-button" href={TECHNICAL_MANUSCRIPT_URL} download>Download PDF</a></div></Card>
    </div>
  </div></section>;
}
function Id4dPage() { return (<section className="section"><div className="container"><SectionTitle badge="Identity infrastructure" title="Identity, consent and trust across fragmented systems" text="Identity is an enabling layer for continuity and accountability, not the whole of interoperability." /><Card className="soft-card"><div className="content-block"><h3>From trusted identity to authorised health and research linkage</h3><p>IML does not propose replacing national identity systems. It explores how recognised national identifiers could contribute to a future universal health and research number for authorised multicentre, longitudinal and epidemiological studies. It complements the <a className="text-link" href="https://id4d.worldbank.org/" target="_blank" rel="noopener noreferrer">World Bank ID4D initiative ↗</a> and may build on trust infrastructures such as the <a className="text-link" href="https://www.who.int/initiatives/global-digital-health-certification-network" target="_blank" rel="noopener noreferrer">WHO Global Digital Health Certification Network ↗</a>.</p><p>National models already differ. A future IML model could combine the national identifier namespace, a governed geographic reference and a protected keyed hash. The resulting number would remain regulated personal data and would require legal, ethical, security and equity review before implementation.</p><p>Identity, identifier, access token and carrier mechanism must remain distinct. A QR code or mobile application should carry only a temporary signed token or a verifiable digital certificate, never sensitive identity or health information in clear text.</p><p>The Country-level digital health <a className="text-link" href="https://monitor.digitalhealthmonitor.org/map" target="_blank" rel="noopener noreferrer">Global Digital Health Monitor map ↗</a>. provides country-level information on digital health. IML is different: it develops an independent comparative framework designed to guide structured country research, verify documentary evidence, identify information gaps, and support contextual human validation.</p></div></Card></div></section>); }
function EvaluationPage() {
  return <section className="section"><div className="container"><SectionTitle badge="Operational pathway" title="From assessment to action" text="IML connects documented maturity profiles with practical improvement and concrete clinical or public-health pathways." />
    <div className="tile-grid three-up">
      <Card className="value-card"><div className="metric-symbol">AMR</div><h3>AMR / BMR demonstrator</h3><p>Links microbiology with symptoms, diagnosis, treatment, outcomes and public-health learning, beginning with UTI and multidrug-resistant <em>E. coli</em>.</p></Card>
      <Card className="value-card"><div className="metric-symbol">OCW</div><h3>Open Clinical Workspace</h3><p>An open-source, vendor-neutral and academically governed reference environment that can connect existing systems or provide a progressively deployable foundation where services are limited.</p></Card>
      <Card className="value-card"><div className="metric-symbol">Q</div><h3>Software quality</h3><p>Digital health quality is assessed through preservation of meaning, correction, auditability, security, resilience, portability, reversibility, accessibility and long-term maintainability.</p></Card>
    </div>
    <Card className="soft-card top-gap"><div className="content-block"><h3>First demonstrator pathway</h3><div className="stack-list">{["Symptoms, fever and clinical context.", "Urine testing, culture, bacterial count and antibiogram.", "Clinical interpretation and retained diagnosis.", "Treatment, evolution and outcome.", "Aggregated surveillance, correction and shared learning."].map((text, index) => <div className="list-box" key={text}><strong>{index + 1}.</strong> {text}</div>)}</div></div></Card>
  </div></section>;
}

function WorldPage() {
  const [profiles, setProfiles] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [warning, setWarning] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    loadGlobalMapProfiles(controller.signal)
      .then((result) => { setProfiles(asArray(result.profiles)); setWarning(result.warning || ""); })
      .catch((error) => { if (error?.name !== "AbortError") { setProfiles([]); setWarning(error?.message || "Unable to load the Global Map API."); } });
    return () => controller.abort();
  }, []);
  const profileByIso3 = useMemo(
    () =>
      Object.fromEntries(
        profiles
          .map((profile) => [normalizeIso3(profile?.iso3), profile])
          .filter(([iso3]) => Boolean(iso3))
      ),
    [profiles]
  );
  const selectedProfile = selectedCountry
    ? profileByIso3[normalizeIso3(selectedCountry.iso3)]
    : null;
  return <section className="section"><div className="container"><SectionTitle badge="Global Map" title="Country profiles" text="Colours show the current documented profile signal. Countries without a profile remain neutral." />{warning ? <Card className="highlight-card"><div className="content-block"><h3>Country profiles temporarily unavailable</h3><p>{warning}</p></div></Card> : null}<div className="top-gap-small"><WorldMap profiles={profiles} selectedCountry={selectedCountry} onSelect={setSelectedCountry} /></div><div className="top-gap"><CountryProfile selectedCountry={selectedCountry} profile={selectedProfile} /></div></div></section>;
}

function ContactPage() {
  const email = "iml.health@pm.me";
  const [copied, setCopied] = useState(false);
  const copyEmail = async () => {
    try { await navigator.clipboard.writeText(email); setCopied(true); window.setTimeout(() => setCopied(false), 1800); }
    catch { setCopied(false); }
  };
  return <section className="section"><div className="container"><SectionTitle badge="Open for scientific review" title="Scientific review and collaboration" text="IML welcomes methodological criticism, documentary review, local country expertise, clinical validation and proposals for institutional collaboration." /><div className="split-grid profile-grid"><Card><div className="content-block"><h3>Direct contact</h3><p>For scientific review, collaboration or questions about the framework, contact IML directly.</p><div className="mail-box"><a className="text-link" href={`mailto:${email}`}>{email}</a></div><div className="form-actions top-gap-small"><a className="primary-button" href={`mailto:${email}?subject=${encodeURIComponent("IML scientific review or collaboration")}`}>Send email</a><button type="button" className="secondary-button" onClick={copyEmail}>Copy email</button></div>{copied ? <p className="form-note top-gap-small">Email copied.</p> : null}</div></Card><Card className="soft-card"><div className="content-block"><h3>Country review</h3><p>Reviewers may propose a more precise institutional source, correct an interpretation, document implementation, identify a technical access block, or challenge a domain score. Every accepted change should remain traceable and versioned.</p></div></Card></div></div></section>;
}

function Footer() {
  return <footer className="footer"><div className="container footer-grid"><div><div className="footer-brand"><div><div className="eyebrow">IML</div><div className="footer-title">Interoperability Maturity Lab</div></div></div><p className="footer-copy">Health is the objective. Trustworthy information is the foundation. Interoperability is the path.</p></div><div><div className="footer-label">Scientific status</div><p className="footer-copy">Independent, non-commercial and open for scientific review.</p></div></div></footer>;
}

export default function App() {
  const getHash = () => {
    if (typeof window === "undefined") return "home";
    const hash = window.location.hash.replace("#", "").trim();
    return ROUTES.some((route) => route.key === hash) ? hash : "home";
  };
  const [route, setRoute] = useState(getHash);
  useEffect(() => {
    const sync = () => setRoute(getHash());
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);
  const goTo = (key) => {
    window.location.hash = key;
    window.scrollTo({ top: 0, behavior: "smooth" });
    setRoute(key);
  };
  return <div className="app-shell"><header className="topbar"><div className="container topbar-inner"><button type="button" className="brand-button" onClick={() => goTo("home")}>{route !== "home" ? <LogoMark /> : null}<div><div className="eyebrow">IML</div><div className="brand-title">Interoperability Maturity Lab</div></div></button><nav className="topnav desktop-nav">{ROUTES.map((item) => <NavButton key={item.key} active={route === item.key} onClick={() => goTo(item.key)}>{item.label}</NavButton>)}</nav></div><div className="container mobile-nav">{ROUTES.map((item) => <NavButton key={item.key} active={route === item.key} onClick={() => goTo(item.key)}>{item.label}</NavButton>)}</div></header><main>{route === "home" ? <HomePage /> : null}{route === "id4d" ? <Id4dPage /> : null}{route === "evaluation" ? <EvaluationPage /> : null}{route === "methodology" ? <MethodologyPage /> : null}{route === "world" ? <WorldPage /> : null}{route === "manuscripts" ? <ManuscriptsPage /> : null}{route === "contact" ? <ContactPage /> : null}</main><Footer /></div>;
}
