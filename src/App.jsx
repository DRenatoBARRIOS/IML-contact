import { useEffect, useMemo, useState } from "react";
import worldCountries from "./world-countries.json";
import logoImage from "./assets/iml-logo.png";
import heroLampImage from "./assets/hero-lamp-editorial.png";

const BASE_URL = import.meta.env.BASE_URL || "/";

const navigation = [
  { href: "/vision", label: "Vision" },
  { href: "/identity-trust", label: "Identity & Trust" },
  { href: "/clinical-workspace", label: "Clinical Workspace" },
  { href: "/interoperability", label: "Interoperability" },
  { href: "/country-profiles", label: "Country Profiles" },
  { href: "/manuscripts", label: "Manuscripts" },
  { href: "/collaborate", label: "Collaborate" },
];

function SiteHeader({ active, home }) {
  return (
    <header className="site-header">
      <div className="shell header-inner">
        <a className={`brand${home ? " brand-home" : ""}`} href="/" aria-label="IML Health home">
          <span className="brand-mark" aria-hidden="true">
            <img src={logoImage} alt="" width="54" height="64" />
          </span>
          <span className="brand-copy">
            <strong>IML Health</strong>
            <span>Open Health Information Environment</span>
          </span>
        </a>
        <nav className="desktop-nav" aria-label="Primary navigation">
          {navigation.map((item) => (
            <a href={item.href} key={item.href} aria-current={active === item.href ? "page" : undefined}>{item.label}</a>
          ))}
        </nav>
        <details className="mobile-menu">
          <summary>Menu</summary>
          <nav aria-label="Mobile navigation">
            <a href="/" aria-current={active === "/" ? "page" : undefined}>Home</a>
            {navigation.map((item) => (
              <a href={item.href} key={item.href} aria-current={active === item.href ? "page" : undefined}>{item.label}</a>
            ))}
          </nav>
        </details>
      </div>
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="shell footer-grid">
        <div className="footer-brand">
          <div>
            <strong>IML Health</strong>
            <p>Independent, non-commercial and open for scientific review.</p>
          </div>
        </div>
        <div>
          <h3>Explore</h3>
          <a href="/clinical-workspace">Clinical workspace</a>
          <a href="/interoperability">Integration layer</a>
          <a href="/country-profiles">Country profiles</a>
        </div>
        <div>
          <h3>Project</h3>
          <a href="/vision">Vision</a>
          <a href="/identity-trust">Identity &amp; Trust</a>
          <a href="/manuscripts">Manuscripts</a>
          <a href="/collaborate">Collaborate</a>
        </div>
      </div>
      <div className="shell footer-bottom">
        <span>© {new Date().getFullYear()} IML Health</span>
      </div>
    </footer>
  );
}

function PageFrame({ active, home = false, children }) {
  return (
    <>
      <a className="skip-link" href="#page-content">Skip to the content</a>
      <SiteHeader active={active} home={home} />
      <main id="page-content">{children}</main>
      <div className="page-ornament" aria-hidden="true">
        <span />
        <i />
        <i />
        <span />
      </div>
      <SiteFooter />
    </>
  );
}

function PageMasthead({ title, lede, compact = false, mirroredLamp = false }) {
  return (
    <section className={`page-masthead${compact ? " page-masthead-compact" : ""}`}>
      <div className="shell page-masthead-grid">
        <div>
          <a className="back-home" href="/">← IML Health home</a>
          <h1>{title}</h1>
        </div>
        {mirroredLamp ? (
          <div className="collaborate-masthead-aside">
            <div className="collaborate-lamp-frame" aria-hidden="true">
              <img src={heroLampImage} alt="" />
            </div>
            <p>{lede}</p>
          </div>
        ) : <p>{lede}</p>}
      </div>
    </section>
  );
}

const MAP_WIDTH = 1000;
const MAP_HEIGHT = 500;
const MAP_VISIBLE_HEIGHT = 430;
const RADAR_LABELS = ["Governance", "Technical", "Identity", "Adoption", "Security", "Learning"];
const AXIS_KEYS = ["governance", "technical", "identity", "adoption", "security", "learning"];

const normalizeIso3 = (value) => String(value || "").trim().toUpperCase();
const asArray = (value) => (Array.isArray(value) ? value : []);

function normalizeProfile(profile) {
  const scores = profile.scores || profile.domainScores || {};
  const values = Array.isArray(profile.values)
    ? profile.values
    : AXIS_KEYS.map((key) => Number(scores[key] ?? 0));
  return {
    ...profile,
    iso3: normalizeIso3(profile.iso3 || profile.country_iso3),
    name: profile.name || profile.country_name || profile.countryName || "Unnamed country",
    status: profile.status || profile.assessment_status || "published",
    version: profile.version || "",
    updatedAt: profile.updatedAt || profile.updated_at || profile.assessment_date || profile.assessed_at || profile.published_at || "",
    evidenceLevel: profile.evidenceLevel || profile.evidence_level || "Exploratory working profile",
    subtitle: profile.subtitle || profile.summary || "",
    values,
    strengths: asArray(profile.strengths),
    watch: asArray(profile.watch || profile.pointsToWatch),
    sources: asArray(profile.sources),
  };
}

async function loadCountryProfiles(signal) {
  const response = await fetch("/api/countries", { headers: { Accept: "application/json" }, signal });
  if (!response.ok) throw new Error(`Countries API returned ${response.status}.`);
  const payload = await response.json();
  const rows = Array.isArray(payload) ? payload : payload.countries;
  if (!Array.isArray(rows) || rows.length === 0) throw new Error("No published country profile is available.");
  return {
    profiles: rows.map(normalizeProfile),
    apiVersion: payload.api_version || "current",
  };
}

function featureIso3(feature) {
  const properties = feature?.properties || {};
  return normalizeIso3(properties.iso3 || properties.ISO_A3 || properties.adm0_a3 || properties.ADM0_A3);
}

function featureName(feature) {
  const properties = feature?.properties || {};
  return String(properties.name || properties.NAME || properties.admin || properties.ADMIN || "Unknown country").trim();
}

function isAntarctica(feature) {
  const name = featureName(feature).toLowerCase();
  const continent = String(feature?.properties?.continent || feature?.properties?.CONTINENT || "").toLowerCase();
  return featureIso3(feature) === "ATA" || name.includes("antarctica") || continent === "antarctica";
}

function projectCoordinate([longitude, latitude]) {
  return [((longitude + 180) / 360) * MAP_WIDTH, ((90 - latitude) / 180) * MAP_HEIGHT];
}

function ringToPath(coordinates = []) {
  let path = "";
  let previousX = null;
  coordinates.forEach((coordinate, index) => {
    const [x, y] = projectCoordinate(coordinate);
    const crossesDateLine = previousX !== null && Math.abs(x - previousX) > MAP_WIDTH / 2;
    path += index === 0 || crossesDateLine ? ` M ${x.toFixed(2)} ${y.toFixed(2)}` : ` L ${x.toFixed(2)} ${y.toFixed(2)}`;
    previousX = x;
  });
  return path ? `${path} Z` : "";
}

