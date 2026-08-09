import manifest from "../data/source-audits/romania.json" with { type: "json" };
import { auditSource, summarizeAudit } from "../scripts/audit-sources.mjs";

export async function GET() {
  if (process.env.VERCEL_ENV !== "preview" || process.env.VERCEL_GIT_COMMIT_REF !== "fix-romania-source-quality") {
    return Response.json({ error: "Preview branch only." }, { status: 403 });
  }

  const results = [];
  for (const source of manifest.sources || []) {
    results.push(await auditSource(source));
  }

  return Response.json(summarizeAudit(manifest, results), {
    headers: { "Cache-Control": "no-store" },
  });
}
