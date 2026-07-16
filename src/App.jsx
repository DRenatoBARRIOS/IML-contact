import React, { useEffect, useMemo, useState } from "react";
import manuscriptPdf from "./IML_Founding_Manuscript.pdf";
import logoImage from "./assets/iml-logo.png";
import worldCountries from "./world-countries.json";

const styles = `
  :root {
    font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    color: #0f172a;
    background: #ffffff;
    line-height: 1.5;
    font-weight: 400;
  }
  * { box-sizing: border-box; }
  html, body, #root { margin: 0; min-height: 100%; }
  body { background: #ffffff; color: #0f172a; }
  button, input, textarea, select { font: inherit; }
  .app-shell { min-height: 100vh; background: #ffffff; }
  .container { width: min(1180px, calc(100% - 40px)); margin: 0 auto; }
  .topbar { position: sticky; top: 0; z-index: 50; border-bottom: 1px solid #e2e8f0; background: rgba(255,255,255,0.92); backdrop-filter: blur(10px); }
  .topbar-inner { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 16px 0; }
  .brand-button { display: flex; align-items: center; gap: 12px; border: 0; background: transparent; cursor: pointer; text-align: left; padding: 0; }
  .brand-title { font-size: 14px; color: #334155; }
  .logo-box { height: 56px; width: 56px; display: flex; align-items: center; justify-content: center; overflow: hidden; border-radius: 18px; border: 1px solid #dbe2ea; background: #ffffff; box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06); }
  .logo-svg { display: block; width: 52px; height: 52px; object-fit: contain; }
  .eyebrow { font-size: 12px; text-transform: uppercase; letter-spacing: 0.2em; color: #64748b; }
  .topnav, .mobile-nav { display: flex; gap: 8px; flex-wrap: wrap; }
  .mobile-nav { display: none; padding-bottom: 16px; overflow-x: auto; }
  .nav-button, .secondary-button { border: 0; cursor: pointer; }
  .nav-button { border-radius: 18px; background: #0f172a; color: white; padding: 10px 16px; font-size: 14px; font-weight: 700; transition: transform 180ms ease, box-shadow 180ms ease, background 180ms ease; }
  .nav-button:hover { background: #1e293b; }
  .nav-button-active { padding: 12px 20px; font-size: 16px; transform: scale(1.08); box-shadow: 0 10px 24px rgba(15, 23, 42, 0.18); outline: 2px solid #cbd5e1; }
  .hero { overflow: hidden; border-bottom: 1px solid #e2e8f0; background: radial-gradient(circle at top left, rgba(15,23,42,0.06), transparent 34%), radial-gradient(circle at bottom right, rgba(15,23,42,0.05), transparent 30%); }
  .hero-grid, .split-grid, .footer-grid, .profile-grid { display: grid; gap: 28px; }
  .hero-grid { grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.85fr); padding: 72px 0 88px; }
  .hero-copy h1, .section-heading h2 { margin: 0; line-height: 1.05; letter-spacing: -0.03em; }
  .hero-copy h1 { max-width: 760px; font-size: clamp(2.7rem, 5vw, 4.4rem); }
  .hero-text, .section-heading p, .content-block p, .value-card p, .muted-copy, .footer-copy, .list-box, .plain-list, .form-note { color: #475569; }
  .hero-text { max-width: 720px; font-size: 19px; line-height: 1.8; }
  .section { padding: 72px 0; }
  .section-heading { max-width: 820px; margin-bottom: 32px; }
  .section-heading h2 { font-size: clamp(2rem, 3vw, 3rem); margin-bottom: 12px; }
  .section-heading p { font-size: 18px; line-height: 1.75; margin: 0; }
  .section-badge { display: inline-flex; align-items: center; border-radius: 999px; border: 1px solid #dbe2ea; background: #ffffff; padding: 6px 12px; margin-bottom: 14px; font-size: 12px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: #64748b; }
  .card { border: 1px solid #e2e8f0; border-radius: 28px; background: #ffffff; box-shadow: 0 10px 32px rgba(15, 23, 42, 0.05); }
  .soft-card { background: #f8fafc; }
  .highlight-card { border-color: #fde68a; background: #fef3c7; }
  .content-block { padding: 28px; }
  .content-block h3, .value-card h3, .profile-head h3 { margin: 0 0 14px; font-size: 1.32rem; letter-spacing: -0.02em; }
  .content-block p, .value-card p, .plain-list li, .list-box, .metric-subtitle, .form-note { font-size: 15px; line-height: 1.8; }
  .note-box { padding: 22px 24px; max-width: 860px; }
  .note-box p { margin: 0; }
  .metric-grid, .tile-grid, .form-grid, .stack-list { display: grid; gap: 18px; }
  .metric-grid.two-up, .form-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .tile-grid.three-up, .tile-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .value-card, .metric-card, .mini-tile { padding: 24px; }
  .metric-card { display: flex; gap: 16px; align-items: flex-start; }
  .metric-symbol { display: inline-flex; align-items: center; justify-content: center; flex: 0 0 auto; width: 44px; height: 44px; border-radius: 16px; border: 1px solid #dbe2ea; background: #f1f5f9; color: #0f172a; font-weight: 800; }
  .metric-title { font-size: 14px; color: #64748b; }
  .metric-value { margin-top: 2px; font-size: 30px; font-weight: 800; letter-spacing: -0.03em; }
  .metric-subtitle { margin-top: 4px; }
  .overview-card { padding: 30px; }
  .overview-top { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
  .overview-title, .mail-box { font-size: 1.2rem; font-weight: 800; color: #0f172a; letter-spacing: -0.02em; }
  .mini-tile { border: 1px solid #e2e8f0; border-radius: 22px; }
  .mini-tile-title { margin-bottom: 8px; font-size: 14px; font-weight: 800; }
  .mini-tile-text { font-size: 14px; color: #475569; line-height: 1.7; }
  .top-gap { margin-top: 36px; }
  .top-gap-small { margin-top: 20px; }
  .split-grid, .footer-grid, .profile-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .stack-layout { display: grid; gap: 18px; }
  .list-box, .code-box { border: 1px solid #e2e8f0; border-radius: 20px; padding: 16px 18px; background: #ffffff; }
  .code-box { margin-top: 18px; background: #f8fafc; }
  .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }
  .hex-chart { display: block; width: 100%; max-width: 390px; margin: 0 auto; }
  .mini-hex { width: 88px; height: 88px; }
  .world-box { position: relative; overflow: hidden; border-radius: 32px; border: 1px solid #e2e8f0; background: linear-gradient(180deg, #fbfdff 0%, #f2f6fb 100%); padding: 20px; box-shadow: 0 20px 60px rgba(15, 23, 42, 0.08); }
  .world-box-head { display: flex; align-items: center; justify-content: space-between; gap: 18px; margin-bottom: 14px; }
  .helper-pill { border-radius: 999px; border: 1px solid #e2e8f0; background: white; padding: 10px 14px; color: #64748b; font-size: 12px; }
  .world-map-wrap { position: relative; width: 100%; aspect-ratio: 900 / 430; }
  .world-map { width: 100%; height: 100%; }
  .marker-group { cursor: pointer; }
  .tooltip-anchor { pointer-events: auto; position: absolute; z-index: 10; }
  .map-tooltip { width: 160px; border-radius: 22px; border: 1px solid rgba(226,232,240,0.95); background: rgba(255,255,255,0.95); padding: 12px; box-shadow: 0 18px 50px rgba(15, 23, 42, 0.18); backdrop-filter: blur(8px); }
  .map-tooltip-top, .profile-head, .form-actions { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
  .map-tooltip-title { font-size: 14px; font-weight: 800; }
  .map-tooltip-score, .score-pill { border-radius: 999px; background: #0f172a; color: white; padding: 6px 10px; font-size: 12px; font-weight: 700; }
  .muted-copy { margin-top: 0; margin-bottom: 12px; }
  .select-wrap { max-width: 360px; }
  .select-wrap label { display: block; font-size: 14px; font-weight: 700; color: #334155; margin-bottom: 8px; }
  .select-wrap select { width: 100%; border: 1px solid #cbd5e1; border-radius: 18px; background: #ffffff; padding: 14px 16px; color: #0f172a; outline: none; }
  .contact-form { display: grid; gap: 16px; }
  .contact-form label { display: block; font-size: 14px; font-weight: 700; color: #334155; margin-bottom: 8px; }
  .contact-form input, .contact-form textarea { width: 100%; border: 1px solid #cbd5e1; border-radius: 18px; background: #ffffff; padding: 14px 16px; color: #0f172a; outline: none; }
  .contact-form textarea { resize: vertical; }
  .primary-button { border: 0; cursor: pointer; border-radius: 16px; padding: 12px 16px; font-weight: 700; background: #0f172a; color: white; }
  .secondary-button { border: 0; cursor: pointer; border-radius: 16px; padding: 12px 16px; font-weight: 700; background: #ffffff; color: #0f172a; border: 1px solid #dbe2ea; }
  .mail-box { border-radius: 18px; border: 1px solid #e2e8f0; background: white; padding: 14px 16px; }
  .footer { border-top: 1px solid #e2e8f0; background: #f8fafc; margin-top: 40px; }
  .footer-grid { padding: 36px 0; }
  .footer-brand { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
  .footer-title { font-size: 14px; color: #334155; }
  .footer-label { margin-bottom: 12px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.2em; color: #64748b; font-weight: 800; }
  .plain-list { margin: 0; padding: 0; list-style: none; }

  .button-row { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; margin-top: 22px; }
  .primary-button, .secondary-button { display: inline-flex; align-items: center; justify-content: center; text-decoration: none; }
  .text-link { color: #0f172a; font-weight: 800; text-decoration: underline; text-decoration-color: #cbd5e1; text-underline-offset: 4px; }
  .text-link:hover { text-decoration-color: #0f172a; }
  .principle-stack { display: grid; gap: 10px; margin-top: 22px; }
  .principle-line { border-left: 3px solid #0f172a; padding: 4px 0 4px 14px; font-size: 16px; font-weight: 700; color: #334155; }
  .compact-list { display: grid; gap: 8px; margin: 0; padding: 0; list-style: none; color: #475569; }
  .compact-list li { line-height: 1.65; }
  .status-pill { display: inline-flex; align-items: center; border-radius: 999px; background: #f1f5f9; color: #334155; padding: 7px 11px; font-size: 12px; font-weight: 800; }

  .map-controls { display: grid; grid-template-columns: minmax(0, 320px); gap: 16px; align-items: end; }
  .control-field label { display: block; margin-bottom: 8px; font-size: 13px; font-weight: 800; color: #334155; }
  .control-field select { width: 100%; border: 1px solid #cbd5e1; border-radius: 16px; background: #ffffff; padding: 12px 14px; color: #0f172a; outline: none; }
  .map-stage { overflow: hidden; border-radius: 24px; background: #f8fbff; }
  .country-shape { cursor: pointer; transition: fill 150ms ease, stroke 150ms ease, opacity 150ms ease; outline: none; }
  .country-shape:hover, .country-shape:focus { stroke: #0f172a; stroke-width: 1.4; opacity: 0.94; }
  .country-shape-profile { cursor: pointer; }
  .country-shape-selected { filter: drop-shadow(0 0 5px rgba(217, 119, 6, 0.42)); }
  .map-tooltip-floating { position: absolute; z-index: 12; display: grid; gap: 3px; width: max-content; max-width: 220px; pointer-events: none; border: 1px solid rgba(203, 213, 225, 0.95); border-radius: 14px; background: rgba(255,255,255,0.96); padding: 9px 11px; box-shadow: 0 14px 36px rgba(15,23,42,0.18); font-size: 12px; }
  .map-tooltip-floating span { color: #64748b; }
  .map-legend { display: flex; align-items: center; justify-content: flex-end; gap: 10px; margin-top: 14px; color: #64748b; font-size: 11px; }
  .legend-swatches { display: grid; grid-template-columns: repeat(6, 24px); overflow: hidden; border: 1px solid #cbd5e1; border-radius: 999px; }
  .legend-swatches span { height: 10px; }
  .legend-selected { display: inline-flex; align-items: center; gap: 6px; margin-left: 8px; color: #92400e; font-weight: 800; }
  .legend-selected-swatch { width: 14px; height: 14px; border-radius: 4px; border: 2px solid #92400e; background: #f59e0b; }
  .data-source-pill { display: inline-flex; align-items: center; gap: 8px; flex: 0 0 auto; border: 1px solid #cbd5e1; border-radius: 999px; background: white; padding: 8px 12px; color: #475569; font-size: 12px; font-weight: 800; }
  .data-source-live { color: #14532d; border-color: #86efac; background: #f0fdf4; }
  .status-dot { width: 8px; height: 8px; border-radius: 50%; background: currentColor; }
  .profile-meta { display: flex; gap: 8px; flex-wrap: wrap; margin: 16px 0 4px; }
  .profile-meta span { border-radius: 999px; background: #f1f5f9; padding: 6px 9px; color: #475569; font-size: 11px; font-weight: 700; }
  .profile-stat-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
  .profile-stat { display: flex; align-items: center; justify-content: space-between; gap: 8px; border: 1px solid #e2e8f0; border-radius: 12px; padding: 9px 10px; font-size: 12px; color: #64748b; }
  .profile-stat strong { color: #0f172a; font-size: 15px; }
  .map-empty { max-width: 760px; }
  @media (max-width: 1100px) {
    .hero-grid, .split-grid, .footer-grid, .profile-grid, .metric-grid.two-up, .tile-grid, .tile-grid.three-up, .form-grid { grid-template-columns: 1fr; }
    .map-controls { grid-template-columns: 1fr; }
    .helper-pill { display: none; }
  }
  @media (max-width: 820px) {
    .desktop-nav { display: none; }
    .mobile-nav { display: flex; }
    .container { width: min(100% - 28px, 1180px); }
    .section, .hero-grid { padding-top: 56px; padding-bottom: 56px; }
    .hero-grid { gap: 22px; }
    .map-legend { justify-content: flex-start; flex-wrap: wrap; }
    .profile-stat-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  }
`;
const MANUSCRIPT_URL = manuscriptPdf;
const ROUTES = [
  { key: "home", label: "Home" },
  { key: "id4d", label: "Identity & Trust" },
  { key: "evaluation", label: "From assessment to action" },
  { key: "methodology", label: "Methodology" },
  { key: "world", label: "World Map" },
  { key: "contact", label: "Scientific Review" },
];
const AXES = ["Governance", "Technical", "Identity", "Adoption", "Security", "Learning"];

