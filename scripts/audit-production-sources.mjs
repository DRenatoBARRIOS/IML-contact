import { writeFile } from "node:fs/promises";

const DEFAULT_API = "https://www.imlhealth.org/api/countries";
const TIMEOUT_MS = 15000;
const CONCURRENCY = 8;
const MAX_VALIDATED_AGE_DAYS = 35;
const RETRY_DELAY_MS = 1200;

const PUBLISHABLE = new Set(["verified", "redirected"]);
const BLOCKED_HTTP = new Set([401, 403, 412]);
const TRANSIENT_HTTP = new Set([408, 425, 429]);
const BROKEN_HTTP = new Set([404, 410]);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function ageDays(value) {
  if (!value) return null;
  const time = Date.parse(value);
  if (!Number.isFinite(time)) return null;
  return Math.floor((Date.now() - time) / 86400000);
}

function classifyHttp(status) {
  if (status >= 200 && status < 400) return "reachable";
  if (BROKEN_HTTP.has(status)) return "broken";
  if (BLOCKED_HTTP.has(status)) return "blocked";
  if (TRANSIENT_HTTP.has(status) || status >= 500) return "transient";
  if (status >= 400 && status < 500) return "client_error";
  return "unknown";
}

async function probeOnce(url) {
  const checkedAt = new Date().toISOString();
  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      headers: {
        Accept: "text/html,application/xhtml+xml,application/pdf;q=0.9,*/*;q=0.8",
        "User-Agent": "IML-source-quality/2.0 (+https://www.imlhealth.org)",
      },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const result = {
      checked_at: checkedAt,
      requested_url: url,
      final_url: response.url || url,
      http_status: response.status,
      redirected: response.redirected,
      classification: classifyHttp(response.status),
      error: null,
    };
    try { await response.body?.cancel(); } catch {}
    return result;
  } catch (error) {
    return {
      checked_at: checkedAt,
      requested_url: url,
      final_url: null,
      http_status: null,
      redirected: false,
      classification: "fetch_error",
      error: error?.message || String(error),
    };
  }
}

function consolidateAttempts(attempts) {
  if (attempts.some((item) => item.classification === "reachable")) return "reachable";
  if (attempts.length >= 2 && attempts.every((item) => item.classification === "broken")) return "confirmed_broken";
  if (attempts.every((item) => item.classification === "blocked")) return "blocked";
  if (attempts.every((item) => ["transient", "fetch_error"].includes(item.classification))) return "transient";
  return "inconclusive";
}

async function probeWithRetry(url) {
  const first = await probeOnce(url);
  if (first.classification === "reachable") return { outcome: "reachable", attempts: [first] };
  await sleep(RETRY_DELAY_MS);
  const second = await probeOnce(url);
  return { outcome: consolidateAttempts([first, second]), attempts: [first, second] };
}

