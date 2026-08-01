import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("App.jsx remains a small route dispatcher", () => {
  const source = read("src/App.jsx");
  assert.ok(source.split("\n").length < 180);
  for (const route of ["/vision", "/clinical-workspace", "/interoperability", "/country-profiles", "/manuscripts", "/collaborate"]) {
    assert.match(source, new RegExp(`\\${route}`));
  }
});

test("legacy anchors and paths remain supported", () => {
  const app = read("src/App.jsx");
  const vercel = read("vercel.json");
  for (const legacy of ["id4d", "evaluation", "methodology", "world", "profiles", "contact"]) {
    assert.match(app, new RegExp(legacy));
  }
  assert.match(vercel, /country-profiles/);
  assert.match(vercel, /interoperability/);
});

test("map keeps four score bands, neutral coverage and independent selection", () => {
  const explorer = read("src/components/CountryExplorer.jsx");
  const css = read("src/App.css");
  for (const band of [1, 2, 3, 4]) assert.match(explorer, new RegExp(`legend-band-${band}`));
  assert.match(explorer, /not examined/);
  assert.match(explorer, /is-selected/);
  const selectedRule = css.match(/\.map-country\.is-selected\s*\{([^}]*)\}/)?.[1] || "";
  assert.match(selectedRule, /stroke:/);
  assert.doesNotMatch(selectedRule, /fill:/);
});

test("home header hides the logo frame and secondary pages keep it", () => {
  const chrome = read("src/components/SiteChrome.jsx");
  assert.match(chrome, /!home/);
  assert.match(chrome, /brand-mark/);
  assert.match(chrome, /iml-logo\.png/);
});

test("current and historical country API contracts are both retained", () => {
  assert.match(read("src/services/profileService.js"), /\/api\/countries/);
  assert.match(read("src/services/countriesApi.js"), /\/api\/countries-v2/);
});
