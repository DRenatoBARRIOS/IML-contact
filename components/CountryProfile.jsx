import React from "react";
import CountryReport from "./CountryReport.jsx";
import {
  asArray,
  averageScore,
  classNames,
  firstDefined,
} from "../utils/countryMapUtils.js";

function Card({ children, className = "" }) {
  return (
    <div className={classNames("card", className)}>
      {children}
    </div>
  );
}

function polar(angle, radius, center) {
  const radians = (angle - 90) * (Math.PI / 180);

  return {
    x: center + radius * Math.cos(radians),
    y: center + radius * Math.sin(radians),
  };
}

function HexagonChart({ values, domains }) {
  const size = 360;
  const center = size / 2;
  const radius = 118;

  const safeValues = domains.map((_, index) =>
    Math.max(
      0,
      Math.min(100, Number(values?.[index]) || 0)
    )
  );

  const polygon = (scale) =>
    domains
      .map((_, index) => {
        const point = polar(
          (360 / domains.length) * index,
          radius * scale,
          center
        );

        return `${point.x},${point.y}`;
      })
      .join(" ");

  const data = safeValues
    .map((value, index) => {
      const point = polar(
        (360 / domains.length) * index,
        radius * (value / 100),
        center
      );

      return `${point.x},${point.y}`;
    })
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className="hex-chart"
      aria-label="IML six-domain profile"
    >
      {Array.from({ length: 5 }).map((_, index) => (
        <polygon
          key={index}
          points={polygon((index + 1) / 5)}
          fill="none"
          stroke="#d8dee7"
          strokeWidth="1"
        />
      ))}

      {domains.map((domain, index) => {
        const end = polar(
          (360 / domains.length) * index,
          radius,
          center
        );
        const label = polar(
          (360 / domains.length) * index,
          radius + 30,
          center
        );

        return (
          <g key={domain.key}>
            <line
              x1={center}
              y1={center}
              x2={end.x}
              y2={end.y}
              stroke="#d8dee7"
              strokeWidth="1"
            />
            <text
              x={label.x}
              y={label.y}
              textAnchor="middle"
              style={{
                fontSize: 11,
                fontWeight: 600,
                fill: "#64748b",
              }}
            >
              {domain.axis}
            </text>
          </g>
        );
      })}

      <polygon
        points={data}
        fill="rgba(15,23,42,0.14)"
        stroke="#0f172a"
        strokeWidth="2"
      />

      {safeValues.map((value, index) => {
        const point = polar(
          (360 / domains.length) * index,
          radius * (value / 100),
          center
        );

        return (
          <circle
            key={domains[index].key}
            cx={point.x}
            cy={point.y}
            r="4"
            fill="#0f172a"
          />
        );
      })}
    </svg>
  );
}

function normaliseEvidenceLevel(level) {
  const match = String(level || "")
    .toUpperCase()
    .match(/[A-D]/);

  return match ? match[0] : null;
}

function collectIndicators(profile) {
  return asArray(profile?.sources).flatMap((source) =>
    asArray(source.indicators).map((indicator) => ({
      ...indicator,
      source,
    }))
  );
}

function evidenceAudit(profile) {
  const sources = asArray(profile?.sources);
  const indicators = collectIndicators(profile);

  const domainCodes = new Set(
    indicators
      .map((indicator) =>
        String(
          firstDefined(
            indicator.domain_code,
            indicator.domain,
            indicator.code,
            ""
          )
        )
          .split(/[.-]/)[0]
          .toUpperCase()
      )
      .filter(Boolean)
  );

  const levels = { A: 0, B: 0, C: 0, D: 0 };

  indicators.forEach((indicator) => {
    const level = normaliseEvidenceLevel(
      indicator.evidence_level
    );

    if (level) levels[level] += 1;
  });

  return {
    sourceCount: Number(
      firstDefined(
        profile?.source_count,
        profile?.sources_count,
        sources.length
      )
    ),
    evidenceLinkCount: Number(
      firstDefined(
        profile?.evidence_link_count,
        profile?.evidence_links_count,
        indicators.length
      )
    ),
    coveredDomainCount: Number(
      firstDefined(
        profile?.covered_domain_count,
        profile?.covered_domains_count,
        domainCodes.size
      )
    ),
    levels,
  };
}

function humanLabel(value, fallback = "Not recorded") {
  if (!value) return fallback;

  return String(value)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value) {
  if (!value) return null;

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? String(value)
    : new Intl.DateTimeFormat("en-GB", {
        dateStyle: "medium",
      }).format(date);
}

function DatabaseProfileSummary({ profile }) {
  const audit = evidenceAudit(profile);
  const assessment = profile?.assessment || {};

  const status = firstDefined(
    assessment.status,
    assessment.assessment_status,
    profile?.assessment_status,
    profile?.status
  );

  const method = firstDefined(
    assessment.method,
    assessment.assessment_method,
    profile?.assessment_method
  );

  const confidence = firstDefined(
    assessment.confidence,
    assessment.confidence_level,
    profile?.confidence_level
  );

  const verifiedAt = formatDate(
    firstDefined(
      assessment.last_verified_at,
      profile?.last_verified_at,
      profile?.updated_at
    )
  );

  return (
    <Card className="soft-card">
      <div className="content-block">
        <h3>Database and evidence record</h3>
        <p className="muted-copy">
          The PostgreSQL test model separates country scores
          from the documentary confidence supporting them.
        </p>

        <div className="database-stat-grid">
          <div className="database-stat">
            <span>Sources</span>
            <strong>{audit.sourceCount}</strong>
          </div>
          <div className="database-stat">
            <span>Evidence links</span>
            <strong>{audit.evidenceLinkCount}</strong>
          </div>
          <div className="database-stat">
            <span>Domains covered</span>
            <strong>{audit.coveredDomainCount}/6</strong>
          </div>
        </div>

        <div
          className="evidence-level-row"
          aria-label="Evidence links by level"
        >
          {Object.entries(audit.levels).map(
            ([level, count]) => (
              <span key={level}>
                Level {level}: <strong>{count}</strong>
              </span>
            )
          )}
        </div>

        <ul className="compact-list top-gap-small">
          <li>
            <strong>Assessment status:</strong>{" "}
            {humanLabel(status)}
          </li>
          <li>
            <strong>Documentary confidence:</strong>{" "}
            {humanLabel(confidence)}
          </li>
          <li>
            <strong>Method:</strong>{" "}
            {humanLabel(
              method,
              "Documentary audit with human validation"
            )}
          </li>
          {verifiedAt ? (
            <li>
              <strong>Last verification:</strong>{" "}
              {verifiedAt}
            </li>
          ) : null}
        </ul>
      </div>
    </Card>
  );
}

