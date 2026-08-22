import { neon } from "@neondatabase/serverless";
import { seedUzbekistan } from "../db/seeds/20260822_uzbekistan.mjs";
import { patchUzbekistanWhoSource } from "../db/seeds/20260822_uzbekistan_who_source_patch.mjs";

export async function GET() {
  if (process.env.VERCEL_ENV !== "preview") {
    return Response.json({ error: "Preview only." }, { status: 403 });
  }

  if (!process.env.DATABASE_URL) {
    return Response.json({ error: "DATABASE_URL is not available." }, { status: 500 });
  }

  try {
    const sql = neon(process.env.DATABASE_URL);
    const seed = await seedUzbekistan(sql);
    const sourcePatch = await patchUzbekistanWhoSource(sql);
    return Response.json({ ...seed, sourcePatch }, {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Unable to seed Uzbekistan Preview profile:", error);
    return Response.json(
      { error: "Unable to seed Uzbekistan Preview profile.", detail: error?.message || String(error) },
      { status: 500 }
    );
  }
}
