import { useEffect, useMemo, useState } from "react";
import worldCountries from "../data/world-countries.json";
import { loadCountryProfiles } from "../services/profileService.js";

const MAP_WIDTH = 1000;
const MAP_HEIGHT = 500;
const MAP_VISIBLE_HEIGHT = 430;
const RADAR_LABELS = ["Governance", "Technical", "Identity", "Adoption", "Security", "Learning"];

const normalizeIso3 = (value) => String(value || "").trim().toUpperCase();
const asArray = (value) => (Array.isArray(value) ? value : []);

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

function evidenceFamily(source, index) {
  const publisher = String(source?.publisher || "").toLowerCase();
  const url = String(source?.url || "").toLowerCase();

  if (publisher.includes("cour des comptes")) {
    return { key: "cour-des-comptes", title: "Cour des comptes · national audit", publisher: "Cour des comptes" };
  }
  if (url.includes("cert.ssi.gouv.fr") || publisher.includes("cert-fr")) {
    return { key: "anssi-cert-fr", title: "ANSSI / CERT-FR · health-sector threat assessment", publisher: "ANSSI / CERT-FR" };
  }
  if (url.includes("cyberveille.esante.gouv.fr") || publisher.includes("cert santé")) {
    return { key: "cert-sante", title: "CERT Santé · incident reports and returns of experience", publisher: "CERT Santé / Agence du Numérique en Santé" };
  }
  if (publisher.includes("cybermalveillance")) {
    return { key: "cybermalveillance", title: "Cybermalveillance.gouv.fr · official incident notice", publisher: "Cybermalveillance.gouv.fr" };
  }

  return {
    key: `source-${source?.url || source?.title || index}`,
    title: source?.title || `Source ${index + 1}`,
    publisher: source?.publisher || "Publisher not recorded",
  };
}