function SourceRecord({ source, index }) {
  const indicators = asArray(source.indicators);

  const status = firstDefined(
    source.link_status,
    source.url_status,
    source.access_status,
    source.status
  );

  const verifiedAt = formatDate(
    firstDefined(
      source.last_verified_at,
      source.checked_at,
      source.updated_at
    )
  );

  const publisher = firstDefined(
    source.publisher,
    source.institution,
    source.organisation
  );

  return (
    <details
      className="list-box"
      key={`${source.url || source.title || "source"}-${index}`}
    >
      <summary
        style={{ cursor: "pointer", fontWeight: 800 }}
      >
        {source.title || `Source ${index + 1}`}
        {publisher ? ` — ${publisher}` : ""}
      </summary>

      <div className="top-gap-small">
        <div className="source-audit-line">
          {status ? <span>{humanLabel(status)}</span> : null}
          {verifiedAt ? (
            <span>Checked {verifiedAt}</span>
          ) : null}
          {source.source_type ? (
            <span>{humanLabel(source.source_type)}</span>
          ) : null}
        </div>

        {source.note ? <p>{source.note}</p> : null}
        {source.scope ? (
          <p>
            <strong>Scope:</strong> {source.scope}
          </p>
        ) : null}

        {indicators.length ? (
          <div className="stack-list">
            {indicators.map(
              (indicator, indicatorIndex) => (
                <div
                  className="mini-tile"
                  key={`${
                    indicator.code || "indicator"
                  }-${indicatorIndex}`}
                >
                  <div className="mini-tile-title">
                    {indicator.code || "IML indicator"}
                    {indicator.evidence_level
                      ? ` · Evidence ${indicator.evidence_level}`
                      : ""}
                    {indicator.support_type
                      ? ` · ${indicator.support_type}`
                      : ""}
                  </div>

                  {indicator.summary ? (
                    <div className="mini-tile-text">
                      {indicator.summary}
                    </div>
                  ) : null}

                  {indicator.limitation ? (
                    <div className="mini-tile-text top-gap-small">
                      <strong>Limitation:</strong>{" "}
                      {indicator.limitation}
                    </div>
                  ) : null}
                </div>
              )
            )}
          </div>
        ) : null}

        {source.url ? (
          <div className="button-row">
            <a
              className="text-link"
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              Open precise institutional source ↗
            </a>
          </div>
        ) : null}
      </div>
    </details>
  );
}

export default function CountryProfile({
  selectedCountry,
  profile,
  domains,
}) {
  if (!selectedCountry) return null;

  if (!profile) {
    return (
      <Card className="soft-card">
        <div className="content-block map-empty">
          <div className="section-badge">
            Profile not yet available
          </div>
          <h3>{selectedCountry.name}</h3>
          <p>
            <strong>Selection only:</strong> the amber
            highlight means that the country is being viewed.
            It is not an assessment.
          </p>
          <p>
            A future editorial workflow can create a draft,
            attach institutional sources, link evidence to
            indicators, request local review and publish a
            versioned profile.
          </p>
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
                  <div
                    className="score-pill"
                    title="Overall maturity signal, not a country ranking"
                  >
                    {averageScore(
                      asArray(profile.values)
                    )}
                    /100
                  </div>
                </div>
              </div>
            </div>

            <p className="muted-copy">
              {profile.subtitle}
            </p>

            <HexagonChart
              values={profile.values}
              domains={domains}
            />

            <div className="profile-stat-grid">
              {domains.map((domain, index) => (
                <div
                  className="profile-stat"
                  key={domain.key}
                >
                  <span>{domain.axis}</span>
                  <strong>
                    {profile.values?.[index] ?? 0}
                  </strong>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <div className="stack-layout">
          <DatabaseProfileSummary profile={profile} />

          <Card>
            <div className="content-block">
              <h3>Strengths</h3>
              <ul className="plain-list">
                {asArray(profile.strengths).map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
          </Card>

          <Card>
            <div className="content-block">
              <h3>Points to watch</h3>
              <ul className="plain-list">
                {asArray(profile.watch).map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
          </Card>

          <Card className="soft-card">
            <div className="content-block">
              <h3>Evidence</h3>
              <p className="muted-copy">
                Each source should point to the precise
                institutional page supporting a defined
                indicator. Homepage links are used only when
                no more specific official page exists.
              </p>

              {asArray(profile.sources).length ? (
                <div className="stack-layout">
                  {profile.sources.map((source, index) => (
                    <SourceRecord
                      source={source}
                      index={index}
                      key={`${
                        source.url || source.title
                      }-${index}`}
                    />
                  ))}
                </div>
              ) : (
                <p>
                  No documentary sources are attached to this
                  profile yet.
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>

      <CountryReport profile={profile} />
    </>
  );
}
