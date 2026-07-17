import React, { useMemo, useState } from "react";
import worldCountries from "../world-countries.json";

const AXIS_KEYS = [
  "governance",
  "technical",
  "identity",
  "adoption",
  "security",
  "learning",
];

const MAP_WIDTH = 1000;
const MAP_HEIGHT = 500;
const MAP_VISIBLE_HEIGHT = 420;

function cls(...items) {
  return items.filter(Boolean).join(" ");
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

export default function WorldMap({ profiles, selectedCountry, onSelect, metric }) {
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

