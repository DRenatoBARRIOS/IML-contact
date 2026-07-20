import React, { useMemo, useState } from "react";
import worldCountries from "../world-countries.json";
import {
  classNames,
  metricScore,
  normalizeIso3,
} from "../utils/countryMapUtils.js";

const MAP_WIDTH = 1000;
const MAP_HEIGHT = 500;
const MAP_VISIBLE_HEIGHT = 420;

function projectCoordinate([longitude, latitude]) {
  return [
    ((longitude + 180) / 360) * MAP_WIDTH,
    ((90 - latitude) / 180) * MAP_HEIGHT,
  ];
}

function ringToPath(coordinates = []) {
  let path = "";
  let previousX = null;

  coordinates.forEach((coordinate, index) => {
    const [x, y] = projectCoordinate(coordinate);
    const crossesDateLine =
      previousX !== null &&
      Math.abs(x - previousX) > MAP_WIDTH / 2;

    path +=
      index === 0 || crossesDateLine
        ? ` M ${x.toFixed(2)} ${y.toFixed(2)}`
        : ` L ${x.toFixed(2)} ${y.toFixed(2)}`;

    previousX = x;
  });

  return path ? `${path} Z` : "";
}

function geometryToPath(geometry) {
  if (geometry?.type === "Polygon") {
    return geometry.coordinates.map(ringToPath).join(" ");
  }

  if (geometry?.type === "MultiPolygon") {
    return geometry.coordinates
      .flatMap((polygon) => polygon.map(ringToPath))
      .join(" ");
  }

  return "";
}

function featureIso3(feature) {
  const properties = feature?.properties || {};

  return normalizeIso3(
    properties.iso3 ||
      properties.ISO_A3 ||
      properties.adm0_a3 ||
      properties.ADM0_A3 ||
      ""
  );
}

function featureName(feature) {
  const properties = feature?.properties || {};

  return String(
    properties.name ||
      properties.NAME ||
      properties.admin ||
      properties.ADMIN ||
      "Unknown country"
  ).trim();
}

function isAntarcticaFeature(feature) {
  const properties = feature?.properties || {};
  const name = featureName(feature).toLowerCase();
  const continent = String(
    properties.continent ||
      properties.CONTINENT ||
      ""
  ).toLowerCase();

  return (
    featureIso3(feature) === "ATA" ||
    name.includes("antarctica") ||
    continent === "antarctica"
  );
}

function scoreFill(score, hasProfile) {
  if (!hasProfile || score === null) return "#e6edf5";
  if (score >= 85) return "#164e63";
  if (score >= 70) return "#0e7490";
  if (score >= 55) return "#67a8bb";
  if (score >= 40) return "#a8ced8";
  return "#d8e8ed";
}

export default function WorldMap({
  profiles,
  selectedCountry,
  onSelect,
}) {
  const [hovered, setHovered] = useState(null);

  const profileByIso3 = useMemo(
    () =>
      Object.fromEntries(
        profiles
          .map((profile) => [
            normalizeIso3(profile?.iso3),
            profile,
          ])
          .filter(([iso3]) => Boolean(iso3))
      ),
    [profiles]
  );

  // Germany is drawn last only to keep its border visible.
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

    onSelect({
      iso3,
      name: profileByIso3[iso3]?.name || featureName(feature),
    });
  };

  return (
    <div className="world-box">
      <div className="world-box-head">
        <div>
          <div className="eyebrow">PostgreSQL test environment</div>
          <div className="overview-title">
            Evidence-linked country profiles
          </div>
        </div>
        <div className="helper-pill">
          Amber marks the country being viewed. It is not a score.
        </div>
      </div>

      <div className="world-map-wrap map-stage">
        <svg
          viewBox={`0 0 ${MAP_WIDTH} ${MAP_VISIBLE_HEIGHT}`}
          className="world-map"
          aria-label="Interactive IML world map"
        >
          <rect
            width={MAP_WIDTH}
            height={MAP_VISIBLE_HEIGHT}
            rx="26"
            fill="#f8fbff"
          />

          <g>
            {mapFeatures.map((feature) => {
              const iso3 = featureIso3(feature);
              const profile = profileByIso3[iso3];
              const selected =
                normalizeIso3(selectedCountry?.iso3) === iso3;
              const score = metricScore(profile);

              return (
                <path
                  key={`${iso3}-${featureName(feature)}`}
                  d={geometryToPath(feature.geometry)}
                  className={classNames(
                    "country-shape",
                    profile && "country-shape-profile",
                    selected && "country-shape-selected"
                  )}
                  fill={
                    selected
                      ? "#f59e0b"
                      : scoreFill(score, Boolean(profile))
                  }
                  stroke={
                    selected
                      ? "#92400e"
                      : iso3 === "DEU"
                        ? "#64748b"
                        : "#9fb0c4"
                  }
                  strokeWidth={
                    selected
                      ? 2.2
                      : iso3 === "DEU"
                        ? 1.15
                        : 0.65
                  }
                  vectorEffect="non-scaling-stroke"
                  data-country-iso3={iso3}
                  tabIndex={
                    iso3 && iso3 !== "-99" ? 0 : undefined
                  }
                  role={
                    iso3 && iso3 !== "-99"
                      ? "button"
                      : undefined
                  }
                  aria-label={`${profile?.name || featureName(feature)}${
                    profile
                      ? ", IML profile available"
                      : ", profile not yet available"
                  }`}
                  onMouseEnter={(event) =>
                    showTooltip(event, feature)
                  }
                  onMouseMove={(event) =>
                    showTooltip(event, feature)
                  }
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => selectFeature(feature)}
                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter" ||
                      event.key === " "
                    ) {
                      selectFeature(feature);
                    }
                  }}
                >
                  <title>
                    {profile?.name || featureName(feature)}
                  </title>
                </path>
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
            <span>
              {hovered.hasProfile
                ? `${hovered.score}/100 · documented working profile`
                : "Profile not yet available"}
            </span>
          </div>
        ) : null}
      </div>

      <div className="map-legend" aria-label="Map legend">
        <span>No profile</span>
        <div className="legend-swatches">
          {[
            "#e6edf5",
            "#d8e8ed",
            "#a8ced8",
            "#67a8bb",
            "#0e7490",
            "#164e63",
          ].map((color) => (
            <span key={color} style={{ background: color }} />
          ))}
        </div>
        <span>Higher maturity signal</span>
        <span className="legend-selected">
          <span className="legend-selected-swatch" />
          Selected country · viewing only
        </span>
      </div>
    </div>
  );
}