function geometryToPath(geometry) {
  if (geometry?.type === "Polygon") return geometry.coordinates.map(ringToPath).join(" ");
  if (geometry?.type === "MultiPolygon") return geometry.coordinates.flatMap((polygon) => polygon.map(ringToPath)).join(" ");
  return "";
}

function averageScore(values = []) {
  const scores = asArray(values).map(Number).filter(Number.isFinite);
  return scores.length ? Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length) : 0;
}

function profileScore(profile) {
  const recorded = Number(profile?.overall_score);
  return Number.isFinite(recorded) ? recorded : averageScore(profile?.values);
}

function scoreBand(score) {
  if (score >= 75) return 4;
  if (score >= 50) return 3;
  if (score >= 25) return 2;
  return 1;
}

function polygonPoints(values, radius, center = 120) {
  return values.map((value, index) => {
    const angle = -Math.PI / 2 + (index * Math.PI * 2) / values.length;
    const scaled = radius * (Math.max(0, Math.min(100, Number(value) || 0)) / 100);
    return `${center + Math.cos(angle) * scaled},${center + Math.sin(angle) * scaled}`;
  }).join(" ");
}

function formatDate(value) {
  if (!value) return "Not recorded";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(date);
}

function humanize(value) {
  return value ? String(value).replaceAll("_", " ") : "not recorded";
}

const DOMAIN_REPORT_GUIDANCE = {
  Governance: "Standards, responsibilities, oversight and institutional coordination.",
  Technical: "Structured, secure and reliable exchange between information systems.",
  Identity: "Identification, trusted access, consent and information provenance.",
  Adoption: "Use of standards and infrastructure in routine clinical and public-health work.",
  Security: "Protection, availability, traceability, recovery and continuity.",
  Learning: "Use of audits, incidents, complaints and outcomes to improve the system.",
};

function escapeReportHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function safeReportUrl(value) {
  try {
    const url = new URL(String(value || ""), window.location.href);
    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}

function scoreInterpretation(score) {
  const value = Number(score || 0);
  if (value >= 80) return "Strong documented foundations, to be read alongside implementation limits and source coverage.";
  if (value >= 60) return "Substantial foundations with material variation, incomplete adoption or operational gaps.";
  if (value >= 40) return "Partial maturity: formal structures exist, but delivery or practical implementation remains limited.";
  return "Major unresolved gaps or limited evidence of reliable implementation and continuity.";
}

function listReportItems(items, emptyText) {
  const rows = asArray(items);
  if (!rows.length) return `<p class="empty">${escapeReportHtml(emptyText)}</p>`;
  return `<ul>${rows.map((item) => `<li>${escapeReportHtml(item)}</li>`).join("")}</ul>`;
}

function sourceReportHtml(source, index) {
  const publicUrl = safeReportUrl(source?.url);
  const indicators = asArray(source?.indicators);
  return `
    <article class="source">
      <h3>${String(index + 1).padStart(2, "0")} · ${escapeReportHtml(source?.title || `Source ${index + 1}`)}</h3>
      <p class="source-meta">${escapeReportHtml(source?.publisher || "Publisher not recorded")}${source?.publication_date ? ` · ${escapeReportHtml(formatDate(source.publication_date))}` : ""}</p>
      ${source?.note ? `<p>${escapeReportHtml(source.note)}</p>` : ""}
      ${publicUrl ? `<p><a href="${escapeReportHtml(publicUrl)}">${escapeReportHtml(publicUrl)}</a></p>` : '<p class="empty">No public link recorded.</p>'}
      ${indicators.map((indicator) => `
        <div class="indicator">
          <strong>${escapeReportHtml(indicator?.code || "IML indicator")} · evidence ${escapeReportHtml(indicator?.evidence_level || "ungraded")}</strong>
          <p>${escapeReportHtml(indicator?.summary || "Evidence summary not recorded.")}</p>
          ${indicator?.limitation ? `<p><b>Limitation:</b> ${escapeReportHtml(indicator.limitation)}</p>` : ""}
        </div>
      `).join("")}
    </article>
  `;
}

function openCountryPdfReport(profile) {
  if (!profile) return;

  const reportWindow = window.open("", "_blank");
  if (!reportWindow) {
    window.alert("Please allow pop-ups to generate the country PDF report.");
    return;
  }

  reportWindow.opener = null;
  const values = asArray(profile.values).length === 6 ? profile.values.map(Number) : [0, 0, 0, 0, 0, 0];
  const sources = asArray(profile.sources);
  const score = profileScore(profile);
  const generatedAt = new Intl.DateTimeFormat("en-GB", { dateStyle: "long" }).format(new Date());
  const logoUrl = new URL(logoImage, window.location.href).href;
  const reportTitle = `IML-${normalizeIso3(profile.iso3)}-country-report-${new Date().toISOString().slice(0, 10)}`;
  const domainRows = RADAR_LABELS.map((axis, index) => `
    <tr>
      <th>${escapeReportHtml(axis)}</th>
      <td class="score">${escapeReportHtml(values[index])}/100</td>
      <td><strong>${escapeReportHtml(DOMAIN_REPORT_GUIDANCE[axis])}</strong><br>${escapeReportHtml(scoreInterpretation(values[index]))}</td>
    </tr>
  `).join("");

  reportWindow.document.open();
  reportWindow.document.write(`<!doctype html>
  <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>${escapeReportHtml(reportTitle)}</title>
      <style>
        @page { size: A4; margin: 16mm 15mm 18mm; }
        * { box-sizing: border-box; }
        body { margin: 0; color: #13283a; font: 10.5pt/1.48 Arial, Helvetica, sans-serif; }
        header { display: flex; align-items: center; justify-content: space-between; gap: 18px; border-bottom: 2px solid #2e6f6a; padding-bottom: 12px; }
        header img { width: 55px; height: 55px; object-fit: contain; }
        .brand { display: flex; align-items: center; gap: 12px; }
        .brand strong { display: block; font-family: Georgia, serif; font-size: 19pt; font-weight: 600; }
        .brand span, .meta, .source-meta, .empty { color: #546775; }
        .report-type { color: #2e6f6a; font-size: 8.5pt; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
        h1 { margin: 24px 0 4px; font-family: Georgia, serif; font-size: 30pt; font-weight: 600; letter-spacing: -.025em; }
        h2 { margin: 26px 0 10px; border-bottom: 1px solid #d8cdbb; padding-bottom: 5px; font-family: Georgia, serif; font-size: 17pt; font-weight: 600; page-break-after: avoid; }
        h3 { margin: 0 0 4px; font-size: 10.5pt; page-break-after: avoid; }
        p { margin: 7px 0; }
        a { color: #245b57; overflow-wrap: anywhere; }
        .summary { margin: 18px 0; border-left: 4px solid #e2a647; background: #fbf4e7; padding: 12px 14px; }
        .headline { display: grid; grid-template-columns: 1fr auto; align-items: end; gap: 20px; }
        .overall { min-width: 88px; border-radius: 12px; background: #2e6f6a; color: white; padding: 10px 13px; text-align: center; }
        .overall strong { display: block; font-size: 19pt; line-height: 1; }
        .overall span { font-size: 7.5pt; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border-bottom: 1px solid #ded6c8; padding: 8px 7px; vertical-align: top; text-align: left; }
        th { width: 21%; color: #245b57; }
        td.score { width: 13%; font-weight: 700; white-space: nowrap; }
        ul { margin: 6px 0 0; padding-left: 20px; }
        li { margin-bottom: 5px; }
        .two-columns { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
        .panel { border: 1px solid #d8cdbb; border-radius: 10px; padding: 12px 14px; break-inside: avoid; }
        .panel h2 { margin-top: 0; font-size: 14pt; }
        .source { border: 1px solid #d8cdbb; border-radius: 10px; margin-bottom: 10px; padding: 12px 14px; break-inside: avoid; }
        .indicator { margin-top: 9px; border-left: 3px solid #2e6f6a; background: #eef5f2; padding: 8px 10px; }
        .indicator p { margin: 3px 0; }
        .method { margin-top: 24px; border-top: 1px solid #d8cdbb; color: #546775; padding-top: 10px; font-size: 8.5pt; }
        .print-actions { position: sticky; top: 0; z-index: 2; display: flex; justify-content: center; gap: 10px; background: #eef5f2; padding: 12px; }
        button { cursor: pointer; border: 0; border-radius: 8px; background: #2e6f6a; color: white; padding: 10px 16px; font: 700 10pt Arial, sans-serif; }
        @media print {
          .print-actions { display: none; }
          .two-columns { grid-template-columns: 1fr 1fr; }
          a { color: #13283a; text-decoration: none; }
        }
        @media screen and (max-width: 700px) { .two-columns { grid-template-columns: 1fr; } }
      </style>
    </head>
    <body>
      <div class="print-actions"><button type="button" onclick="window.print()">Save as PDF</button></div>
      <header>
        <div class="brand"><img src="${escapeReportHtml(logoUrl)}" alt=""><div><strong>IML Health</strong><span>Open Health Information Environment</span></div></div>
        <div class="report-type">Country evidence report</div>
      </header>
      <main>
        <div class="headline">
          <div><h1>${escapeReportHtml(profile.name)}</h1><p class="meta">ISO3 ${escapeReportHtml(profile.iso3)} · Profile v${escapeReportHtml(profile.version || "working")} · Generated ${escapeReportHtml(generatedAt)}</p></div>
          <div class="overall"><strong>${escapeReportHtml(score)}/100</strong><span>orientation signal</span></div>
        </div>
        <div class="summary"><strong>Exploratory profile - not a ranking or certification.</strong><br>${escapeReportHtml(profile.subtitle || "Evidence-oriented working country profile.")}</div>

        <h2>Assessment overview</h2>
        <p><strong>Status:</strong> ${escapeReportHtml(humanize(profile?.assessment?.assessment_status || profile.status))} · <strong>Evidence:</strong> ${escapeReportHtml(humanize(profile?.assessment?.confidence_level || profile.evidenceLevel))} · <strong>Updated:</strong> ${escapeReportHtml(formatDate(profile.updatedAt || profile.published_at))}</p>

        <h2>Six-domain assessment</h2>
        <table><tbody>${domainRows}</tbody></table>

        <div class="two-columns">
          <section class="panel"><h2>Documented strengths</h2>${listReportItems(profile.strengths, "No reviewed strength recorded.")}</section>
          <section class="panel"><h2>Points to examine</h2>${listReportItems(profile.watch, "No reviewed watch point recorded.")}</section>
        </div>

        <h2>Evidence register</h2>
        ${sources.length ? sources.map(sourceReportHtml).join("") : '<p class="empty">No documentary source is attached to this working profile.</p>'}

        <p class="method"><strong>Methodological note.</strong> The overall orientation signal is the rounded arithmetic mean of the six current domain scores unless an explicitly reviewed overall score is stored. It summarises the profile but does not replace the underlying sources, limitations and indicator-by-indicator review.</p>
      </main>
    </body>
  </html>`);
  reportWindow.document.close();
  reportWindow.focus();
}

function ProfilePanel({ country, profile }) {
  if (!profile) {
    return (
      <article className="profile-panel empty-profile" aria-live="polite">
        <div>
          <p className="profile-overline">{country?.iso3 || "Country"} · documentary coverage</p>
          <h3>{country?.name || "Select a country"}</h3>
          <p>This country has not yet been examined in the current IML evidence register. Neutral colour means absence of a reviewed profile, never low maturity.</p>
          <div className="not-ranking"><strong>Not yet examined.</strong> The selected outline identifies what you are viewing; it does not assign a score.</div>
        </div>
      </article>
    );
  }

  const score = profileScore(profile);
  const values = asArray(profile.values).length === 6 ? profile.values.map(Number) : [0, 0, 0, 0, 0, 0];
  const sources = asArray(profile.sources);
  const assessment = profile.assessment || {};
  const evidenceCount = sources.flatMap((source) => asArray(source.indicators)).length;

  return (
    <article className="profile-panel" aria-live="polite">
      <div className="profile-heading">
        <div><p className="profile-overline">{profile.iso3} · profile v{profile.version || "working"}</p><h3>{profile.name}</h3></div>
        <div className="orientation-score" aria-label={`Indicative orientation signal ${score} out of 100`}><strong>{score}</strong><span>/100</span><small>orientation signal</small></div>
      </div>
      <p className="profile-subtitle">{profile.subtitle || "Exploratory, evidence-oriented country profile."}</p>
      <div className="not-ranking"><strong>Not a ranking.</strong> Scores help structure inquiry across six domains; they are provisional and evidence-dependent.</div>
      <div className="radar-wrap">
        <svg className="radar" viewBox="0 0 240 240" role="img" aria-label={`Six-domain orientation for ${profile.name}`}>
          {[25, 50, 75, 100].map((level) => <polygon key={level} points={polygonPoints([level, level, level, level, level, level], 78)} className="radar-grid" />)}
          {[0, 1, 2, 3, 4, 5].map((index) => { const angle = -Math.PI / 2 + (index * Math.PI * 2) / 6; return <line key={index} x1="120" y1="120" x2={120 + Math.cos(angle) * 78} y2={120 + Math.sin(angle) * 78} className="radar-axis" />; })}
          <polygon points={polygonPoints(values, 78)} className="radar-value" />
          {values.map((value, index) => { const angle = -Math.PI / 2 + (index * Math.PI * 2) / 6; const x = 120 + Math.cos(angle) * 99; const y = 120 + Math.sin(angle) * 99; return <text key={RADAR_LABELS[index]} x={x} y={y} textAnchor={x < 110 ? "end" : x > 130 ? "start" : "middle"} dominantBaseline="middle">{RADAR_LABELS[index]} · {value}</text>; })}
        </svg>
        <dl className="profile-meta">
          <div><dt>Assessment</dt><dd>{humanize(assessment.assessment_status || profile.status)}</dd></div>
          <div><dt>Evidence</dt><dd>{humanize(assessment.confidence_level || profile.evidenceLevel)}</dd></div>
          <div><dt>Sources</dt><dd>{sources.length}</dd></div>
          <div><dt>Evidence links</dt><dd>{evidenceCount}</dd></div>
          <div><dt>Updated</dt><dd>{formatDate(profile.updatedAt || profile.published_at)}</dd></div>
        </dl>
      </div>
      <div className="profile-lists">
        <div><h4>Documented strengths</h4><ul>{asArray(profile.strengths).length ? profile.strengths.map((item, index) => <li key={index}>{item}</li>) : <li>No reviewed strength recorded.</li>}</ul></div>
        <div><h4>Points to examine</h4><ul>{asArray(profile.watch).length ? profile.watch.map((item, index) => <li key={index}>{item}</li>) : <li>No reviewed watch point recorded.</li>}</ul></div>
      </div>
      <details className="evidence-register">
        <summary><span><strong>Evidence register</strong><small>{sources.length} source{sources.length === 1 ? "" : "s"} · {evidenceCount} linked indicator{evidenceCount === 1 ? "" : "s"}</small></span><span>+</span></summary>
        <div className="evidence-list">
          {sources.length ? sources.map((source, index) => (
            <article className="evidence-item" key={`${source.url || source.title || "source"}-${index}`}>
              <div className="evidence-title"><span>{String(index + 1).padStart(2, "0")}</span><div><h5>{source.title || `Source ${index + 1}`}</h5><p>{source.publisher || "Publisher not recorded"}</p></div>{source.url ? <a href={source.url} target="_blank" rel="noreferrer">Open source ↗</a> : <span className="restricted-link">No public link</span>}</div>
              {source.note ? <p>{source.note}</p> : null}
              {asArray(source.indicators).map((indicator, indicatorIndex) => <div className="evidence-claim" key={`${indicator.code || "indicator"}-${indicatorIndex}`}><span>{indicator.code || "IML indicator"} · evidence {indicator.evidence_level || "ungraded"}</span><p>{indicator.summary || "Evidence summary not recorded."}</p>{indicator.limitation ? <small><strong>Limit:</strong> {indicator.limitation}</small> : null}</div>)}
            </article>
          )) : <p>No source record is publicly available for this working profile.</p>}
        </div>
      </details>
    </article>
  );
}

function CountryExplorer() {
  const [profiles, setProfiles] = useState([]);
  const [selectedIso3, setSelectedIso3] = useState("FRA");
  const [hovered, setHovered] = useState(null);
  const [status, setStatus] = useState({ loading: true, warning: "" });

  useEffect(() => {
    const controller = new AbortController();
    loadCountryProfiles(controller.signal)
      .then((result) => {
        setProfiles(result.profiles);
        setStatus({ loading: false, warning: "" });
        if (!result.profiles.some((profile) => profile.iso3 === "FRA") && result.profiles[0]) setSelectedIso3(result.profiles[0].iso3);
      })
      .catch((error) => {
        if (error?.name !== "AbortError") setStatus({ loading: false, warning: error?.message || "Profile service unavailable." });
      });
    return () => controller.abort();
  }, []);

  const profilesByIso3 = useMemo(() => new Map(profiles.map((profile) => [profile.iso3, profile])), [profiles]);
  const features = useMemo(() => worldCountries.features.filter((feature) => !isAntarctica(feature) && featureIso3(feature) && featureIso3(feature) !== "-99"), []);
  const countryOptions = useMemo(() => Array.from(new Map(features.map((feature) => [featureIso3(feature), { iso3: featureIso3(feature), name: profilesByIso3.get(featureIso3(feature))?.name || featureName(feature) }])).values()).sort((a, b) => a.name.localeCompare(b.name)), [features, profilesByIso3]);
  const selectedFeature = features.find((feature) => featureIso3(feature) === selectedIso3);
  const selectedCountry = selectedFeature ? { iso3: selectedIso3, name: profilesByIso3.get(selectedIso3)?.name || featureName(selectedFeature) } : null;
  const selectedProfile = profilesByIso3.get(selectedIso3) || null;

  if (status.loading) return <div className="explorer-loading" role="status"><span />Loading country profiles…</div>;

  return (
    <div className="country-explorer">
      <div className="explorer-toolbar">
        <label><span>Choose a country</span><select value={selectedIso3} onChange={(event) => setSelectedIso3(event.target.value)}>{countryOptions.map((country) => <option value={country.iso3} key={country.iso3}>{country.name} — {profilesByIso3.has(country.iso3) ? "examined" : "not examined"}</option>)}</select></label>
        <div className="report-toolbar-action">
          <button
            type="button"
            className="button primary"
            disabled={!selectedProfile}
            onClick={() => openCountryPdfReport(selectedProfile)}
          >
            Download PDF report
          </button>
          <small>{selectedProfile ? `Report for ${selectedProfile.name}` : "Select an examined country to enable the report."}</small>
        </div>
      </div>
      {status.warning ? <div className="explorer-warning" role="status"><strong>Country profiles could not be loaded.</strong><span>{status.warning}</span></div> : null}
      <div className="explorer-grid">
        <div className="map-panel">
          <div className="map-legend" aria-label="Map colour scale"><span><i className="legend-unexamined" /> Not examined</span><span className="legend-scale-label">Examined · orientation signal</span><span><i className="legend-band-1" /> 0–24</span><span><i className="legend-band-2" /> 25–49</span><span><i className="legend-band-3" /> 50–74</span><span><i className="legend-band-4" /> 75–100</span><span><i className="legend-selected" /> Selection</span></div>
          <div className="map-stage">
            <svg className="world-map" viewBox={`0 0 ${MAP_WIDTH} ${MAP_VISIBLE_HEIGHT}`} role="img" aria-labelledby="map-title map-description">
              <title id="map-title">IML country profiles world map</title><desc id="map-description">Examined countries use a four-step colour scale. Countries not yet examined are neutral. Every country can be selected.</desc>
              {features.map((feature) => {
                const iso3 = featureIso3(feature); const profile = profilesByIso3.get(iso3); const selected = selectedIso3 === iso3; const score = profile ? profileScore(profile) : null;
                return <path key={`${iso3}-${featureName(feature)}`} d={geometryToPath(feature.geometry)} fillRule="evenodd" className={`map-country${profile ? ` is-examined score-band-${scoreBand(score)}` : " is-unexamined"}${selected ? " is-selected" : ""}`} aria-label={profile ? `${profile.name}: examined, orientation signal ${score} out of 100` : `${featureName(feature)}: not yet examined`} aria-current={selected ? "true" : undefined} role="button" tabIndex={0} onClick={() => setSelectedIso3(iso3)} onMouseMove={(event) => { const bounds = event.currentTarget.ownerSVGElement.getBoundingClientRect(); setHovered({ x: event.clientX - bounds.left, y: event.clientY - bounds.top, name: profile?.name || featureName(feature), profile, score }); }} onMouseLeave={() => setHovered(null)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSelectedIso3(iso3); } }}><title>{profile ? `${profile.name} — examined · orientation signal ${score}/100` : `${featureName(feature)} — not yet examined`}</title></path>;
              })}
            </svg>
            {hovered ? <div className="map-tooltip" style={{ left: `${Math.min(hovered.x + 14, 820)}px`, top: `${Math.max(12, hovered.y - 24)}px` }}><strong>{hovered.name}</strong><span>{hovered.profile ? `${hovered.score}/100 · examined profile` : "Not yet examined"}</span></div> : null}
          </div>
          <p className="map-caption">Colour distinguishes documentary coverage and groups examined profiles by their provisional orientation signal. It is not a ranking.</p>
        </div>
        <ProfilePanel country={selectedCountry} profile={selectedProfile} />
      </div>
    </div>
  );
}

