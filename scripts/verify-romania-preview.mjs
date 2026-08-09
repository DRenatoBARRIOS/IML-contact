import { neon } from "@neondatabase/serverless";
import { seedRomania } from "../db/seeds/20260809_romania.mjs";
import { romaniaProfile } from "../src/data/countries/romaniaProfile.js";
import { GET as getCountries } from "../api/countries.js";

const isTargetPreview =
  process.env.VERCEL_ENV === "preview" &&
  (!process.env.VERCEL_GIT_COMMIT_REF || process.env.VERCEL_GIT_COMMIT_REF === "preprod-romania");

if (!isTargetPreview || !process.env.DATABASE_URL) {
  console.log("Romania preview DB verification skipped outside preprod preview.");
  process.exit(0);
}

const sql = neon(process.env.DATABASE_URL);
const first = await seedRomania(sql);
const second = await seedRomania(sql);

const idempotent =
  first.countryId === second.countryId &&
  first.profileId === second.profileId &&
  JSON.stringify(first.counts) === JSON.stringify(second.counts);

if (!idempotent) {
  throw new Error(`Romania seed is not idempotent: ${JSON.stringify({ first, second })}`);
}

const rows = await sql`
  SELECT
    c.iso3,
    c.slug,
    c.name_en AS name,
    cp.subtitle,
    cp.assessment_date::text AS assessment_date,
    cp.published_at,
    COALESCE(
      (
        SELECT json_agg(s.score ORDER BY d.display_order)
        FROM country_profile_scores s
        JOIN iml_domains d ON d.code = s.domain_code
        WHERE s.profile_id = cp.id
      ),
      '[]'::json
    ) AS values,
    COALESCE(
      (
        SELECT json_agg(n.note_text ORDER BY n.display_order)
        FROM country_profile_notes n
        WHERE n.profile_id = cp.id AND n.note_type = 'strength'
      ),
      '[]'::json
    ) AS strengths,
    COALESCE(
      (
        SELECT json_agg(n.note_text ORDER BY n.display_order)
        FROM country_profile_notes n
        WHERE n.profile_id = cp.id AND n.note_type = 'watch'
      ),
      '[]'::json
    ) AS watch,
    COALESCE(
      (
        SELECT json_agg(
          json_build_object(
            'title', s.title,
            'publisher', s.publisher,
            'url', s.source_url,
            'publication_date', s.publication_date,
            'accessed_at', s.accessed_at,
            'note', s.evidence_note,
            'indicators', COALESCE(
              (
                SELECT json_agg(
                  json_build_object(
                    'code', i.indicator_code,
                    'summary', i.evidence_summary,
                    'limitation', i.limitation_note
                  ) ORDER BY i.id
                )
                FROM country_profile_source_indicators i
                WHERE i.source_id = s.id
              ),
              '[]'::json
            )
          ) ORDER BY s.id
        )
        FROM country_profile_sources s
        WHERE s.profile_id = cp.id
      ),
      '[]'::json
    ) AS sources
  FROM countries c
  JOIN country_profiles cp ON cp.country_id = c.id
  WHERE c.iso3 = 'ROU' AND cp.version = 1 AND cp.status = 'published';
`;

if (rows.length !== 1) {
  throw new Error(`Expected exactly one published ROU database profile, got ${rows.length}.`);
}

const db = rows[0];
const documentaryProjection = (profile) => ({
  iso3: profile.iso3,
  slug: profile.slug,
  name: profile.name,
  subtitle: profile.subtitle,
  assessment_date: String(profile.assessment_date).slice(0, 10),
  published_at: new Date(profile.published_at).toISOString(),
  values: profile.values.map(Number),
  strengths: profile.strengths,
  watch: profile.watch,
  sources: profile.sources.map((source) => ({
    title: source.title,
    publisher: source.publisher,
    url: source.url,
    publication_date: source.publication_date ? String(source.publication_date).slice(0, 10) : undefined,
    accessed_at: source.accessed_at ? String(source.accessed_at).slice(0, 10) : undefined,
    note: source.note,
    indicators: source.indicators.map((indicator) => ({
      code: indicator.code,
      summary: indicator.summary,
      limitation: indicator.limitation,
    })),
  })),
});

const expected = documentaryProjection(romaniaProfile);
const actual = documentaryProjection(db);
const documentaryMatch = JSON.stringify(actual) === JSON.stringify(expected);

if (!documentaryMatch) {
  throw new Error(`Romania documentary projection differs from v0.1 fixture.\nExpected: ${JSON.stringify(expected)}\nActual: ${JSON.stringify(actual)}`);
}

const publishedCounts = await sql`
  SELECT
    COUNT(*)::int AS published_profiles,
    COUNT(DISTINCT c.iso3)::int AS published_countries
  FROM countries c
  JOIN country_profiles cp ON cp.country_id = c.id
  WHERE c.is_active = TRUE AND cp.status = 'published';
`;

const apiResponse = await getCountries();
if (!apiResponse.ok) {
  throw new Error(`/api/countries function returned ${apiResponse.status}.`);
}
const apiPayload = await apiResponse.json();
const apiRomania = apiPayload.countries.filter((country) => country.iso3 === "ROU");
const apiUsesDatabaseRomania = apiRomania.length === 1 && Number(apiRomania[0].version) === 1;
const apiMatchesDatabaseCount = apiPayload.count === publishedCounts[0].published_countries;

if (!apiUsesDatabaseRomania || !apiMatchesDatabaseCount) {
  throw new Error(`Countries API verification failed: ${JSON.stringify({ apiPayloadCount: apiPayload.count, apiRomania, publishedCounts })}`);
}

console.log("Romania preview DB verification:", JSON.stringify({
  idempotent,
  documentaryMatch,
  apiUsesDatabaseRomania,
  apiMatchesDatabaseCount,
  apiCount: apiPayload.count,
  countryId: second.countryId,
  profileId: second.profileId,
  counts: second.counts,
  databasePublishedProfiles: publishedCounts[0].published_profiles,
  databasePublishedCountries: publishedCounts[0].published_countries,
}));
