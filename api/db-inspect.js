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
      SELECT
        table_name,
        column_name,
        data_type,
        is_nullable,
        column_default,
        is_identity,
        identity_generation
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = ANY(${TABLES})
      ORDER BY table_name, ordinal_position;
    `;

    const constraintDefinitions = await sql`
      SELECT
        conrelid::regclass::text AS table_name,
        conname AS constraint_name,
        contype AS constraint_type,
        pg_get_constraintdef(oid) AS definition
      FROM pg_constraint
      WHERE connamespace = 'public'::regnamespace
        AND conrelid::regclass::text = ANY(${TABLES})
      ORDER BY conrelid::regclass::text, conname;
    `;

    const sequences = await sql`
      SELECT
        table_name,
        column_name,
        pg_get_serial_sequence(format('%I.%I', table_schema, table_name), column_name) AS sequence_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = ANY(${TABLES})
        AND column_name = 'id'
      ORDER BY table_name;
    `;

    const domains = await sql`
      SELECT * FROM iml_domains ORDER BY display_order;
    `;

    return Response.json(
      { columns, constraintDefinitions, sequences, domains },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Database inspection failed:", error);
    return Response.json({ error: "Database inspection failed." }, { status: 500 });
  }
}
