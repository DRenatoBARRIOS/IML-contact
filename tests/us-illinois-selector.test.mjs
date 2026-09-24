import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const paths = [
  "src/features/countries/CountryExplorer.jsx",
  "src/components/CountryExplorer.jsx",
];

for (const path of paths) {
  const source = fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

  test(`${path}: Illinois is exposed as a subnational selector without changing the world map`, () => {
    assert.match(source, /Illinois — United States/);
    assert.match(source, /Choose jurisdiction/);
    assert.match(source, /worldCountries\.features/);
    assert.match(source, /world map remains country-level/i);
  });

  test(`${path}: Illinois does not inherit the federal USA profile`, () => {
    assert.match(source, /id: "USA-IL"[\s\S]*profileIso3: null/);
    assert.match(source, /Federal United States scores are not inherited/);
    assert.match(source, /selectedJurisdiction\.profileIso3[\s\S]*\? profilesByIso3\.get\(selectedJurisdiction\.profileIso3\)[\s\S]*: null/);
  });
}
