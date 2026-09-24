import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const sql = fs.readFileSync(new URL("../db/migrations/192_generic_geography_layer.sql", import.meta.url), "utf8");

test("generic geography migration is additive and leaves current country tables untouched", () => {
  const forbidden = [
    /\bDROP\b/i,
    /\bTRUNCATE\b/i,
    /\bDELETE\s+FROM\b/i,
    /\bALTER\s+TABLE\s+(countries|country_profiles|country_profile_)/i,
    /\bUPDATE\s+(countries|country_profiles|country_profile_)/i,
    /\bINSERT\s+INTO\s+(countries|country_profiles|country_profile_)/i,
  ];

  for (const pattern of forbidden) {
    assert.equal(pattern.test(sql), false, `Migration 192 must remain additive; forbidden pattern: ${pattern}`);
  }
});

test("generic geography migration creates the canonical independent geography layer", () => {
  for (const table of [
    "geo_entity_types",
    "geo_entities",
    "geo_identifiers",
    "geo_names",
    "geo_relation_types",
    "geo_relations",
  ]) {
    assert.match(sql, new RegExp(`CREATE TABLE IF NOT EXISTS ${table}\\b`, "i"));
  }
});

test("geography uses stable internal identity and does not make ISO identifiers primary keys", () => {
  assert.match(sql, /geo_entities[\s\S]*GENERATED ALWAYS AS IDENTITY PRIMARY KEY/i);
  assert.match(sql, /geo_identifiers[\s\S]*scheme text NOT NULL[\s\S]*value text NOT NULL/i);
  assert.equal(/iso3\s+[^,]*PRIMARY KEY/i.test(sql), false);
  assert.equal(/iso_3166[^,]*PRIMARY KEY/i.test(sql), false);
});

test("geographic relationships support temporal and non-tree evolution", () => {
  for (const relation of [
    "administrative_part_of",
    "historical_part_of",
    "overlaps",
    "precedes",
    "succeeds",
    "health_authority_part_of",
  ]) {
    assert.match(sql, new RegExp(`'${relation}'`));
  }

  assert.match(sql, /valid_from date/i);
  assert.match(sql, /valid_to date/i);
});
