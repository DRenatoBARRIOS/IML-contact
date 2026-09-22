import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { queryParamsAllowed } from "../scripts/audit-sources.mjs";

const seed = readFileSync("db/seeds/20260922_tunisia.mjs", "utf8");
const manifest = JSON.parse(readFileSync("data/source-audits/tunisia.json", "utf8"));

test("Tunisia profile preserves the six-domain IML decision", () => {
  assert.match(seed, /'TUN', 'tunisia', 'Tunisia'/);
  assert.match(seed, /'governance', 62/);
  assert.match(seed, /'technical', 55/);
  assert.match(seed, /'identity', 54/);
  assert.match(seed, /'adoption', 58/);
  assert.match(seed, /'security', 52/);
  assert.match(seed, /'learning', 47/);
  assert.match(seed, /code: "LRN-5"/);
  assert.match(seed, /institutional responsiveness is therefore not assessed/i);
  assert.match(seed, /first phases and financed future commitments/i);
  assert.equal((seed.match(/title: "/g) || []).length, 12);
  assert.equal((seed.match(/code: "/g) || []).length, 28);
  assert.equal((seed.match(/publicUrl: null/g) || []).length, 2);
});

test("Tunisia semantic source manifest is complete and country-specific", () => {
  assert.equal(manifest.country.iso3, "TUN");
  assert.equal(manifest.audit_id, "TUN-2026-09-22");
  assert.ok(manifest.sources.length >= 10);

  const ids = manifest.sources.map((source) => source.id);
  assert.equal(new Set(ids).size, ids.length);

  for (const source of manifest.sources) {
    assert.match(source.url, /^https:\/\//);
    assert.ok(source.expected_domains.length >= 1);
    assert.ok(source.required_text_groups.length >= 2);
  }

  const whoUhc = manifest.sources.find((source) => source.id === "TN-WHO-UHC-DIGITAL");
  assert.equal(
    whoUhc.url,
    "https://extranet.who.int/uhcpartnershiplivemonitoring/country-profile?iso3=TUN",
  );
  assert.deepEqual(whoUhc.required_url_params, { iso3: "TUN" });
  assert.equal(queryParamsAllowed(whoUhc.url, whoUhc.required_url_params), true);
  assert.equal(
    queryParamsAllowed(
      "https://extranet.who.int/uhcpartnership/country-profile/tunisia",
      whoUhc.required_url_params,
    ),
    false,
  );

  const optional = manifest.sources.filter((source) => source.required_public_link === false);
  assert.ok(optional.some((source) => source.id === "TN-LABES-CNAM"));
  assert.ok(optional.some((source) => source.id === "TN-WHO-SCORE-INDEX"));
});