/*
 * These few rules are deliberately kept here so this App.jsx can replace the
 * current file on site-test without requiring another CSS upload.
 */
const REFERENCE_ADJUSTMENTS = `
  /* Editorial line work: a few incomplete arcs continue the movement of the
     lamp illustration. They deliberately begin outside the visible page so
     this reads as atmosphere, never as a repeated grid. */
  .hero,
  .page-masthead,
  .vision,
  .current-state,
  .clinical-section,
  .route-overview,
  .next-paths,
  .methodology-section,
  .profiles-section,
  .manuscripts-section {
    background-color: var(--light);
    background-image:
      radial-gradient(ellipse 92% 128% at -16% 104%, transparent 0 67%, rgba(46, 111, 106, .13) 67.15% 67.3%, transparent 67.45% 74%, rgba(46, 111, 106, .07) 74.15% 74.28%, transparent 74.43%),
      radial-gradient(ellipse 78% 116% at 112% -22%, transparent 0 62%, rgba(226, 166, 71, .15) 62.15% 62.32%, transparent 62.47% 70%, rgba(46, 111, 106, .08) 70.15% 70.27%, transparent 70.42%),
      linear-gradient(145deg, var(--light), var(--paper));
    background-size: 100% 100%;
    background-repeat: no-repeat;
  }

  .interoperability-section,
  .collaborate-section {
    background-image:
      radial-gradient(ellipse 96% 136% at -18% 112%, transparent 0 68%, rgba(226, 166, 71, .20) 68.15% 68.3%, transparent 68.45% 75%, rgba(255, 255, 255, .08) 75.15% 75.28%, transparent 75.43%),
      radial-gradient(ellipse 72% 108% at 112% -20%, transparent 0 63%, rgba(226, 166, 71, .16) 63.15% 63.3%, transparent 63.45% 71%, rgba(255, 255, 255, .06) 71.15% 71.27%, transparent 71.42%),
      linear-gradient(145deg, var(--navy), var(--teal-deep));
    background-size: 100% 100%;
    background-repeat: no-repeat;
  }

  .page-ornament {
    display: flex;
    align-items: center;
    gap: 10px;
    width: min(1160px, calc(100% - 48px));
    margin: 0 auto;
    padding: 18px 0;
    color: color-mix(in srgb, var(--teal) 50%, var(--line));
  }

  .page-ornament span {
    height: 1px;
    flex: 1;
    background: currentColor;
    opacity: .65;
  }

  .page-ornament i {
    box-sizing: border-box;
    display: block;
    width: 7px;
    height: 7px;
    flex: 0 0 7px;
    border: 1px solid currentColor;
    border-radius: 50%;
  }

  .brand-home {
    min-width: 320px;
    gap: 14px;
  }

  .hero-grid {
    grid-template-columns: minmax(0, 1.02fr) minmax(430px, .98fr);
  }

  .hero-copy {
    max-width: 760px;
  }

  .brand-mark img,
  .footer-logo img {
    transform: scale(1.52);
    mix-blend-mode: multiply;
  }

  .footer-brand {
    gap: 14px;
  }

  .footer-logo {
    width: 62px;
    height: 62px;
    display: grid;
    place-items: center;
    flex: 0 0 auto;
    overflow: hidden;
    border-radius: 14px;
    background: #f5efe4;
  }

  .footer-logo img {
    width: 58px;
    height: 58px;
    object-fit: contain;
  }

  .page-masthead-grid {
    grid-template-columns: minmax(0, 1.45fr) minmax(280px, .55fr);
  }

  .explorer-toolbar {
    justify-content: space-between;
  }

  .report-toolbar-action {
    display: grid;
    justify-items: end;
    gap: 7px;
  }

  .report-toolbar-action button {
    cursor: pointer;
    font-family: inherit;
  }

  .report-toolbar-action button:disabled {
    cursor: not-allowed;
    opacity: .48;
    transform: none;
    box-shadow: none;
  }

  .report-toolbar-action small {
    margin: 0;
    color: var(--soft);
    font-size: .68rem;
    line-height: 1.35;
    text-align: right;
  }

  .manuscript-cards h3 {
    margin-top: 12px;
  }

  body[data-iml-route="/country-profiles"] .page-masthead-grid,
  body[data-iml-route="/manuscripts"] .page-masthead-grid {
    min-height: 280px;
    padding-block: 48px 56px;
  }

  body[data-iml-route="/country-profiles"] .page-masthead h1,
  body[data-iml-route="/manuscripts"] .page-masthead h1 {
    font-size: clamp(3rem, 4.8vw, 5.1rem);
  }

  body[data-iml-route="/country-profiles"] .profiles-heading {
    margin-bottom: 30px;
  }

  body[data-iml-route="/identity-trust"] .page-masthead-grid {
    min-height: 320px;
    grid-template-columns: minmax(0, 1.45fr) minmax(280px, .55fr);
    padding-block: 52px 62px;
  }

  body[data-iml-route="/identity-trust"] .page-masthead h1 {
    max-width: 1050px;
    font-size: clamp(3rem, 4.8vw, 5.15rem);
  }

  .collaborate-masthead-aside {
    align-self: stretch;
    display: flex;
    min-width: 0;
    flex-direction: column;
    justify-content: space-between;
    gap: 18px;
  }

  .collaborate-lamp-frame {
    position: relative;
    width: 100%;
    aspect-ratio: 3 / 2;
    overflow: hidden;
    border-radius: 46% 54% 51% 49% / 58% 44% 56% 42%;
    -webkit-mask-image: radial-gradient(ellipse at center, #000 54%, rgba(0, 0, 0, .96) 69%, transparent 100%);
    mask-image: radial-gradient(ellipse at center, #000 54%, rgba(0, 0, 0, .96) 69%, transparent 100%);
  }

  .collaborate-lamp-frame img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
    transform: scaleX(-1);
    mix-blend-mode: multiply;
  }

  .collaborate-masthead-aside p {
    margin: 0;
    color: var(--soft);
    font-size: clamp(1.03rem, 1.3vw, 1.22rem);
    line-height: 1.75;
  }

  .identity-trust-section {
    background: var(--light);
    padding-block: clamp(48px, 6vw, 86px);
  }

  .identity-trust-card {
    border: 1px solid color-mix(in srgb, var(--teal) 42%, var(--line));
    border-radius: 24px;
    background: color-mix(in srgb, var(--teal-wash) 34%, var(--light));
    padding: clamp(28px, 4vw, 48px);
    box-shadow: 0 18px 48px rgba(19, 40, 58, .07);
  }

  .identity-trust-card h2 {
    margin: 0 0 20px;
    font-family: var(--font-source-serif), Georgia, serif;
    font-size: clamp(1.55rem, 2.2vw, 2.2rem);
    font-weight: 650;
    letter-spacing: -.025em;
    line-height: 1.15;
  }

  .identity-trust-card p {
    margin: 0;
    color: var(--soft);
    font-size: 1rem;
    line-height: 1.75;
  }

  .identity-trust-card p + p {
    margin-top: 18px;
  }

  @media (max-width: 760px) {
    body[data-iml-route="/country-profiles"] .page-masthead-grid,
    body[data-iml-route="/manuscripts"] .page-masthead-grid {
      padding-block: 38px 48px;
    }

    body[data-iml-route="/identity-trust"] .page-masthead-grid {
      min-height: auto;
      grid-template-columns: 1fr;
      padding-block: 38px 48px;
    }

    .identity-trust-card {
      border-radius: 18px;
    }

    .collaborate-masthead-aside {
      max-width: 760px;
    }

    .collaborate-lamp-frame {
      width: min(520px, 100%);
    }

    .report-toolbar-action {
      justify-items: stretch;
    }

    .report-toolbar-action small {
      text-align: left;
    }

    .brand-home {
      min-width: 0;
    }

    .footer-logo {
      width: 54px;
      height: 54px;
    }
  }

  @media (max-width: 1180px) {
    .hero-grid {
      grid-template-columns: minmax(0, 1fr);
    }

    .hero-copy {
      max-width: 880px;
    }
  }
`;

