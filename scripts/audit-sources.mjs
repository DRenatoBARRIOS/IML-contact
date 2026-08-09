import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const DEFAULT_TIMEOUT_MS = 20000;
const USER_AGENT = "IML-source-quality/2.0 (+https://www.imlhealth.org)";
const PUBLIC_OK = new Set(["verified", "redirected"]);
const PROBE_WARNING = new Set(["restricted", "transient_error"]);

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function classifyHttpStatus(status) {
  if (status === 401 || status === 403 || status === 412) return "restricted";
  if (status === 408 || status === 425 || status === 429 || status >= 500) {
    return "transient_error";
  }
  return "unverified";
}

function domainAllowed(url, expectedDomains = []) {
  if (!expectedDomains.length) return true;
  const hostname = new URL(url).hostname.toLowerCase();
  return expectedDomains.some((domain) => hostname === domain.toLowerCase());
}

function checkTextGroups(text, groups = []) {
  const normalized = normalizeText(text);
  return groups.map((group) => {
    const alternatives = Array.isArray(group) ? group : [group];
    const matched = alternatives.some((item) => normalized.includes(normalizeText(item)));
    return { alternatives, matched };
  });
}

export function classifyAuditGate(_source, result) {
  if (PUBLIC_OK.has(result.url_status)) return "pass";

  // A bot/WAF block, timeout, rate limit or 5xx is not proof that the
  // documentary source is invalid. It requires independent verification.
  if (PROBE_WARNING.has(result.url_status)) return "warning";

  // 404/410, unexpected domains and missing semantic markers remain failures.
  return "fail";
}

function withGate(source, result) {
  const gate = classifyAuditGate(source, result);
  return {
    ...result,
    gate,
    secondary_check_required: gate === "warning",
  };
}

export async function auditSource(source, options = {}) {
  const checkedAt = new Date().toISOString();
  const timeoutMs = options.timeoutMs || DEFAULT_TIMEOUT_MS;

  try {
    const response = await fetch(source.url, {
      method: "GET",
      redirect: "follow",
      headers: {
        Accept: "text/html,application/xhtml+xml,application/pdf;q=0.9,*/*;q=0.8",
        "User-Agent": USER_AGENT,
      },
      signal: AbortSignal.timeout(timeoutMs),
    });

    const finalUrl = response.url || source.url;
    const expectedDomain = domainAllowed(finalUrl, source.expected_domains);
    const body = response.ok ? await response.text() : "";
    const textChecks = checkTextGroups(body, source.required_text_groups);
    const contentVerified = textChecks.every((item) => item.matched);

    let urlStatus;
    if (!response.ok) {
      urlStatus = classifyHttpStatus(response.status);
    } else if (!expectedDomain || !contentVerified) {
      urlStatus = "unverified";
    } else {
      urlStatus = response.redirected ? "redirected" : "verified";
    }

    const result = {
      id: source.id,
      title: source.title,
      required_public_link: source.required_public_link !== false,
      requested_url: source.url,
      final_url: finalUrl,
      http_status: response.status,
      url_status: urlStatus,
      redirected: response.redirected,
      expected_domain: expectedDomain,
      content_verified: contentVerified,
      text_checks: textChecks,
      checked_at: checkedAt,
    };

    return withGate(source, result);
  } catch (error) {
    const result = {
      id: source.id,
      title: source.title,
      required_public_link: source.required_public_link !== false,
      requested_url: source.url,
      final_url: null,
      http_status: null,
      url_status: "transient_error",
      redirected: false,
      expected_domain: null,
      content_verified: false,
      text_checks: [],
      checked_at: checkedAt,
      error: error?.message || String(error),
    };

    return withGate(source, result);
  }
}

export function summarizeAudit(manifest, results) {
  const failures = results.filter((result) => result.gate === "fail");
  const warnings = results.filter((result) => result.gate === "warning");
  const passes = results.filter((result) => result.gate === "pass");

  return {
    audit_id: manifest.audit_id,
    country: manifest.country,
    checked_at: new Date().toISOString(),
    total: results.length,
    passed: passes.length,
    warnings: warnings.length,
    failed: failures.length,
    public_link_gate_passed: failures.length === 0,
    secondary_checks_required: warnings.length,
    results,
  };
}

export async function auditManifest(manifestPath) {
  const raw = await readFile(manifestPath, "utf8");
  const manifest = JSON.parse(raw);
  const results = [];

  for (const source of manifest.sources || []) {
    results.push(await auditSource(source));
  }

  return summarizeAudit(manifest, results);
}

async function main() {
  const manifestPath = process.argv[2];
  if (!manifestPath) {
    console.error("Usage: node scripts/audit-sources.mjs <manifest.json>");
    process.exitCode = 2;
    return;
  }

  const report = await auditManifest(manifestPath);
  console.log(JSON.stringify(report, null, 2));

  if (report.failed > 0) {
    process.exitCode = 1;
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