const COUNTRIES = {
  Argentina: { subtitle: "Nationally coordinated digital-health trajectory built around shared records and distributed interoperability.", values: [78, 74, 72, 77, 73, 63], strengths: ["National interoperability strategy", "Distributed shared health-record model", "Legal framework for electronic clinical records"], watch: ["Operational maturity varies across jurisdictions", "Implementation depends on provincial adoption", "Correction capacity remains uneven"] },
  Brazil: { subtitle: "Large-scale interoperability effort centred on RNDS, SUS Digital and citizen-facing access.", values: [84, 85, 76, 80, 81, 67], strengths: ["RNDS platform", "Meu SUS Digital", "Nationwide SUS Digital adhesion"], watch: ["Federal complexity", "Uneven local implementation", "Less visible correction layer"] },
  Canada: { subtitle: "Strong policy vision, but constrained by a multi-jurisdictional landscape and uneven implementation.", values: [71, 76, 68, 74, 77, 58], strengths: ["Pan-Canadian roadmap", "Strong digital health policy capacity", "Connected care priorities"], watch: ["Jurisdictional fragmentation", "Variable implementation maturity", "Coordination complexity"] },
  China: { subtitle: "Large-scale state-led digital health environment with strong deployment capacity, but more limited transparency on interoperability quality, recourse and practical correction pathways.", values: [74, 76, 70, 73, 71, 45], strengths: ["Large-scale public digital infrastructure", "Strong administrative steering capacity", "Platform-scale deployment potential"], watch: ["Public transparency on interoperability maturity remains more limited than in some peer systems", "Patient-facing correction and redress pathways are harder to read from open documentation", "Cross-actor trust and real-world continuity are more difficult to assess than infrastructure scale alone"] },
  France: { subtitle: "France combines strong identity and doctrinal foundations with comparatively weak real-world interoperability: connectivity remains concentrated in institutional corridors, DMP feeding is irregular, and correction mechanisms remain largely formal rather than operational.", values: [66, 45, 82, 42, 80, 15], strengths: ["INS identity layer", "Pro Santé Connect", "CI-SIS doctrine"], watch: ["Connectivity remains concentrated in state-centred channels", "DMP and Mon espace santé feeding remain irregular", "Correction and redress remain slow, opaque and frequently ineffective"] },
  Guatemala: { subtitle: "Foundational identity system exists, but health-sector integration remains comparatively early and uneven.", values: [54, 46, 62, 43, 55, 33], strengths: ["RENAP registry", "RENAP-MSPAS coordination", "Digital transformation agenda"], watch: ["Early-stage health interoperability", "Limited linkage to care pathways", "Weak ecosystem-wide correction loops"] },
  India: { subtitle: "Large digital-health identity ecosystem built around ABDM, ABHA and structured registries.", values: [80, 81, 86, 74, 79, 61], strengths: ["ABHA", "Health Facility Registry", "Provider Registry"], watch: ["Uneven state-level implementation", "Scale and diversity", "Less legible correction capacity"] },
  Japan: { subtitle: "Mature identity-linked health access environment combined with strong regulatory data infrastructure.", values: [82, 85, 88, 79, 86, 67], strengths: ["My Number health linkage", "Identity-linked access", "MID-NET"], watch: ["Governance and trust management", "Not all domains move at same speed", "Correction separate from maturity"] },
  Morocco: { subtitle: "Ecosystem in transition supported by broader digital transformation, still needing stronger convergence between identity and health interoperability.", values: [58, 49, 52, 61, 56, 34], strengths: ["Digital Morocco 2030", "National ID-based authentication", "State modernization potential"], watch: ["Health interoperability less visible", "Identity and care pathways require tighter integration", "Correction still maturing"] },
  "New Zealand": { subtitle: "Longstanding health-identity environment built around the National Health Index and broad operational use.", values: [81, 82, 90, 77, 84, 66], strengths: ["National Health Index", "Broad cross-setting use", "Clear identity governance"], watch: ["Identity does not equal full interoperability everywhere", "Connected systems still matter", "Correction remains distinct"] },
  Senegal: { subtitle: "Promising but uneven trajectory combining digital economy reforms, identity advances and health-system strengthening.", values: [60, 52, 57, 58, 51, 36], strengths: ["Biometric identity framework", "Digital economy reforms", "Health information-system strengthening"], watch: ["Health interoperability not yet as visible", "Identity-health integration remains partial", "Less documented feedback mechanisms"] },
  Sweden: { subtitle: "Strong medication-centred digital health ecosystem combining e-prescriptions, a national medication list and strict identity safeguards.", values: [86, 90, 84, 85, 92, 70], strengths: ["High e-prescription adoption", "National Medication List", "Strong identity and authorisation requirements"], watch: ["Correction requires governance beyond access control", "Strengths clearer in medicines than every domain", "Feedback channels still matter"] },
  Tanzania: { subtitle: "Structured digital-health trajectory with formal strategy, enterprise architecture and registry ambitions.", values: [69, 70, 61, 68, 63, 55], strengths: ["Digital health strategy", "Center for Digital Health", "Enterprise architecture"], watch: ["Implementation varies across facilities", "Continuity across full care path remains work in progress", "Correction less visible than architecture ambitions"] },
  "United States": { subtitle: "Nationally significant but heterogeneous environment, combining a federal governance floor with major state-level and network-level variation.", values: [82, 83, 72, 76, 84, 63], strengths: ["TEFCA", "USCDI", "Strong federal policy capacity"], watch: ["Major local variation", "Federal floor does not erase disparities", "State-specific reading still needed"] },
};