function HomePage() {
  return (
    <PageFrame active="/" home>
      <section className="hero" id="top">
        <div className="shell hero-grid">
          <div className="hero-copy">
            <h1>Health information should illuminate care — not fragment it.</h1>
            <p className="hero-lede">
              An open clinical workspace and an integration layer for systems that must cooperate without losing clinical meaning.
            </p>
            <div className="hero-actions">
              <a className="button primary" href="/vision">Explore the project</a>
              <a className="button secondary" href="/country-profiles">View country profiles</a>
            </div>
            <div className="hero-paths" aria-label="Two complementary paths">
              <a className="path-card" href="/clinical-workspace">
                <span className="path-number">01</span>
                <span>
                  <strong>Open Clinical Workspace</strong>
                  <small>A progressively deployable clinical foundation.</small>
                </span>
              </a>
              <a className="path-card" href="/interoperability">
                <span className="path-number">02</span>
                <span>
                  <strong>Integration &amp; evidence layer</strong>
                  <small>Connect systems, preserve meaning, document evidence.</small>
                </span>
              </a>
            </div>
          </div>
          <div className="hero-art">
            <div className="hero-art-frame">
              <img src={heroLampImage} alt="Hand-drawn IML lamp illuminating connected evidence paths" />
            </div>
          </div>
        </div>
        <div className="shell principle">
          <span />
          <p>Health is the objective. Trustworthy information is the foundation. Interoperability is the path.</p>
          <span />
        </div>
      </section>
    </PageFrame>
  );
}

