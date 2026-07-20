const AXIS_KEYS = [
  "governance",
  "technical",
  "identity",
  "adoption",
  "security",
  "learning",
];

const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || "";

export function normalizeProfile(profile) {
  const scores = profile.scores || profile.domainScores || {};
  const values = Array.isArray(profile.values)
    ? profile.values
    : AXIS_KEYS.map((key) => Number(scores[key] ?? 0));

  return {
    iso3: String(profile.iso3 || profile.country_iso3 || "").toUpperCase(),
    name: profile.name || profile.country_name || profile.countryName || "Unnamed country",
    slug: profile.slug || "",
    status: profile.status || profile.assessment_status || "published",
    version: profile.version || "",
    updatedAt:
      profile.updatedAt ||
      profile.updated_at ||
      profile.assessment_date ||
      profile.assessed_at ||
      profile.published_at ||
      "",
    evidenceLevel:
      profile.evidenceLevel ||
      profile.evidence_level ||
      "Exploratory working profile",
    subtitle: profile.subtitle || profile.summary || "",
    values,
    strengths: profile.strengths || [],
    watch: profile.watch || profile.pointsToWatch || [],
    sources: profile.sources || [],
  };
}

export async function loadGlobalMapProfiles(signal) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/countries`, {
      headers: { Accept: "application/json" },
      signal,
    });

    if (!response.ok) {
      throw new Error(`Countries API returned ${response.status}.`);
    }

    const payload = await response.json();
    const rows = Array.isArray(payload) ? payload : payload.countries;

    if (!Array.isArray(rows)) {
      throw new Error("Countries API payload must contain a countries array.");
    }

    if (rows.length === 0) {
      throw new Error(
        "The countries API contains no published country profiles yet."
      );
    }

    return {
      profiles: rows.map(normalizeProfile),
      source: "database",
    };
  } catch (error) {
    if (error?.name === "AbortError") throw error;

    return {
      profiles: [],
      source: "unavailable",
      warning: error?.message || "API unavailable",
    };
  }
}
