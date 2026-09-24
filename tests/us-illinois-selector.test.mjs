import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const paths = [
  "src/features/countries/CountryExplorer.jsx",
  "src/components/CountryExplorer.jsx",
];

const illinois = JSON.parse(
  fs.readFileSync(new URL("../src/data/illinoisProfile.json", import.meta.url), "utf8")
);

for (const path of paths) {
  const source = fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

  test(`${path}: Illinois is exposed as a subnational selector without changing the world map`, () => {
    assert.match(source, /Illinois — United States/);
    assert.match(source, /Choose jurisdiction/);
    assert.match(source, /worldCountries/);
    assert.match(source, /world map remains country-level/i);
  });

  test(`${path}: Illinois does not inherit the federal USA profile`, () => {
    assert.match(source, /id: "USA-IL"[\s\S]*profileIso3: null[\s\S]*jurisdictionProfileId: "USA-IL"/);
    assert.match(source, /Federal United States scores are not inherited/);
    assert.match(source, /selectedJurisdiction\.jurisdictionProfileId[\s\S]*jurisdictionProfilesById\.get/);
  });

  test(`${path}: USA selection exposes an explicit jurisdiction menu`, () => {
    assert.match(source, /USA-FED/);
    assert.match(source, /setSelectedJurisdictionId\(iso3 === "USA" \? "USA-FED" : ""\)/);
    assert.match(source, /jurisdictionOptions\.map/);
  });
}

test("Illinois v0.1 has six independent scores and explicit no-inheritance metadata", () => {
  assert.equal(illinois.iso3, "USA-IL");
  assert.equal(illinois.parent_iso3, "USA");
  assert.deepEqual(illinois.values, [62, 76, 72, 78, 42, 52]);
  assert.equal(illinois.values.length, 6);
  assert.equal(illinois.methodology.federal_score_inheritance, false);
  assert.equal(illinois.methodology.overall_score, 64);
  assert.equal(illinois.methodology.lrn5, "not_assessed");
  assert.ok(illinois.sources.length >= 10);
});

test("Illinois v0.1 preserves key governance, adoption and security evidence", () => {
  const joined = JSON.stringify(illinois);
  assert.match(joined, /185 acute-care hospitals/i);
  assert.match(joined, /HealthChoice Illinois ADT/);
  assert.match(joined, /Weaknesses in Cybersecurity Programs and Practices/);
  assert.match(joined, /HIE opt-out/i);
});


test("Illinois public-source metadata follows the source-quality protocol", () => {
  const optOut = illinois.sources.find((source) => source.title.includes("740 ILCS 110/9.6"));
  assert.equal(optOut.url, null);
  assert.equal(optOut.url_status, "unverified");
  assert.match(optOut.documentary_url, /ilga\.gov/);

  const dissolution = illinois.sources.find((source) => source.title.includes("Dissolution"));
  assert.match(dissolution.url, /ILCS\/Articles\?ActID=326/);
  assert.doesNotMatch(dissolution.url, /ILCS\/details/);

  const phishing = illinois.sources.find((source) => source.title.includes("phishing"));
  assert.match(phishing.url, /www\.illinois\.gov/);
  assert.doesNotMatch(phishing.url, /hfs\.illinois\.gov\/content\/dam/);

  const smhp = illinois.sources.find((source) => source.title.includes("State Medicaid Health Information Technology Plan"));
  assert.match(smhp.title, /2022/);

  for (const source of illinois.sources) {
    if (source.url) assert.ok(["verified", "redirected"].includes(source.url_status));
    assert.ok(source.documentary_url);
    assert.ok(source.last_checked_at);
  }
});