function VisionPage() {
  return (
    <PageFrame active="/vision">
      <PageMasthead
        title="One open environment. Two complementary paths."
        lede="IML links a modular clinical foundation with an open way to connect existing health information systems."
      />
      <section className="vision vision-page" aria-labelledby="vision-heading">
        <div className="shell vision-grid">
          <div>
            <h2 id="vision-heading">Make trustworthy information useful across care.</h2>
          </div>
          <div className="vision-prose">
            <p>
              IML is not a new national silo. It is a vendor-neutral reference environment for clinical work, integration, evidence and correction.
            </p>
            <p>
              Identity remains a governed enabling layer. <a className="text-link" href="/identity-trust">Read Identity &amp; Trust →</a>
            </p>
          </div>
        </div>
      </section>
    </PageFrame>
  );
}

function ClinicalWorkspacePage() {
  return (
    <PageFrame active="/clinical-workspace">
      <PageMasthead
        title="Primary care deserves software that can be trusted, adapted and kept."
        lede="An open clinical workspace: practical for the consultation, respectful of local care, and free from dependence on a single supplier."
      />
      <section className="section clinical-section" aria-labelledby="clinical-heading">
        <div className="shell primary-care-layout">
          <div className="section-intro sticky-intro">
            <p className="section-kicker">The clinical need</p>
            <h2 id="clinical-heading">Care should not be held hostage by its software.</h2>
            <p>
              In primary care, the record must support the encounter: listening, examining, deciding, prescribing, following up and correcting. Yet many practices face costly licences, opaque data models and tools that are difficult to adapt to local language, workflows or public-health needs.
            </p>
            <p>
              IML does not propose another isolated electronic record. It develops an open implementation bridge: a small, useful clinical workspace that can connect to existing systems, grow gradually and always leave the data understandable and exportable.
            </p>
          </div>
          <div className="primary-care-content">
            <div className="primary-care-promise">
              <span>01</span>
              <div>
                <h3>Useful at the point of care</h3>
                <p>A coherent consultation record, local terminology, results with their provenance and a clear clinical history — without making the clinician work for the system.</p>
              </div>
            </div>
            <div className="primary-care-promise">
              <span>02</span>
              <div>
                <h3>Open to scrutiny and improvement</h3>
                <p>Code, data structures and corrections can be inspected, tested and improved by clinicians, universities and communities. Clinical safety is a shared, documented responsibility.</p>
              </div>
            </div>
            <div className="primary-care-promise">
              <span>03</span>
              <div>
                <h3>Adaptable without vendor lock-in</h3>
                <p>Regional packs can add language, terminology and national services without changing the common core. A practice can start locally, work with modest infrastructure and connect later when it is useful.</p>
              </div>
            </div>
            <aside className="clinical-reference">
              <strong>Build with — not against — existing open-source work.</strong>
              <p><a className="text-link" href="https://openmrs.org/" target="_blank" rel="noopener noreferrer">OpenMRS ↗</a> is an important reference: it shows how a global open-source community can support adaptable clinical records and standards-based integration. IML explores complementary regional packs, quality methods and an independent integration layer.</p>
              <p className="ai-regulatory-note"><strong>Responsible AI.</strong> Where artificial intelligence is used, it must remain traceable, proportionate and subject to professional validation. <em>See IML regulatory watch.</em></p>
            </aside>
            <div className="clinical-action-row">
              <a className="text-link" href="/collaborate">Join the clinical workstream →</a>
              <a className="text-link" href="/manuscripts">Read the founding manuscript →</a>
            </div>
          </div>
        </div>
      </section>
    </PageFrame>
  );
}

