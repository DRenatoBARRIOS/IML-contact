import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const read = (path) => readFileSync(path, "utf8");

test("validated IML site continuity invariants", () => {
  const api = read("api/countries.js");
  const app = read("src/App.jsx");
  const sitePages = read("src/pages/SitePages.jsx");
  const vercel = read("vercel.json");
  const sync = read("db/production-country-sync.mjs");
  const productionSync = read("scripts/sync-production-country-data.mjs");
  const packageJson = read("package.json");
  const continuityWorkflow = read(".github/workflows/continuity-guard.yml");

  assert.match(api, /FRANCE_SECURITY_ADJUSTMENT\s*=\s*20/);
  assert.match(api, /ensurePreviewCountryData/);
  assert.doesNotMatch(api, /main-test/);

  assert.match(api, /Security: repeated hospital cyber incidents reveal a gap between formal safeguards and observed operational resilience\./);
  assert.doesNotMatch(api, /IML starts from official and administrative evidence about cybersecurity/);
  assert.match(api, /simplifyFranceWatch/);
  assert.match(api, /url_status: "verified"/);
  assert.match(api, /documentary_url:/);
  assert.match(api, /last_checked_at: "2026-09-22T00:00:00\+00:00"/);

  assert.match(sync, /seedUzbekistan/);
  assert.match(sync, /seedTunisia/);
  assert.match(sync, /applyFranceLearningResponsivenessCorrection/);
  assert.match(sync, /env\.VERCEL_ENV === "production"/);
  assert.match(sync, /env\.VERCEL_GIT_COMMIT_REF === "main"/);
  assert.match(sync, /c\.iso3 = 'TUN'/);
  assert.match(sync, /tunisia_scores_ready/);
  assert.match(sync, /tunisia_lrn5_ready/);
  assert.match(sync, /tunisia_source_route_ready/);
  assert.match(
    sync,
    /https:\/\/extranet\.who\.int\/uhcpartnershiplivemonitoring\/country-profile\?iso3=TUN/,
  );

  assert.match(productionSync, /ensureRequiredCountryData/);
  assert.match(productionSync, /shouldRunProductionCountrySync/);
  assert.match(read("src/components/CountryExplorer.jsx"), /groupEvidenceSources/);
  assert.match(read("src/components/CountryExplorer.jsx"), /Security adjusted downward after repeated officially documented hospital cyber incidents/);
  assert.doesNotMatch(read("src/components/CountryExplorer.jsx"), /Why Learning is/);
  assert.match(packageJson, /sync-production-country-data\.mjs/);
  assert.doesNotMatch(continuityWorkflow, /main-test/);

  assert.doesNotMatch(app, /["']\/manuscripts["']/);
  assert.doesNotMatch(sitePages, /function\s+ManuscriptsPage\s*\(/);
  assert.match(sitePages, /IML_Founding_Manuscript\.pdf/);
  assert.match(sitePages, /IML_Technical_Manuscript\.pdf/);
  assert.doesNotMatch(vercel, /"source"\s*:\s*"\/manuscripts"/);

  assert.equal(existsSync("src/pages/ManuscriptsPage.jsx"), false);
  assert.equal(existsSync("db/seeds/20260822_uzbekistan.mjs"), true);
  assert.equal(existsSync("db/seeds/20260922_tunisia.mjs"), true);
  assert.equal(existsSync("db/seeds/20260901_france_learning_responsiveness.mjs"), true);
  assert.equal(existsSync("db/production-country-sync.mjs"), true);
  assert.equal(existsSync("scripts/sync-production-country-data.mjs"), true);
  assert.equal(existsSync("data/source-audits/tunisia.json"), true);
  assert.equal(existsSync("src/components/IndicatorDefinitionsTable.jsx"), true);
});
