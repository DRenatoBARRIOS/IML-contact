// Germany cyber-resilience and learning correction after 2020–2026 incident audit.
// Assessment date: 2026-09-22.
// Method: same operational incident-outcome review used for France.
// Scope: DEU published profile only. France is not modified by this module.

const INTERNAL_REVIEW_MARKER = "[IML internal Germany audit rationale — 2026-09-22]";
const INTERNAL_REVIEW_NOTE =
  `${INTERNAL_REVIEW_MARKER}\nSecurity 88 → 80: operational hospital and supplier incidents qualify the strength that can be inferred from Germany's formal statutory and technical safeguards.\nLearning 65 → 70: several incident records document investigation, notification, mitigation, regulatory action or corrective follow-through; national complaint-to-resolution and final judicial-outcome data remain limited.`;

async function storeInternalReviewNote(sql, profileId) {
  const rows = await sql`
    SELECT id, review_notes
    FROM country_profile_assessments
    WHERE profile_id = ${profileId}
    LIMIT 1;
  `;

  if (!rows.length) {
    await sql`
      INSERT INTO country_profile_assessments (
        profile_id, assessment_status, review_notes
      )
      VALUES (${profileId}, 'provisional', ${INTERNAL_REVIEW_NOTE});
    `;
    return;
  }

  if (!String(rows[0].review_notes || "").includes(INTERNAL_REVIEW_MARKER)) {
    const updatedNotes = rows[0].review_notes
      ? `${rows[0].review_notes}\n\n${INTERNAL_REVIEW_NOTE}`
      : INTERNAL_REVIEW_NOTE;
    await sql`
      UPDATE country_profile_assessments
      SET review_notes = ${updatedNotes}
      WHERE id = ${rows[0].id};
    `;
  }
}

const SOURCES = [
  {
    title: "SiKIS Abschlussbericht",
    publisher: "Bundesamt für Sicherheit in der Informationstechnik (BSI)",
    url: "https://www.bsi.bund.de/SharedDocs/Downloads/DE/BSI/DigitaleGesellschaft/SiKIS_Abschlussbericht.html",
    publicationDate: "2025-02-10",
    note: "Official BSI assessment of hospital information-system security. It documents ransomware-related admissions stops, emergency-service deregistration and suspended operations as recurring operational consequences.",
    indicator: {
      code: "SEC-1",
      evidenceLevel: "A",
      supportType: "supports",
      summary: "National cybersecurity evidence shows that hospital cyber incidents can materially impair essential clinical availability, qualifying a framework-only security assessment.",
      limitation: "The report characterises sector risks and examples; it does not quantify the maturity of every German hospital.",
    },
  },
  {
    title: "Uniklinik Düsseldorf wieder bereit für Notfälle",
    publisher: "Universitätsklinikum Düsseldorf",
    url: "https://www.uniklinik-duesseldorf.de/ueber-uns/pressemitteilungen/detail/uniklinik-duesseldorf-wieder-bereit-fuer-notfaelle",
    publicationDate: "2020-09-23",
    note: "Primary hospital documentation showing that the university hospital was deregistered from emergency care for 13 days following the September 2020 cyberattack.",
    indicator: {
      code: "SEC-1",
      evidenceLevel: "A",
      supportType: "supports",
      summary: "Directly documents prolonged loss of emergency-care availability following a cyberattack.",
      limitation: "A single hospital incident cannot by itself define national security maturity.",
    },
  },
  {
    title: "Information über den Cyberangriff bei der Klinikum Lippe GmbH",
    publisher: "Klinikum Lippe",
    url: "https://www.klinikum-lippe.de/cyberangriff2022/",
    publicationDate: "2023-03-09",
    note: "Primary post-incident account documenting possible personal-data theft, completed investigation, rebuilt infrastructure and additional technologies for earlier attack detection and defence.",
    indicator: {
      code: "LRN-2",
      evidenceLevel: "B",
      supportType: "partially_supports",
      summary: "Documents a visible incident-to-investigation-to-correction loop, including infrastructure replacement and added detection controls.",
      limitation: "The public account is the affected organisation's own report and does not provide an independent effectiveness audit of the corrective measures.",
    },
  },
  {
    title: "Informationen zum Cyberangriff auf unimed",
    publisher: "unimed",
    url: "https://www.unimed.de/sicherheit/",
    publicationDate: "2026-05-29",
    note: "Documents the April 2026 supplier attack, data theft, regulator and police notification, external forensics, affected-customer notification and security restoration before reconnection.",
    indicator: {
      code: "LRN-2",
      evidenceLevel: "B",
      supportType: "partially_supports",
      summary: "Provides current evidence of rapid detection, notification, forensic investigation and corrective action after a health-sector supplier breach.",
      limitation: "The source is the affected supplier's own account and final regulatory or judicial outcomes remain pending.",
    },
  },
  {
    title: "Tätigkeitsbericht Datenschutz 2025",
    publisher: "Hamburgischer Beauftragter für Datenschutz und Informationsfreiheit",
    url: "https://datenschutz-hamburg.de/service-information/taetigkeitsberichte/taetigkeitsbericht-datenschutz-2025",
    publicationDate: null,
    note: "Official regulator report documenting mitigation of ePA security weaknesses before nationwide rollout and enforcement after unauthorised access to a hospital patient record.",
    indicator: {
      code: "LRN-2",
      evidenceLevel: "A",
      supportType: "supports",
      summary: "Shows operational feedback, mitigation and enforcement rather than merely the existence of formal procedures.",
      limitation: "The examples are jurisdiction-specific and do not establish uniform national follow-through.",
    },
  },
  {
    title: "Jahresbericht 2024",
    publisher: "Berliner Beauftragte für Datenschutz und Informationsfreiheit",
    url: "https://www.datenschutz-berlin.de/jahresbericht-2024",
    publicationDate: null,
    note: "Official regulator report documenting a EUR 60,000 fine for security deficiencies in practice-management software affecting health-data confidentiality.",
    indicator: {
      code: "LRN-2",
      evidenceLevel: "A",
      supportType: "supports",
      summary: "Provides traceable evidence that identified security weaknesses can lead to a formal regulatory outcome.",
      limitation: "A regulatory sanction demonstrates enforcement in one case, not the completeness of redress or correction across Germany.",
    },
  },
];

