export const asArray = (value) => (Array.isArray(value) ? value : []);

export const firstDefined = (...values) =>
  values.find(
    (value) =>
      value !== undefined &&
      value !== null &&
      value !== ""
  );

export function normalizeIso3(value) {
  return String(value || "").trim().toUpperCase();
}

export function averageScore(values = []) {
  return values.length
    ? Math.round(
        values.reduce(
          (total, value) => total + Number(value || 0),
          0
        ) / values.length
      )
    : 0;
}

export function metricScore(profile, metric = "overall", axisKeys = []) {
  if (!profile) return null;
  if (metric === "overall") return averageScore(asArray(profile.values));

  const index = axisKeys.indexOf(metric);
  return index >= 0 ? Number(profile.values?.[index] || 0) : null;
}

export const classNames = (...items) =>
  items.filter(Boolean).join(" ");