const COUNTRY_ISO3 = {
  Argentina: "ARG",
  Brazil: "BRA",
  Canada: "CAN",
  China: "CHN",
  France: "FRA",
  Guatemala: "GTM",
  India: "IND",
  Japan: "JPN",
  Morocco: "MAR",
  "New Zealand": "NZL",
  Senegal: "SEN",
  Sweden: "SWE",
  Tanzania: "TZA",
  "United States": "USA",
};

const AXIS_KEYS = ["governance", "technical", "identity", "adoption", "security", "learning"];
const MAP_WIDTH = 1000;
const MAP_HEIGHT = 500;
const MAP_VISIBLE_HEIGHT = 420;
const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || "";

function fallbackProfiles() {
  return Object.entries(COUNTRIES).map(([name, country]) => ({
    iso3: COUNTRY_ISO3[name],
    name,
    slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
    version: "prototype-0.1",
    updatedAt: "2026-07-15",
    evidenceLevel: "Illustrative working note",
    subtitle: country.subtitle,
    values: country.values,
    strengths: country.strengths,
    watch: country.watch,
    sources: [],
  }));
}

function normalizeProfile(profile) {
  const scores = profile.scores || profile.domainScores || {};
  const values = Array.isArray(profile.values)
    ? profile.values
    : AXIS_KEYS.map((key) => Number(scores[key] ?? 0));

  return {
    iso3: String(profile.iso3 || profile.country_iso3 || "").toUpperCase(),
    name: profile.name || profile.country_name || profile.countryName || "Unnamed country",
    slug: profile.slug || "",
    version: profile.version || "",
    updatedAt: profile.updatedAt || profile.updated_at || profile.assessment_date || profile.assessed_at || profile.published_at || "",
    evidenceLevel: profile.evidenceLevel || profile.evidence_level || "Exploratory working profile",
    subtitle: profile.subtitle || profile.summary || "",
    values,
    strengths: profile.strengths || [],
    watch: profile.watch || profile.pointsToWatch || [],
    sources: profile.sources || [],
  };
}

