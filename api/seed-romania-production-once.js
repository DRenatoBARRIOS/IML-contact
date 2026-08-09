import { neon } from "@neondatabase/serverless";
import { seedRomania } from "../db/seeds/20260809_romania.mjs";

export async function GET() {
  if (process.env.VERCEL_GIT_COMMIT_REF !== "main-test") {
    return Response.json({ error: "Restricted to main-test." }, { status: 403 });
  }

  if (!process.env.DATABASE_URL) {
    return Response.json({ error: "DATABASE_URL is not available." }, { status: 500 });
  }

  try {
    const sql = neon(process.env.DATABASE_URL);
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