function CountryProfilesPage() {
  return (
    <PageFrame active="/country-profiles">
      <PageMasthead
        title="Country profiles"
        lede="Explore evidence, sources and limitations. Profiles support inquiry; they are not rankings."
      />
      <section className="section profiles-section" aria-labelledby="profiles-heading">
        <div className="shell">
          <div className="profiles-heading">
            <p id="profiles-heading">Select any country on the map. Neutral means not yet examined, never low maturity.</p>
          </div>
          <CountryExplorer />
        </div>
      </section>
    </PageFrame>
  );
}

function ManuscriptsPage() {
  return (
    <PageFrame active="/manuscripts">
      <PageMasthead
        title="Manuscripts"
        lede="Founding vision and technical architecture for scientific review."
      />
      <section className="section manuscripts-section" aria-labelledby="manuscripts-heading">
        <div className="shell manuscript-layout">
          <div className="section-intro">
            <h2 id="manuscripts-heading">Read the current foundations.</h2>
          </div>
          <div className="manuscript-cards" aria-label="IML manuscripts">
            <article>
              <h3>Founding vision</h3>
              <p>Why fragmented information harms care, and why a health information environment must be open, accountable and clinically grounded.</p>
              <a className="button primary" href={`${BASE_URL}IML_Founding_Manuscript.pdf`} target="_blank" rel="noreferrer">
                Read founding manuscript ↗
              </a>
            </article>
            <article>
              <h3>Technical architecture</h3>
              <p>How modular software, interoperability layers, evidence and correction can form a coherent implementation path.</p>
              <a className="button secondary" href={`${BASE_URL}IML_Technical_Manuscript.pdf`} target="_blank" rel="noreferrer">
                Read technical manuscript ↗
              </a>
            </article>
          </div>
        </div>
      </section>
    </PageFrame>
  );
}

function IdentityTrustPage() {
  return (
    <PageFrame active="/identity-trust">
      <PageMasthead
        title="Identity, consent and trust across fragmented systems"
        lede="Identity is an enabling layer for continuity and accountability, not the whole of interoperability."
      />
      <section className="identity-trust-section" id="identity-trust" aria-labelledby="identity-trust-heading">
        <div className="shell">
          <article className="identity-trust-card">
            <h2 id="identity-trust-heading">From trusted identity to authorised health and research linkage</h2>
            <p>
              IML does not propose replacing national identity systems. It explores how recognised national identifiers could contribute to a future universal health and research number for authorised multicentre, longitudinal and epidemiological studies. It complements the <a className="text-link" href="https://id4d.worldbank.org/" target="_blank" rel="noopener noreferrer">World Bank ID4D initiative ↗</a> and may build on trust infrastructures such as the <a className="text-link" href="https://www.who.int/initiatives/global-digital-health-certification-network" target="_blank" rel="noopener noreferrer">WHO Global Digital Health Certification Network ↗</a>.
            </p>
            <p>
              National models already differ. A future IML model could combine the national identifier namespace, a governed geographic reference and a protected keyed hash. The resulting number would remain regulated personal data and would require legal, ethical, security and equity review before implementation.
            </p>
            <p>
              Identity, identifier, access token and carrier mechanism must remain distinct. A QR code or mobile application should carry only a temporary signed token or a verifiable digital certificate, never sensitive identity or health information in clear text.
            </p>
            <p>
              The country-level <a className="text-link" href="https://monitor.digitalhealthmonitor.org/map" target="_blank" rel="noopener noreferrer">Global Digital Health Monitor map ↗</a> provides information on digital health. IML is different: it develops an independent comparative framework designed to guide structured country research, verify documentary evidence, identify information gaps and support contextual human validation.
            </p>
          </article>
        </div>
      </section>
    </PageFrame>
  );
}

const interoperabilityLayers = [
  ["01", "Technical", "Can systems exchange data reliably?"],
  ["02", "Semantic", "Is clinical meaning preserved?"],
  ["03", "Organisational", "Do workflows and responsibilities align?"],
  ["04", "Institutional", "Are governance, law and accountability credible?"],
  ["05", "Clinical & public health", "Does information improve decisions, safety and learning?"],
];

const methodologyDomains = [
  ["GOV", "Governance", "Stewardship, accountability and policy direction"],
  ["TEC", "Technical", "Standards, architecture and reliable exchange"],
  ["IDT", "Identity", "People, professionals, organisations and consent"],
  ["ADP", "Adoption", "Real use in care and public-health workflows"],
  ["SEC", "Security", "Protection, access control and resilience"],
  ["LRN", "Learning", "Feedback, correction and system improvement"],
];

function InteroperabilityPage() {
  return (
    <PageFrame active="/interoperability">
      <PageMasthead
        title="Interoperability is a clinical capability, not a cable between databases."
        lede="A connection becomes useful only when technical exchange, shared meaning, workflow, governance and clinical purpose hold together."
      />
      <section className="section interoperability-section" aria-labelledby="layers-heading">
        <div className="shell">
          <div className="wide-heading"><div><h2 id="layers-heading">Exchange must preserve meaning and responsibility.</h2></div><p>IML treats interoperability as an end-to-end clinical and institutional capability rather than a narrow interface project.</p></div>
          <div className="layer-grid">{interoperabilityLayers.map(([number, title, copy]) => <article key={title}><span>{number}</span><h3>{title}</h3><p>{copy}</p></article>)}</div>
          <div className="information-flow" aria-label="Information flow from source systems to learning">
            <div><small>Existing sources</small><strong>EHRs · labs · registries · payers</strong></div><i>→</i>
            <div><small>Trust layer</small><strong>Identity · consent · terminology</strong></div><i>→</i>
            <div><small>Clinical use</small><strong>Workspace · public health</strong></div><i>→</i>
            <div><small>Learning</small><strong>Evidence · correction · feedback</strong></div>
          </div>
          <div className="demonstrator-grid">
            <article><h3>AMR / BMR continuity</h3><p>Trace culture, susceptibility, antimicrobial decisions and feedback without detaching a laboratory result from its clinical context.</p></article>
            <article><h3>Payer interoperability</h3><p>Connect coverage and reimbursement processes to care without allowing administrative exchange to distort the clinical record.</p></article>
            <article><h3>Identity, consent &amp; access</h3><p>QR or mobile workflows should carry only short-lived signed tokens—never sensitive health data in clear text. IML complements national identity systems; it does not replace them.</p></article>
          </div>
        </div>
      </section>
      <section className="section methodology-section" id="methodology" aria-labelledby="methodology-heading">
        <div className="shell methodology-layout">
          <div className="section-intro"><h2 id="methodology-heading">Six domains, explicit evidence and versioned judgments.</h2><p>Country profiles are structured orientation tools. Each claim should point to documentary support, declare its limitation and remain open to correction by informed reviewers.</p></div>
          <div className="domain-grid">{methodologyDomains.map(([code, title, copy]) => <article key={code}><span>{code}</span><h3>{title}</h3><p>{copy}</p></article>)}</div>
          <ol className="evidence-pipeline" aria-label="Evidence workflow">
            <li><span>1</span><strong>Source</strong><small>Prefer authoritative public documentation</small></li>
            <li><span>2</span><strong>Claim</strong><small>Link evidence to a precise indicator</small></li>
            <li><span>3</span><strong>Limit</strong><small>State what the source cannot prove</small></li>
            <li><span>4</span><strong>Review</strong><small>Version, challenge and correct</small></li>
          </ol>
        </div>
      </section>
    </PageFrame>
  );
}

