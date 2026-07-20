import React from "react";

const AXES = [
  "Governance",
  "Technical",
  "Identity",
  "Adoption",
  "Security",
  "Learning",
];

function averageScore(values = []) {
  if (!values.length) return 0;
  return Math.round(
    values.reduce((total, value) => total + Number(value || 0), 0) /
      values.length
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
        if (indicator.limitation)
          lines.push(`  Limitation: ${indicator.limitation}`);
      });
    } else {
      lines.push("Linked evidence: no source-indicator link is currently attached to this domain.");
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
        `${sourceIndex + 1}. ${source.title || "Untitled source"}${source.publisher ? ` — ${source.publisher}` : ""}`
      );
      if (source.note) lines.push(`   Note: ${source.note}`);
      if (source.url) lines.push(`   URL: ${source.url}`);
      if (Array.isArray(source.indicators)) {
        source.indicators.forEach((indicator) => {
          lines.push(
            `   Indicator ${indicator.code || "not specified"}${indicator.evidence_level ? `, evidence ${indicator.evidence_level}` : ""}${indicator.support_type ? `, ${indicator.support_type}` : ""}`
          );
          if (indicator.summary) lines.push(`   Support: ${indicator.summary}`);
          if (indicator.limitation) lines.push(`   Limitation: ${indicator.limitation}`);
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
    window.alert("The report could not be copied automatically. Please use Print or save as PDF.");
  }
}

export default function CountryReport({ profile }) {
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
            <div className="eyebrow">IML explanation report · {profile.iso3}</div>
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
            <span>{profile.evidenceLevel || "Exploratory working profile"}</span>
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
                    <span className="report-domain-score">{score}/100</span>
                  </div>

                  <p>
                    {DOMAIN_REPORT_GUIDANCE[axis]} {scoreInterpretation(score)}
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
                              <strong>{indicator.code || "Indicator"}:</strong>{" "}
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
                        {indicator.summary ? <p>{indicator.summary}</p> : null}
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
