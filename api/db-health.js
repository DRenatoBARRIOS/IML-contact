import { neon } from "@neondatabase/serverless";

export async function GET() {
  if (!process.env.DATABASE_URL) {
    return Response.json(
      {
        ok: false,
        error: "DATABASE_URL is not available.",
      },
      { status: 500 }
    );
  }

  try {
    const sql = neon(process.env.DATABASE_URL);

    const [result] = await sql`
      SELECT
        (SELECT COUNT(*)::int
         FROM countries
         WHERE is_active = TRUE) AS active_countries,

        (SELECT COUNT(*)::int
         FROM country_profiles
         WHERE status = 'published') AS published_profiles,

        (SELECT COUNT(*)::int
         FROM country_profile_scores) AS scores,

        (SELECT COUNT(*)::int
         FROM country_profile_notes) AS notes
    `;

    return Response.json({
      ok: true,
      database: "connected",
      ...result,
    });
  } catch (error) {
    console.error("IML database health check failed:", error);

    return Response.json(
      {
        ok: false,
        database: "connection_failed",
      },
      { status: 500 }
    );
  }
}
