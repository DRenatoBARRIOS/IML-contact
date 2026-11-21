import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const seed = readFileSync("db/seeds/20260922_tunisia.mjs", "utf8");

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
