import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const seed = readFileSync("db/seeds/20260924_australia_event_audit.mjs", "utf8");
const audit = readFileSync("docs/AUSTRALIA_COUNTRY_EVENT_AUDIT_2026-09-24.md", "utf8");
const manifest = JSON.parse(readFileSync("data/source-audits/australia.json", "utf8"));
const sync = readFileSync("db/production-country-sync.mjs", "utf8");
const explorer = readFileSync("src/features/countries/CountryExplorer.jsx", "utf8");

test("Australia event audit preserves the six-domain decision and date zero", () => {
  assert.match(seed, /'AUS', 'australia', 'Australia'/);
  assert.match(seed, /'governance', 78/);
  assert.match(seed, /'technical', 82/);
  assert.match(seed, /'identity', 88/);
  assert.match(seed, /'adoption', 82/);
  assert.match(seed, /'security', 60/);
  assert.match(seed, /'learning', 72/);
  assert.match(seed, /eventAuditDateZero: "2026-09-24"/);
  assert.match(seed, /incidentDate: "2026-06-18"/);
  assert.match(seed, /code: "LRN-5"/);
  assert.match(seed, /LRN-5 remains not assessed nationally/i);
  assert.equal((seed.match(/title: "/g) || []).length, 12);
  assert.equal((seed.match(/code: "/g) || []).length, 23);
});

test("Australia documentary audit distinguishes incident date from event-audit date zero", () => {
  assert.match(audit, /date zero:\*\* 24 September 2026/i);
  assert.match(audit, /Underlying incident date:\*\* 18 June 2026/i);
  assert.match(audit, /Overall orientation signal: 77\/100/);
  assert.match(audit, /forensic investigation.*ongoing/i);
  assert.match(audit, /not assessed at national level/i);
});

test("Australia source manifest covers the primary incident and national infrastructure evidence", () => {
  assert.equal(manifest.country.iso3, "AUS");
  assert.equal(manifest.audit_id, "AUS-2026-09-24-EVENT-0");
  assert.equal(manifest.sources.length, 12);
  const ids = manifest.sources.map((source) => source.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const source of manifest.sources) {
    assert.match(source.url, /^https:\/\//);
    assert.ok(source.expected_domains.length >= 1);
    assert.ok(source.required_text_groups.length >= 3);
  }
  assert.ok(ids.includes("AU-PM-OPENAI-INCIDENT"));
  assert.ok(ids.includes("AU-ASD-AI-MISALIGNMENT"));
  assert.ok(ids.includes("AU-MHR-STATS-2026-07"));
});

test("Production sync explicitly protects Australia v0.1", () => {
  assert.match(sync, /seedAustralia/);
  assert.match(sync, /c\.iso3 = 'AUS'/);
  assert.match(sync, /australia_profile_ready/);
  assert.match(sync, /australia_scores_ready/);
  assert.match(sync, /australia_event_sources_ready/);
  assert.match(sync, /2026-09-24\.1/);
});


test("Australia security event banner is visible in the active country profile UI", () => {
  assert.match(explorer, /Security event · 24 Sep 2026/);
  assert.match(explorer, /Medicare Statistics Reporting Service portal/);
  assert.match(explorer, /forensic investigation remained ongoing/);
});
