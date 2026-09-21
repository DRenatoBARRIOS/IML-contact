import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const read = (path) => readFileSync(path, "utf8");

test("validated IML site continuity invariants", () => {
  const api = read("api/countries.js");
  const app = read("src/App.jsx");
  const sitePages = read("src/pages/SitePages.jsx");
  const vercel = read("vercel.json");

  assert.match(api, /FRANCE_SECURITY_ADJUSTMENT\s*=\s*20/);
  assert.match(api, /applyFranceLearningResponsivenessCorrection/);
  assert.match(api, /"main-test"/);
  assert.match(api, /seedUzbekistan/);

  assert.doesNotMatch(app, /["']\/manuscripts["']/);
  assert.doesNotMatch(sitePages, /function\s+ManuscriptsPage\s*\(/);
  assert.match(sitePages, /IML_Founding_Manuscript\.pdf/);
  assert.match(sitePages, /IML_Technical_Manuscript\.pdf/);
  assert.doesNotMatch(vercel, /"source"\s*:\s*"\/manuscripts"/);

  assert.equal(existsSync("src/pages/ManuscriptsPage.jsx"), false);
  assert.equal(existsSync("db/seeds/20260822_uzbekistan.mjs"), true);
  assert.equal(existsSync("db/seeds/20260901_france_learning_responsiveness.mjs"), true);
  assert.equal(existsSync("src/components/IndicatorDefinitionsTable.jsx"), true);
});
