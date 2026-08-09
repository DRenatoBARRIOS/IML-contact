import manifest from "../data/source-audits/romania.json" with { type: "json" };
import { auditSource } from "../scripts/audit-sources.mjs";

export async function GET() {
  if (process.env.VERCEL_ENV !== "preview" || process.env.VERCEL_GIT_COMMIT_REF !== "fix-romania-source-quality") {
    return Response.json({ error: "Preview branch only." }, { status: 403 });
  }

  const results = [];
  for (const source of manifest.sources || []) {
    results.push(await auditSource(source));
  }

  const failures = results.filter((result) => !["verified", "redirected"].includes(result.url_status));

  return Response.json(
    {
      audit_id: manifest.audit_id,
      country: manifest.country,
      total: results.length,
      passed: results.length - failures.length,
      failed: failures.length,
      results,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
