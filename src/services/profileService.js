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

function qualifyPatientIdentity(profile) {
  const iso3 = String(profile?.iso3 || "").toUpperCase();
  if (!["USA", "USA-IL"].includes(iso3)) return profile;

  const values = Array.isArray(profile.values) ? profile.values.map(Number) : [];
  const adjustedValues = values.length === 6 ? [...values] : values;

  if (iso3 === "USA" && adjustedValues.length === 6) {
    adjustedValues[1] = Math.max(0, adjustedValues[1] - 2);
    adjustedValues[2] = Math.max(0, adjustedValues[2] - 10);
  }

  if (iso3 === "USA-IL" && adjustedValues.length === 6) {
    adjustedValues[1] = 74;
    adjustedValues[2] = 62;
  }

  const federalWatch = "The United States has no adopted national patient identifier standard usable across all health systems. Cross-system identity therefore depends on patient matching across local identifiers and demographic attributes, creating a structural interoperability burden.";
  const illinoisWatch = "Illinois shares the U.S. structural patient-identity limitation: there is no adopted national patient identifier standard. Provider identity proofing and NPI-based access do not constitute a universal patient identity layer.";

  const sourceTitles = new Set((profile.sources || []).map((source) => source?.title));
  const extraSources = [
    ...(sourceTitles.has("Unique Identifiers Overview") ? [] : [{
      title: "Unique Identifiers Overview",
      publisher: "U.S. Department of Health and Human Services / CMS",
      url: "https://www.hhs.gov/guidance/document/unique-identifiers-overview",
      note: "HHS states that there is no adopted standard to identify patients, unlike the adopted national identifier for providers.",
      indicators: [{
        code: iso3 === "USA" ? "USA-IDT-PATIENT-01" : "IL-IDT-PATIENT-01",
        evidence_level: "A",
        summary: "Documents the absence of an adopted national standard patient identifier.",
        limitation: "This does not imply absence of patient matching mechanisms."
      }]
    }]),
    ...(sourceTitles.has("Patient Identity and Patient Record Matching") ? [] : [{
      title: "Patient Identity and Patient Record Matching",
      publisher: "Assistant Secretary for Technology Policy / Office of the National Coordinator for Health IT",
      url: "https://healthit.gov/standards-and-technology/patient-identity-and-patient-record-matching/",
      note: "ONC describes patient matching across systems using multiple demographic attributes and identifies it as critical to interoperability.",
      indicators: [{
        code: iso3 === "USA" ? "USA-TEC-PATIENT-01" : "IL-TEC-PATIENT-01",
        evidence_level: "A",
        summary: "Documents the operational dependence on patient matching across heterogeneous local identifiers.",
        limitation: "Patient matching mitigates fragmentation but is not equivalent to a single universal patient identifier."
      }]
    }])
  ];

  return {
    ...profile,
    values: adjustedValues,
    overall_score: iso3 === "USA" ? 75 : 62,
    watch: [
      iso3 === "USA" ? federalWatch : illinoisWatch,
      ...(profile.watch || []).filter((item) => item !== federalWatch && item !== illinoisWatch),
    ],
    sources: [...(profile.sources || []), ...extraSources],
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
      profiles: rows.map(enrich).map(qualifyPatientIdentity),
      jurisdictions: jurisdictionRows.map(enrich).map(qualifyPatientIdentity),
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
