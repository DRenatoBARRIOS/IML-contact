import { neon } from "@neondatabase/serverless";
import { ensurePatientHarmRedressLearningWorkstream } from "../db/seeds/20260906_patient_harm_redress_learning.mjs";

export async function GET() {
  if (!process.env.DATABASE_URL) {
    return Response.json(
      { error: "DATABASE_URL is not available." },
      { status: 500 }
    );
  }

  try {
    const sql = neon(process.env.DATABASE_URL);

    if (
      process.env.VERCEL_ENV === "preview" &&
      process.env.VERCEL_GIT_COMMIT_REF === "main-test"
    ) {
      await ensurePatientHarmRedressLearningWorkstream(sql);
    }

    const tableState = await sql`
      SELECT to_regclass('public.iml_research_workstreams') AS table_name;
    `;

    if (!tableState[0]?.table_name) {
      return Response.json(
        { count: 0, workstreams: [], note: "Research workstream registry is not initialised in this environment." },
        { status: 200, headers: { "Cache-Control": "no-store" } }
      );
    }

    const workstreams = await sql`
      SELECT
        code,
        title,
        status,
        scoring_status,
        conclusion_status,
        scope,
        study_question,
        comparison_dimensions,
        evidence_policy,
        registered_at,
        updated_at
      FROM iml_research_workstreams
      ORDER BY registered_at DESC, code;
    `;

    return Response.json(
      { count: workstreams.length, workstreams },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Unable to load IML research workstreams:", error);
    return Response.json(
      { error: "Unable to load research workstreams." },
      { status: 500 }
    );
  }
}
