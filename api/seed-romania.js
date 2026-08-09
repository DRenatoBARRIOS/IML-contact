import { neon } from "@neondatabase/serverless";
import { seedRomania } from "../db/seeds/20260809_romania.mjs";

export async function GET() {
  if (process.env.VERCEL_ENV !== "preview") {
    return Response.json({ error: "This seed may only run in a Vercel preview environment." }, { status: 403 });
  }

  if (process.env.VERCEL_GIT_COMMIT_REF && process.env.VERCEL_GIT_COMMIT_REF !== "preprod-romania") {
    return Response.json({ error: "This seed is restricted to preprod-romania." }, { status: 403 });
  }

  if (!process.env.DATABASE_URL) {
    return Response.json({ error: "DATABASE_URL is not available." }, { status: 500 });
  }

  try {
    const sql = neon(process.env.DATABASE_URL);
    const first = await seedRomania(sql);
    const second = await seedRomania(sql);
    return Response.json(
      {
        first,
        second,
        idempotent:
          first.countryId === second.countryId &&
          first.profileId === second.profileId &&
          JSON.stringify(first.counts) === JSON.stringify(second.counts),
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Romania seed failed:", error);
    return Response.json({ error: "Romania seed failed.", detail: error?.message || String(error) }, { status: 500 });
  }
}