function groupEvidenceSources(sources) {
  const groups = new Map();

  asArray(sources).forEach((source, index) => {
    const family = evidenceFamily(source, index);
    if (!groups.has(family.key)) {
      groups.set(family.key, { ...family, publications: [], indicators: [] });
    }

    const group = groups.get(family.key);
    const publicationKey = source?.url || `${source?.title || "source"}-${source?.publication_date || index}`;
    let publication = group.publications.find((item) => item.key === publicationKey);
    if (!publication) {
      publication = {
        key: publicationKey,
        title: source?.title || `Source ${index + 1}`,
        url: source?.url || "",
        publicationDate: source?.publication_date || "",
        summaries: [],
      };
      group.publications.push(publication);
    }

    if (source?.note && !publication.summaries.includes(source.note)) publication.summaries.push(source.note);
    group.indicators.push(...asArray(source?.indicators));
  });

  return Array.from(groups.values());
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
  const sourceGroups = groupEvidenceSources(sources);
  const assessment = profile.assessment || {};
  const evidenceCount = sources.flatMap((source) => asArray(source.indicators)).length;
  const watchItems = asArray(profile.watch).map((item) => {
    if (normalizeIso3(profile.iso3) === "FRA" && String(item).startsWith("Security score adjusted downward by 20 points")) {
      return "Security score adjusted downward by 20 points after cross-checking formal cybersecurity assurances against repeated officially documented hospital incidents affecting continuity of care, confidentiality, system availability and recovery. Transparency in incident reporting is not penalised and remains a positive governance and learning signal.";
    }
    return item;
  });

  return (
    <article className="profile-panel" aria-live="polite">
      <div className="profile-heading">
        <div><p className="profile-overline">{profile.iso3} · profile v{profile.version || "working"}</p><h3>{profile.name}</h3></div>
        <div className="orientation-score" aria-label={`Indicative orientation signal ${score} out of 100`}><strong>{score}</strong><span>/100</span><small>orientation signal</small></div>
      </div>
      <p className="profile-subtitle">{profile.subtitle || "Exploratory, evidence-oriented country profile."}</p>
      <div className="not-ranking"><strong>Not a ranking.</strong> Scores help structure inquiry across six domains; they are provisional, evidence-dependent and not valid for league tables.</div>

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
          <div><dt>Source groups</dt><dd>{sourceGroups.length}</dd></div>
          <div><dt>Publications</dt><dd>{sources.length}</dd></div>
          <div><dt>Updated</dt><dd>{formatDate(profile.updatedAt || profile.published_at)}</dd></div>
        </dl>
      </div>

      <div className="profile-lists">
        <div><h4>Documented strengths</h4><ul>{asArray(profile.strengths).length ? profile.strengths.map((item, index) => <li key={index}>{item}</li>) : <li>No reviewed strength recorded.</li>}</ul></div>
        <div><h4>Points to examine</h4><ul>{watchItems.length ? watchItems.map((item, index) => <li key={index}>{item}</li>) : <li>No reviewed watch point recorded.</li>}</ul></div>
      </div>

      <details className="evidence-register">
        <summary><span><strong>Evidence register</strong><small>{sourceGroups.length} documentary group{sourceGroups.length === 1 ? "" : "s"} · {sources.length} publication{sources.length === 1 ? "" : "s"} · {evidenceCount} linked indicator{evidenceCount === 1 ? "" : "s"}</small></span><span>+</span></summary>
        <div className="evidence-list">
          {sourceGroups.length ? sourceGroups.map((group, index) => (
            <article className="evidence-item" key={group.key}>
              <div className="evidence-title">
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div><h5>{group.title}</h5><p>{group.publisher}</p></div>
                <span className="restricted-link">{group.publications.length} publication{group.publications.length === 1 ? "" : "s"}</span>
              </div>
              <ul>
                {group.publications.map((publication) => (
                  <li key={publication.key}>
                    <strong>{publication.title}</strong>{publication.publicationDate ? ` · ${formatDate(publication.publicationDate)}` : ""}
                    {publication.summaries.map((summary, summaryIndex) => <p key={summaryIndex}>{summary}</p>)}
                    {publication.url ? <a href={publication.url} target="_blank" rel="noreferrer">Open official source ↗</a> : <span className="restricted-link">No public link</span>}
                  </li>
                ))}
              </ul>
              {group.indicators.length ? (
                <div className="evidence-claim">
                  <span>{group.indicators[0]?.code || "IML indicator"} · grouped official evidence</span>
                  <p>{group.publications.length > 1 ? `${group.publications.length} official publications are consolidated here to avoid repeating the same institutional evidence family while preserving each incident summary and source link.` : group.indicators[0]?.summary || "Evidence summary not recorded."}</p>
                  {group.publications.length === 1 && group.indicators[0]?.limitation ? <small><strong>Limit:</strong> {group.indicators[0].limitation}</small> : null}
                </div>
              ) : null}
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
  const [status, setStatus] = useState({ loading: true, warning: "", apiVersion: "" });

  useEffect(() => {
    const controller = new AbortController();
    loadCountryProfiles(controller.signal)
      .then((result) => {
        setProfiles(result.profiles);
        setStatus({ loading: false, warning: result.warning || "", apiVersion: result.apiVersion || "current" });
        if (!result.profiles.some((profile) => normalizeIso3(profile.iso3) === "FRA") && result.profiles[0]) setSelectedIso3(normalizeIso3(result.profiles[0].iso3));
      })
      .catch((error) => {
        if (error?.name !== "AbortError") setStatus({ loading: false, warning: error?.message || "Profile service unavailable.", apiVersion: "" });
      });
    return () => controller.abort();
  }, []);

  const profilesByIso3 = useMemo(() => new Map(profiles.map((profile) => [normalizeIso3(profile.iso3), profile])), [profiles]);
  const features = useMemo(() => worldCountries.features.filter((feature) => !isAntarctica(feature) && featureIso3(feature) && featureIso3(feature) !== "-99").slice().sort((left, right) => {
    const leftIso = featureIso3(left); const rightIso = featureIso3(right);
    if (leftIso === "DEU" && rightIso !== "DEU") return 1;
    if (rightIso === "DEU" && leftIso !== "DEU") return -1;
    return 0;
  }), []);
  const countryOptions = useMemo(() => Array.from(new Map(features.map((feature) => [featureIso3(feature), { iso3: featureIso3(feature), name: profilesByIso3.get(featureIso3(feature))?.name || featureName(feature) }])).values()).sort((a, b) => a.name.localeCompare(b.name)), [features, profilesByIso3]);
  const selectedFeature = features.find((feature) => featureIso3(feature) === selectedIso3);
  const selectedCountry = selectedFeature ? { iso3: selectedIso3, name: profilesByIso3.get(selectedIso3)?.name || featureName(selectedFeature) } : null;
  const selectedProfile = profilesByIso3.get(selectedIso3) || null;

  if (status.loading) return <div className="explorer-loading" role="status"><span />Loading the live evidence register…</div>;

  return (
    <div className="country-explorer">
      <div className="explorer-toolbar">
        <div><span className={`live-indicator${status.warning ? " is-warning" : ""}`}><i />{status.warning ? "Profile service unavailable" : "Live PostgreSQL dataset"}</span><p>{profiles.length} documented profiles{status.apiVersion ? ` · API ${status.apiVersion}` : ""}</p></div>
        <label><span>Choose any country</span><select value={selectedIso3} onChange={(event) => setSelectedIso3(event.target.value)}>{countryOptions.map((country) => <option value={country.iso3} key={country.iso3}>{country.name} — {profilesByIso3.has(country.iso3) ? "examined" : "not examined"}</option>)}</select></label>
      </div>

      {status.warning ? <div className="explorer-warning" role="status"><strong>Country profiles could not be loaded.</strong><span>{status.warning}</span> The map remains usable and clearly shows that no current documentary profile is available.</div> : null}

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
          <p className="map-caption">Colour distinguishes documentary coverage and groups examined profiles by their provisional orientation signal. It is not a ranking. A neutral country is “not yet examined”, never “low maturity”.</p>
        </div>
        <ProfilePanel country={selectedCountry} profile={selectedProfile} />
      </div>
    </div>
  );
}