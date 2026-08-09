import { neon } from "@neondatabase/serverless";

const TABLES = [
  "countries",
  "country_profiles",
  "country_profile_scores",
  "country_profile_notes",
  "country_profile_sources",
  "country_profile_source_indicators",
  "iml_domains",
];

export async function GET() {
  if (!process.env.DATABASE_URL) {
    return Response.json({ error: "DATABASE_URL is not available." }, { status: 500 });
  }

  try {
    const sql = neon(process.env.DATABASE_URL);

    const columns = await sql`
      SELECT table_name, column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = ANY(${TABLES})
      ORDER BY table_name, ordinal_position;
    `;

    const constraints = await sql`
      SELECT
        tc.table_name,
        tc.constraint_name,
        tc.constraint_type,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints tc
      LEFT JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
       AND tc.table_schema = kcu.table_schema
      LEFT JOIN information_schema.constraint_column_usage ccu
        ON tc.constraint_name = ccu.constraint_name
       AND tc.table_schema = ccu.table_schema
      WHERE tc.table_schema = 'public'
        AND tc.table_name = ANY(${TABLES})
      ORDER BY tc.table_name, tc.constraint_name, kcu.ordinal_position;
    `;

    const domains = await sql`
      SELECT * FROM iml_domains ORDER BY display_order;
    `;

    const countries = await sql`
      SELECT * FROM countries ORDER BY name_en;
    `;

    const profiles = await sql`
      SELECT cp.*, c.iso3, c.name_en
      FROM country_profiles cp
      JOIN countries c ON c.id = cp.country_id
      ORDER BY c.name_en, cp.id;
    `;

    const scores = await sql`
      SELECT c.iso3, cp.version, s.*
      FROM country_profile_scores s
      JOIN country_profiles cp ON cp.id = s.profile_id
      JOIN countries c ON c.id = cp.country_id
      ORDER BY c.iso3, s.domain_code;
    `;

    const notes = await sql`
      SELECT c.iso3, cp.version, n.*
      FROM country_profile_notes n
      JOIN country_profiles cp ON cp.id = n.profile_id
      JOIN countries c ON c.id = cp.country_id
      ORDER BY c.iso3, n.note_type, n.display_order;
    `;

    const sources = await sql`
      SELECT c.iso3, cp.version, s.*
      FROM country_profile_sources s
      JOIN country_profiles cp ON cp.id = s.profile_id
      JOIN countries c ON c.id = cp.country_id
      ORDER BY c.iso3, s.id;
    `;

    const indicators = await sql`
      SELECT c.iso3, cp.version, i.*
      FROM country_profile_source_indicators i
      JOIN country_profile_sources s ON s.id = i.source_id
      JOIN country_profiles cp ON cp.id = s.profile_id
      JOIN countries c ON c.id = cp.country_id
      ORDER BY c.iso3, i.source_id, i.indicator_code;
    `;

    return Response.json(
      { columns, constraints, domains, countries, profiles, scores, notes, sources, indicators },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Database inspection failed:", error);
    return Response.json({ error: "Database inspection failed." }, { status: 500 });
  }
}