async function upsertSource(sql, profileId, source) {
  const existing = await sql`
    SELECT id
    FROM country_profile_sources
    WHERE profile_id = ${profileId}
      AND source_url = ${source.url}
    ORDER BY id
    LIMIT 1;
  `;

  let sourceId;
  if (existing.length) {
    sourceId = existing[0].id;
    await sql`
      UPDATE country_profile_sources
      SET title = ${source.title},
          publisher = ${source.publisher},
          publication_date = ${source.publicationDate},
          accessed_at = '2026-09-22',
          evidence_note = ${source.note},
          public_url = ${source.url},
          url_status = 'verified',
          last_checked_at = '2026-09-22',
          replacement_reason = 'Revalidated for Germany cyber-resilience audit on 22 September 2026.'
      WHERE id = ${sourceId};
    `;
  } else {
    const inserted = await sql`
      INSERT INTO country_profile_sources (
        profile_id, title, publisher, source_url, publication_date, accessed_at,
        evidence_note, public_url, url_status, last_checked_at, replacement_reason
      )
      VALUES (
        ${profileId}, ${source.title}, ${source.publisher}, ${source.url},
        ${source.publicationDate}, '2026-09-22', ${source.note},
        ${source.url}, 'verified', '2026-09-22',
        'Added for Germany cyber-resilience audit on 22 September 2026.'
      )
      RETURNING id;
    `;
    sourceId = inserted[0].id;
  }

  const indicator = source.indicator;
  const linked = await sql`
    SELECT id
    FROM country_profile_source_indicators
    WHERE source_id = ${sourceId}
      AND indicator_code = ${indicator.code}
    ORDER BY id
    LIMIT 1;
  `;

  if (linked.length) {
    await sql`
      UPDATE country_profile_source_indicators
      SET evidence_level = ${indicator.evidenceLevel},
          support_type = ${indicator.supportType},
          evidence_summary = ${indicator.summary},
          limitation_note = ${indicator.limitation},
          evidence_direction = 'unknown',
          evidence_scope = 'unknown',
          implementation_status = 'not_assessed'
      WHERE id = ${linked[0].id};
    `;
  } else {
    await sql`
      INSERT INTO country_profile_source_indicators (
        source_id, indicator_code, evidence_level, support_type,
        evidence_summary, limitation_note, evidence_direction,
        evidence_scope, implementation_status
      )
      VALUES (
        ${sourceId}, ${indicator.code}, ${indicator.evidenceLevel},
        ${indicator.supportType}, ${indicator.summary}, ${indicator.limitation},
        'unknown', 'unknown', 'not_assessed'
      );
    `;
  }

  return sourceId;
}

export async function applyGermanyCyberAuditCorrection(sql) {
  const profileRows = await sql`
    SELECT cp.id
    FROM country_profiles cp
    JOIN countries c ON c.id = cp.country_id
    WHERE c.iso3 = 'DEU'
      AND cp.status = 'published'
    ORDER BY cp.version DESC
    LIMIT 1;
  `;

  if (profileRows.length !== 1) {
    throw new Error("Published Germany country profile not found.");
  }

  const profileId = profileRows[0].id;

  await sql`
    INSERT INTO country_profile_scores (profile_id, domain_code, score)
    VALUES
      (${profileId}, 'security', 80),
      (${profileId}, 'learning', 70)
    ON CONFLICT (profile_id, domain_code)
    DO UPDATE SET score = EXCLUDED.score;
  `;

  await sql`
    UPDATE country_profiles
    SET assessment_date = '2026-09-22',
        updated_at = NOW()
    WHERE id = ${profileId};
  `;

  await storeInternalReviewNote(sql, profileId);

  await sql`
    DELETE FROM country_profile_notes
    WHERE profile_id = ${profileId}
      AND note_type = 'watch'
      AND (
        note_text LIKE 'Security revised from 88 to 80 on 22 September 2026%'
        OR note_text LIKE 'Learning revised from 65 to 70 on 22 September 2026%'
      );
  `;

  const sourceIds = [];
  for (const source of SOURCES) {
    sourceIds.push(await upsertSource(sql, profileId, source));
  }

  const verification = await sql`
    SELECT
      ROUND(AVG(score))::int AS overall_score,
      MAX(score) FILTER (WHERE domain_code = 'security')::int AS security_score,
      MAX(score) FILTER (WHERE domain_code = 'learning')::int AS learning_score
    FROM country_profile_scores
    WHERE profile_id = ${profileId};
  `;

  return {
    iso3: "DEU",
    profileId,
    securityScore: verification[0].security_score,
    learningScore: verification[0].learning_score,
    overallScore: verification[0].overall_score,
    sourceIds,
  };
}
