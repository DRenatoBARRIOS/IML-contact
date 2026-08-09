import { neon } from "@neondatabase/serverless";
import { seedRomania } from "../db/seeds/20260809_romania.mjs";

export async function GET() {
  if (process.env.VERCEL_ENV !== "production") {
    return Response.json({ error: "Restricted to Vercel production." }, { status: 403 });
  }

  if (!process.env.DATABASE_URL) {
    return Response.json({ error: "DATABASE_URL is not available." }, { status: 500 });
  }

  try {
    const sql = neon(process.env.DATABASE_URL);
    const existing = await sql`
      SELECT id
      FROM countries
      WHERE iso3 = 'ROU'
      LIMIT 1
    `;

    if (existing.length > 0) {
      return Response.json(
        { status: "already_seeded", iso3: "ROU" },
        { status: 410, headers: { "Cache-Control": "no-store" } }
      );
    }

    const result = await seedRomania(sql);
    return Response.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Romania production seed failed:", error);
    return Response.json(
      { error: "Romania production seed failed.", detail: error?.message || String(error) },
      { status: 500 }
    );
  }
}
