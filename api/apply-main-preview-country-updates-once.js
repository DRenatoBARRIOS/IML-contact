import { neon } from "@neondatabase/serverless";
import { seedUzbekistan } from "../db/seeds/20260822_uzbekistan.mjs";
import { applyFranceLearningResponsivenessCorrection } from "../db/seeds/20260901_france_learning_responsiveness.mjs";

export async function GET() {
  if (
    process.env.VERCEL_ENV !== "preview" ||
    process.env.VERCEL_GIT_COMMIT_REF !== "main"
  ) {
    return new Response(
      JSON.stringify({ error: "This one-time route is restricted to the main Preview deployment." }),
      { status: 403, headers: { "content-type": "application/json", "cache-control": "no-store" } },
    );
  }

  if (!process.env.DATABASE_URL) {
    return new Response(
      JSON.stringify({ error: "DATABASE_URL is not configured." }),
      { status: 500, headers: { "content-type": "application/json", "cache-control": "no-store" } },
    );
  }

  try {
    const sql = neon(process.env.DATABASE_URL);
    const uzbekistan = await seedUzbekistan(sql);
    const france = await applyFranceLearningResponsivenessCorrection(sql);

    return new Response(
      JSON.stringify({ ok: true, uzbekistan, france }),
      { status: 200, headers: { "content-type": "application/json", "cache-control": "no-store" } },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ ok: false, error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { "content-type": "application/json", "cache-control": "no-store" } },
    );
  }
}
