import { neon } from "@neondatabase/serverless";
import {
  ensureRequiredCountryData,
  shouldRunProductionCountrySync,
} from "../db/production-country-sync.mjs";

const env = process.env;

if (!shouldRunProductionCountrySync(env)) {
  console.log(
    JSON.stringify({
      skipped: true,
      reason: "production-country-sync-runs-only-on-vercel-production-main",
      vercelEnv: env.VERCEL_ENV || null,
      gitRef: env.VERCEL_GIT_COMMIT_REF || null,
    }),
  );
  process.exit(0);
}

const databaseUrl = env.DATABASE_URL_MANUAL || env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL_MANUAL or DATABASE_URL is required for production country synchronization.");
}

const sql = neon(databaseUrl);
const sync = await ensureRequiredCountryData(sql);

const rows = await sql`
  SELECT
    COUNT(*) FILTER (
      WHERE c.iso3 = 'TUN'
        AND c.is_active = TRUE
        AND cp.status = 'published'
    )::int AS tunisia_published,
    COUNT(*) FILTER (
      WHERE c.iso3 = 'UZB'
        AND c.is_active = TRUE
        AND cp.status = 'published'
    )::int AS uzbekistan_published,
    COUNT(*) FILTER (
      WHERE c.iso3 = 'FRA'
        AND c.is_active = TRUE
        AND cp.status = 'published'
    )::int AS france_published
  FROM countries c
  JOIN country_profiles cp ON cp.country_id = c.id;
`;

const verification = rows[0] || {};

if (
  Number(verification.tunisia_published) < 1 ||
  Number(verification.uzbekistan_published) < 1 ||
  Number(verification.france_published) < 1
) {
  throw new Error(
    `Production country verification failed: ${JSON.stringify(verification)}`,
  );
}

console.log(
  JSON.stringify({
    skipped: false,
    sync,
    verification,
  }),
);
