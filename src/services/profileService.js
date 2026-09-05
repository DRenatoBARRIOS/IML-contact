import { loadGlobalMapProfiles, normalizeProfile } from "./countriesApi.js";

const API_BASE_URL = import.meta.env?.DEV
  ? (import.meta.env?.VITE_API_BASE_URL || "")
  : "";

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
    if (!Array.isArray(rows) || rows.length === 0) throw new Error("The countries API contains no published country profiles yet.");
    return {
      profiles: rows.map(enrich),
      source: "database",
      apiVersion: payload.api_version || "current",
      generatedAt: payload.generated_at || null,
    };
  } catch (primaryError) {
    if (primaryError?.name === "AbortError") throw primaryError;
    const fallback = await loadGlobalMapProfiles(signal);
    if (fallback.profiles.length) return { ...fallback, profiles: fallback.profiles.map(enrich) };
    return {
      profiles: [],
      source: "unavailable",
      warning: fallback.warning || primaryError?.message || "Country profile service unavailable.",
    };
  }
}
