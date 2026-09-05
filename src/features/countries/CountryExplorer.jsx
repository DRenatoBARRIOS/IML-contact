import { useEffect, useMemo, useState } from "react";
import worldCountries from "../../world-countries.json";
import logoImage from "../../assets/iml-logo.png";

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
  Learning: "Correction, continuous improvement, traceable reuse, documentary reliability and institutional answerability.",
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
  const learningEvidence = sources.flatMap((source) =>
    asArray(source.indicators)
      .filter((indicator) => {
        const code = String(indicator.code || "").toUpperCase();
        return code.startsWith("LRN-") || code.includes("-LRN-");
      })
      .map((indicator) => ({ indicator, source }))
  );

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

      <section
        aria-labelledby={`domain-scores-${profile.iso3}`}
        style={{ marginTop: "30px", border: "1px solid var(--line)", borderRadius: "14px", background: "var(--light)", overflow: "hidden" }}
      >
        <div style={{ padding: "18px 20px 12px" }}>
          <h4 id={`domain-scores-${profile.iso3}`} style={{ margin: 0, fontSize: "1.05rem" }}>Six-domain scores</h4>
          <p style={{ margin: "6px 0 0", color: "var(--soft)", fontSize: ".86rem", lineHeight: 1.55 }}>
            Each score is shown explicitly with the domain meaning and the interpretation used in the country report.
          </p>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "720px" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "11px 16px", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)", color: "var(--teal-deep)" }}>Domain</th>
                <th style={{ textAlign: "left", padding: "11px 16px", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)", color: "var(--teal-deep)" }}>Score</th>
                <th style={{ textAlign: "left", padding: "11px 16px", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)", color: "var(--teal-deep)" }}>What the score means</th>
              </tr>
            </thead>
            <tbody>
              {RADAR_LABELS.map((axis, index) => (
                <tr key={axis}>
                  <th scope="row" style={{ textAlign: "left", verticalAlign: "top", padding: "13px 16px", borderBottom: "1px solid var(--line)", color: "var(--navy)" }}>{axis}</th>
                  <td style={{ verticalAlign: "top", padding: "13px 16px", borderBottom: "1px solid var(--line)", whiteSpace: "nowrap" }}><strong>{values[index]}/100</strong></td>
                  <td style={{ verticalAlign: "top", padding: "13px 16px", borderBottom: "1px solid var(--line)", color: "var(--soft)", lineHeight: 1.55 }}>
                    <strong style={{ color: "var(--navy)" }}>{DOMAIN_REPORT_GUIDANCE[axis]}</strong><br />
                    {scoreInterpretation(values[index])}
                    {axis === "Learning" && profile.iso3 === "FRA" && Number(values[index]) === 10 ? (
                      <><br /><strong style={{ color: "var(--teal-deep)" }}>France revision:</strong> 15 → 10 on 1 September 2026 following the adoption of LRN-5 and authoritative audit evidence on evaluation, enforcement and institutional follow-through.</>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {learningEvidence.length ? (
        <div className="evidence-list" aria-label={`Learning score rationale for ${profile.name}`} style={{ marginTop: "24px" }}>
          <article className="evidence-item">
            <div className="evidence-title"><span>LRN</span><div><h5>Why Learning is {values[5]}/100</h5><p>Documented evidence linked to the Learning domain</p></div></div>
            {learningEvidence.map(({ indicator, source }, index) => (
              <div className="evidence-claim" key={`${indicator.code || "LRN"}-${index}`}>
                <span>{indicator.code || "Learning indicator"} · evidence {indicator.evidence_level || "ungraded"}</span>
                <p>{indicator.summary || "Evidence summary not recorded."}</p>
                <small><strong>Source:</strong> {source.title || source.publisher || "Source not recorded"}{indicator.limitation ? <> · <strong>Limit:</strong> {indicator.limitation}</> : null}</small>
              </div>
            ))}
          </article>
        </div>
      ) : null}

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

export default function CountryExplorer() {
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
