// Tunisia exploratory Country Profile v0.1 -> IML PostgreSQL schema.
// Documentary review date: 2026-09-22.
// Database profile version 1 corresponds to documentary version 0.1.
//
// Scoring rule: six equally weighted domains. Policy or project existence is
// not treated as evidence of nationwide implementation. Historical evidence is
// retained only when its date and limitation are explicit.

const SOURCES = [
  {
    title: "Tunisia — UHC Partnership country support: digital-health transformation",
    publisher: "World Health Organization",
    url: "https://extranet.who.int/uhcpartnership/country-profile/tunisia",
    publicUrl: "https://extranet.who.int/uhcpartnership/country-profile/tunisia",
    publicationDate: null,
    accessedAt: "2026-09-22",
    note: "WHO describes the roll-out of Tunisia's National Digital Health Transformation strategy as ongoing and supports integrated platforms focused on primary care, real-time data and clinical decision support. The associated outcome indicator measures facilities using point-of-service tools that exchange data through national registry and directory services.",
    indicators: [
      {
        code: "TN-GOV-01",
        evidenceLevel: "A",
        supportType: "supports",
        summary: "A named national digital-health transformation strategy and an implementation-support programme provide a current governance direction for health-information reform.",
        limitation: "The source describes an ongoing roll-out and a target indicator; it does not publish achieved national coverage or demonstrate full implementation.",
      },
      {
        code: "TN-TEC-01",
        evidenceLevel: "A",
        supportType: "partially_supports",
        summary: "National registry, directory and integrated-platform services are explicitly part of the intended interoperability architecture.",
        limitation: "The page does not identify a complete national data standard, implementation guide or measured exchange success rate.",
      },
    ],
  },
  {
    title: "Tunisia Health System Strengthening Project",
    publisher: "World Bank",
    url: "https://www.worldbank.org/en/news/press-release/2025/05/28/new-project-to-boost-tunisia-s-health-system-and-pandemic-response",
    publicUrl: "https://www.worldbank.org/en/news/press-release/2025/05/28/new-project-to-boost-tunisia-s-health-system-and-pandemic-response",
    publicationDate: "2025-05-28",
    accessedAt: "2026-09-22",
    note: "The World Bank approved US$125.16 million for a nationwide health-system project supporting governance, digitalization, One Health surveillance, electronic medical records, telemedicine, emergency dispatch and hospital-management technologies.",
    indicators: [
      {
        code: "TN-GOV-02",
        evidenceLevel: "A",
        supportType: "supports",
        summary: "A financed nationwide programme links digital health to Tunisia's National Health Policy and assigns implementation to the public health system.",
        limitation: "Approval and financing demonstrate capacity and commitment, not delivery of every planned result.",
      },
      {
        code: "TN-TEC-02",
        evidenceLevel: "A",
        supportType: "context_only",
        summary: "Electronic medical records, One Health surveillance and integrated emergency technologies are explicit programme components.",
        limitation: "These are project commitments; the source does not establish that nationwide interoperability or longitudinal records are already operational.",
      },
      {
        code: "TN-ADP-01",
        evidenceLevel: "A",
        supportType: "context_only",
        summary: "The programme is designed to expand telemedicine, electronic patient records and digital tools for frontline workers at national scale.",
        limitation: "Expected future reach is not counted as current routine adoption.",
      },
    ],
  },
  {
    title: "Progress of public-administration digital-transformation projects",
    publisher: "Presidency of the Government of Tunisia",
    url: "https://www.pm.gov.tn/ar/decision-gouvernementale/tqdwm-anjaz-mshary-althwwl-alrwqmy-lladart-mhwr-mjls-wzary-bashraf-ryyst",
    publicUrl: "https://www.pm.gov.tn/ar/decision-gouvernementale/tqdwm-anjaz-mshary-althwwl-alrwqmy-lladart-mhwr-mjls-wzary-bashraf-ryyst",
    publicationDate: "2026-02-13",
    accessedAt: "2026-09-22",
    note: "The Government lists the first phase of the digital hospital, Najda.tn and the first phase of a national interoperability platform among projects completed by the end of 2025. It also reports centralized tracking of 192 digital projects and calls for unified performance indicators, open data and cybersecurity measures.",
    indicators: [
      {
        code: "TN-GOV-03",
        evidenceLevel: "A",
        supportType: "supports",
        summary: "Cross-government monitoring and a stated requirement for unified performance indicators provide concrete coordination and oversight mechanisms.",
        limitation: "The announcement does not publish project-by-project performance results, independent evaluation or health-sector coverage denominators.",
      },
      {
        code: "TN-TEC-03",
        evidenceLevel: "A",
        supportType: "partially_supports",
        summary: "A first-phase national interoperability platform and social-sector interoperability services are reported as completed.",
        limitation: "First-phase completion does not demonstrate comprehensive semantic interoperability, clinical exchange or private-sector participation.",
      },
      {
        code: "TN-ADP-02",
        evidenceLevel: "A",
        supportType: "partially_supports",
        summary: "The digital hospital and Najda are reported as completed first-phase public services rather than only proposals.",
        limitation: "The source does not quantify active users, facility coverage, clinical workflow penetration or service availability over time.",
      },
      {
        code: "TN-LRN-01",
        evidenceLevel: "B",
        supportType: "partially_supports",
        summary: "Central project tracking and unified performance indicators create a basis for monitoring and corrective management.",
        limitation: "No public correction history, target-versus-result series or evidence of policy changes triggered by these indicators is provided.",
      },
    ],
  },
  {
    title: "Framework agreement for paperless data exchange using the Labes platform",
    publisher: "Ministry of Social Affairs of Tunisia",
    url: "https://www.social.gov.tn/index.php/fr/signature-d%E2%80%99un-accord-cadre-pour-l%C3%A9change-immat%C3%A9riel-des-donn%C3%A9es-entre-les-minist%C3%A8res-des-affaires",
    publicUrl: null,
    hiddenReason: "The ministry page is retained as documentary evidence but its public link is withheld after repeated automated timeouts; revalidate before exposing it.",
    publicationDate: null,
    accessedAt: "2026-09-22",
    note: "The Ministry reports a Labes pilot spanning 92 health facilities and more than six million data exchanges with the national health-insurance fund (CNAM).",
    indicators: [
      {
        code: "TN-TEC-04",
        evidenceLevel: "A",
        supportType: "supports",
        summary: "Labes provides quantified evidence of operational inter-organizational data exchange between health facilities and CNAM.",
        limitation: "The public report does not provide a national denominator, message-level conformance results, exchange success rates or clinical-data scope.",
      },
      {
        code: "TN-ADP-03",
        evidenceLevel: "A",
        supportType: "supports",
        summary: "Reported use across 92 facilities and millions of exchanges demonstrates non-trivial operational adoption.",
        limitation: "Pilot scale and transaction volume do not establish routine use across all public and private providers.",
      },
    ],
  },
  {
    title: "E-CNAM access through Tunisia's national digital identity",
    publisher: "Ministry of Communication Technologies of Tunisia",
    url: "https://www.mtc.gov.tn/index.php?cHash=633ad82bb4c9397f6335574270cc556b&id=119&tx_ttnews%5Btt_news%5D=4823",
    publicUrl: "https://www.mtc.gov.tn/index.php?cHash=633ad82bb4c9397f6335574270cc556b&id=119&tx_ttnews%5Btt_news%5D=4823",
    publicationDate: "2024-05-31",
    accessedAt: "2026-09-22",
    note: "The Ministry states that people enrolled with CNAM can use the national digital identity e-Houwiya for unified access to E-CNAM services including claim tracking, document submission, coverage decisions and family-doctor changes.",
    indicators: [
      {
        code: "TN-IDT-01",
        evidenceLevel: "A",
        supportType: "supports",
        summary: "A reusable national digital identity is integrated with a health-insurance service for authenticated citizen access.",
        limitation: "Authentication to E-CNAM does not by itself demonstrate nationwide patient matching, clinical authorization, consent or provenance controls.",
      },
      {
        code: "TN-ADP-04",
        evidenceLevel: "A",
        supportType: "supports",
        summary: "E-CNAM exposes concrete transaction and coverage functions through a unified digital-identity login.",
        limitation: "The source does not publish active-user rates, service-completion rates or accessibility outcomes.",
      },
    ],
  },
  {
    title: "Sahetna.tn and National Health Identifier rollout",
    publisher: "La Presse de Tunisie, republished by AllAfrica",
    url: "https://fr.allafrica.com/stories/202607210663.html",
    publicUrl: "https://fr.allafrica.com/stories/202607210663.html",
    publicationDate: "2026-07-21",
    accessedAt: "2026-09-22",
    note: "A media report reproducing a Ministry of Health announcement describes Sahetna.tn in final configuration and network deployment, with progressive rollout of a National Health Identifier after pilot testing in selected public hospitals.",
    indicators: [
      {
        code: "TN-IDT-02",
        evidenceLevel: "B",
        supportType: "partially_supports",
        summary: "A health-specific unique identifier and citizen portal have moved beyond design into pilot and progressive rollout.",
        limitation: "This is a republished announcement, not an independent coverage audit; nationwide assignment and private-sector integration were not yet complete.",
      },
      {
        code: "TN-TEC-05",
        evidenceLevel: "B",
        supportType: "partially_supports",
        summary: "The planned shared record and portal are designed to support longitudinal access and transfer of clinical information.",
        limitation: "Final configuration and successful pilots are not evidence of national-scale, standards-conformant exchange or reliable longitudinal completeness.",
      },
    ],
  },
  {
    title: "Law No. 2024-32 on the rights of beneficiaries of health services and medical responsibility",
    publisher: "Republic of Tunisia, consolidated by lois.tn",
    url: "https://lois.tn/doc/77522",
    publicUrl: "https://lois.tn/doc/77522",
    publicationDate: "2024-06-19",
    accessedAt: "2026-09-22",
    note: "The law requires traceable informed consent, protects privacy and personal data in the medical record, grants access to a complete copy of the record, requires complaint channels and responses within reasonable time, and establishes quality, risk-management and adverse-event reporting duties.",
    indicators: [
      {
        code: "TN-IDT-03",
        evidenceLevel: "A",
        supportType: "supports",
        summary: "The legal framework establishes patient information, traceable consent, privacy and access rights for medical records.",
        limitation: "Legal rights do not demonstrate consistent digital implementation, granular authorization, identity matching or practical access across facilities.",
      },
      {
        code: "TN-SEC-01",
        evidenceLevel: "A",
        supportType: "supports",
        summary: "Health-record privacy and personal-data protection are explicit statutory duties, with institutional responsibility for safety and risk management.",
        limitation: "The law does not publish compliance rates, audit findings, incident statistics or recovery performance.",
      },
      {
        code: "LRN-5",
        evidenceLevel: "A",
        supportType: "context_only",
        summary: "Health facilities have a formal duty to provide suggestion and complaint mechanisms, examine submissions and respond within a reasonable period.",
        limitation: "No representative response-time or substantive-answer data were found; institutional responsiveness is therefore not assessed from the existence of the legal channel alone.",
      },
      {
        code: "TN-LRN-02",
        evidenceLevel: "A",
        supportType: "partially_supports",
        summary: "Permanent quality and risk units plus protected adverse-event reporting provide a statutory basis for feedback and learning.",
        limitation: "Implementation, correction closure and cross-institutional learning outcomes are not documented in this source.",
      },
    ],
  },
  {
    title: "Legal and regulatory framework for information-system security audits",
    publisher: "National Cybersecurity Agency of Tunisia (ANCS)",
    url: "https://ancs.tn/index.php/fr/audit-reglementaire",
    publicUrl: "https://ancs.tn/index.php/fr/audit-reglementaire",
    publicationDate: null,
    accessedAt: "2026-09-22",
    note: "ANCS documents mandatory security audits for public bodies and other covered systems under Decree-Law 2023-17, certified auditors, technical audit criteria and follow-up of audit recommendations.",
    indicators: [
      {
        code: "TN-SEC-02",
        evidenceLevel: "A",
        supportType: "supports",
        summary: "Tunisia has a current national cybersecurity audit framework covering public information systems, personal-data processors and critical digital infrastructure.",
        limitation: "The framework does not disclose health-sector audit coverage, conformity rates, unresolved findings, incident outcomes or tested recovery performance.",
      },
    ],
  },
  {
    title: "Health-sector personal-data protection toolkit for Tunisia",
    publisher: "Council of Europe / Tunisia's National Personal Data Protection Authority (INPDP)",
    url: "https://www.coe.int/fr/web/tunis/-/une-nouvelle-boite-outils-pour-une-meilleure-protection-des-donnees-personnelles-dans-le-secteur-de-la-sante-en-tunisie",
    publicUrl: "https://www.coe.int/fr/web/tunis/-/une-nouvelle-boite-outils-pour-une-meilleure-protection-des-donnees-personnelles-dans-le-secteur-de-la-sante-en-tunisie",
    publicationDate: "2022-05-17",
    accessedAt: "2026-09-22",
    note: "INPDP and the Council of Europe produced a Tunisia-specific toolkit covering health institutions, clinicians, pharmacies, insurers, telemedicine, patients and health research.",
    indicators: [
      {
        code: "TN-SEC-03",
        evidenceLevel: "B",
        supportType: "supports",
        summary: "Sector-specific privacy guidance translates general personal-data obligations into health-use contexts.",
        limitation: "Guidance and awareness material do not demonstrate enforcement, technical control deployment or audited compliance.",
      },
      {
        code: "TN-IDT-04",
        evidenceLevel: "B",
        supportType: "partially_supports",
        summary: "The toolkit explicitly addresses patient control, privacy and lawful handling of health information across several actor groups.",
        limitation: "The source does not establish interoperable consent records, access-control implementation or patient-facing correction workflows.",
      },
    ],
  },
  {
    title: "WHO results report 2024–2025 — Tunisia",
    publisher: "World Health Organization",
    url: "https://www.who.int/about/accountability/results/who-results-report-2024-2025/region-EMRO/2024/tunisia",
    publicUrl: "https://www.who.int/about/accountability/results/who-results-report-2024-2025/region-EMRO/2024/tunisia",
    publicationDate: null,
    accessedAt: "2026-09-22",
    note: "WHO reports deployment of HeRAMS, an incident-management health-information toolkit and automated risk assessments, and states that digital health information systems improved outbreak detection, response coordination and decision-making.",
    indicators: [
      {
        code: "TN-ADP-05",
        evidenceLevel: "A",
        supportType: "supports",
        summary: "Operational emergency and resource-mapping tools demonstrate practical use of digital health information in public-health response.",
        limitation: "Emergency-response deployment does not establish routine clinical-system adoption or nationwide longitudinal records.",
      },
      {
        code: "TN-LRN-03",
        evidenceLevel: "A",
        supportType: "supports",
        summary: "Real-time analytics and incident-management information were used to improve outbreak detection, coordination and decisions.",
        limitation: "The report does not publish correction logs, data-quality metrics or an independent causal evaluation of the improvements.",
      },
    ],
  },
  {
    title: "SCORE for Health Data — Assessment Summary for Tunisia",
    publisher: "World Health Organization",
    url: "https://cdn.who.int/media/docs/default-source/documents/ddi/score/country-profiles/who_score_tun_en.pdf",
    publicUrl: null,
    hiddenReason: "The historical PDF is retained as documentary evidence; the public button is withheld because the semantic auditor cannot reliably inspect compressed PDF text.",
    publicationDate: "2021-03-15",
    accessedAt: "2026-09-22",
    note: "Historical baseline using data from 2013–2018. It recorded strong civil-registration and surveillance elements but missing or limited evidence for facility-data quality checks, reporting completeness, unique patient identification, interoperability, monitoring and evaluation, open-data policy and routine analytical learning. It must not be read as the current 2026 state.",
    indicators: [
      {
        code: "TN-TEC-06",
        evidenceLevel: "A",
        supportType: "context_only",
        summary: "The historical WHO baseline found incomplete patient identification and no demonstrated fully interoperable, standards-based exchange for routine facility data.",
        limitation: "The assessment was updated in 2021 using 2013–2018 data; later projects and deployments may have changed the position materially.",
      },
      {
        code: "TN-LRN-04",
        evidenceLevel: "A",
        supportType: "context_only",
        summary: "The baseline documented weak facility-data quality assurance, infrequent public reporting, limited links from analysis to policy and no documented national monitoring-and-evaluation architecture.",
        limitation: "This is a dated baseline used to identify unresolved questions, not a current penalty or evidence that every gap persisted through 2026.",
      },
    ],
  },
  {
    title: "E-health investment programme for Tunisian public hospitals",
    publisher: "Agence Française de Développement",
    url: "https://www.afd.fr/fr/projets/reequilibrer-lacces-aux-soins-en-deployant-une-strategie-e-sante-dans-les-hopitaux-publics",
    publicUrl: "https://www.afd.fr/fr/projets/reequilibrer-lacces-aux-soins-en-deployant-une-strategie-e-sante-dans-les-hopitaux-publics",
    publicationDate: "2019-02-01",
    accessedAt: "2026-09-22",
    note: "AFD describes a five-year, EUR 27.3 million programme for PACS, computerized medical records, digital archives and medication distribution in 15 public hospitals, plus five telemedicine initiatives. It also states that hospital digitization was limited at project start.",
    indicators: [
      {
        code: "TN-TEC-07",
        evidenceLevel: "A",
        supportType: "context_only",
        summary: "The programme establishes a concrete multi-application hospital architecture and scoped investment plan.",
        limitation: "A project design covering 15 hospitals is not evidence of completed deployment, interoperability or national coverage.",
      },
      {
        code: "TN-ADP-06",
        evidenceLevel: "A",
        supportType: "context_only",
        summary: "The defined hospital and telemedicine scope shows sustained implementation activity beyond a single application.",
        limitation: "The public project page does not report final completion, routine use, outcome measures or the share of national facilities reached.",
      },
    ],
  },
];