async function loadGlobalMapProfiles(signal) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/countries`, {
      headers: { Accept: "application/json" },
      signal,
    });
    if (!response.ok) throw new Error(`Countries API returned ${response.status}.`);
    const payload = await response.json();
    const rows = Array.isArray(payload) ? payload : payload.countries;
    if (!Array.isArray(rows)) throw new Error("Countries API payload must contain a countries array.");
    if (rows.length === 0) throw new Error("The countries API contains no published country profiles yet.");
    return { profiles: rows.map(normalizeProfile), source: "database" };
  } catch (error) {
    if (error?.name === "AbortError") throw error;
    return { profiles: fallbackProfiles(), source: "prototype", warning: error?.message || "API unavailable" };
  }
}

function cls(...items) {
  return items.filter(Boolean).join(" ");
}

function assertDataIntegrity() {
  Object.entries(COUNTRIES).forEach(([name, country]) => {
    if (!COUNTRY_ISO3[name]) {
      throw new Error(`Country data for ${name} must provide an ISO 3166-1 alpha-3 code.`);
    }
    if (!Array.isArray(country.values) || country.values.length !== AXES.length) {
      throw new Error(`Country data for ${name} must provide ${AXES.length} axis values.`);
    }
    if (!Array.isArray(country.strengths) || !Array.isArray(country.watch)) {
      throw new Error(`Country data for ${name} must include strengths and watch arrays.`);
    }
  });
}

function polar(angle, radius, center) {
  const rad = (angle - 90) * (Math.PI / 180);
  return {
    x: center + radius * Math.cos(rad),
    y: center + radius * Math.sin(rad),
  };
}

function LogoMark() {
  return (
    <div className="logo-box">
      <img
        src={logoImage}
        className="logo-svg"
        alt="IML logo"
      />
    </div>
  );
}

function Card({ children, className = "" }) {
  return <div className={cls("card", className)}>{children}</div>;
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

function HexagonChart({ values, small = false }) {
  const size = small ? 92 : 360;
  const center = size / 2;
  const radius = small ? 28 : 118;
  const levels = small ? 3 : 5;
  const safe = AXES.map((_, index) => Math.max(0, Math.min(100, Number(values?.[index]) || 0)));

  const ring = (scale) =>
    AXES.map((_, index) => {
      const point = polar((360 / AXES.length) * index, radius * scale, center);
      return `${point.x},${point.y}`;
    }).join(" ");

  const data = safe.map((value, index) => {
    const point = polar((360 / AXES.length) * index, radius * (value / 100), center);
    return `${point.x},${point.y}`;
  }).join(" ");

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className={small ? "mini-hex" : "hex-chart"} aria-label="IML hexagon chart">
      {Array.from({ length: levels }).map((_, index) => (
        <polygon key={index} points={ring((index + 1) / levels)} fill="none" stroke="#d8dee7" strokeWidth="1" />
      ))}
      {AXES.map((axis, index) => {
        const end = polar((360 / AXES.length) * index, radius, center);
        const label = polar((360 / AXES.length) * index, radius + (small ? 0 : 30), center);
        return (
          <g key={axis}>
            <line x1={center} y1={center} x2={end.x} y2={end.y} stroke="#d8dee7" strokeWidth="1" />
            {!small ? (
              <text x={label.x} y={label.y} textAnchor="middle" style={{ fontSize: 11, fontWeight: 600, fill: "#64748b" }}>
                {axis}
              </text>
            ) : null}
          </g>
        );
      })}
      <polygon points={data} fill="rgba(15,23,42,0.14)" stroke="#0f172a" strokeWidth="2" />
      {safe.map((value, index) => {
        const point = polar((360 / AXES.length) * index, radius * (value / 100), center);
        return <circle key={index} cx={point.x} cy={point.y} r={small ? 2.4 : 4} fill="#0f172a" />;
      })}
    </svg>
  );
}

function projectCoordinate([longitude, latitude]) {
  return [
    ((longitude + 180) / 360) * MAP_WIDTH,
    ((90 - latitude) / 180) * MAP_HEIGHT,
  ];
}

function ringToPath(coordinates) {
  if (!coordinates?.length) return "";
  let path = "";
  let previousX = null;

  coordinates.forEach((coordinate, index) => {
    const [x, y] = projectCoordinate(coordinate);
    const crossesDateLine = previousX !== null && Math.abs(x - previousX) > MAP_WIDTH / 2;
    path += index === 0 || crossesDateLine ? ` M ${x.toFixed(2)} ${y.toFixed(2)}` : ` L ${x.toFixed(2)} ${y.toFixed(2)}`;
    previousX = x;
  });

  return `${path} Z`;
}

function geometryToPath(geometry) {
  if (!geometry) return "";
  if (geometry.type === "Polygon") {
    return geometry.coordinates.map(ringToPath).join(" ");
  }
  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates.flatMap((polygon) => polygon.map(ringToPath)).join(" ");
  }
  return "";
}

function averageScore(values = []) {
  if (!values.length) return 0;
  return Math.round(values.reduce((total, value) => total + Number(value || 0), 0) / values.length);
}

function metricScore(profile, metric) {
  if (!profile) return null;
  if (metric === "overall") return averageScore(profile.values);
  const index = AXIS_KEYS.indexOf(metric);
  return index >= 0 ? Number(profile.values[index] || 0) : null;
}

function scoreFill(score, hasProfile) {
  if (!hasProfile || score === null) return "#e6edf5";
  if (score >= 85) return "#164e63";
  if (score >= 70) return "#0e7490";
  if (score >= 55) return "#67a8bb";
  if (score >= 40) return "#a8ced8";
  return "#d8e8ed";
}

function isAntarcticaFeature(feature) {
  const properties = feature?.properties || {};
  const iso3 = String(
    properties.iso3 ||
      properties.ISO_A3 ||
      properties.adm0_a3 ||
      properties.ADM0_A3 ||
      ""
  )
    .trim()
    .toUpperCase();

  const name = String(
    properties.name ||
      properties.NAME ||
      properties.admin ||
      properties.ADMIN ||
      ""
  )
    .trim()
    .toLowerCase();

  const continent = String(
    properties.continent ||
      properties.CONTINENT ||
      ""
  )
    .trim()
    .toLowerCase();

  return (
    iso3 === "ATA" ||
    name === "antarctica" ||
    name.includes("antarctica") ||
    continent === "antarctica"
  );
}

function WorldMap({ profiles, selectedCountry, onSelect, metric }) {
  const [hovered, setHovered] = useState(null);
  const profileByIso3 = useMemo(
    () => Object.fromEntries(profiles.map((profile) => [profile.iso3, profile])),
    [profiles]
  );

  const showTooltip = (event, feature) => {
    const svg = event.currentTarget.ownerSVGElement;
    const bounds = svg.getBoundingClientRect();
    const iso3 = feature.properties.iso3;
    const profile = profileByIso3[iso3];
    setHovered({
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
      iso3,
      name: profile?.name || feature.properties.name,
      score: metricScore(profile, metric),
      hasProfile: Boolean(profile),
    });
  };

  const selectFeature = (feature) => {
    const iso3 = feature.properties.iso3;
    if (!iso3 || iso3 === "-99") return;
    const profile = profileByIso3[iso3];
    onSelect({ iso3, name: profile?.name || feature.properties.name });
  };

  return (
    <div className="world-box">
      <div className="world-box-head">
        <div>
          <div className="eyebrow">PostgreSQL-ready prototype</div>
          <div className="overview-title">Interactive country profiles</div>
        </div>
        <div className="helper-pill">Move over a country to preview it. Amber means selected for viewing, never scored.</div>
      </div>
      <div className="world-map-wrap map-stage">
        <svg viewBox={`0 0 ${MAP_WIDTH} ${MAP_VISIBLE_HEIGHT}`} className="world-map" aria-label="Interactive IML world map">
          <rect width={MAP_WIDTH} height={MAP_VISIBLE_HEIGHT} rx="26" fill="#f8fbff" />
          <g>
            {worldCountries.features
              .filter((feature) => !isAntarcticaFeature(feature))
              .map((feature) => {
              const iso3 = feature.properties.iso3;
              const profile = profileByIso3[iso3];
              const selected = selectedCountry?.iso3 === iso3;
              const score = metricScore(profile, metric);
              return (
                <path
                  key={`${iso3}-${feature.properties.name}`}
                  d={geometryToPath(feature.geometry)}
                  className={cls("country-shape", profile && "country-shape-profile", selected && "country-shape-selected")}
                  fill={selected ? "#f59e0b" : scoreFill(score, Boolean(profile))}
                  stroke={selected ? "#92400e" : "#9fb0c4"}
                  strokeWidth={selected ? 2.2 : 0.65}
                  vectorEffect="non-scaling-stroke"
                  tabIndex={iso3 && iso3 !== "-99" ? 0 : undefined}
                  role={iso3 && iso3 !== "-99" ? "button" : undefined}
                  aria-label={`${profile?.name || feature.properties.name}${profile ? ", IML profile available" : ", profile not yet available"}`}
                  onMouseEnter={(event) => showTooltip(event, feature)}
                  onMouseMove={(event) => showTooltip(event, feature)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => selectFeature(feature)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") selectFeature(feature);
                  }}
                />
              );
            })}
          </g>
        </svg>
        {hovered ? (
          <div
            className="map-tooltip-floating"
            style={{
              left: Math.min(hovered.x + 14, 820),
              top: Math.max(12, hovered.y - 18),
            }}
          >
            <strong>{hovered.name}</strong>
            <span>{hovered.hasProfile ? `${hovered.score}/100 · working profile` : "Profile not yet available"}</span>
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
        <span className="legend-selected">
          <span className="legend-selected-swatch" aria-hidden="true" />
          Selected country · viewing only, not a score
        </span>
      </div>
    </div>
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
          <p>
            <strong>Selection only:</strong> this highlight means that the
            country is being viewed. It does not represent an IML score or
            assessment.
          </p>
          <p>
            This country already exists on the map, but no IML evidence profile
            has been published in the database. The future editorial workflow
            can create a draft, attach sources, request local review and publish
            it without changing the map code.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="split-grid profile-grid">
      <Card>
        <div className="content-block">
          <div className="profile-head">
            <div>
              <div className="eyebrow">{profile.iso3}</div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  flexWrap: "wrap",
                }}
              >
                <h3 style={{ margin: 0 }}>{profile.name}</h3>

                <div
                  className="score-pill"
                  title="Exploratory overall signal, not a country ranking"
                >
                  {averageScore(profile.values)}/100
                </div>
              </div>
            </div>
          </div>

          <p className="muted-copy">{profile.subtitle}</p>

          <div className="profile-meta">
            <span>Version {profile.version || "pending"}</span>
            <span>{profile.evidenceLevel}</span>
            <span>
              {profile.updatedAt
                ? `Updated ${profile.updatedAt}`
                : "Review date pending"}
            </span>
          </div>

          <HexagonChart values={profile.values} />

          <div className="profile-stat-grid">
            {AXES.map((axis, index) => (
              <div className="profile-stat" key={axis}>
                <span>{axis}</span>
                <strong>{profile.values[index]}</strong>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <div className="stack-layout">
        <Card>
          <div className="content-block">
            <h3>Strengths</h3>
            <ul className="plain-list">
              {profile.strengths.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </div>
        </Card>

        <Card>
          <div className="content-block">
            <h3>Points to watch</h3>
            <ul className="plain-list">
              {profile.watch.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </div>
        </Card>

        <Card className="soft-card">
          <div className="content-block">
            <h3>Evidence</h3>
            <p>
              {profile.sources.length
                ? `${profile.sources.length} source(s) attached to this profile.`
                : "No documentary sources are attached to this illustrative seed profile yet."}
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}

function HomePage() {
  return (
    <>
      <section className="hero">
      <div className="container hero-grid">
        <div className="hero-copy">
          <div className="section-badge">Open for scientific review</div>
          <h1>A scientific framework for trusted Health Information Ecosystems.</h1>
          <div className="principle-stack" aria-label="IML founding principles">
            <div className="principle-line">Health is the objective.</div>
            <div className="principle-line">Trustworthy information is the foundation.</div>
            <div className="principle-line">Interoperability is the path.</div>
          </div>
          <p className="hero-text">IML helps researchers, clinicians, institutions, engineers, payers and public decision-makers understand, assess and progressively improve the ecosystems through which health information is generated, trusted, exchanged and used.</p>
          <p className="hero-text">IML is not intended to remain a repository of ideas. Its next step is to seek institutional collaboration capable of reviewing and testing its methods and of progressively developing an open-source reference environment that can connect existing systems and provide a practical starting point in underserved settings.</p>
          <Card className="note-box">
            <p>
              IML does not rank countries. It creates maturity profiles, identifies
              weaknesses in information continuity and supports practical improvement
              pathways.
            </p>
          </Card>
          <div className="button-row">
            <a className="primary-button" href={MANUSCRIPT_URL} download>
              Download the Founding Manuscript
            </a>
            <a className="secondary-button" href="#methodology">
              Explore the framework
            </a>
          </div>
          <div className="metric-grid two-up top-gap-small">
            <MetricCard symbol="5L" title="Interoperability" value="5 layers" subtitle="Technical, semantic, organisational, institutional, and clinical/public health." />
            <MetricCard symbol="6D" title="Assessment" value="6 domains" subtitle="A health-oriented maturity profile rather than a technological inventory." />
          </div>
        </div>
        <Card className="overview-card">
          <div className="overview-top">
            <LogoMark />
            <div>
              <div className="eyebrow">Interoperability Maturity Lab</div>
              <div className="overview-title">From information to better health</div>
            </div>
          </div>
          <div className="tile-grid three-up">
            {[
              ["Health Information Ecosystems", "The ecosystem, not an isolated application, is the principal unit of analysis."],
              ["AMR / BMR demonstrator", "UTI and multidrug-resistant E. coli provide the first operational thread."],
              ["Human responsibility", "AI may assist analysis and learning, but responsibility remains human."],
            ].map(([title, text]) => (
              <div key={title} className="mini-tile">
                <div className="mini-tile-title">{title}</div>
                <div className="mini-tile-text">{text}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
      </section>

      <section className="section">
        <div className="container">
          <Card className="soft-card">
            <div className="content-block">
              <div className="section-badge">Positioning</div>
              <h3>Existing digital health maturity initiatives</h3>
              <p>
                IML is complementary to initiatives such as the{" "}
                <a
                  className="text-link"
                  href="https://monitor.digitalhealthmonitor.org/map"
                  target="_blank"
                  rel="noreferrer"
                >
                  Global Digital Health Monitor
                </a>
                . These tools help describe national digital health capacity and progress.
                IML focuses on a narrower question: whether this capacity preserves
                clinical meaning, context, trust and usefulness across Health Information
                Ecosystems.
              </p>
            </div>
          </Card>
        </div>
      </section>
    </>
  );
}

function MethodologyPage() {
  const domains = [
    { title: "Governance and Standards", symbol: "GOV", text: "Shared responsibilities, standards, legal clarity and accountable ecosystem governance." },
    { title: "Technical Interoperability", symbol: "TEC", text: "Secure, reliable and maintainable exchange across heterogeneous systems." },
    { title: "Identity, Consent and Trust", symbol: "ID", text: "Reliable identification, appropriate consent, provenance and confidence in information." },
    { title: "Adoption and Use", symbol: "USE", text: "Practical integration into workflows, with training, access rights and professional roles aligned with real care activity." },
    { title: "Security and Resilience", symbol: "SEC", text: "Protection, availability, recovery, traceability and continuity under disruption." },
    { title: "Feedback, Correction and Learning", symbol: "LRN", text: "Correction pathways, feedback loops, evaluation and institutional learning." },
  ];

  return (
    <section className="section">
      <div className="container">
        <SectionTitle badge="IML Framework" title="A maturity framework for improvement, not ranking" text="Assessment should answer three questions: where are we today, what should improve next, and how will progress be measured?" />

        <Card className="soft-card">
          <div className="content-block">
            <h3>How IML differs from digital health maturity dashboards</h3>
            <p>
              IML does not duplicate national digital health maturity dashboards. Tools such
              as the Global Digital Health Monitor provide a valuable country-level view of
              digital health capacity, including governance, strategy, infrastructure,
              standards, interoperability and workforce. IML adds a clinical and
              ecosystem-oriented layer of analysis.
            </p>
            <p>
              Rather than asking only whether digital health capacity exists, IML asks
              whether information remains trustworthy, contextualised, auditable and
              actionable across care, public health, research and financing.
            </p>
            <p>
              This distinction matters. A health system may have digital strategies,
              platforms and standards while still losing clinical context between a
              laboratory result, a diagnosis, a treatment decision and an outcome. IML
              therefore examines interoperability usefulness, not digital maturity alone.
            </p>
          </div>
        </Card>

        <div className="tile-grid three-up top-gap-small">
          {domains.map((pillar) => (
            <Card key={pillar.title} className="value-card">
              <div className="metric-symbol">{pillar.symbol}</div>
              <h3>{pillar.title}</h3>
              <p>{pillar.text}</p>
            </Card>
          ))}
        </div>
        <div className="split-grid top-gap">
          <Card className="soft-card">
            <div className="content-block">
              <h3>Five interacting layers</h3>
              <ul className="compact-list">
                <li><strong>Technical:</strong> can systems exchange information securely and reliably?</li>
                <li><strong>Semantic:</strong> is meaning preserved across systems and contexts?</li>
                <li><strong>Organisational:</strong> do workflows and responsibilities support action?</li>
                <li><strong>Institutional:</strong> are institutions ready and willing to collaborate?</li>
                <li><strong>Clinical and public health:</strong> does information improve care, prevention, surveillance or learning?</li>
              </ul>
            </div>
          </Card>
          <Card className="soft-card">
            <div className="content-block">
              <h3>Cross-cutting dimensions</h3>
              <ul className="compact-list">
                <li><strong>Institutional Engagement</strong> examines responsiveness, collaboration and the capacity to receive, review and test proposals.</li>
                <li><strong>Payer Interoperability</strong> recognises public and private financing actors as part of the ecosystem.</li>
                <li><strong>AI Readiness</strong> examines whether information is trustworthy enough for responsible AI-assisted use.</li>
              </ul>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}

function Id4dPage() {
  return (
    <section className="section">
      <div className="container">
        <SectionTitle badge="Identity infrastructure" title="Identity, consent and trust across fragmented systems" text="Identity is an enabling layer for continuity, accountability and appropriate access. It is not the whole of interoperability." />
        <Card className="soft-card">
          <div className="content-block">
            <h3>Identity and trust: not a new number, but a secure access layer</h3>
            <p>IML does not propose a new personal identity number or a replacement for national identity systems. Instead, IML explores how existing national identifiers and emerging digital identity infrastructures, including the European Digital Identity Wallet, could support safer health information interoperability through secure, purpose-limited and auditable access tokens. A QR code or mobile application could be used as a practical access mechanism, but sensitive identity or health information should never be exposed in clear text. Biometric authentication, if used, should remain local to the user’s device and serve only to unlock access or confirm user presence. Any operational implementation would require scientific validation, privacy and security assessment, transparent governance, correction procedures, safeguards against exclusion or misuse, and legal review. At this stage, this is a research hypothesis, not an operational identity system.</p>
        
        <p>IML distinguishes identity, identifier, access token and carrier mechanism. It should avoid a new universal identity number and instead explore identity-light mechanisms: temporary signed access tokens, patient-mediated authorisation, trusted identity brokers, contextual pseudonyms and episode-based linkage. A QR code or mobile application would only carry a temporary, auditable and revocable token. The objective is not to expose identity, but to enable legitimate access to trustworthy health information under strict governance.</p> 
        </div>
        </Card>
      </div>
    </section>
  );
}

function EvaluationPage() {
  return (
    <section className="section">
      <div className="container">
        <SectionTitle badge="Operational pathway" title="From assessment to action" text="IML connects maturity assessment with practical implementation and concrete clinical and public health problems, while remaining independent of any particular vendor or platform." />

        <Card className="soft-card">
          <div className="content-block">
            <h3>The AMR/BMR demonstrator makes the difference visible</h3>
            <p>
              A digital health maturity dashboard can describe whether national digital
              health capacity exists. IML tests whether that capacity can preserve meaning
              in a real clinical pathway: symptoms, urine test, culture, antibiogram,
              diagnosis, treatment, evolution, surveillance and learning.
            </p>
          </div>
        </Card>

        <div className="tile-grid three-up top-gap-small">
          <Card className="value-card">
            <div className="metric-symbol">AMR</div>
            <h3>AMR / BMR demonstrator</h3>
            <p>A resistant isolate is not necessarily a clinically meaningful infection. The first IML demonstrator links microbiology with symptoms, diagnosis, treatment, outcomes and public health learning, beginning with UTI and multidrug-resistant <em>E. coli</em>.</p>
          </Card>
          <Card className="value-card">
            <div className="metric-symbol">OCW</div>
            <h3>Open Clinical Workspace</h3>
            <p>The Open Clinical Workspace is intended as an open-source, vendor-neutral reference environment. In digitally mature settings it should connect and contextualise existing systems; in underserved settings it should provide a progressively deployable clinical and public health foundation. Its design must acknowledge that about 2.2 billion people remain offline and 3.4 billion do not use mobile Internet, supporting local hosting, intermittent connectivity, offline-first workflows, modest hardware and multilingual use. It should reuse and extend mature open-source components rather than rebuild them.</p>
          </Card>
          <Card className="value-card">
            <div className="metric-symbol">Q</div>
            <h3>Technology quality in health</h3>
            <p>IML treats digital health software quality as a patient-safety issue. Commercial, public and open-source solutions should be assessed through transparent health-oriented criteria, including preservation of meaning and clinical context, auditability, correction, security, resilience, portability, reversibility, accessibility, offline operation and long-term maintainability. Operating systems and databases are evaluated through real health use cases, never through vendor preference.</p>
          </Card>
        </div>
        <Card className="soft-card top-gap">
          <div className="content-block">
            <h3>Clinical thread for the first demonstrator</h3>
            <div className="stack-list">
              <div className="list-box"><strong>1.</strong> Symptoms, fever and clinical context.</div>
              <div className="list-box"><strong>2.</strong> Urine testing, culture, bacterial count and antibiogram.</div>
              <div className="list-box"><strong>3.</strong> Clinical interpretation and retained diagnosis.</div>
              <div className="list-box"><strong>4.</strong> Treatment, evolution and outcome.</div>
              <div className="list-box"><strong>5.</strong> Aggregated surveillance, correction and shared learning.</div>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}

function WorldPage() {
  const [profiles, setProfiles] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [dataSource, setDataSource] = useState("loading");
  const [warning, setWarning] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    loadGlobalMapProfiles(controller.signal)
      .then((result) => {
        setProfiles(result.profiles);
        setDataSource(result.source);
        setWarning(result.warning || "");
      })
      .catch((error) => {
        if (error?.name !== "AbortError") {
          setProfiles(fallbackProfiles());
          setDataSource("prototype");
          setWarning(error?.message || "Unable to load the Global Map API.");
        }
      });
    return () => controller.abort();
  }, []);

  const profileByIso3 = useMemo(
    () => Object.fromEntries(profiles.map((profile) => [profile.iso3, profile])),
    [profiles]
  );
  const options = useMemo(
    () => [...profiles].sort((a, b) => a.name.localeCompare(b.name)),
    [profiles]
  );
  const selectedProfile = selectedCountry ? profileByIso3[selectedCountry.iso3] : null;

  return (
    <section className="section">
      <div className="container">
        <SectionTitle badge="Global Map prototype" title="Maturity profiles, not country rankings" text="The map treats every country as a stable geographic entity identified by its ISO alpha-3 code with six domain scores, evidence, strengths and improvement pathways." />

        <div className="top-gap-small">
          <WorldMap profiles={profiles} selectedCountry={selectedCountry} onSelect={setSelectedCountry} metric="overall" />
        </div>

        <div className="top-gap">
          <CountryProfile selectedCountry={selectedCountry} profile={selectedProfile} />
        </div>
      </div>
    </section>
  );
}

function ContactPage() {
  const email = "iml.health@pm.me";
  const [copied, setCopied] = useState(false);

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(
    "IML scientific review or collaboration"
  )}`;

  return (
    <section className="section">
      <div className="container">
        <SectionTitle
          badge="Open for scientific review"
          title="Scientific review and collaboration"
          text="IML welcomes methodological criticism, evidence review, clinical expertise, institutional perspectives and proposals for collaborative case studies."
        />
        <div className="split-grid profile-grid">
         <Card>
  <div className="content-block">
    <div className="profile-head">
      <div>
        <div className="eyebrow">{profile.iso3}</div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            flexWrap: "wrap",
          }}
        >
          <h3 style={{ margin: 0 }}>{profile.name}</h3>

          <div
            className="score-pill"
            title="Exploratory overall signal, not a country ranking"
          >
            {averageScore(profile.values)}/100
          </div>
        </div>
      </div>

      <div className="status-pill">{profile.status}</div>
    </div>

    <p className="muted-copy">{profile.subtitle}</p>

    <div className="profile-meta">
      <span>Version {profile.version || "pending"}</span>
      <span>{profile.evidenceLevel}</span>
      <span>
        {profile.updatedAt
          ? `Updated ${profile.updatedAt}`
          : "Review date pending"}
      </span>
    </div>

    <HexagonChart values={profile.values} />

    <div className="profile-stat-grid">
      {AXES.map((axis, index) => (
        <div className="profile-stat" key={axis}>
          <span>{axis}</span>
          <strong>{profile.values[index]}</strong>
        </div>
      ))}
    </div>
  </div>
