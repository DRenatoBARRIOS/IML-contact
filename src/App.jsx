import React, { useEffect, useMemo, useRef, useState } from "react";

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
  .logo-svg { height: 44px; width: 44px; }
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
  @media (max-width: 1100px) {
    .hero-grid, .split-grid, .footer-grid, .profile-grid, .metric-grid.two-up, .tile-grid, .tile-grid.three-up, .form-grid { grid-template-columns: 1fr; }
    .helper-pill { display: none; }
  }
  @media (max-width: 820px) {
    .desktop-nav { display: none; }
    .mobile-nav { display: flex; }
    .container { width: min(100% - 28px, 1180px); }
    .section, .hero-grid { padding-top: 56px; padding-bottom: 56px; }
    .hero-grid { gap: 22px; }
  }
`;

const CONTACT_FORM_ACTION = "https://formspree.io/f/xzdorore";
const ROUTES = [
  { key: "home", label: "Home" },
  { key: "id4d", label: "ID4D Framework" },
  { key: "evaluation", label: "Evaluation and regulatory shifts" },
  { key: "methodology", label: "Methodology" },
  { key: "world", label: "World Map" },
  { key: "contact", label: "Contact" },
];
const AXES = ["Standards", "Connectivity", "Identity", "Adoption", "Security", "Correction"];

const COUNTRIES = {
  Argentina: { score: 76, subtitle: "Nationally coordinated digital-health trajectory built around shared records and distributed interoperability.", values: [78, 74, 72, 77, 73, 63], strengths: ["National interoperability strategy", "Distributed shared health-record model", "Legal framework for electronic clinical records"], watch: ["Operational maturity varies across jurisdictions", "Implementation depends on provincial adoption", "Correction capacity remains uneven"] },
  Brazil: { score: 82, subtitle: "Large-scale interoperability effort centred on RNDS, SUS Digital and citizen-facing access.", values: [84, 85, 76, 80, 81, 67], strengths: ["RNDS platform", "Meu SUS Digital", "Nationwide SUS Digital adhesion"], watch: ["Federal complexity", "Uneven local implementation", "Less visible correction layer"] },
  Canada: { score: 73, subtitle: "Strong policy vision, but constrained by a multi-jurisdictional landscape and uneven implementation.", values: [71, 76, 68, 74, 77, 58], strengths: ["Pan-Canadian roadmap", "Strong digital health policy capacity", "Connected care priorities"], watch: ["Jurisdictional fragmentation", "Variable implementation maturity", "Coordination complexity"] },
  China: { score: 72, subtitle: "Large-scale state-led digital health environment with strong deployment capacity, but more limited transparency on interoperability quality, recourse and practical correction pathways.", values: [74, 76, 70, 73, 71, 45], strengths: ["Large-scale public digital infrastructure", "Strong administrative steering capacity", "Platform-scale deployment potential"], watch: ["Public transparency on interoperability maturity remains more limited than in some peer systems", "Patient-facing correction and redress pathways are harder to read from open documentation", "Cross-actor trust and real-world continuity are more difficult to assess than infrastructure scale alone"] },
  France: { score: 55, subtitle: "France combines strong identity and doctrinal foundations with comparatively weak real-world interoperability: connectivity remains concentrated in institutional corridors, DMP feeding is irregular, and correction mechanisms remain largely formal rather than operational.", values: [66, 45, 82, 42, 80, 15], strengths: ["INS identity layer", "Pro Santé Connect", "CI-SIS doctrine"], watch: ["Connectivity remains concentrated in state-centred channels", "DMP and Mon espace santé feeding remain irregular", "Correction and redress remain slow, opaque and frequently ineffective"] },
  Guatemala: { score: 52, subtitle: "Foundational identity system exists, but health-sector integration remains comparatively early and uneven.", values: [54, 46, 62, 43, 55, 33], strengths: ["RENAP registry", "RENAP-MSPAS coordination", "Digital transformation agenda"], watch: ["Early-stage health interoperability", "Limited linkage to care pathways", "Weak ecosystem-wide correction loops"] },
  India: { score: 79, subtitle: "Large digital-health identity ecosystem built around ABDM, ABHA and structured registries.", values: [80, 81, 86, 74, 79, 61], strengths: ["ABHA", "Health Facility Registry", "Provider Registry"], watch: ["Uneven state-level implementation", "Scale and diversity", "Less legible correction capacity"] },
  Japan: { score: 84, subtitle: "Mature identity-linked health access environment combined with strong regulatory data infrastructure.", values: [82, 85, 88, 79, 86, 67], strengths: ["My Number health linkage", "Identity-linked access", "MID-NET"], watch: ["Governance and trust management", "Not all domains move at same speed", "Correction separate from maturity"] },
  Morocco: { score: 55, subtitle: "Ecosystem in transition supported by broader digital transformation, still needing stronger convergence between identity and health interoperability.", values: [58, 49, 52, 61, 56, 34], strengths: ["Digital Morocco 2030", "National ID-based authentication", "State modernization potential"], watch: ["Health interoperability less visible", "Identity and care pathways require tighter integration", "Correction still maturing"] },
  "New Zealand": { score: 83, subtitle: "Longstanding health-identity environment built around the National Health Index and broad operational use.", values: [81, 82, 90, 77, 84, 66], strengths: ["National Health Index", "Broad cross-setting use", "Clear identity governance"], watch: ["Identity does not equal full interoperability everywhere", "Connected systems still matter", "Correction remains distinct"] },
  Senegal: { score: 57, subtitle: "Promising but uneven trajectory combining digital economy reforms, identity advances and health-system strengthening.", values: [60, 52, 57, 58, 51, 36], strengths: ["Biometric identity framework", "Digital economy reforms", "Health information-system strengthening"], watch: ["Health interoperability not yet as visible", "Identity-health integration remains partial", "Less documented feedback mechanisms"] },
  Sweden: { score: 88, subtitle: "Strong medication-centred digital health ecosystem combining e-prescriptions, a national medication list and strict identity safeguards.", values: [86, 90, 84, 85, 92, 70], strengths: ["High e-prescription adoption", "National Medication List", "Strong identity and authorisation requirements"], watch: ["Correction requires governance beyond access control", "Strengths clearer in medicines than every domain", "Feedback channels still matter"] },
  Tanzania: { score: 67, subtitle: "Structured digital-health trajectory with formal strategy, enterprise architecture and registry ambitions.", values: [69, 70, 61, 68, 63, 55], strengths: ["Digital health strategy", "Center for Digital Health", "Enterprise architecture"], watch: ["Implementation varies across facilities", "Continuity across full care path remains work in progress", "Correction less visible than architecture ambitions"] },
  "United States": { score: 80, subtitle: "Nationally significant but heterogeneous environment, combining a federal governance floor with major state-level and network-level variation.", values: [82, 83, 72, 76, 84, 63], strengths: ["TEFCA", "USCDI", "Strong federal policy capacity"], watch: ["Major local variation", "Federal floor does not erase disparities", "State-specific reading still needed"] },
};

const MARKERS = [
  { name: "Argentina", x: 246, y: 302 },
  { name: "Brazil", x: 223, y: 258, labelDx: 12, labelDy: 16 },
  { name: "Canada", x: 140, y: 110, labelDx: 12, labelDy: -2, textSize: 11.5 },
  { name: "China", x: 730, y: 155, labelDx: 12, labelDy: -10 },
  { name: "France", x: 470, y: 125 },
  { name: "Guatemala", x: 178, y: 184, labelDx: -82, labelDy: -10 },
  { name: "India", x: 662, y: 186, labelDx: 12, labelDy: 18 },
  { name: "Japan", x: 812, y: 166, labelDx: 10, labelDy: -8 },
  { name: "Morocco", x: 446, y: 170, labelDx: -36, labelDy: -10 },
  { name: "New Zealand", x: 805, y: 350 },
  { name: "Senegal", x: 428, y: 205, labelDx: -48, labelDy: 10 },
  { name: "Sweden", x: 490, y: 88 },
  { name: "Tanzania", x: 505, y: 274, labelDx: 12, labelDy: 18 },
  { name: "United States", x: 120, y: 138, labelDx: 12, labelDy: 18, textSize: 12.4 },
];

function cls(...items) {
  return items.filter(Boolean).join(" ");
}

function assertDataIntegrity() {
  Object.entries(COUNTRIES).forEach(([name, country]) => {
    if (!Array.isArray(country.values) || country.values.length !== AXES.length) {
      throw new Error(`Country data for ${name} must provide ${AXES.length} axis values.`);
    }
    if (!Array.isArray(country.strengths) || !Array.isArray(country.watch)) {
      throw new Error(`Country data for ${name} must include strengths and watch arrays.`);
    }
  });
  MARKERS.forEach((marker) => {
    if (!COUNTRIES[marker.name]) {
      throw new Error(`Marker ${marker.name} must match a country entry.`);
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
      <svg viewBox="0 0 64 64" className="logo-svg" aria-label="IML logo">
        <g fill="none" stroke="#0f172a" strokeWidth="1.45" strokeLinecap="round" strokeLinejoin="round">
          <rect x="10.5" y="10.5" width="43" height="43" rx="1.6" />
          <path d="M32 15.5 L46 44 H18 Z" />
          <path d="M20.6 33 C23.7 28.1, 28.7 25.6, 31.7 25.6 C34.8 25.6, 39.8 28.1, 43.4 33 C39.8 37.9, 34.8 40.4, 31.7 40.4 C28.7 40.4, 23.7 37.9, 20.6 33 Z" />
          <circle cx="30.7" cy="33" r="4.2" fill="#0f172a" stroke="none" />
          <circle cx="32" cy="31.7" r="0.95" fill="white" stroke="none" />
        </g>
      </svg>
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

function WorldTooltip({ marker, country, onEnter, onLeave }) {
  if (!marker || !country) return null;
  const left = `${(marker.x / 900) * 100}%`;
  const top = `${(marker.y / 430) * 100}%`;
  const horizontal = marker.x > 650 ? "translate(calc(-100% - 18px), -16px)" : "translate(18px, -16px)";

  return (
    <div className="tooltip-anchor" style={{ left, top, transform: horizontal }} onMouseEnter={onEnter} onMouseLeave={onLeave}>
      <div className="map-tooltip">
        <div className="map-tooltip-top">
          <div className="map-tooltip-title">{marker.name}</div>
          <div className="map-tooltip-score">{country.score}%</div>
        </div>
        <HexagonChart values={country.values} small />
      </div>
    </div>
  );
}

function WorldMap({ selectedCountry, onSelect }) {
  const [hoveredCountry, setHoveredCountry] = useState("");
  const closeTimerRef = useRef(null);

  const clearCloseTimer = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const openTooltip = (name) => {
    clearCloseTimer();
    setHoveredCountry(name);
    onSelect(name);
  };

  const scheduleClose = () => {
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => {
      setHoveredCountry("");
      closeTimerRef.current = null;
    }, 140);
  };

  const activeMarker = MARKERS.find((marker) => marker.name === hoveredCountry) || null;
  const activeCountry = hoveredCountry ? COUNTRIES[hoveredCountry] : null;

  return (
    <div className="world-box">
      <div className="world-box-head">
        <div>
          <div className="eyebrow">Global coverage in progress</div>
          <div className="overview-title">Interactive world review map</div>
        </div>
        <div className="helper-pill">Hover a marker to preview the country hexagon. The full note updates below.</div>
      </div>
      <div className="world-map-wrap">
        <svg viewBox="0 0 900 430" className="world-map" aria-label="Interactive world map">
          <defs>
            <linearGradient id="oceanFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f8fbff" />
              <stop offset="100%" stopColor="#eef3f9" />
            </linearGradient>
            <linearGradient id="landFill" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#e7eef6" />
              <stop offset="100%" stopColor="#d5e0ec" />
            </linearGradient>
          </defs>
          <rect x="0" y="0" width="900" height="430" rx="28" fill="url(#oceanFill)" />
          <g fill="url(#landFill)" stroke="#9fb0c4" strokeWidth="1.1">
            <path d="M88 112 C108 80, 170 70, 214 90 C248 105, 254 144, 232 170 C214 192, 174 197, 155 220 C139 240, 101 236, 79 207 C59 180, 58 141, 88 112 Z" />
            <path d="M180 233 C199 228, 226 239, 239 259 C251 276, 245 305, 223 319 C204 332, 176 326, 164 305 C154 287, 160 241, 180 233 Z" />
            <path d="M372 92 C422 70, 498 75, 548 103 C580 122, 595 160, 572 187 C551 211, 504 214, 482 233 C456 254, 417 247, 395 228 C376 211, 337 212, 320 189 C304 166, 317 116, 372 92 Z" />
            <path d="M468 238 C489 228, 523 235, 542 255 C559 271, 563 308, 538 333 C515 355, 479 354, 455 338 C433 323, 420 297, 428 273 C435 255, 448 247, 468 238 Z" />
            <path d="M609 103 C654 85, 730 92, 775 118 C816 141, 829 182, 806 212 C781 244, 733 246, 694 241 C657 236, 623 214, 604 190 C584 163, 579 118, 609 103 Z" />
            <ellipse cx="742" cy="324" rx="34" ry="18" />
            <ellipse cx="805" cy="350" rx="17" ry="10" />
          </g>
          <g>
            {MARKERS.map((marker) => {
              const selected = selectedCountry === marker.name;
              const hovered = hoveredCountry === marker.name;
              return (
                <g key={marker.name} className="marker-group" onClick={() => onSelect(marker.name)} onMouseEnter={() => openTooltip(marker.name)} onMouseLeave={scheduleClose}>
                  <circle cx={marker.x} cy={marker.y} r={selected || hovered ? 12 : 8} fill={selected || hovered ? "#0f172a" : "#334155"} />
                  <circle cx={marker.x} cy={marker.y} r={selected || hovered ? 22 : 15} fill="rgba(15,23,42,0.10)" />
                  <text x={marker.x + (marker.labelDx ?? 14)} y={marker.y + (marker.labelDy ?? 4)} fill="#0f172a" style={{ fontSize: marker.textSize ?? 13, fontWeight: 600 }}>{marker.name}</text>
                </g>
              );
            })}
          </g>
        </svg>
        {activeMarker && activeCountry ? <WorldTooltip marker={activeMarker} country={activeCountry} onEnter={() => openTooltip(activeMarker.name)} onLeave={scheduleClose} /> : null}
      </div>
    </div>
  );
}

function CountryProfile({ selectedCountry }) {
  const selected = selectedCountry ? COUNTRIES[selectedCountry] : null;
  if (!selected) return null;

  return (
    <div className="split-grid profile-grid">
      <Card>
        <div className="content-block">
          <div className="profile-head">
            <h3>{selectedCountry}</h3>
            <div className="score-pill">Score {selected.score}/100</div>
          </div>
          <p className="muted-copy">{selected.subtitle}</p>
          <HexagonChart values={selected.values} />
        </div>
      </Card>
      <div className="stack-layout">
        <Card>
          <div className="content-block">
            <h3>Strengths</h3>
            <ul className="plain-list">
              {selected.strengths.map((item) => <li key={item}>• {item}</li>)}
            </ul>
          </div>
        </Card>
        <Card>
          <div className="content-block">
            <h3>Points to watch</h3>
            <ul className="plain-list">
              {selected.watch.map((item) => <li key={item}>• {item}</li>)}
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
}

function HomePage() {
  return (
    <section className="hero">
      <div className="container hero-grid">
        <div className="hero-copy">
          <h1>The framework that makes interoperability maturity visible, comparable and governable.</h1>
          <p className="hero-text">IML provides a publication-ready framework for assessing health systems, exchange architectures, identity layers and real-world deployment capacity.</p>
          <Card className="note-box">
            <p>Interoperability maturity depends on how identity, governance, trust, deployment and correction capacity reinforce one another in practice.</p>
          </Card>
          <div className="metric-grid two-up">
            <MetricCard symbol="6X" title="Assessment model" value="6 criteria" subtitle="Standards, connectivity, identity, adoption, security and correction." />
            <MetricCard symbol="ID" title="Critical layer" value="Identity & trust" subtitle="The seam between interoperability and confidence." />
          </div>
        </div>
        <Card className="overview-card">
          <div className="overview-top">
            <LogoMark />
            <div>
              <div className="eyebrow">Institutional overview</div>
              <div className="overview-title">Publication-ready structure</div>
            </div>
          </div>
          <div className="tile-grid three-up">
            {[["Scoring", "A readable maturity score anchored in six criteria."], ["Benchmarks", "Country profiles that quickly open strategic discussion."], ["ID4D", "A trust and inclusion lens for identity-enabled public infrastructure."]].map(([title, text]) => (
              <div key={title} className="mini-tile">
                <div className="mini-tile-title">{title}</div>
                <div className="mini-tile-text">{text}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </section>
  );
}

function MethodologyPage() {
  return (
    <section className="section">
      <div className="container">
        <SectionTitle badge="" title="A framework that is simple to read and strong enough to defend" text="IML combines six assessment dimensions, a maturity score and comparative country notes." />
        <div className="tile-grid three-up">
          {[{ title: "Governance & Standards", symbol: "GV", text: "Institutional ownership, legal frameworks and national steering capacity." }, { title: "Technical Interoperability", symbol: "IO", text: "Exchange models, APIs, semantics and architecture coherence." }, { title: "Identity & Trust", symbol: "ID", text: "Identity matching, authentication, consent and trust services." }, { title: "Security", symbol: "SC", text: "Privacy safeguards, access control and traceability." }, { title: "Adoption", symbol: "AD", text: "Operational rollout, user uptake and workflow integration." }, { title: "Correction & Feedback", symbol: "CF", text: "Redress, correction and institutional learning from failures." }].map((pillar) => (
            <Card key={pillar.title} className="value-card">
              <div className="metric-symbol">{pillar.symbol}</div>
              <h3>{pillar.title}</h3>
              <p>{pillar.text}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function Id4dPage() {
  return (
    <section className="section">
      <div className="container">

        
        
        
        
        <SectionTitle badge="Identity infrastructure" title="Positioning IML in alignment with the ID4D approach" text="Identity is treated as an enabling public infrastructure layer for access, trust and accountability." />
        <Card className="soft-card">
          <div className="content-block">
            <h3>Identity and trust as a public infrastructure layer</h3>
            <p>Digital identity is more than a secure authentication mechanism. In a fragmented healthcare ecosystem, it provides the foundation for creating a common interoperability identifier capable of linking information originating from heterogeneous clinical, laboratory, pharmacy and administrative systems. Rather than replacing existing national or local identifiers or requiring a single software platform, the proposed IML approach is based on a federated identity model that generates a shared interoperability identifier through standardized identity matching, trusted governance and interoperability standards. This logical identifier acts as a bridge between heterogeneous information systems, enabling them to recognize the same patient, healthcare professional or organization while preserving existing infrastructures and workflows. By providing this common identification layer, health systems can harmonize data, reduce duplicate records, improve data quality, and support secure information exchange across institutions, regions and countries without replacing existing systems.
</p>
            <div className="code-box mono">IML1-S-DDMMYYYY-GEO4-HASH-CC</div>
            <p className="small-text">
  <strong>IML1</strong>: algorithm version •
  <strong>S</strong>: sex •
  <strong>DDMMYYYY</strong>: date of birth •
  <strong>GEO4</strong>: standardized geographic code •
  <strong>HASH</strong>: one-way cryptographic hash generated from normalized demographic attributes •
  <strong>CC</strong>: checksum for integrity verification.
</p>
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
        <SectionTitle badge="" title="Evaluation and regulatory shifts in an interoperable environment" text="Interoperability maturity affects clinical evaluation, long-term follow-up and regulatory decision-making." />
        <Card className="soft-card">
          <div className="content-block">
            <h3>Illustrative progression scale</h3>
            <div className="stack-list">
              <div className="list-box"><strong>20%</strong> · Fragmented observation.</div>
              <div className="list-box"><strong>40%</strong> · Partial visibility.</div>
              <div className="list-box"><strong>60%</strong> · Structured follow-up.</div>
              <div className="list-box"><strong>80%</strong> · Advanced continuity.</div>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}

function WorldPage() {
  const [selectedCountry, setSelectedCountry] = useState("");
  const options = useMemo(() => Object.keys(COUNTRIES).sort((a, b) => a.localeCompare(b)), []);

  return (
    <section className="section">
      <div className="container">
        <SectionTitle badge="Country notes" title="A growing global review rather than a closed country list" text="The countries currently included are illustrative, not exhaustive." />
        <Card className="soft-card">
          <div className="content-block">
            <h3>Reading guide for score ranges</h3>
            <div className="tile-grid">
              {[{ range: "0-39%", title: "Foundational stage", text: "Very limited interoperability maturity." }, { range: "40-59%", title: "Emerging stage", text: "A visible trajectory exists, but continuity remains uneven." }, { range: "60-79%", title: "Structured stage", text: "The system shows coherent architecture with meaningful deployment." }, { range: "80-100%", title: "Advanced stage", text: "Interoperability is broadly structured and operational." }].map((item) => (
                <div key={item.range} className="mini-tile">
                  <div className="mini-tile-title">{item.range} · {item.title}</div>
                  <div className="mini-tile-text">{item.text}</div>
                </div>
              ))}
            </div>
          </div>
        </Card>
        <div className="select-wrap top-gap">
          <label>Choose a country</label>
          <select value={selectedCountry} onChange={(event) => setSelectedCountry(event.target.value)}>
            <option value="">Choose a country</option>
            {options.map((country) => <option key={country} value={country}>{country}</option>)}
          </select>
        </div>
        <div className="top-gap">
          <WorldMap selectedCountry={selectedCountry} onSelect={setSelectedCountry} />
        </div>
        {selectedCountry ? (
          <div className="top-gap">
            <CountryProfile selectedCountry={selectedCountry} />
          </div>
        ) : null}
      </div>
    </section>
  );
}

function ContactPage() {
  const [copied, setCopied] = useState(false);
  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText("iml.health@pm.me");
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section className="section">
      <div className="container">
        <SectionTitle badge="" title="Editorial and institutional contact" text="For publication matters, country notes and methodological discussion, please use the form below or the direct contact details." />
        <div className="split-grid profile-grid">
          <Card>
            <div className="content-block">
              <h3>Contact form</h3>
              <form className="contact-form" action={CONTACT_FORM_ACTION} method="POST">
                <input type="hidden" name="subject" value="IML website contact request" />
                <div className="form-grid">
                  <label>Name<input name="name" placeholder="Your name" required /></label>
                  <label>Email<input name="email" placeholder="name@organisation.org" type="email" required /></label>
                </div>
                <label>Organisation<input name="organisation" placeholder="Institution, ministry, donor, provider, insurer..." /></label>
                <label>Message<textarea name="message" placeholder="Describe your request or the update you want to discuss." rows="6" required /></label>
                <div className="form-actions">
                  <button type="submit" className="primary-button">Send</button>
                  <span className="form-note">Formspree HTML form. Preview does not send from this canvas, but the deployed site will post to Formspree.</span>
                </div>
              </form>
            </div>
          </Card>
          <div className="stack-layout">
            <Card className="soft-card">
              <div className="content-block">
                <h3>Direct contact</h3>
                <div className="mail-box">iml.health@pm.me</div>
                <div className="form-actions top-gap-small">
                  <button type="button" className="secondary-button" onClick={copyEmail}>Copy email</button>
                  {copied ? <span className="form-note">Email copied.</span> : null}
                </div>
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
              <div className="footer-title">Interoperability Maturity Label</div>
            </div>
          </div>
          <p className="footer-copy">A structured framework to assess, compare and explain health interoperability maturity.</p>
        </div>
        <div>
          <div className="footer-label">Positioning</div>
          <p className="footer-copy">Six-axis benchmark, country notes, identity and trust, regulatory use, and ID4D-aligned framing.</p>
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
              <div className="brand-title">Interoperability Maturity Label</div>
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