export async function seedTunisia(sql) {
  const countryRows = await sql`
    INSERT INTO countries (
      iso3, slug, name_en, map_x, map_y, label_dx, label_dy, text_size, is_active
    ) VALUES (
      'TUN', 'tunisia', 'Tunisia', 474, 150, 11, 1, 13, TRUE
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
      ${"Exploratory evidence profile of Tunisia's digital-health governance, interoperability, trusted access, operational adoption, cybersecurity safeguards and learning capacity. The profile distinguishes current operations from pilots, first phases and financed future commitments."},
      '2026-09-22',
      '2026-09-22T00:00:00.000Z'
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

  // Replace only Tunisia v0.1/v1 children. Cascades remove source indicators.
  await sql`DELETE FROM country_profile_sources WHERE profile_id = ${profileId};`;
  await sql`DELETE FROM country_profile_notes WHERE profile_id = ${profileId};`;
  await sql`DELETE FROM country_profile_scores WHERE profile_id = ${profileId};`;

  await sql`
    INSERT INTO country_profile_scores (profile_id, domain_code, score) VALUES
      (${profileId}, 'governance', 62),
      (${profileId}, 'technical', 55),
      (${profileId}, 'identity', 54),
      (${profileId}, 'adoption', 58),
      (${profileId}, 'security', 52),
      (${profileId}, 'learning', 47);
  `;

  const strengths = [
    "Tunisia has a current national digital-health transformation direction backed by WHO support and a financed nationwide health-system programme.",
    "Operational evidence goes beyond policy: Labes data exchange, E-CNAM access through e-Houwiya, first-phase digital-hospital and interoperability services, and emergency information tools are documented.",
    "The 2024 health-rights law establishes traceable consent, medical-record privacy and access rights, complaint handling, quality units and adverse-event reporting duties.",
    "A national cybersecurity audit framework applies to public systems and other covered personal-data or critical infrastructures.",
  ];

  const watch = [
    "National coverage remains unproven: several important components are pilots, first phases, progressive roll-outs or financed future commitments rather than completed nationwide services.",
    "No public national implementation guide or conformance evidence was found for FHIR, shared clinical terminologies, exchange profiles, record provenance or end-to-end semantic interoperability.",
    "The National Health Identifier and Sahetna.tn were still being progressively deployed in 2026; private-sector participation and longitudinal record completeness require verification.",
    "Cybersecurity rules and audit duties are documented, but public health-sector evidence is insufficient on audit coverage, unresolved findings, incident reporting, continuity tests and recovery outcomes.",
    "Learning evidence is mixed: current emergency analytics and project monitoring are positive, while the latest detailed WHO baseline is historical and showed important data-quality, access, evaluation and policy-use gaps.",
    "LRN-5 institutional responsiveness is not assessed: the law requires complaint channels and reasonable-time responses, but no representative response-time, substantive-answer or corrective-follow-through data were found.",
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
    const publicUrl = source.publicUrl === undefined ? source.url : source.publicUrl;
    const urlStatus = publicUrl ? 'verified' : 'unverified';
    const sourceRows = await sql`
      INSERT INTO country_profile_sources (
        profile_id, title, publisher, source_url, publication_date, accessed_at,
        evidence_note, public_url, url_status, last_checked_at, replacement_reason
      ) VALUES (
        ${profileId}, ${source.title}, ${source.publisher}, ${source.url},
        ${source.publicationDate}, ${source.accessedAt}, ${source.note},
        ${publicUrl}, ${urlStatus}, ${source.accessedAt}, ${source.hiddenReason || null}
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
    iso3: "TUN",
    countryId,
    profileId,
    databaseVersion: 1,
    documentaryVersion: "0.1",
    counts: counts[0],
    insertedIndicators: indicatorCount,
  };
}
