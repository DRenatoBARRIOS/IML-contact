import { seedUzbekistan } from "./seeds/20260822_uzbekistan.mjs";
import { seedTunisia } from "./seeds/20260922_tunisia.mjs";
import { applyFranceLearningResponsivenessCorrection } from "./seeds/20260901_france_learning_responsiveness.mjs";
import { applyGermanyCyberAuditCorrection } from "./seeds/20260922_germany_cyber_audit.mjs";

export const PRODUCTION_COUNTRY_SYNC_VERSION = "2026-09-23.1";

export function shouldRunProductionCountrySync(env = process.env) {
  return env.VERCEL_ENV === "production" && env.VERCEL_GIT_COMMIT_REF === "main";
}

export function shouldRunPreviewCountrySync(env = process.env) {
  return env.VERCEL_ENV === "preview" && env.VERCEL_GIT_COMMIT_REF === "main";
}

export async function readRequiredCountryDataState(sql) {
  const rows = await sql`
    SELECT
      EXISTS (
        SELECT 1
        FROM countries c
        JOIN country_profiles cp ON cp.country_id = c.id
        WHERE c.iso3 = 'UZB'
          AND c.is_active = TRUE
          AND cp.status = 'published'
      ) AS uzbekistan_ready,
      EXISTS (
        SELECT 1
        FROM countries c
        JOIN country_profiles cp ON cp.country_id = c.id
        WHERE c.iso3 = 'TUN'
          AND c.is_active = TRUE
          AND cp.status = 'published'
          AND cp.assessment_date = '2026-09-22'
      ) AS tunisia_profile_ready,
      (
        SELECT COUNT(*) = 6
        FROM countries c
        JOIN country_profiles cp ON cp.country_id = c.id
        JOIN country_profile_scores s ON s.profile_id = cp.id
        WHERE c.iso3 = 'TUN'
          AND cp.version = 1
          AND (
            (s.domain_code = 'governance' AND s.score = 62) OR
            (s.domain_code = 'technical' AND s.score = 55) OR
            (s.domain_code = 'identity' AND s.score = 54) OR
            (s.domain_code = 'adoption' AND s.score = 58) OR
            (s.domain_code = 'security' AND s.score = 52) OR
            (s.domain_code = 'learning' AND s.score = 47)
          )
      ) AS tunisia_scores_ready,
      EXISTS (
        SELECT 1
        FROM countries c
        JOIN country_profiles cp ON cp.country_id = c.id
        JOIN country_profile_sources src ON src.profile_id = cp.id
        JOIN country_profile_source_indicators i ON i.source_id = src.id
        WHERE c.iso3 = 'TUN'
          AND cp.version = 1
          AND i.indicator_code = 'LRN-5'
      ) AS tunisia_lrn5_ready,
      EXISTS (
        SELECT 1
        FROM countries c
        JOIN country_profiles cp ON cp.country_id = c.id
        JOIN country_profile_sources src ON src.profile_id = cp.id
        WHERE c.iso3 = 'TUN'
          AND cp.version = 1
          AND src.source_url = 'https://extranet.who.int/uhcpartnershiplivemonitoring/country-profile?iso3=TUN'
          AND src.public_url = 'https://extranet.who.int/uhcpartnershiplivemonitoring/country-profile?iso3=TUN'
          AND src.url_status IN ('verified', 'redirected')
      ) AS tunisia_source_route_ready,
      EXISTS (
        SELECT 1
        FROM countries c
        JOIN country_profiles cp ON cp.country_id = c.id
        JOIN country_profile_scores s ON s.profile_id = cp.id
        WHERE c.iso3 = 'FRA'
          AND cp.status = 'published'
          AND s.domain_code = 'learning'
          AND s.score = 10
      ) AS france_score_ready,
      EXISTS (
        SELECT 1
        FROM countries c
        JOIN country_profiles cp ON cp.country_id = c.id
        JOIN country_profile_sources src ON src.profile_id = cp.id
        JOIN country_profile_source_indicators i ON i.source_id = src.id
        WHERE c.iso3 = 'FRA'
          AND cp.status = 'published'
          AND i.indicator_code = 'LRN-5'
      ) AS france_lrn5_ready,
      (
        EXISTS (
          SELECT 1
          FROM countries c
          JOIN country_profiles cp ON cp.country_id = c.id
          JOIN country_profile_assessments a ON a.profile_id = cp.id
          WHERE c.iso3 = 'FRA'
            AND cp.status = 'published'
            AND a.review_notes LIKE '%[IML internal Learning rationale — 2026-09-01]%'
        )
        AND NOT EXISTS (
          SELECT 1
          FROM countries c
          JOIN country_profiles cp ON cp.country_id = c.id
          JOIN country_profile_notes n ON n.profile_id = cp.id
          WHERE c.iso3 = 'FRA'
            AND cp.status = 'published'
            AND n.note_type = 'watch'
            AND n.note_text LIKE 'Learning revised from 15 to 10 on 1 September 2026.%'
        )
      ) AS france_internal_review_ready,
      (
        SELECT COUNT(*) = 2
        FROM countries c
        JOIN country_profiles cp ON cp.country_id = c.id
        JOIN country_profile_scores s ON s.profile_id = cp.id
        WHERE c.iso3 = 'DEU'
          AND cp.status = 'published'
          AND (
            (s.domain_code = 'security' AND s.score = 80) OR
            (s.domain_code = 'learning' AND s.score = 70)
          )
      ) AS germany_scores_ready,
      (
        SELECT COUNT(*) >= 6
        FROM countries c
        JOIN country_profiles cp ON cp.country_id = c.id
        JOIN country_profile_sources src ON src.profile_id = cp.id
        WHERE c.iso3 = 'DEU'
          AND cp.status = 'published'
          AND src.source_url IN (
            'https://www.bsi.bund.de/SharedDocs/Downloads/DE/BSI/DigitaleGesellschaft/SiKIS_Abschlussbericht.html',
            'https://www.uniklinik-duesseldorf.de/ueber-uns/pressemitteilungen/detail/uniklinik-duesseldorf-wieder-bereit-fuer-notfaelle',
            'https://www.klinikum-lippe.de/cyberangriff2022/',
            'https://www.unimed.de/sicherheit/',
            'https://datenschutz-hamburg.de/service-information/taetigkeitsberichte/taetigkeitsbericht-datenschutz-2025',
            'https://www.datenschutz-berlin.de/jahresbericht-2024'
          )
      ) AS germany_audit_sources_ready,
      (
        EXISTS (
          SELECT 1
          FROM countries c
          JOIN country_profiles cp ON cp.country_id = c.id
          JOIN country_profile_assessments a ON a.profile_id = cp.id
          WHERE c.iso3 = 'DEU'
            AND cp.status = 'published'
            AND a.review_notes LIKE '%[IML internal Germany audit rationale — 2026-09-22]%'
        )
        AND NOT EXISTS (
          SELECT 1
          FROM countries c
          JOIN country_profiles cp ON cp.country_id = c.id
          JOIN country_profile_notes n ON n.profile_id = cp.id
          WHERE c.iso3 = 'DEU'
            AND cp.status = 'published'
            AND n.note_type = 'watch'
            AND (
              n.note_text LIKE 'Security revised from 88 to 80 on 22 September 2026%'
              OR n.note_text LIKE 'Learning revised from 65 to 70 on 22 September 2026%'
            )
        )
      ) AS germany_internal_review_ready;
  `;

  return rows[0] || {};
}

