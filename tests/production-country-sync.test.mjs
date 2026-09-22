import test from "node:test";
import assert from "node:assert/strict";

import {
  shouldRunPreviewCountrySync,
  shouldRunProductionCountrySync,
} from "../db/production-country-sync.mjs";

test("production country sync is restricted to Vercel production on main", () => {
  assert.equal(
    shouldRunProductionCountrySync({
      VERCEL_ENV: "production",
      VERCEL_GIT_COMMIT_REF: "main",
    }),
    true,
  );

  assert.equal(
    shouldRunProductionCountrySync({
      VERCEL_ENV: "preview",
      VERCEL_GIT_COMMIT_REF: "main",
    }),
    false,
  );

  assert.equal(
    shouldRunProductionCountrySync({
      VERCEL_ENV: "production",
      VERCEL_GIT_COMMIT_REF: "feature/test",
    }),
    false,
  );

  assert.equal(
    shouldRunProductionCountrySync({
      VERCEL_ENV: "production",
      VERCEL_GIT_COMMIT_REF: "main-test",
    }),
    false,
  );
});

test("preview country sync accepts only the canonical main preview", () => {
  assert.equal(
    shouldRunPreviewCountrySync({
      VERCEL_ENV: "preview",
      VERCEL_GIT_COMMIT_REF: "main",
    }),
    true,
  );

  assert.equal(
    shouldRunPreviewCountrySync({
      VERCEL_ENV: "preview",
      VERCEL_GIT_COMMIT_REF: "main-test",
    }),
    false,
  );

  assert.equal(
    shouldRunPreviewCountrySync({
      VERCEL_ENV: "production",
      VERCEL_GIT_COMMIT_REF: "main",
    }),
    false,
  );
});
