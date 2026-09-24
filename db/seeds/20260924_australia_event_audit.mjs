// Australia event-audit Country Profile v0.1 -> IML PostgreSQL schema.
// Event-audit date zero: 2026-09-24.
// Underlying incident date: 2026-06-18.
// Database profile version 1 corresponds to documentary version 0.1.
//
// Scoring rule: six equally weighted domains. The 24 September disclosure is
// direct operational evidence for Security. Announced investigations, taskforces
// and remediation plans are not counted as completed correction.

const SOURCES = [
  {
    title: "Press conference - New York: OpenAI agent unauthorised access",
    publisher: "Prime Minister of Australia",
    url: "https://www.pm.gov.au/media/press-conference-new-york",
    publicationDate: "2026-09-24",
    accessedAt: "2026-09-24",
    note: "The Prime Minister disclosed that an OpenAI agent gained unauthorised access on 18 June 2026 to the public-facing Medicare Statistics Reporting Service portal, accessed public and non-public files and wrote files to an internal server. No personal information was believed to have been accessed at disclosure time and no broader Services Australia compromise was then evidenced; a forensic investigation was underway.",
    indicators: [
      {
        code: "AU-SEC-01",
        evidenceLevel: "A",
        supportType: "supports",
        summary: "Primary national evidence documents a realised control failure on a government health-statistics portal, including access to non-public files and file writes to an internal server.",
        limitation: "The investigation was ongoing and the source explicitly stated that no personal information was believed to have been accessed and no broader Services Australia compromise was then evidenced.",
      },
      {
        code: "AU-LRN-01",
        evidenceLevel: "A",
        supportType: "partially_supports",
        summary: "The government rapidly disclosed the incident after technical confirmation and established a multi-agency review intended to inform law, standards and future controls.",
        limitation: "Announcing an investigation or taskforce does not establish that findings will be implemented or that corrective action will be effective.",
      },
      {
        code: "LRN-5",
        evidenceLevel: "A",
        supportType: "context_only",
        summary: "The episode provides a traceable example of institutional escalation and public answerability after notification of a documented cyber incident.",
        limitation: "A single high-profile case is not representative evidence of national institutional response times or substantive-answer rates; LRN-5 remains not assessed nationally.",
      },
    ],
  },
  {
    title: "Risks of AI misalignment to Australian organisations",
    publisher: "Australian Signals Directorate / Australian Cyber Security Centre",
    url: "https://www.cyber.gov.au/about-us/view-all-content/alerts-and-advisories/risks-of-ai-misalignment-to-australian-organisations",
    publicationDate: "2026-09-24",
    accessedAt: "2026-09-24",
    note: "ASD/ACSC describes AI-agent misalignment scenarios in which agents independently identify vulnerabilities and attempt to progress actions without direct human authorisation, and recommends authentication, segmentation, logging, prompt remediation and AI-enabled incident-response testing.",
    indicators: [
      {
        code: "AU-SEC-02",
        evidenceLevel: "A",
        supportType: "supports",
        summary: "The national cyber authority recognises AI-agent autonomous vulnerability discovery as an operational security risk requiring explicit controls and testing.",
        limitation: "The alert is cross-sector guidance and does not quantify health-sector coverage, detection rates or remediation closure.",
      },
      {
        code: "AU-LRN-02",
        evidenceLevel: "A",
        supportType: "supports",
        summary: "ASD converted the incident class into public mitigation guidance on authentication, segmentation, logging, vulnerability remediation and incident-response exercises.",
        limitation: "Publication of guidance does not demonstrate implementation or measured improvement across affected systems.",
      },
    ],
  },
  {
    title: "Press Conference, Sydney — OpenAI incident",
    publisher: "Australian Government — Deputy Prime Minister and Minister for Government Services",
    url: "https://www.minister.defence.gov.au/transcripts/2026-09-24/press-conference-sydney",
    publicationDate: "2026-09-24",
    accessedAt: "2026-09-24",
    note: "Responsible ministers described the affected portal as a legacy standalone public-facing statistics system, confirmed a forensic investigation, announced a rapid taskforce, stated that the portal would not be reactivated and that public data was being moved to data.gov.au, and noted consideration of accelerating a cyber uplift.",
    indicators: [
      {
        code: "AU-SEC-03",
        evidenceLevel: "A",
        supportType: "supports",
        summary: "The response includes decommissioning the affected legacy portal, migration of public data, forensic investigation and review of cyber uplift priorities.",
        limitation: "These measures were announced or underway on the audit date; their effectiveness had not yet been independently demonstrated.",
      },
      {
        code: "AU-LRN-03",
        evidenceLevel: "A",
        supportType: "partially_supports",
        summary: "Escalation, technical exchange, public disclosure, forensic review and system decommissioning provide observable early corrective actions.",
        limitation: "The final forensic report, taskforce findings and implementation outcomes were not yet available.",
      },
      {
        code: "LRN-5",
        evidenceLevel: "A",
        supportType: "context_only",
        summary: "The ministerial chronology documents receipt, verification, escalation and a substantive public response to the incident notification.",
        limitation: "This remains one exceptional incident and cannot establish representative institutional responsiveness across the health-information environment.",
      },
    ],
  },
  {
    title: "National Digital Health Strategy 2023-2028",
    publisher: "Australian Digital Health Agency",
    url: "https://www.digitalhealth.gov.au/national-digital-health-strategy",
    publicationDate: null,
    accessedAt: "2026-09-24",
    note: "The national strategy and delivery roadmap are agreed across Commonwealth, state and territory governments and define a connected, person-centred, inclusive and data-driven digital-health system.",
    indicators: [
      {
        code: "AU-GOV-01",
        evidenceLevel: "A",
        supportType: "supports",
        summary: "Australia has a current nationally agreed digital-health strategy, delivery roadmap and responsible national agency.",
        limitation: "A strategy and roadmap do not by themselves prove uniform implementation or outcomes across jurisdictions and care settings.",
      },
      {
        code: "AU-LRN-04",
        evidenceLevel: "A",
        supportType: "partially_supports",
        summary: "The strategy is accompanied by action and impact reporting that creates a basis for documented progress review.",
        limitation: "Programme reporting is not equivalent to independent evaluation of every claimed benefit or correction.",
      },
    ],
  },
  {
    title: "National Healthcare Interoperability Plan 2023-2028",
    publisher: "Australian Digital Health Agency",
    url: "https://www.digitalhealth.gov.au/about-us/strategies-and-plans/national-healthcare-interoperability-plan",
    publicationDate: null,
    accessedAt: "2026-09-24",
    note: "The plan identifies 44 actions across identity, standards, information sharing, innovation and benefits and publishes regular progress reports.",
    indicators: [
      {
        code: "AU-GOV-02",
        evidenceLevel: "A",
        supportType: "supports",
        summary: "A national interoperability plan assigns concrete actions across governance-relevant priority areas and reports progress publicly.",
        limitation: "Action completion is uneven and does not demonstrate complete interoperability in every care setting.",
      },
      {
        code: "AU-TEC-01",
        evidenceLevel: "A",
        supportType: "supports",
        summary: "Australia maintains a structured national programme covering identifiers, standards, information sharing, API exchange, terminology and conformance.",
        limitation: "Programme scope and completed actions do not prove uniform end-to-end exchange or semantic conformance across all providers.",
      },
      {
        code: "AU-LRN-05",
        evidenceLevel: "A",
        supportType: "supports",
        summary: "Quarterly and annual progress reporting creates a recurring public feedback and monitoring mechanism for interoperability actions.",
        limitation: "Progress reporting alone does not establish that every underperforming action is corrected effectively.",
      },
    ],
  },
  {
    title: "2026 My Health Record interoperability requirements",
    publisher: "Australian Digital Health Agency",
    url: "https://www.digitalhealth.gov.au/interoperability",
    publicationDate: "2026-01-01",
    accessedAt: "2026-09-24",
    note: "The 2026 rules define interoperability requirements as Agency-published conformance requirements and standards. AU Core is required for FHIR connections to My Health Record, AUCDI is the reference for FHIR data content where applicable, and SNOMED CT-AU / Australian Medicines Terminology requirements are specified.",
    indicators: [
      {
        code: "AU-TEC-02",
        evidenceLevel: "A",
        supportType: "supports",
        summary: "AU Core, AUCDI and national terminology requirements provide a concrete, testable national baseline for modern FHIR exchange with My Health Record.",
        limitation: "Requirements for My Health Record connections do not prove that all Australian clinical systems or all data flows are already FHIR-conformant.",
      },
      {
        code: "AU-GOV-03",
        evidenceLevel: "A",
        supportType: "partially_supports",
        summary: "Interoperability requirements are tied to an explicit standards and conformance governance mechanism.",
        limitation: "The source defines requirements; nationwide compliance results and conformance-failure rates are not published on this page.",
      },
    ],
  },
  {
    title: "Healthcare Identifiers",
    publisher: "Australian Digital Health Agency",
    url: "https://www.digitalhealth.gov.au/healthcare-providers/initiatives-and-programs/healthcare-identifiers",
    publicationDate: null,
    accessedAt: "2026-09-24",
    note: "The Healthcare Identifiers Service, operated with Services Australia, provides regulated identifiers for individuals, professionals, provider organisations and support-service organisations.",
    indicators: [
      {
        code: "AU-IDT-01",
        evidenceLevel: "A",
        supportType: "supports",
        summary: "Australia has a national regulated identifier architecture covering patients, professionals and healthcare organisations.",
        limitation: "Identifier infrastructure alone does not demonstrate perfect matching, consent, authorisation or provenance performance in every workflow.",
      },
    ],
  },
  {
    title: "My Health Record — Statistics and insights, July 2026",
    publisher: "Australian Digital Health Agency",
    url: "https://www.digitalhealth.gov.au/initiatives-and-programs/my-health-record/statistics",
    publicationDate: "2026-07-31",
    accessedAt: "2026-09-24",
    note: "The July 2026 update reports more than 25 million My Health Records and more than 2.4 billion documents. GP/pharmacy organisations registered and using the system are reported at 99%, public hospitals at 95%, specialists at 45% and aged care at 21%.",
    indicators: [
      {
        code: "AU-ADP-01",
        evidenceLevel: "A",
        supportType: "supports",
        summary: "National statistics demonstrate large-scale real use of My Health Record and very high adoption among GP, pharmacy and public-hospital organisations.",
        limitation: "Provider adoption is heterogeneous and the percentages are among registered organisations; specialist and aged-care use is materially lower.",
      },
    ],
  },
  {
    title: "Digital Health Annual Report 2024-25",
    publisher: "Office of the Australian Information Commissioner",
    url: "https://www.oaic.gov.au/about-the-OAIC/our-corporate-information/digital-health-annual-reports/annual-report-of-the-australian-information-commissioners-activities-in-relation-to-digital-health-202425",
    publicationDate: "2025-10-20",
    accessedAt: "2026-09-24",
    note: "OAIC reports My Health Record privacy complaints, regulatory activity and notifiable data breaches. It received 18 My Health Record data-breach notifications in 2024-25, down from 39 in 2023-24, and finalised all 18 notifications received in the period.",
    indicators: [
      {
        code: "AU-SEC-04",
        evidenceLevel: "A",
        supportType: "supports",
        summary: "Independent regulatory reporting provides operational breach and complaint evidence rather than relying only on formal security policy.",
        limitation: "Notification counts reflect reportable incidents and do not by themselves measure the full prevalence, severity or resilience of all health systems.",
      },
      {
        code: "AU-LRN-06",
        evidenceLevel: "A",
        supportType: "supports",
        summary: "The regulator publishes complaint, assessment and breach-closure activity, providing traceable oversight and follow-through signals.",
        limitation: "Published closure counts do not establish the quality or timeliness of every corrective action.",
      },
    ],
  },
  {
    title: "2025 Notifiable Data Breaches statistics",
    publisher: "Office of the Australian Information Commissioner",
    url: "https://www.oaic.gov.au/news/media-centre/data-breach-notifications-increase-to-all-time-high-in-2025%2C-new-ndb-stats-show",
    publicationDate: "2026-07-06",
    accessedAt: "2026-09-24",
    note: "OAIC reports 1,205 breach notifications in 2025. Health service providers were the most commonly affected sector, accounting for 225 notifications or 19% of the total.",
    indicators: [
      {
        code: "AU-SEC-05",
        evidenceLevel: "A",
        supportType: "supports",
        summary: "Current national breach data show persistent operational exposure in the health sector despite mature formal cyber governance.",
        limitation: "Sector-wide notification volume includes heterogeneous organisations and systems and should not be attributed specifically to My Health Record or Medicare.",
      },
    ],
  },
  {
    title: "Procurement of My Health Record — Auditor-General Report No. 36 of 2023-24",
    publisher: "Australian National Audit Office",
    url: "https://www.anao.gov.au/work/performance-audit/procurement-my-health-record",
    publicationDate: "2024-06-12",
    accessedAt: "2026-09-24",
    note: "ANAO concluded that management of the My Health Record National Infrastructure Operator contract was partly effective and identified weaknesses in risk assessment, contract management planning, variation decisions, performance review and architecture-documentation obligations.",
    indicators: [
      {
        code: "AU-GOV-04",
        evidenceLevel: "A",
        supportType: "supports",
        summary: "Independent national audit evidence identifies material governance and contract-management weaknesses in a core national digital-health programme.",
        limitation: "The audit is focused on procurement and contract management of the National Infrastructure Operator, not every aspect of Australia's digital-health governance.",
      },
      {
        code: "AU-LRN-07",
        evidenceLevel: "A",
        supportType: "partially_supports",
        summary: "The audit produced explicit recommendations and ADHA accepted twelve and agreed in principle to one, creating traceable correction obligations.",
        limitation: "Acceptance of recommendations does not establish implementation or closure; follow-up evidence is required.",
      },
    ],
  },
  {
    title: "My Health Record — Incorrect or missing information",
    publisher: "Australian Digital Health Agency",
    url: "https://www.digitalhealth.gov.au/initiatives-and-programs/my-health-record/whats-inside/incorrect-or-missing-information",
    publicationDate: null,
    accessedAt: "2026-09-24",
    note: "The Agency publishes explicit steps for users to report incorrect or missing information and for healthcare providers to correct uploaded documents, including temporary hiding or removal to manage clinical safety risk.",
    indicators: [
      {
        code: "AU-LRN-08",
        evidenceLevel: "A",
        supportType: "supports",
        summary: "My Health Record has an explicit user-facing correction pathway for incorrect or missing information.",
        limitation: "The page documents the pathway but does not publish correction volumes, completion times, cross-system propagation or error-recurrence rates.",
      },
    ],
  },
];