function requiredStateIsReady(state) {
  return Boolean(
    state.uzbekistan_ready &&
    state.tunisia_profile_ready &&
    state.tunisia_scores_ready &&
    state.tunisia_lrn5_ready &&
    state.tunisia_source_route_ready &&
    state.france_score_ready &&
    state.france_lrn5_ready &&
    state.france_internal_review_ready &&
    state.germany_scores_ready &&
    state.germany_audit_sources_ready &&
    state.germany_internal_review_ready
  );
}

export async function ensureRequiredCountryData(sql) {
  const before = await readRequiredCountryDataState(sql);
  const actions = [];

  if (!before.uzbekistan_ready) {
    await seedUzbekistan(sql);
    actions.push("seedUzbekistan");
  }

  if (
    !before.tunisia_profile_ready ||
    !before.tunisia_scores_ready ||
    !before.tunisia_lrn5_ready ||
    !before.tunisia_source_route_ready
  ) {
    await seedTunisia(sql);
    actions.push("seedTunisia");
  }

  if (!before.france_score_ready || !before.france_lrn5_ready || !before.france_internal_review_ready) {
    await applyFranceLearningResponsivenessCorrection(sql);
    actions.push("applyFranceLearningResponsivenessCorrection");
  }

  if (
    !before.germany_scores_ready ||
    !before.germany_audit_sources_ready ||
    !before.germany_internal_review_ready
  ) {
    await applyGermanyCyberAuditCorrection(sql);
    actions.push("applyGermanyCyberAuditCorrection");
  }

  const after = await readRequiredCountryDataState(sql);

  if (!requiredStateIsReady(after)) {
    throw new Error(
      `Required production country data is incomplete after sync: ${JSON.stringify(after)}`,
    );
  }

  return {
    version: PRODUCTION_COUNTRY_SYNC_VERSION,
    actions,
    before,
    after,
  };
}

export async function ensurePreviewCountryData(sql, env = process.env) {
  if (!shouldRunPreviewCountrySync(env)) {
    return {
      skipped: true,
      reason: "not-main-preview",
      version: PRODUCTION_COUNTRY_SYNC_VERSION,
    };
  }

  return ensureRequiredCountryData(sql);
}