function CollaboratePage() {
  return (
    <PageFrame active="/collaborate">
      <PageMasthead title="Bring evidence, clinical reality or implementation experience." lede="IML is independent, non-commercial and open to rigorous contribution." mirroredLamp />
      <section className="section collaborate-section" aria-labelledby="collaborate-heading">
        <div className="shell collaborate-layout">
          <div><h2 id="collaborate-heading">A concrete contribution is better than a broad endorsement.</h2><p>Tell us what you know, what should be corrected and what you would be prepared to test.</p><a className="button amber-button" href="mailto:iml.health@pm.me?subject=IML%20collaboration">Write to iml.health@pm.me</a></div>
          <div className="audience-grid">
            <article><span>01</span><h3>Clinicians &amp; country reviewers</h3><p>Test whether profiles reflect real care and flag overstatement, omissions or outdated evidence.</p></article>
            <article><span>02</span><h3>Universities &amp; researchers</h3><p>Strengthen the method, validation design and scientific critique.</p></article>
            <article><span>03</span><h3>Institutions &amp; implementers</h3><p>Explore pragmatic pilots without creating another closed dependency.</p></article>
            <article><span>04</span><h3>Open-source developers</h3><p>Build small, reviewable modules and integration demonstrations.</p></article>
          </div>
        </div>
      </section>
    </PageFrame>
  );
}

function NotFoundPage() {
  return (
    <PageFrame active="/">
      <PageMasthead title="This page is not part of the current IML site." lede="Use the navigation or return to the project home." />
      <section className="section"><div className="shell"><a className="button primary" href="/">Return to IML Health</a></div></section>
    </PageFrame>
  );
}

export const ROUTES = {
  "/": {
    component: HomePage,
    title: "IML Health — Open Health Information Environment",
    description: "An open-source clinical workspace and an open integration layer for health information systems.",
  },
  "/vision": {
    component: VisionPage,
    title: "Vision — IML Health",
    description: "The purpose, scope and current state of the IML Open Health Information Environment.",
  },
  "/identity-trust": {
    component: IdentityTrustPage,
    title: "Identity & Trust — IML Health",
    description: "Identity, consent, provenance and trusted access across fragmented health information systems.",
  },
  "/clinical-workspace": {
    component: ClinicalWorkspacePage,
    title: "Open Clinical Workspace — IML Health",
    description: "A modular, open-source and vendor-neutral clinical workspace for progressive deployment.",
  },
  "/interoperability": {
    component: InteroperabilityPage,
    title: "Interoperability — IML Health",
    description: "IML's open integration, evidence and learning layer for health information systems.",
  },
  "/country-profiles": {
    component: CountryProfilesPage,
    title: "Country Profiles — IML Health",
    description: "Evidence-oriented country interoperability profiles with explicit sources and limitations.",
  },
  "/manuscripts": {
    component: ManuscriptsPage,
    title: "Manuscripts — IML Health",
    description: "The founding vision and technical architecture manuscripts of IML Health.",
  },
  "/collaborate": {
    component: CollaboratePage,
    title: "Collaborate — IML Health",
    description: "Contribute evidence, clinical review, research or open-source implementation experience to IML Health.",
  },
};

const LEGACY_HASHES = {
  "#id4d": "/identity-trust",
  "#evaluation": "/interoperability",
  "#methodology": "/interoperability#methodology",
  "#world": "/country-profiles",
  "#profiles": "/country-profiles",
  "#contact": "/collaborate",
};

const LEGACY_PATHS = {
  "/id4d": "/identity-trust",
  "/evaluation": "/interoperability",
  "/methodology": "/interoperability#methodology",
  "/world": "/country-profiles",
  "/profiles": "/country-profiles",
  "/contact": "/collaborate",
};

function cleanPath(pathname) {
  if (!pathname || pathname === "/") return "/";
  return pathname.replace(/\/+$/, "") || "/";
}

function resolveLocation() {
  const pathname = cleanPath(window.location.pathname);
  const legacyTarget = LEGACY_PATHS[pathname]
    || (pathname === "/" ? LEGACY_HASHES[window.location.hash.toLowerCase()] : null);
  if (!legacyTarget) return { routePath: pathname, canonicalTarget: null };
  return { routePath: legacyTarget.split("#")[0], canonicalTarget: legacyTarget };
}

function setMeta(route) {
  document.title = route.title;
  let description = document.querySelector('meta[name="description"]');
  if (!description) {
    description = document.createElement("meta");
    description.setAttribute("name", "description");
    document.head.appendChild(description);
  }
  description.setAttribute("content", route.description);
}

function ensureIdentityTrustLinks(activePath) {
  document.querySelectorAll(".desktop-nav, .mobile-menu nav").forEach((nav) => {
    let link = nav.querySelector('a[href="/identity-trust"]');
    if (!link) {
      link = document.createElement("a");
      link.href = "/identity-trust";
      link.textContent = "Identity & Trust";
      const visionLink = nav.querySelector('a[href="/vision"]');
      if (visionLink) visionLink.insertAdjacentElement("afterend", link);
      else nav.prepend(link);
    }
    if (activePath === "/identity-trust") link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });

  const projectFooter = [...document.querySelectorAll(".footer-grid > div")]
    .find((section) => section.querySelector("h3")?.textContent.trim() === "Project");
  if (projectFooter && !projectFooter.querySelector('a[href="/identity-trust"]')) {
    const link = document.createElement("a");
    link.href = "/identity-trust";
    link.textContent = "Identity & Trust";
    const visionLink = projectFooter.querySelector('a[href="/vision"]');
    if (visionLink) visionLink.insertAdjacentElement("afterend", link);
    else projectFooter.append(link);
  }
}

export default function App() {
  const location = resolveLocation();
  const route = ROUTES[location.routePath] || {
    component: NotFoundPage,
    title: "Page not found — IML Health",
    description: "The requested IML Health page could not be found.",
  };
  const Page = route.component;

  useEffect(() => {
    setMeta(route);
    document.body.dataset.imlRoute = location.routePath;

    if (location.canonicalTarget) {
      window.history.replaceState({}, "", location.canonicalTarget);
    }

    const fragment = (location.canonicalTarget?.split("#")[1] || window.location.hash.slice(1)).trim();
    window.requestAnimationFrame(() => {
      ensureIdentityTrustLinks(location.routePath);
      if (fragment && document.getElementById(fragment)) {
        document.getElementById(fragment).scrollIntoView();
      } else {
        window.scrollTo(0, 0);
      }
    });

    return () => {
      delete document.body.dataset.imlRoute;
    };
  }, [location.canonicalTarget, location.routePath, route]);

  return (
    <>
      <style>{REFERENCE_ADJUSTMENTS}</style>
      <Page />
    </>
  );
}
