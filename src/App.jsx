import React, { useEffect, useMemo, useState } from "react";
import logoImage from "./assets/iml-logo.png";
import worldCountries from "./world-countries.json";
import { loadGlobalMapProfiles } from "./services/countriesApi.js";
import CountryReport from "./components/CountryReport.jsx";
import "./App.css";

const MANUSCRIPT_URL = `${import.meta.env.BASE_URL}IML_Founding_Manuscript.pdf`;
const TECHNICAL_MANUSCRIPT_URL = `${import.meta.env.BASE_URL}IML_Technical_Manuscript.pdf`;

const ROUTES = [
  ["home", "Home"],
  ["id4d", "Identity & Trust"],
  ["evaluation", "From assessment to action"],
  ["methodology", "Methodology"],
  ["world", "World Map"],
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
          <div className="eyebrow">PostgreSQL test environment</div>
          <div className="overview-title">Evidence-linked country profiles</div>
        </div>
        <div className="helper-pill">Amber marks the country being viewed. It is not a score.</div>
      </div>
      <div className="world-map-wrap map-stage">
        <svg viewBox={`0 0 ${MAP_WIDTH} ${MAP_VISIBLE_HEIGHT}`} className="world-map" aria-label="Interactive IML world map">
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
                  fill={selected ? "#f59e0b" : scoreFill(score, Boolean(profile))}
                  stroke={selected ? "#92400e" : iso3 === "DEU" ? "#64748b" : "#9fb0c4"}
                  strokeWidth={selected ? 2.2 : iso3 === "DEU" ? 1.15 : 0.65}
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
        <span className="legend-selected"><span className="legend-selected-swatch" />Selected country · viewing only</span>
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

function CountryProfile({ selectedCountry, profile }) {
  if (!selectedCountry) return null;
  if (!profile) {
    return (
      <Card className="soft-card">
        <div className="content-block map-empty">
          <div className="section-badge">Profile not yet available</div>
          <h3>{selectedCountry.name}</h3>
          <p><strong>Selection only:</strong> the amber highlight means that the country is being viewed. It is not an assessment.</p>
          <p>A future editorial workflow can create a draft, attach institutional sources, link evidence to indicators, request local review and publish a versioned profile.</p>
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
          <p className="hero-text">IML helps researchers, clinicians, institutions, engineers, payers and public decision-makers assess how health information is generated, trusted, exchanged and used.</p>
          <Card className="note-box"><p>IML is designed as an orientation engine rather than a certification system. Its purpose is to illuminate fragmented health information environments, identify possible pathways into a health problem, reveal barriers and blind spots, and indicate where further investigation may be most useful. The engine continuously updates indicative information as new signals, sources and connections become available. Human validation is not required for every correction or recalculation. It becomes necessary only when an indicative result is promoted as formally validated evidence, used to support a decision, or incorporated into an authoritative country assessment.IML is therefore a lamp rather than a verdict: it helps make visible the information pathways surrounding disease.</p></Card>
          <div className="button-row">
            <a className="primary-button" href={MANUSCRIPT_URL} download>Download the Founding Manuscript</a>
            <a className="secondary-button" href="#methodology">Explore the methodology</a>
          </div>
          <div className="metric-grid two-up top-gap-small">
            <MetricCard symbol="5L" title="Interoperability" value="5 layers" subtitle="Technical, semantic, organisational, institutional, and clinical/public health." />
            <MetricCard symbol="6D" title="Assessment" value="6 domains" subtitle="A health-oriented maturity profile linked to documentary evidence." />
          </div>
        </div>
        <Card className="overview-card"><div className="overview-top"><LogoMark /><div><div className="eyebrow">Interoperability Maturity Lab</div><div className="overview-title">From information to better health</div></div></div>
          <div className="tile-grid three-up">{[
            ["Health Information Ecosystems", "The ecosystem, not an isolated application, is the principal unit of analysis."],
            ["AMR / BMR demonstrator", "UTI and multidrug-resistant E. coli provide the first operational thread."],
            ["Human validation", "Automated research support organises evidence; scientific interpretation remains human."],
          ].map(([title, text]) => <div key={title} className="mini-tile"><div className="mini-tile-title">{title}</div><div className="mini-tile-text">{text}</div></div>)}</div>
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
function Id4dPage() { return (<section className="section"><div className="container"><SectionTitle badge="Identity infrastructure" title="Identity, consent and trust across fragmented systems" text="Identity is an enabling layer for continuity and accountability, not the whole of interoperability." /><Card className="soft-card"><div className="content-block"><h3>From trusted identity to authorised health and research linkage</h3><p>IML does not propose replacing national identity systems. It explores how recognised national identifiers could contribute to a future universal health and research number for authorised multicentre, longitudinal and epidemiological studies. It complements the <a className="text-link" href="https://id4d.worldbank.org/" target="_blank" rel="noopener noreferrer">World Bank ID4D initiative ↗</a> and may build on trust infrastructures such as the <a className="text-link" href="https://www.who.int/initiatives/global-digital-health-certification-network" target="_blank" rel="noopener noreferrer">WHO Global Digital Health Certification Network ↗</a>.</p><p>National models already differ. A future IML model could combine the national identifier namespace, a governed geographic reference and a protected keyed hash. The resulting number would remain regulated personal data and would require legal, ethical, security and equity review before implementation.</p><p>Identity, identifier, access token and carrier mechanism must remain distinct. A QR code or mobile application should carry only a temporary signed token or a verifiable digital certificate, never sensitive identity or health information in clear text.</p><p>Country-level digital health information can be explored through the <a className="text-link" href="https://monitor.digitalhealthmonitor.org/map" target="_blank" rel="noopener noreferrer">Global Digital Health Monitor map ↗</a>. IML uses this comparative information as a starting point for structured country research, documentary verification and human validation.</p></div></Card></div></section>); }
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
  return <section className="section"><div className="container"><SectionTitle badge="Global Map · PostgreSQL test" title="Maturity profiles, not country rankings" text="Country records use ISO alpha-3 codes and connect six domain scores to documented sources, evidence links, limitations and review status." />{warning ? <Card className="highlight-card"><div className="content-block"><h3>Country profiles temporarily unavailable</h3><p>{warning}</p></div></Card> : null}<div className="top-gap-small"><WorldMap profiles={profiles} selectedCountry={selectedCountry} onSelect={setSelectedCountry} /></div><div className="top-gap"><CountryProfile selectedCountry={selectedCountry} profile={selectedProfile} /></div></div></section>;
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
  return <footer className="footer"><div className="container footer-grid"><div><div className="footer-brand"><LogoMark /><div><div className="eyebrow">IML</div><div className="footer-title">Interoperability Maturity Lab</div></div></div><p className="footer-copy">Health is the objective. Trustworthy information is the foundation. Interoperability is the path.</p></div><div><div className="footer-label">Scientific status</div><p className="footer-copy">Independent, non-commercial and open for scientific review. The PostgreSQL map is a test environment for evidence-linked, versioned country profiles.</p></div></div></footer>;
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
  return <div className="app-shell"><header className="topbar"><div className="container topbar-inner"><button type="button" className="brand-button" onClick={() => goTo("home")}><LogoMark /><div><div className="eyebrow">IML</div><div className="brand-title">Interoperability Maturity Lab</div></div></button><nav className="topnav desktop-nav">{ROUTES.map((item) => <NavButton key={item.key} active={route === item.key} onClick={() => goTo(item.key)}>{item.label}</NavButton>)}</nav></div><div className="container mobile-nav">{ROUTES.map((item) => <NavButton key={item.key} active={route === item.key} onClick={() => goTo(item.key)}>{item.label}</NavButton>)}</div></header><main>{route === "home" ? <HomePage /> : null}{route === "id4d" ? <Id4dPage /> : null}{route === "evaluation" ? <EvaluationPage /> : null}{route === "methodology" ? <MethodologyPage /> : null}{route === "world" ? <WorldPage /> : null}{route === "contact" ? <ContactPage /> : null}</main><Footer /></div>;
}