async function mapLimit(items, limit, fn) {
  const results = new Array(items.length);
  let cursor = 0;
  async function worker() {
    while (true) {
      const index = cursor++;
      if (index >= items.length) return;
      results[index] = await fn(items[index]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

function inspectMetadata(source, duplicatePublicUrls, duplicateDocumentaryUrls) {
  const errors = [];
  const warnings = [];
  if (!source.title) errors.push("missing_title");
  if (!source.publisher) errors.push("missing_publisher");
  if (!source.documentary_url) errors.push("missing_documentary_url");
  if (!source.url_status) errors.push("missing_url_status");
  if (source.url && !PUBLISHABLE.has(source.url_status)) errors.push("public_url_exposed_with_non_publishable_status");
  if (!source.url && source.url_status === "verified" && !source.replacement_reason) warnings.push("verified_documentary_only_without_explanation");

  const checkedAge = ageDays(source.last_checked_at);
  if (checkedAge == null) warnings.push("missing_last_validated_at");
  else if (checkedAge > MAX_VALIDATED_AGE_DAYS) warnings.push("validated_review_due");
  if (!source.note) warnings.push("missing_evidence_note");

  if (!Array.isArray(source.indicators) || source.indicators.length === 0) errors.push("source_without_indicator");
  else source.indicators.forEach((indicator) => {
    if (!indicator.code) errors.push("indicator_missing_code");
    if (!indicator.evidence_level) errors.push(`indicator_${indicator.code || "unknown"}_missing_evidence_level`);
    if (!indicator.support_type) errors.push(`indicator_${indicator.code || "unknown"}_missing_support_type`);
    if (!indicator.summary) warnings.push(`indicator_${indicator.code || "unknown"}_missing_summary`);
    if (!indicator.limitation) warnings.push(`indicator_${indicator.code || "unknown"}_missing_limitation`);
  });

  if (source.url && duplicatePublicUrls.has(source.url)) warnings.push("duplicate_public_url_within_country");
  if (source.documentary_url && duplicateDocumentaryUrls.has(source.documentary_url)) warnings.push("duplicate_documentary_url_within_country");
  return { checkedAge, errors: [...new Set(errors)], warnings: [...new Set(warnings)] };
}

function duplicates(values) {
  const counts = new Map();
  values.filter(Boolean).forEach((value) => counts.set(value, (counts.get(value) || 0) + 1));
  return new Set([...counts.entries()].filter(([, count]) => count > 1).map(([value]) => value));
}

async function main() {
  const apiUrl = process.argv[2] || DEFAULT_API;
  const outputPath = process.argv[3] || null;
  const response = await fetch(apiUrl, {
    headers: { Accept: "application/json", "User-Agent": "IML-source-quality/2.0" },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`Country API returned HTTP ${response.status}`);
  const payload = await response.json();
  const countries = Array.isArray(payload.countries) ? payload.countries : [];

  const sourceRows = [];
  for (const country of countries) {
    const sources = Array.isArray(country.sources) ? country.sources : [];
    const duplicatePublicUrls = duplicates(sources.map((source) => source.url));
    const duplicateDocumentaryUrls = duplicates(sources.map((source) => source.documentary_url));
    for (const source of sources) {
      const metadata = inspectMetadata(source, duplicatePublicUrls, duplicateDocumentaryUrls);
      sourceRows.push({
        iso3: country.iso3,
        country: country.name,
        title: source.title,
        publisher: source.publisher,
        public_url: source.url,
        documentary_url: source.documentary_url,
        stored_status: source.url_status,
        last_validated_at: source.last_checked_at,
        validated_age_days: metadata.checkedAge,
        metadata_errors: metadata.errors,
        metadata_warnings: metadata.warnings,
      });
    }
  }

  const publicRows = sourceRows.filter((row) => row.public_url);
  const probeResults = await mapLimit(publicRows, CONCURRENCY, async (row) => ({
    key: `${row.iso3}::${row.title}`,
    ...(await probeWithRetry(row.public_url)),
  }));
  const probes = new Map(probeResults.map((result) => [result.key, result]));

  const results = sourceRows.map((row) => {
    const key = `${row.iso3}::${row.title}`;
    const probe = row.public_url ? probes.get(key) : null;
    const errors = [...row.metadata_errors];
    const warnings = [...row.metadata_warnings];
    if (probe?.outcome === "confirmed_broken") errors.push("public_link_confirmed_broken_404_410");
    else if (probe?.outcome === "blocked") warnings.push("automated_probe_blocked_secondary_check_required");
    else if (probe?.outcome === "transient") warnings.push("automated_probe_transient_secondary_check_required");
    else if (probe?.outcome === "inconclusive") warnings.push("automated_probe_inconclusive_secondary_check_required");

    if (probe?.outcome === "reachable") {
      const lastAttempt = [...probe.attempts].reverse().find((item) => item.classification === "reachable");
      if (row.stored_status === "verified" && lastAttempt?.redirected) warnings.push("stored_verified_but_redirects_now");
      if (row.stored_status === "redirected" && !lastAttempt?.redirected) warnings.push("stored_redirected_but_direct_now");
    }

    return { ...row, probe: probe || { outcome: "not_public", attempts: [] }, errors: [...new Set(errors)], warnings: [...new Set(warnings)] };
  });

  const byCountry = countries.map((country) => {
    const rows = results.filter((row) => row.iso3 === country.iso3);
    return {
      iso3: country.iso3,
      country: country.name,
      sources: rows.length,
      public_links: rows.filter((row) => row.public_url).length,
      documentary_only: rows.filter((row) => !row.public_url).length,
      confirmed_broken: rows.filter((row) => row.probe.outcome === "confirmed_broken").length,
      blocked_or_transient: rows.filter((row) => ["blocked", "transient", "inconclusive"].includes(row.probe.outcome)).length,
      errors: rows.reduce((sum, row) => sum + row.errors.length, 0),
      warnings: rows.reduce((sum, row) => sum + row.warnings.length, 0),
    };
  });

  const report = {
    protocol_version: "2.0",
    audited_at: new Date().toISOString(),
    api_url: apiUrl,
    countries: countries.length,
    sources: results.length,
    public_links: results.filter((row) => row.public_url).length,
    documentary_only: results.filter((row) => !row.public_url).length,
    confirmed_broken: results.filter((row) => row.probe.outcome === "confirmed_broken").length,
    blocked_or_transient: results.filter((row) => ["blocked", "transient", "inconclusive"].includes(row.probe.outcome)).length,
    metadata_errors: results.reduce((sum, row) => sum + row.metadata_errors.length, 0),
    validation_due: results.filter((row) => row.metadata_warnings.includes("validated_review_due")).length,
    hard_failures: results.reduce((sum, row) => sum + row.errors.length, 0),
    by_country: byCountry,
    items_requiring_attention: results.filter((row) => row.errors.length || row.warnings.length),
  };

  const json = JSON.stringify(report, null, 2);
  console.log(json);
  if (outputPath) await writeFile(outputPath, `${json}\n`, "utf8");
  if (report.hard_failures > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(JSON.stringify({ error: error?.message || String(error) }, null, 2));
  process.exitCode = 2;
});
