const AXIS_KEYS = [
  "governance",
  "technical",
  "identity",
  "adoption",
  "security",
  "learning",
];

const API_BASE_URL = import.meta.env?.DEV
  ? (import.meta.env?.VITE_API_BASE_URL || "")
  : "";

function normalizeProfile(profile) {
  const scores = profile.scores || profile.domainScores || {};
  const values = Array.isArray(profile.values)
    ? profile.values
    : AXIS_KEYS.map((key) => Number(scores[key] ?? 0));

  return {
    iso3: String(profile.iso3 || profile.country_iso3 || "").toUpperCase(),
    name: profile.name || profile.country_name || profile.countryName || "Unnamed jurisdiction",
    slug: profile.slug || "",
    status: profile.status || profile.assessment_status || "published",
    version: profile.version || "",
    updatedAt: profile.updatedAt || profile.updated_at || profile.assessment_date || profile.assessed_at || profile.published_at || "",
    evidenceLevel: profile.evidenceLevel || profile.evidence_level || profile.assessment?.confidence_level || "Exploratory working profile",
    subtitle: profile.subtitle || profile.summary || "",
    values,
    strengths: profile.strengths || [],
    watch: profile.watch || profile.pointsToWatch || [],
    sources: profile.sources || [],
  };
}

function enrich(profile) {
  return { ...profile, ...normalizeProfile(profile) };
}

export async function loadCountryProfiles(signal) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/countries`, {
      headers: { Accept: "application/json" },
      signal,
    });

    if (!response.ok) throw new Error(`Countries API returned ${response.status}.`);

    const payload = await response.json();
    const rows = Array.isArray(payload) ? payload : payload.countries;
    const jurisdictionRows = Array.isArray(payload?.jurisdictions) ? payload.jurisdictions : [];

    if (!Array.isArray(rows) || rows.length === 0) {
      throw new Error("The countries API contains no published country profiles yet.");
    }

    return {
      profiles: rows.map(enrich),
      jurisdictions: jurisdictionRows.map(enrich),
      source: "database",
      apiVersion: payload.api_version || "current",
      generatedAt: payload.generated_at || null,
    };
  } catch (error) {
    if (error?.name === "AbortError") throw error;
    return {
      profiles: [],
      jurisdictions: [],
      source: "unavailable",
      warning: error?.message || "Country profile service unavailable.",
    };
  }
}
