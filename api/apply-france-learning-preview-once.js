import { neon } from "@neondatabase/serverless";
import { applyFranceLearningResponsivenessCorrection } from "../db/seeds/20260901_france_learning_responsiveness.mjs";

const REVIEW_BRANCH = "codex/iml-lrn5-france-responsiveness";

export async function GET() {
  if (
    process.env.VERCEL_ENV !== "preview" ||
    process.env.VERCEL_GIT_COMMIT_REF !== REVIEW_BRANCH
  ) {
    return Response.json({ error: "Review Preview only." }, { status: 403 });
  }

  if (!process.env.DATABASE_URL) {
    return Response.json(
      { error: "DATABASE_URL is not available." },
      { status: 500 }
    );
  }

  try {
    const sql = neon(process.env.DATABASE_URL);
    const result = await applyFranceLearningResponsivenessCorrection(sql);

    return Response.json(result, {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Unable to apply the France Learning correction:", error);
    return Response.json(
      {
        error: "Unable to apply the France Learning correction.",
        detail: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
