import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const read = (path) => readFileSync(path, "utf8");

test("public IML site uses one Neon-backed profile architecture", () => {
  const api = read("api/countries.js");
  const app = read("src/App.jsx");
  const sitePages = read("src/pages/SitePages.jsx");
  const explorer = read("src/components/CountryExplorer.jsx");
  const profileService = read("src/services/profileService.js");
  const packageJson = JSON.parse(read("package.json"));
  const vercel = read("vercel.json");

  assert.match(api, /DATABASE_URL_MANUAL\s*\|\|\s*process\.env\.DATABASE_URL/);
  assert.match(api, /country_profile_assessments/);
  assert.match(api, /geo_relations/);
  assert.match(api, /administrative_part_of/);
  assert.match(api, /jurisdiction_count/);
  assert.doesNotMatch(api, /FRANCE_SECURITY_ADJUSTMENT/);
  assert.doesNotMatch(api, /ensurePreviewCountryData/);
  assert.doesNotMatch(api, /seed[A-Z]/);

  assert.match(sitePages, /\.\.\/components\/CountryExplorer\.jsx/);
  assert.doesNotMatch(sitePages, /features\/countries\/CountryExplorer/);

  assert.match(profileService, /jurisdictions/);
  assert.doesNotMatch(profileService, /countriesApi|loadGlobalMapProfiles/);
  assert.match(explorer, /Choose jurisdiction/);
  assert.match(explorer, /jurisdictions/);
  assert.match(explorer, /parent_iso3/);
  assert.doesNotMatch(explorer, /illinoisProfileData/);
  assert.doesNotMatch(explorer, /SUBNATIONAL_PROFILE_OPTIONS/);
  assert.doesNotMatch(explorer, /USA-FED/);

  assert.equal(packageJson.scripts.build, "vite build");
  assert.doesNotMatch(JSON.stringify(packageJson), /sync-production-country-data/);

  assert.equal(existsSync("src/features/countries/CountryExplorer.jsx"), false);
  assert.equal(existsSync("src/data/illinoisProfile.json"), false);
  assert.equal(existsSync("src/world-countries.json"), false);
  assert.equal(existsSync("db/production-country-sync.mjs"), false);
  assert.equal(existsSync("scripts/sync-production-country-data.mjs"), false);
  assert.equal(existsSync("src/services/countriesApi.js"), false);
  assert.equal(existsSync("docs/PRODUCTION_COUNTRY_SYNC.md"), false);
  assert.equal(existsSync("db/seeds"), false);

  assert.equal(existsSync("src/data/world-countries.json"), true);
  assert.equal(existsSync("data/source-audits"), false);
  assert.equal(existsSync("scripts/audit-sources.mjs"), false);
  assert.equal(existsSync("scripts/audit-production-sources.mjs"), false);

  assert.doesNotMatch(app, /["']\/manuscripts["']/);
  assert.doesNotMatch(sitePages, /function\s+ManuscriptsPage\s*\(/);
  assert.match(sitePages, /IML_Founding_Manuscript\.pdf/);
  assert.match(sitePages, /IML_Technical_Manuscript\.pdf/);
  assert.doesNotMatch(vercel, /"source"\s*:\s*"\/manuscripts"/);
});