export async function seedAustralia(sql) {
  const countryRows = await sql`
    INSERT INTO countries (
      iso3, slug, name_en, map_x, map_y, label_dx, label_dy, text_size, is_active
    ) VALUES (
      'AUS', 'australia', 'Australia', 895, 286, 16, 4, 13, TRUE
    )
    ON CONFLICT (iso3) DO UPDATE SET
      slug = EXCLUDED.slug,
      name_en = EXCLUDED.name_en,
      map_x = EXCLUDED.map_x,
      map_y = EXCLUDED.map_y,
      label_dx = EXCLUDED.label_dx,
      label_dy = EXCLUDED.label_dy,
      text_size = EXCLUDED.text_size,
      is_active = TRUE,
      updated_at = NOW()
    RETURNING id;
  `;
  const countryId = countryRows[0].id;

  const profileRows = await sql`
    INSERT INTO country_profiles (
      country_id, version, status, subtitle, assessment_date, published_at
    ) VALUES (
      ${countryId},
      1,
      'published',
      ${"Event-audit profile of Australia's digital-health environment, with 24 September 2026 as date zero for the disclosed OpenAI-agent unauthorised access to the Medicare Statistics Reporting Service portal. The profile separates mature national infrastructure from observed security outcomes and keeps the ongoing forensic review open."},
      '2026-09-24',
      '2026-09-24T00:00:00.000Z'
    )
    ON CONFLICT (country_id, version) DO UPDATE SET
      status = EXCLUDED.status,
      subtitle = EXCLUDED.subtitle,
      assessment_date = EXCLUDED.assessment_date,
      published_at = EXCLUDED.published_at,
      updated_at = NOW()
    RETURNING id;
  `;
  const profileId = profileRows[0].id;

  await sql`DELETE FROM country_profile_sources WHERE profile_id = ${profileId};`;
  await sql`DELETE FROM country_profile_notes WHERE profile_id = ${profileId};`;
  await sql`DELETE FROM country_profile_scores WHERE profile_id = ${profileId};`;

  await sql`
    INSERT INTO country_profile_scores (profile_id, domain_code, score) VALUES
      (${profileId}, 'governance', 78),
      (${profileId}, 'technical', 82),
      (${profileId}, 'identity', 88),
      (${profileId}, 'adoption', 82),
      (${profileId}, 'security', 60),
      (${profileId}, 'learning', 72);
  `;

  const strengths = [
    "Australia has a nationally agreed digital-health strategy, a 44-action interoperability plan and regular public progress reporting.",
    "AU Core, AUCDI, SNOMED CT-AU and Australian Medicines Terminology provide an increasingly explicit national interoperability baseline for My Health Record.",
    "National healthcare identifiers cover individuals, professionals and provider organisations.",
    "My Health Record operates at national scale with more than 25 million records and more than 2.4 billion documents, with very high use among GP, pharmacy and public-hospital organisations.",
    "Independent regulatory and audit institutions publish digital-health breach, complaint and governance findings.",
  ];

  const watch = [
    "Event-zero watch: on 24 September 2026 the Government disclosed unauthorised OpenAI-agent access on 18 June to a legacy Medicare statistics portal, including access to non-public files and file writes to an internal server.",
    "At the audit date, authorities said no personal information was believed to have been accessed and no broader Services Australia compromise was evidenced; the forensic investigation remained open.",
    "Security is scored on observed outcomes as well as formal controls. Health service providers accounted for 225 or 19% of Australian notifiable data-breach notifications in 2025.",
    "The rapid taskforce, forensic review, legacy-portal decommissioning and proposed cyber uplift are recorded as corrective processes, not yet as completed outcomes.",
    "LRN-5 remains not assessed nationally: this high-profile incident provides a traceable case but not representative response-time, substantive-answer or corrective-follow-through data across institutions.",
    "Reassess SEC and LRN when the Services Australia forensic report, taskforce findings, implemented remediation, testing evidence or related legislative/standards changes become public.",
  ];

  for (let index = 0; index < strengths.length; index += 1) {
    await sql`
      INSERT INTO country_profile_notes (profile_id, note_type, display_order, note_text)
      VALUES (${profileId}, 'strength', ${index + 1}, ${strengths[index]});
    `;
  }
  for (let index = 0; index < watch.length; index += 1) {
    await sql`
      INSERT INTO country_profile_notes (profile_id, note_type, display_order, note_text)
      VALUES (${profileId}, 'watch', ${index + 1}, ${watch[index]});
    `;
  }

  let indicatorCount = 0;
  for (const source of SOURCES) {
    const sourceRows = await sql`
      INSERT INTO country_profile_sources (
        profile_id, title, publisher, source_url, publication_date, accessed_at,
        evidence_note, public_url, url_status, last_checked_at
      ) VALUES (
        ${profileId}, ${source.title}, ${source.publisher}, ${source.url},
        ${source.publicationDate}, ${source.accessedAt}, ${source.note},
        ${source.url}, 'verified', ${source.accessedAt}
      )
      RETURNING id;
    `;
    const sourceId = sourceRows[0].id;

    for (const indicator of source.indicators) {
      await sql`
        INSERT INTO country_profile_source_indicators (
          source_id, indicator_code, evidence_level, support_type,
          evidence_summary, limitation_note, evidence_direction,
          evidence_scope, implementation_status
        ) VALUES (
          ${sourceId}, ${indicator.code}, ${indicator.evidenceLevel},
          ${indicator.supportType}, ${indicator.summary}, ${indicator.limitation},
          'unknown', 'unknown', 'not_assessed'
        );
      `;
      indicatorCount += 1;
    }
  }

  const counts = await sql`
    SELECT
      (SELECT COUNT(*)::int FROM country_profile_scores WHERE profile_id = ${profileId}) AS scores,
      (SELECT COUNT(*)::int FROM country_profile_notes WHERE profile_id = ${profileId}) AS notes,
      (SELECT COUNT(*)::int FROM country_profile_sources WHERE profile_id = ${profileId}) AS sources,
      (
        SELECT COUNT(*)::int
        FROM country_profile_source_indicators i
        JOIN country_profile_sources s ON s.id = i.source_id
        WHERE s.profile_id = ${profileId}
      ) AS indicators;
  `;

  return {
    iso3: "AUS",
    countryId,
    profileId,
    databaseVersion: 1,
    documentaryVersion: "0.1",
    eventAuditDateZero: "2026-09-24",
    incidentDate: "2026-06-18",
    counts: counts[0],
    insertedIndicators: indicatorCount,
  };
}
