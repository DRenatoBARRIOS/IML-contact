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
  .topnav, .mobile-nav, .footer-nav { display: flex; gap: 8px; flex-wrap: wrap; }
  .mobile-nav { display: none; padding-bottom: 16px; overflow-x: auto; }
  .nav-button, .footer-link, .primary-button, .secondary-button { border: 0; cursor: pointer; }
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
  .metric-symbol, .signature-check { display: inline-flex; align-items: center; justify-content: center; flex: 0 0 auto; width: 44px; height: 44px; border-radius: 16px; border: 1px solid #dbe2ea; background: #f1f5f9; color: #0f172a; font-weight: 800; }
  .metric-title { font-size: 14px; color: #64748b; }
  .metric-value { margin-top: 2px; font-size: 30px; font-weight: 800; letter-spacing: -0.03em; }
  .metric-subtitle { margin-top: 4px; }
  .overview-card { padding: 30px; }
  .overview-top { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
  .overview-title, .signature-title, .code-title, .mail-box { font-size: 1.2rem; font-weight: 800; color: #0f172a; letter-spacing: -0.02em; }
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
  .select-wrap label, .contact-form label { display: block; font-size: 14px; font-weight: 700; color: #334155; margin-bottom: 8px; }
  .select-wrap select, .contact-form input, .contact-form textarea { width: 100%; border: 1px solid #cbd5e1; border-radius: 18px; background: #ffffff; padding: 14px 16px; color: #0f172a; outline: none; }
  .contact-form textarea { resize: vertical; }
  .contact-form { display: grid; gap: 16px; }
  .primary-button, .secondary-button, .footer-link { border-radius: 16px; padding: 12px 16px; font-weight: 700; }
  .primary-button { background: #0f172a; color: white; }
  .primary-button:disabled { opacity: 0.65; cursor: not-allowed; }
  .status-message { margin-top: 4px; font-size: 14px; line-height: 1.6; }
  .status-success { color: #166534; }
  .status-error { color: #b91c1c; }
  .status-info { color: #475569; }
  .secondary-button, .footer-link { background: #ffffff; color: #0f172a; border: 1px solid #dbe2ea; }
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
  Argentina: { score: 76, subtitle: "Nationally coordinated digital-health trajectory built around shared records and distributed interoperability.", values: [78,74,72,77,73,63], strengths: ["National interoperability strategy","Distributed shared health-record model","Legal framework for electronic clinical records"], watch: ["Operational maturity varies across jurisdictions","Implementation depends on provincial adoption","Correction capacity remains uneven"], sources: ["Argentina Ministry of Health","Historia de Salud Integrada","Electronic Health Record Law"] },
  Australia: { score: 81, subtitle: "Mature national digital-health environment built around healthcare identifiers and My Health Record.", values: [82,84,87,74,85,64], strengths: ["National Healthcare Identifiers Service","My Health Record","Explicit interoperability governance"], watch: ["Operational maturity varies across settings","Trust and recourse remain distinct from infrastructure","Longitudinal integration still depends on local quality"], sources: ["Healthcare Identifiers Service","Australian Digital Health Agency","My Health Record"] },
  Brazil: { score: 82, subtitle: "Large-scale interoperability effort centred on RNDS, SUS Digital and citizen-facing access.", values: [84,85,76,80,81,67], strengths: ["RNDS platform","Meu SUS Digital","Nationwide SUS Digital adhesion"], watch: ["Federal complexity","Uneven local implementation","Less visible correction layer"], ecosystem: ["Public-private provider coexistence shapes real interoperability pathways.","Insurance and private hospital dynamics can accelerate adoption while also increasing fragmentation if not aligned to national standards."], sources: ["Brazil Ministry of Health","RNDS","Meu SUS Digital"] },
  Canada: { score: 73, subtitle: "Strong policy vision, but constrained by a multi-jurisdictional landscape and uneven implementation.", values: [71,76,68,74,77,58], strengths: ["Pan-Canadian roadmap","Strong digital health policy capacity","Connected care priorities"], watch: ["Jurisdictional fragmentation","Variable implementation maturity","Coordination complexity"], ecosystem: ["Provincial systems interact with private vendors, insurers and provider organisations in uneven ways.","National coherence depends not only on public policy, but on ecosystem alignment across delivery and technology actors."], sources: ["Canada Health Infoway","Health Canada","Interoperability roadmap"] },
  "Costa Rica": { score: 74, subtitle: "Advanced digital health trajectory centred on the EDUS model and patient-facing access.", values: [73,75,70,78,72,60], strengths: ["EDUS","Patient-facing access","Medication and diagnosis visibility"], watch: ["Visibility outside core CCSS setting","Interoperability beyond institutional core","Correction still separate"], sources: ["CCSS","EDUS","Official application"] },
  "El Salvador": { score: 59, subtitle: "Reforming digital public-service environment with strong national identity foundations and growing health digitisation.", values: [61,54,68,58,57,44], strengths: ["RNPN identity foundation","Operational digital identity services","Visible Ministry of Health ICT structures"], watch: ["Clinical interoperability remains early and uneven","Health digitisation is stronger in selected programs than system-wide exchange","Correction and feedback are less visible than identity modernization"], sources: ["RNPN","Gobierno de El Salvador","Ministry of Health"] },
  Estonia: { score: 91, subtitle: "Compact and highly coherent model combining digital identity, secure exchange and nationwide health infrastructure.", values: [90,93,95,87,89,76], strengths: ["X-Road","Strong digital identity ecosystem","Connected national services"], watch: ["Central dependence","Partial transposability","Scale advantage"], sources: ["e-Estonia","X-Road","Estonian eID ecosystem"] },
  Ethiopia: { score: 61, subtitle: "Clear national coordination and digital-health foundations, while integration remains uneven across the care continuum.", values: [64,58,62,66,57,49], strengths: ["Digital health executive office","eCHIS and DHIS2","Legal identity foundation"], watch: ["Uneven system integration","Less consolidated identity linkage","Less visible correction mechanisms"], sources: ["Ministry of Health","DHIS2","Digital identification proclamation"] },
  France: { score: 65, subtitle: "Highly structured ecosystem with strong identity foundations, but constrained by administrative bottlenecks and weak practical correction capacity.", values: [70,62,84,50,84,20], strengths: ["INS identity layer","Pro Santé Connect","CI-SIS doctrine"], watch: ["Validation routines can protect the existing system instead of accelerating correction","Uneven operational implementation","Weak practical correction loop in critical cases"], ecosystem: ["Public governance is strong, but the private and insurance layer is not fully mobilised as a coherent interoperability accelerator.","This creates a gap between formal doctrine and ecosystem-wide operational responsiveness."], sources: ["ANS","INS","Pro Santé Connect","Doctrine du numérique en santé"] },
  Guatemala: { score: 52, subtitle: "Foundational identity system exists, but health-sector integration remains comparatively early and uneven.", values: [54,46,62,43,55,33], strengths: ["RENAP registry","RENAP-MSPAS coordination","Digital transformation agenda"], watch: ["Early-stage health interoperability","Limited linkage to care pathways","Weak ecosystem-wide correction loops"], sources: ["RENAP","MSPAS coordination","Transformación Digital Guatemala"] },
  India: { score: 79, subtitle: "Large digital-health identity ecosystem built around ABDM, ABHA and structured registries.", values: [80,81,86,74,79,61], strengths: ["ABHA","Health Facility Registry","Provider Registry"], watch: ["Uneven state-level implementation","Scale and diversity","Less legible correction capacity"], ecosystem: ["Private providers and platform actors are central to real expansion dynamics.","The national picture therefore depends on how public infrastructure and private execution align in practice."], sources: ["ABDM","NHA","PHR information"] },
  Japan: { score: 84, subtitle: "Mature identity-linked health access environment combined with strong regulatory data infrastructure.", values: [82,85,88,79,86,67], strengths: ["My Number health linkage","Identity-linked access","MID-NET"], watch: ["Governance and trust management","Not all domains move at same speed","Correction separate from maturity"], sources: ["Digital Agency Japan","My Number","PMDA MID-NET"] },
  Morocco: { score: 55, subtitle: "Ecosystem in transition supported by broader digital transformation, still needing stronger convergence between identity and health interoperability.", values: [58,49,52,61,56,34], strengths: ["Digital Morocco 2030","National ID-based authentication","State modernization potential"], watch: ["Health interoperability less visible","Identity and care pathways require tighter integration","Correction still maturing"], sources: ["Digital Morocco 2030","CNIE authentication service","World Bank"] },
  "New Zealand": { score: 83, subtitle: "Longstanding health-identity environment built around the National Health Index and broad operational use.", values: [81,82,90,77,84,66], strengths: ["National Health Index","Broad cross-setting use","Clear identity governance"], watch: ["Identity does not equal full interoperability everywhere","Connected systems still matter","Correction remains distinct"], sources: ["Health New Zealand","NHI","Health Identity"] },
  Russia: { score: 63, subtitle: "Centrally steered digital-health trajectory with state-led information-system ambitions and more limited public transparency.", values: [66,64,58,63,62,45], strengths: ["State-led strategy","EGISZ reference point","Healthcare modernization agenda"], watch: ["Lower public transparency","Less visible identity-health linkage","Harder to assess correction capacity"], sources: ["Ministry of Health","EGISZ","Healthcare development"] },
  Senegal: { score: 57, subtitle: "Promising but uneven trajectory combining digital economy reforms, identity advances and health-system strengthening.", values: [60,52,57,58,51,36], strengths: ["Biometric identity framework","Digital economy reforms","Health information-system strengthening"], watch: ["Health interoperability not yet as visible","Identity-health integration remains partial","Less documented feedback mechanisms"], sources: ["Service Public Sénégal","World Bank","NAATANGUE 2030"] },
  Sweden: { score: 88, subtitle: "Strong medication-centred digital health ecosystem combining e-prescriptions, a national medication list and strict identity safeguards.", values: [86,90,84,85,92,70], strengths: ["High e-prescription adoption","National Medication List","Strong identity and authorisation requirements"], watch: ["Correction requires governance beyond access control","Strengths clearer in medicines than every domain","Feedback channels still matter"], sources: ["Swedish eHealth Agency","National Medication List","Security solution"] },
  Tanzania: { score: 67, subtitle: "Structured digital-health trajectory with formal strategy, enterprise architecture and registry ambitions.", values: [69,70,61,68,63,55], strengths: ["Digital health strategy","Center for Digital Health","Enterprise architecture"], watch: ["Implementation varies across facilities","Continuity across full care path remains work in progress","Correction less visible than architecture ambitions"], sources: ["WHO CPCD","Ministry of Health","National health portal"] },
  "United States": { score: 80, subtitle: "Nationally significant but heterogeneous environment, combining a federal governance floor with major state-level and network-level variation.", values: [82,83,72,76,84,63], strengths: ["TEFCA","USCDI","Strong federal policy capacity"], watch: ["Major local variation","Federal floor does not erase disparities","State-specific reading still needed"], ecosystem: ["The U.S. case cannot be understood without private payers, integrated delivery networks, large EHR vendors and exchange intermediaries.","Real interoperability performance is therefore strongly shaped by public-private dynamics rather than by federal policy alone."], sources: ["ASTP/ONC","TEFCA","USCDI","HealthIT.gov"] },
};

const MARKERS = [
  { name: "Argentina", x: 246, y: 302 },
  { name: "Australia", x: 742, y: 324 },
  { name: "Brazil", x: 223, y: 258, labelDx: 12, labelDy: 16 },
  { name: "Canada", x: 140, y: 110, labelDx: 12, labelDy: -2, textSize: 11.5 },
  { name: "Costa Rica", x: 216, y: 196, labelDx: 18, labelDy: 18 },
  { name: "El Salvador", x: 203, y: 176, labelDx: 16, labelDy: -8, textSize: 11.5 },
  { name: "Estonia", x: 505, y: 103 },
  { name: "Ethiopia", x: 518, y: 226, labelDx: 12, labelDy: -8 },
  { name: "France", x: 470, y: 125 },
  { name: "Guatemala", x: 178, y: 184, labelDx: -82, labelDy: -10 },
  { name: "India", x: 662, y: 186 },
  { name: "Japan", x: 812, y: 166 },
  { name: "Morocco", x: 446, y: 170, labelDx: -36, labelDy: -10 },
  { name: "New Zealand", x: 805, y: 350 },
  { name: "Russia", x: 690, y: 120 },
  { name: "Senegal", x: 428, y: 205, labelDx: -48, labelDy: 10 },
  { name: "Sweden", x: 490, y: 88 },
  { name: "Tanzania", x: 505, y: 274, labelDx: 12, labelDy: 18 },
  { name: "United States", x: 120, y: 138, labelDx: 12, labelDy: 18, textSize: 12.4 },
];

const US_STATES = ["California", "Ohio"];

const US_STATE_SAMPLES = {
  California: { score: 82, subtitle: "Strong state-level profile built around the California Data Exchange Framework and whole-person care ambition.", values: [88,82,74,78,80,67], strengths: ["Statewide data sharing agreement and policy layer","Whole-person care framing","Clear administrative home for implementation"], watch: ["Operational readiness across a very large delivery system","Identity and matching less unified than governance ambition","Real-world usage depth still needs continued evidence"], sources: ["California CDII","DxF website","California HCAI"] },
  Ohio: { score: 74, subtitle: "Strong operational HIE case anchored in CliniSync and explicit legal framing for exchange.", values: [73,79,68,81,76,61], strengths: ["Statewide exchange environment","Practical deployment reach","Explicit legal definition for health information exchange"], watch: ["Less broad whole-person reform frame than California","Identity and cross-domain linkage less visible than exchange functionality","Redress present in law but less prominent in the interoperability narrative"], sources: ["CliniSync","Ohio Health Information Partnership","Ohio Revised Code"] },
};

function cls(...items) { return items.filter(Boolean).join(" "); }

function polar(angle, radius, center) {
  const rad = (angle - 90) * (Math.PI / 180);
  return { x: center + radius * Math.cos(rad), y: center + radius * Math.sin(rad) };
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
          <path d="M21.3 34.2 L21.1 49.2" opacity="0.9" />
        </g>
      </svg>
    </div>
  );
}

function NavButton({ active, children, onClick }) {
  return <button type="button" onClick={onClick} className={cls("nav-button", active && "nav-button-active")}>{children}</button>;
}

function Card({ children, className = "" }) {
  return <div className={cls("card", className)}>{children}</div>;
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
  const ring = (scale) => AXES.map((_, index) => { const point = polar((360 / AXES.length) * index, radius * scale, center); return `${point.x},${point.y}`; }).join(" ");
  const data = safe.map((value, index) => { const point = polar((360 / AXES.length) * index, radius * (value / 100), center); return `${point.x},${point.y}`; }).join(" ");
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className={small ? "mini-hex" : "hex-chart"} aria-label="IML hexagon chart">
      {Array.from({ length: levels }).map((_, index) => <polygon key={index} points={ring((index + 1) / levels)} fill="none" stroke="#d8dee7" strokeWidth="1" />)}
      {AXES.map((axis, index) => {
        const end = polar((360 / AXES.length) * index, radius, center);
        const label = polar((360 / AXES.length) * index, radius + (small ? 0 : 30), center);
        return (
          <g key={axis}>
            <line x1={center} y1={center} x2={end.x} y2={end.y} stroke="#d8dee7" strokeWidth="1" />
            {!small ? <text x={label.x} y={label.y} textAnchor="middle" style={{ fontSize: 11, fontWeight: 600, fill: "#64748b" }}>{axis}</text> : null}
          </g>
        );
      })}
      <polygon points={data} fill="rgba(15,23,42,0.14)" stroke="#0f172a" strokeWidth="2" />
      {safe.map((value, index) => { const point = polar((360 / AXES.length) * index, radius * (value / 100), center); return <circle key={index} cx={point.x} cy={point.y} r={small ? 2.4 : 4} fill="#0f172a" />; })}
    </svg>
  );
}

function HomePage() {
  return (
    <div>
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <h1>The framework that makes interoperability maturity visible, comparable and governable.</h1>
            <p className="hero-text">IML provides a publication-ready framework for assessing health systems, exchange architectures, identity layers and real-world deployment capacity. It helps institutions move from fragmented digital initiatives to governed interoperability at scale.</p>
            <Card className="note-box"><p>Interoperability maturity does not depend only on standards or digital infrastructure. It depends on how identity, governance, trust, medicines information, deployment and correction capacity reinforce one another in practice. In many countries, technological progress is moving faster than the redesign of health systems, clinical organisation, workforce training and interoperability-ready workflows. As access expands to information that was previously siloed or difficult to obtain, interoperability will reshape professional education, care practices and, over time, routine clinical protocols.</p></Card>
            <div className="metric-grid two-up">
              <MetricCard symbol="6X" title="Assessment model" value="6 criteria" subtitle="Standards, connectivity, identity, adoption, security and correction." />
              <MetricCard symbol="ID" title="Critical layer" value="Identity & trust" subtitle="The seam between interoperability and confidence." />
            </div>
          </div>
          <Card className="overview-card">
            <div className="overview-top"><LogoMark /><div><div className="eyebrow">Institutional overview</div><div className="overview-title">Publication-ready structure</div></div></div>
            <div className="tile-grid three-up">
              {[["Scoring", "A readable maturity score anchored in six criteria."],["Benchmarks", "Country profiles that quickly open strategic discussion."],["ID4D", "A trust and inclusion lens for identity-enabled public infrastructure."]].map(([title, text]) => <div key={title} className="mini-tile"><div className="mini-tile-title">{title}</div><div className="mini-tile-text">{text}</div></div>)}
            </div>
          </Card>
        </div>
      </section>
      <section className="section"><div className="container"><SectionTitle badge="Positioning" title="Why IML matters" text="The platform frames interoperability as a strategic bridge between policy, architecture, trust and measurable system performance." /><div className="tile-grid three-up">{[{title:"For policymakers",text:"A clear executive view of national interoperability maturity, readiness gaps and priority actions."},{title:"For institutions",text:"A common language to align architecture, governance, identity, trust and deployment decisions."},{title:"For implementers",text:"A way to position technical components inside a coherent and scalable national roadmap."}].map((item) => <Card key={item.title} className="value-card"><div className="metric-symbol">{item.title.slice(0,2).toUpperCase()}</div><h3>{item.title}</h3><p>{item.text}</p></Card>)}</div></div></section>
    </div>
  );
}

function MethodologyPage() {
  return (
    <section className="section"><div className="container"><SectionTitle badge="" title="A framework that is simple to read and strong enough to defend" text="IML combines six assessment dimensions, a maturity score and comparative country notes, while treating identity and trust as structural conditions rather than optional technical modules." />
      <div className="tile-grid three-up">{[{title:"Governance & Standards",symbol:"GV",text:"Institutional ownership, legal frameworks, standards governance, accountability and national steering capacity."},{title:"Technical Interoperability",symbol:"IO",text:"Exchange models, APIs, semantics, technical integration quality, service continuity and architecture coherence."},{title:"Identity & Trust",symbol:"ID",text:"Identity matching, authentication, consent, provider and patient identification, and trust services."},{title:"Security",symbol:"SC",text:"Privacy safeguards, access control, traceability, cyber readiness and defensible trust practices."},{title:"Adoption",symbol:"AD",text:"Operational rollout, user uptake, field deployment, integration into workflows and implementation depth."},{title:"Correction & Feedback",symbol:"CF",text:"Redress, correction, complaint handling, recourse pathways and institutional learning from failures."}].map((pillar) => <Card key={pillar.title} className="value-card"><div className="metric-symbol">{pillar.symbol}</div><h3>{pillar.title}</h3><p>{pillar.text}</p></Card>)}</div>
      <div className="split-grid top-gap"><Card><div className="content-block"><h3>Public-private and insurance dynamics</h3><p>Interoperability maturity is not only a public infrastructure question. In many countries, private providers, insurance systems, payer logic, platform actors and major software vendors shape the actual circulation of clinical information as much as state policy does.</p><p>IML therefore treats the public score as a structured national reading, but not as a denial of hybrid realities.</p></div></Card><Card className="soft-card"><div className="content-block"><h3>Why this matters analytically</h3><div className="stack-list"><div className="list-box"><strong>Insurance layer</strong> · Payers can accelerate structured exchange or create data silos.</div><div className="list-box"><strong>Private provider networks</strong> · Large hospital groups may become de facto interoperability engines.</div><div className="list-box"><strong>Vendor and platform influence</strong> · Exchange quality often depends on software ecosystems, not policy text alone.</div></div></div></Card></div>
    </div></section>
  );
}

function Id4dPage() {
  return (
    <section className="section"><div className="container"><SectionTitle badge="Identity infrastructure" title="Positioning IML in alignment with the ID4D approach" text="IML can be aligned with ID4D by treating digital identity as an enabling public infrastructure layer for inclusive access, trusted service delivery, interoperability and accountable governance." />
      <div className="tile-grid three-up">{[{title:"Inclusive access",text:"Assesses whether people can realistically enter the health system and use digital services without being blocked by identity gaps."},{title:"Low-friction service entry",text:"Examines how easily users and institutions can access services and move across care pathways without duplicative burden."},{title:"Trusted identity assurance",text:"Covers identification, authentication, matching quality and reliability of trust services."},{title:"Interoperability and open standards",text:"Looks at exchange architecture, shared standards and practical ability of systems to connect."},{title:"Privacy and data protection",text:"Focuses on purpose limitation, lawful access, minimisation and confidentiality."},{title:"Governance, oversight and redress",text:"Evaluates accountability, supervision, complaint handling, correction capacity and public-interest learning."}].map((item) => <Card key={item.title} className="value-card"><div className="metric-symbol">{item.title.slice(0,2).toUpperCase()}</div><h3>{item.title}</h3><p>{item.text}</p></Card>)}</div>
      <div className="top-gap"><SectionTitle badge="Trust layer" title="Identity and trust as a public infrastructure layer" text="Within the ID4D framing, identity is not a side module. It is one of the enabling layers that determine whether access, exchange, accountability and trusted service delivery can function at scale across health systems." /><div className="split-grid"><Card><div className="content-block"><h3>Why identity belongs inside the ID4D reading</h3><p>Without a reliable identity layer, interoperability becomes unstable: matching degrades, access control becomes harder to defend, and continuity of care loses precision across institutions and care pathways.</p><p>IML therefore treats identity, authentication, consent and auditability as structural variables rather than optional technical add-ons.</p></div></Card><Card className="soft-card"><div className="content-block"><h3>Explanatory note on the proposed identity code</h3><p>The proposed request-validated identity code is presented here as a methodological annex, not as a universal civil identifier.</p><div className="code-box"><div className="eyebrow">Visible format</div><div className="code-title">IML1-S-DDMMYYYY-GEO4-SSSS-CC</div><div>Example: <span className="mono">IML1-2-17041986-Q7L2-0421-58</span></div></div></div></Card></div></div>
    </div></section>
  );
}

function EvaluationPage() {
  return (
    <section className="section"><div className="container"><SectionTitle badge="" title="Evaluation and regulatory shifts in an interoperable environment" text="Interoperability maturity affects clinical evaluation, long-term follow-up and regulatory decision-making by making broader, longitudinal and better-governed evidence environments possible." />
      <div className="split-grid"><Card><div className="content-block"><h3>Core proposition</h3><p>A mature interoperability and identity layer can support a safeguarded, person-linked longitudinal view of clinically relevant information across prescriptions, dispensing events, laboratory results, care episodes, prior conditions and follow-up signals.</p><p>This does not mean creating a single uncontrolled profile. It means enabling authorised and proportionate access to the information needed to understand medicines use in real care pathways.</p></div></Card><Card className="soft-card"><div className="content-block"><h3>Why Nordic reference cases matter here</h3><p>Sweden shows the practical value of a shared medication information layer through the National Medication List.</p><p>Denmark offers a complementary example in bacteriology with MiBa and MiBAlert, where cross-sector microbiology access influences isolation decisions, antibiotic choice and infection-control action.</p></div></Card></div>
      <Card className="highlight-card top-gap"><div className="content-block"><h3>Special note for pharmaceutical industry and regulatory authorities</h3><p>The IML framework suggests that clinical evaluation can extend beyond short-term, protocol-bound trials toward governed longitudinal follow-up, stronger signal detection and more adaptive evidence generation across real-world use and extended time horizons.</p></div></Card>
    </div></section>
  );
}

function WorldTooltip({ marker, country, onEnter, onLeave }) {
  if (!marker || !country) return null;
  const left = `${(marker.x / 900) * 100}%`;
  const top = `${(marker.y / 430) * 100}%`;
  const horizontal = marker.x > 650 ? "translate(calc(-100% - 18px), -16px)" : "translate(18px, -16px)";
  const vertical = marker.y > 270 ? " translateY(calc(-100% + 32px))" : "";
  return <div className="tooltip-anchor" style={{ left, top, transform: `${horizontal}${vertical}` }} onMouseEnter={onEnter} onMouseLeave={onLeave}><div className="map-tooltip"><div className="map-tooltip-top"><div className="map-tooltip-title">{marker.name}</div><div className="map-tooltip-score">{country.score}%</div></div><HexagonChart values={country.values} small /></div></div>;
}

function WorldMap({ selectedCountry, onSelect }) {
  const [hoveredCountry, setHoveredCountry] = useState("");
  const closeTimerRef = useRef(null);
  const clearCloseTimer = () => { if (closeTimerRef.current) { clearTimeout(closeTimerRef.current); closeTimerRef.current = null; } };
  const openTooltip = (name) => { clearCloseTimer(); setHoveredCountry(name); onSelect(name); };
  const scheduleClose = () => { clearCloseTimer(); closeTimerRef.current = setTimeout(() => { setHoveredCountry(""); closeTimerRef.current = null; }, 140); };
  const activeMarker = MARKERS.find((marker) => marker.name === hoveredCountry) || null;
  const activeCountry = hoveredCountry ? COUNTRIES[hoveredCountry] : null;
  return (
    <div className="world-box"><div className="world-box-head"><div><div className="eyebrow">Global coverage in progress</div><div className="overview-title">Interactive world review map</div></div><div className="helper-pill">Hover a marker to preview the country hexagon. The full note updates below.</div></div><div className="world-map-wrap"><svg viewBox="0 0 900 430" className="world-map" aria-label="Interactive world map"><defs><linearGradient id="oceanFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f8fbff" /><stop offset="100%" stopColor="#eef3f9" /></linearGradient><linearGradient id="landFill" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#e7eef6" /><stop offset="100%" stopColor="#d5e0ec" /></linearGradient></defs><rect x="0" y="0" width="900" height="430" rx="28" fill="url(#oceanFill)" /><g opacity="0.45" stroke="#d5deea" strokeWidth="1">{Array.from({ length: 8 }).map((_, index) => <line key={`h-${index}`} x1="40" y1={48 + index * 42} x2="860" y2={48 + index * 42} />)}{Array.from({ length: 10 }).map((_, index) => <line key={`v-${index}`} x1={70 + index * 80} y1="28" x2={70 + index * 80} y2="398" />)}</g><g fill="url(#landFill)" stroke="#9fb0c4" strokeWidth="1.1"><path d="M88 112 C108 80, 170 70, 214 90 C248 105, 254 144, 232 170 C214 192, 174 197, 155 220 C139 240, 101 236, 79 207 C59 180, 58 141, 88 112 Z" /><path d="M180 233 C199 228, 226 239, 239 259 C251 276, 245 305, 223 319 C204 332, 176 326, 164 305 C154 287, 160 241, 180 233 Z" /><path d="M186 182 C196 172, 213 171, 227 176 C240 181, 248 190, 247 199 C245 208, 235 213, 222 212 C212 211, 205 215, 199 220 C193 224, 185 223, 180 217 C175 211, 175 201, 180 194 C183 189, 184 186, 186 182 Z" /><path d="M372 92 C422 70, 498 75, 548 103 C580 122, 595 160, 572 187 C551 211, 504 214, 482 233 C456 254, 417 247, 395 228 C376 211, 337 212, 320 189 C304 166, 317 116, 372 92 Z" /><path d="M468 238 C489 228, 523 235, 542 255 C559 271, 563 308, 538 333 C515 355, 479 354, 455 338 C433 323, 420 297, 428 273 C435 255, 448 247, 468 238 Z" /><ellipse cx="796" cy="170" rx="18" ry="12" /><path d="M609 103 C654 85, 730 92, 775 118 C816 141, 829 182, 806 212 C781 244, 733 246, 694 241 C657 236, 623 214, 604 190 C584 163, 579 118, 609 103 Z" /><ellipse cx="742" cy="324" rx="34" ry="18" /><ellipse cx="805" cy="350" rx="17" ry="10" /></g><g>{MARKERS.map((marker) => { const selected = selectedCountry === marker.name; const hovered = hoveredCountry === marker.name; return <g key={marker.name} className="marker-group" onClick={() => onSelect(marker.name)} onMouseEnter={() => openTooltip(marker.name)} onMouseLeave={scheduleClose}><circle cx={marker.x} cy={marker.y} r={selected || hovered ? 12 : 8} fill={selected || hovered ? "#0f172a" : "#334155"} /><circle cx={marker.x} cy={marker.y} r={selected || hovered ? 22 : 15} fill="rgba(15,23,42,0.10)" /><circle cx={marker.x} cy={marker.y} r={selected || hovered ? 30 : 22} fill="rgba(15,23,42,0.05)" /><text x={marker.x + (marker.labelDx ?? 14)} y={marker.y + (marker.labelDy ?? 4)} fill="#0f172a" style={{ fontSize: marker.textSize ?? 13, fontWeight: 600 }}>{marker.name}</text></g>; })}</g></svg>{activeMarker && activeCountry ? <WorldTooltip marker={activeMarker} country={activeCountry} onEnter={() => openTooltip(activeMarker.name)} onLeave={scheduleClose} /> : null}</div></div>
  );
}

function CountryProfile({ selectedCountry }) {
  const selected = selectedCountry ? COUNTRIES[selectedCountry] : null;
  if (!selected) return null;
  return <div className="split-grid profile-grid"><Card><div className="content-block"><div className="profile-head"><h3>{selectedCountry}</h3><div className="score-pill">Score {selected.score}/100</div></div><p className="muted-copy">{selected.subtitle}</p><HexagonChart values={selected.values} /></div></Card><div className="stack-layout"><div className="metric-grid two-up"><MetricCard symbol="HX" title="Hexagon" value="6 criteria" subtitle="Standards, connectivity, identity, adoption, security and correction." /><MetricCard symbol="BM" title="Benchmark type" value="Country profile" subtitle="A strategic view rather than a vendor comparison." /><MetricCard symbol="ST" title="Strengths" value="Visible" subtitle="Assets that can accelerate interoperability maturity." /><MetricCard symbol="PW" title="Points to watch" value="Critical" subtitle="Risks, gaps or friction points that can slow scale-up." /></div><div className="split-grid"><Card><div className="content-block"><h3>Strengths</h3><ul className="plain-list">{selected.strengths.map((item) => <li key={item}>• {item}</li>)}</ul></div></Card><Card><div className="content-block"><h3>Points to watch</h3><ul className="plain-list">{selected.watch.map((item) => <li key={item}>• {item}</li>)}</ul></div></Card></div>{selected.ecosystem ? <Card className="soft-card"><div className="content-block"><h3>Ecosystem dynamics</h3><ul className="plain-list">{selected.ecosystem.map((item) => <li key={item}>• {item}</li>)}</ul></div></Card> : null}<Card className="soft-card"><div className="content-block"><h3>Sources used</h3><ul className="plain-list">{selected.sources.map((item) => <li key={item}>• {item}</li>)}</ul></div></Card></div></div>;
}

function UsStateSection() {
  const [selectedState, setSelectedState] = useState("California");
  const selected = US_STATE_SAMPLES[selectedState];
  return <div className="top-gap"><Card className="soft-card"><div className="content-block"><h3>United States sample layer</h3><p>To keep the site readable, the U.S. state-level layer is simplified here to two first sample notes: California and Ohio.</p></div></Card><div className="select-wrap top-gap-small"><label>Choose a U.S. sample state</label><select value={selectedState} onChange={(event) => setSelectedState(event.target.value)}>{US_STATES.map((state) => <option key={state} value={state}>{state}</option>)}</select></div><div className="split-grid profile-grid top-gap-small"><Card><div className="content-block"><div className="profile-head"><h3>{selectedState}</h3><div className="score-pill">Score {selected.score}/100</div></div><p className="muted-copy">{selected.subtitle}</p><HexagonChart values={selected.values} /></div></Card><div className="stack-layout"><div className="split-grid"><Card><div className="content-block"><h3>Strengths</h3><ul className="plain-list">{selected.strengths.map((item) => <li key={item}>• {item}</li>)}</ul></div></Card><Card><div className="content-block"><h3>Points to watch</h3><ul className="plain-list">{selected.watch.map((item) => <li key={item}>• {item}</li>)}</ul></div></Card></div><Card className="soft-card"><div className="content-block"><h3>Sources used</h3><ul className="plain-list">{selected.sources.map((item) => <li key={item}>• {item}</li>)}</ul></div></Card></div></div></div>;
}

function WorldPage() {
  const [selectedCountry, setSelectedCountry] = useState("");
  const options = useMemo(() => Object.keys(COUNTRIES).sort((a, b) => a.localeCompare(b)), []);
  return <section className="section"><div className="container"><SectionTitle badge="Country notes" title="A growing global review rather than a closed country list" text="The countries currently included in the study are not presented as a fixed or exhaustive panel. They are analysed progressively, in a partly opportunistic sequence, with the longer-term objective of extending the review to as many countries as possible." /><div className="select-wrap"><label>Choose a country</label><select value={selectedCountry} onChange={(event) => setSelectedCountry(event.target.value)}><option value="">Choose a country</option>{options.map((country) => <option key={country} value={country}>{country}</option>)}</select></div><div className="top-gap"><WorldMap selectedCountry={selectedCountry} onSelect={setSelectedCountry} /></div>{selectedCountry ? <div className="top-gap"><CountryProfile selectedCountry={selectedCountry} /></div> : null}{selectedCountry === "United States" ? <UsStateSection /> : null}</div></section>;
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

  return <section className="section"><div className="container"><SectionTitle badge="" title="Editorial and institutional contact" text="For publication matters, country notes, methodological discussion and institutional exchanges, please use the direct contact details below." /><div className="split-grid profile-grid"><Card><div className="content-block"><h3>Direct contact</h3><div className="mail-box">iml.health@pm.me</div><div className="form-actions top-gap-small"><button type="button" className="secondary-button" onClick={copyEmail}>Copy email</button>{copied ? <span className="form-note">Email copied.</span> : null}</div></div></Card><div className="stack-layout"><Card><div className="content-block"><h3>Typical use cases</h3><ul className="plain-list"><li>• Request a country note or benchmark update</li><li>• Discuss the methodology with institutional partners</li><li>• Open an editorial or publication conversation</li><li>• Explore an identity-layer or medicines-analysis use case</li><li>• Extend the U.S. sample-state section or add new countries</li></ul></div></Card></div></div></div></section>;
}

function Footer({ goTo }) {
  return <footer className="footer"><div className="container footer-grid"><div><div className="footer-brand"><LogoMark /><div><div className="eyebrow">IML</div><div className="footer-title">Interoperability Maturity Label</div></div></div><p className="footer-copy">A structured framework to assess, compare and explain health interoperability maturity.</p></div><div><div className="footer-label">Navigation</div><div className="footer-nav">{ROUTES.map((route) => <button key={route.key} type="button" className="footer-link" onClick={() => goTo(route.key)}>{route.label}</button>)}</div></div><div><div className="footer-label">Positioning</div><p className="footer-copy">Six-axis benchmark, country notes, identity and trust, regulatory use, and ID4D-aligned framing.</p></div></div></footer>;
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
            <div><div className="eyebrow">IML</div><div className="brand-title">Interoperability Maturity Label</div></div>
          </button>
          <nav className="topnav desktop-nav">{ROUTES.map((item) => <NavButton key={item.key} active={route === item.key} onClick={() => goTo(item.key)}>{item.label}</NavButton>)}</nav>
        </div>
        <div className="container mobile-nav">{ROUTES.map((item) => <NavButton key={item.key} active={route === item.key} onClick={() => goTo(item.key)}>{item.label}</NavButton>)}</div>
      </header>
      <main>
        {route === "home" ? <HomePage /> : null}
        {route === "id4d" ? <Id4dPage /> : null}
        {route === "evaluation" ? <EvaluationPage /> : null}
        {route === "methodology" ? <MethodologyPage /> : null}
        {route === "world" ? <WorldPage /> : null}
        {route === "contact" ? <ContactPage /> : null}
      </main>
      <Footer goTo={goTo} />
    </div>
  );
}