</Card>
          <div className="stack-layout">
            <Card className="soft-card">
              <div className="content-block">
                <h3>Scientific contributions</h3>
                <p>
                  Messages may concern methodology, evidence review, clinical
                  or public health use cases, institutional collaboration,
                  payer interoperability or responsible AI.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <div className="footer-brand">
            <LogoMark />
            <div>
              <div className="eyebrow">IML</div>
              <div className="footer-title">Interoperability Maturity Lab</div>
            </div>
          </div>
          <p className="footer-copy">Health is the objective. Trustworthy information is the foundation. Interoperability is the path.</p>
        </div>
        <div>
          <div className="footer-label">Scientific status</div>
          <p className="footer-copy">Independent, non-commercial and open for scientific review. IML creates maturity profiles and improvement pathways rather than country rankings.</p>
        </div>
      </div>
    </footer>
  );
}

export default function App() {
  const getHash = () => {
    if (typeof window === "undefined") return "home";
    const hash = window.location.hash.replace("#", "").trim();
    return ROUTES.some((route) => route.key === hash) ? hash : "home";
  };

  const [route, setRoute] = useState(getHash);

  useEffect(() => {
    assertDataIntegrity();
  }, []);

  useEffect(() => {
    const sync = () => setRoute(getHash());
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  const goTo = (key) => {
    if (typeof window !== "undefined") {
      window.location.hash = key;
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    setRoute(key);
  };

  return (
    <div className="app-shell">
      <style>{styles}</style>
      <header className="topbar">
        <div className="container topbar-inner">
          <button type="button" className="brand-button" onClick={() => goTo("home")}>
            <LogoMark />
            <div>
              <div className="eyebrow">IML</div>
              <div className="brand-title">Interoperability Maturity Lab</div>
            </div>
          </button>
          <nav className="topnav desktop-nav">
            {ROUTES.map((item) => (
              <NavButton key={item.key} active={route === item.key} onClick={() => goTo(item.key)}>
                {item.label}
              </NavButton>
            ))}
          </nav>
        </div>
        <div className="container mobile-nav">
          {ROUTES.map((item) => (
            <NavButton key={item.key} active={route === item.key} onClick={() => goTo(item.key)}>
              {item.label}
            </NavButton>
          ))}
        </div>
      </header>
      <main>
        {route === "home" ? <HomePage /> : null}
        {route === "id4d" ? <Id4dPage /> : null}
        {route === "evaluation" ? <EvaluationPage /> : null}
        {route === "methodology" ? <MethodologyPage /> : null}
        {route === "world" ? <WorldPage /> : null}
        {route === "contact" ? <ContactPage /> : null}
      </main>
      <Footer />
    </div>
  );
}
