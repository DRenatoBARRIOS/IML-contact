import { neon } from "@neondatabase/serverless";
import { patchRomaniaSourceQuality } from "../db/seeds/20260809_romania_source_quality_patch.mjs";

export async function GET() {
  if (process.env.VERCEL_ENV !== "preview" || process.env.VERCEL_GIT_COMMIT_REF !== "fix-romania-source-quality") {
    return Response.json({ error: "Preview branch only." }, { status: 403 });
  }

  if (!process.env.DATABASE_URL) {
    return Response.json({ error: "DATABASE_URL is not available." }, { status: 500 });
  }

  try {
    const sql = neon(process.env.DATABASE_URL);
    const result = await patchRomaniaSourceQuality(sql);
    return Response.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return Response.json(
      { error: "Romania source-quality preview verification failed.", detail: error?.message || String(error) },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
