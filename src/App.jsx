import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";

const IML_AXES = ["Standards", "Connectivity", "Identity", "Adoption", "Security", "Correction"];

const IML_ROUTES = [
  { key: "home", label: "Home" },
  { key: "id4d", label: "ID4D Framework" },
  { key: "medicines", label: "Evaluation and regulatory shifts" },
  { key: "method", label: "Methodology" },
  { key: "countries", label: "World Map" },
  { key: "contact", label: "Contact" },
];

const IML_HOME = {
  brandLong: "Interoperability Maturity Label",
  tagline: "A structured framework to assess, compare and explain health interoperability maturity.",
  heroTitle: "The framework that makes interoperability maturity visible, comparable and governable.",
  heroText:
    "IML provides a publication-ready framework for assessing health systems, exchange architectures, identity layers and real-world deployment capacity. It helps institutions move from fragmented digital initiatives to governed interoperability at scale.",
  interopShiftNote:
    "Interoperability maturity does not depend only on standards or digital infrastructure. It depends on how identity, governance, trust, medicines information, deployment and correction capacity reinforce one another in practice. In many countries, technological progress is moving faster than the redesign of health systems, clinical organisation, workforce training and interoperability-ready workflows. As access expands to information that was previously siloed or difficult to obtain, interoperability will reshape professional education, care practices and, over time, routine clinical protocols.",
  signature: "From patchwork to orchestration.",
  signatureText:
    "IML turns scattered digital-health capabilities into a measurable integration pathway that can be explained to governments, regulators, implementation partners and public-interest stakeholders.",
  valueCards: [
    {
      title: "For policymakers",
      text: "A clear executive view of national interoperability maturity, readiness gaps and priority actions.",
    },
    {
      title: "For institutions",
      text: "A common language to align architecture, governance, identity, trust and deployment decisions.",
    },
    {
      title: "For implementers",
      text: "A way to position technical components inside a coherent and scalable national roadmap.",
    },
  ],
};

const IML_PILLARS = [
  {
    title: "Governance & Standards",
    symbol: "GV",
    text: "Institutional ownership, legal frameworks, standards governance, accountability and national steering capacity.",
  },
  {
    title: "Technical Interoperability",
    symbol: "IO",
    text: "Exchange models, APIs, semantics, technical integration quality, service continuity and architecture coherence.",
  },
  {
    title: "Identity & Trust",
    symbol: "ID",
    text: "Identity matching, authentication, consent, provider and patient identification, and trust services.",
  },
  {
    title: "Security",
    symbol: "SC",
    text: "Privacy safeguards, access control, traceability, cyber readiness and defensible trust practices.",
  },
  {
    title: "Adoption",
    symbol: "AD",
    text: "Operational rollout, user uptake, field deployment, integration into workflows and implementation depth.",
  },
  {
    title: "Correction & Feedback",
    symbol: "CF",
    text: "Redress, correction, complaint handling, recourse pathways and institutional learning from failures.",
  },
];

const IML_CRITERIA = [
  ["1", "Normative framework", "Existence and coherence of the rules, standards and obligations that support interoperable health services."],
  ["2", "Technical interoperability", "Real capacity of systems to exchange, interpret and reuse health information."],
  ["3", "Identity and trust", "Strength of identification, authentication, matching, privacy and access control."],
  ["4", "Deployment", "Actual implementation in care pathways, organisations and frontline operations."],
  ["5", "Security", "Robustness of security, traceability and authorised access mechanisms."],
  ["6", "Correction, recourse and feedback", "Capacity of the system to correct errors, process complaints, organise recourse and transform feedback into institutional learning."],
];

const IML_SCORING = [
  { label: "Level 1 · Fragmented", value: 22, tone: "Scattered capabilities, weak exchange and limited institutional coherence." },
  { label: "Level 2 · Structured", value: 43, tone: "Basic foundations exist, but implementation remains uneven and partial." },
  { label: "Level 3 · Connected", value: 64, tone: "Meaningful exchange exists across key actors and services." },
  { label: "Level 4 · Orchestrated", value: 82, tone: "Identity, governance and exchange layers are increasingly aligned." },
  { label: "Level 5 · Reference", value: 96, tone: "A mature and trusted ecosystem supports interoperable services at scale." },
];

const IML_EXPLANATORY_PACK = {
  intro: "This section explains how to read the score, the six-criteria hexagon and the country notes.",
  purpose: "It provides a concise reading framework for ministries, regulators, public agencies and implementation teams.",
  scoreCaptures: [
    "The degree of institutional and regulatory alignment behind interoperability.",
    "The maturity of technical exchange capabilities, standards adoption and integration patterns.",
    "The reliability of identity, authentication, matching, consent and trust services.",
    "The ability to deploy and sustain operational use at scale rather than in isolated pilots.",
    "The level of measurable stewardship, data protection and performance management.",
  ],
  scoreLimits: [
    "It is not a proxy for clinical quality in itself.",
    "It is not a ranking of countries or states in absolute geopolitical terms.",
    "It does not replace a detailed architecture review or legal assessment.",
    "It does not erase internal heterogeneity. High-performing pockets can coexist with structural fragmentation.",
  ],
  strengthsGuide: [
    "A robust institutional framework that reduces ambiguity and decision latency.",
    "An operational identity or trust layer that supports secure exchange and matching.",
    "A stable technical backbone with real integration capability, not just standards on paper.",
    "Demonstrated deployment capacity across multiple institutions or regions.",
    "A credible financing or stewardship model that supports continuity over time.",
  ],
  watchGuide: [
    "State or regional heterogeneity that makes a national picture look more coherent than field reality.",
    "Identity fragmentation across programs, providers or channels.",
    "Uneven implementation maturity despite strong central policy intent.",
    "Limited reuse of standards across vendors or public agencies.",
    "Gaps between pilot success and production-grade continuity.",
    "Insufficient measurement of actual usage, quality or impact.",
  ],
};

const IML_ID4D = [
  {
    title: "Inclusive access",
    text: "Assesses whether people can realistically enter the health system and use digital services without being blocked by identity gaps, institutional complexity or fragmented service pathways.",
  },
  {
    title: "Low-friction service entry",
    text: "Examines how easily users, professionals and institutions can access services, verify identity and move across care pathways without duplicative administrative burden.",
  },
  {
    title: "Trusted identity assurance",
    text: "Covers identification, authentication, matching quality, role assurance and the reliability of trust services used across health ecosystems.",
  },
  {
    title: "Interoperability and open standards",
    text: "Looks at exchange architecture, shared standards, semantic consistency and the practical ability of systems to connect and reuse health information.",
  },
  {
    title: "Privacy and data protection",
    text: "Focuses on purpose limitation, lawful access, traceability, minimisation, confidentiality and the safeguards that make data use defensible.",
  },
  {
    title: "Governance, oversight and redress",
    text: "Evaluates institutional accountability, supervision, complaint handling, correction capacity and the ability to transform failures into visible public-interest learning.",
  },
];

const IML_COUNTRIES = {
  Argentina: {
    score: 76,
    subtitle:
      "A nationally coordinated digital-health trajectory built around the Red Nacional de Salud Digital and Historia de Salud Integrada, with a strong emphasis on distributed records, interoperability and patient-controlled access permissions.",
    values: [78, 74, 72, 77, 73, 63],
    strengths: [
      "Red Nacional de Salud Digital as a national interoperability strategy",
      "Historia de Salud Integrada as a distributed shared health-record model",
      "A legal framework for electronic clinical records and patient rights",
    ],
    watch: [
      "Operational maturity can vary across jurisdictions and providers",
      "Nationwide implementation depends on provincial and municipal adoption",
      "Correction and feedback remain analytically distinct from shared-record availability",
    ],
    examples: [
      "The Red Nacional de Salud Digital is designed to ensure interoperability across jurisdictions and subsectors.",
      "Historia de Salud Integrada stores the shared record in distributed form across points of care rather than in a single centralized repository.",
      "Argentina’s legal framework establishes a national electronic health-record registration system.",
    ],
    sources: [
      "Argentina Ministry of Health · Red Nacional de Salud Digital",
      "Argentina Ministry of Health · Historia de Salud Integrada",
      "Argentina.gob.ar · Electronic Health Record Law",
    ],
  },
  Australia: {
    score: 81,
    subtitle:
      "A mature national digital-health environment built around purpose-specific healthcare identifiers, My Health Record connectivity and strong governance for secure information exchange.",
    values: [82, 84, 87, 74, 85, 64],
    strengths: [
      "National Healthcare Identifiers Service for individuals, providers and organisations",
      "My Health Record as a broad national sharing layer",
      "Explicit interoperability and conformance requirements under national digital-health governance",
    ],
    watch: [
      "Operational maturity remains uneven across software and care settings",
      "Practical public trust and recourse remain analytically distinct from core infrastructure",
      "Full longitudinal integration across sectors still depends on local implementation quality",
    ],
    examples: [
      "Australia’s Healthcare Identifiers Service provides unique identifiers for individuals, providers and organisations.",
      "The HI Service supports My Health Record, electronic prescribing and secure messaging.",
      "The Australian Digital Health Agency defines interoperability requirements and conformance for My Health Record-connected systems.",
    ],
    sources: [
      "Australian Government · Healthcare Identifiers Service",
      "Australian Digital Health Agency · Interoperability",
      "Australian Digital Health Developer Portal · My Health Record",
    ],
  },
  Brazil: {
    score: 82,
    subtitle:
      "A large-scale national interoperability effort centred on the RNDS, strengthened by SUS Digital and the citizen-facing Meu SUS Digital environment, with growing federal reach across states and municipalities.",
    values: [84, 85, 76, 80, 81, 67],
    strengths: [
      "RNDS as the official national interoperability platform",
      "Meu SUS Digital for citizen access to records, medicines and laboratory information",
      "SUS Digital with nationwide adhesion across states and municipalities",
    ],
    watch: [
      "Scale and federal complexity still create uneven implementation depth",
      "Identity and continuity of care improve within the platform but remain dependent on local integration quality",
      "Correction and recourse maturity remains less visible than architecture and reach",
    ],
    examples: [
      "The Ministry of Health describes RNDS as the official interoperability platform for secure and standardized health-data exchange.",
      "Meu SUS Digital gives citizens access to health information, including medicines, vaccines and laboratory results fed by RNDS.",
      "SUS Digital reports adhesion by all states, the Federal District and all municipalities.",
    ],
    sources: [
      "Brazil Ministry of Health · RNDS",
      "Brazil Ministry of Health · Meu SUS Digital",
      "Brazil Ministry of Health · SUS Digital",
    ],
  },
  Canada: {
    score: 73,
    subtitle:
      "A serious interoperability trajectory shaped by strong policy vision, but constrained by a multi-jurisdictional landscape and uneven implementation across provinces and territories.",
    values: [71, 76, 68, 74, 77, 58],
    strengths: [
      "Pan-Canadian interoperability roadmap",
      "Strong digital health policy capacity",
      "Institutional recognition of connected care priorities",
    ],
    watch: ["Jurisdictional fragmentation", "Variable implementation maturity", "Complexity of sustained coordination"],
    examples: [
      "The shared pan-Canadian interoperability roadmap aims to connect providers and organisations through standardised technologies and data.",
      "Health Canada presents interoperability as a building block for modern, connected care.",
      "Canada’s challenge is not lack of direction, but the long-term orchestration of a federated environment.",
    ],
    sources: [
      "Canada Health Infoway · Shared Pan-Canadian Interoperability Roadmap",
      "Health Canada · Connecting You to Modern Health Care",
      "Canada Health Infoway · Interoperability resources",
    ],
  },
  "Costa Rica": {
    score: 74,
    subtitle:
      "A relatively advanced digital health trajectory centred on the EDUS model, combining a unified digital health record, patient-facing access and medication-related information within the social security system.",
    values: [73, 75, 70, 78, 72, 60],
    strengths: [
      "EDUS as a recognisable nationwide digital health record model",
      "Patient-facing mobile access through the official CCSS application",
      "Medication, diagnosis and appointment information made visible within a single service environment",
    ],
    watch: [
      "National coherence is stronger inside the CCSS environment than across all possible system layers",
      "Interoperability visibility outside the core institutional setting is less explicit",
      "Correction and feedback capacity is still analytically separate from record availability",
    ],
    examples: [
      "The official CCSS EDUS application allows access to information from the Expediente Digital Único en Salud.",
      "The app includes appointments, prescribed medicines, diagnoses and allergies when the relevant care site has implemented EDUS.",
      "The model shows how a patient-facing health record environment can support integrated service use inside a national social security framework.",
    ],
    sources: ["CCSS · App EDUS", "CCSS · EDUS terms and conditions"],
  },
  Estonia: {
    score: 91,
    subtitle:
      "A compact and highly coherent model combining digital identity, secure exchange and nationwide health information infrastructure.",
    values: [90, 93, 95, 87, 89, 76],
    strengths: [
      "X-Road as a secure exchange backbone",
      "Strong digital identity ecosystem",
      "Nationally connected health information services",
    ],
    watch: [
      "Strong dependence on central institutional coherence",
      "Partial transposability to more fragmented states",
      "Scale advantage may not generalise",
    ],
    examples: [
      "Estonia’s national health information system has connected providers at national scale since 2008.",
      "X-Road provides a secure interoperability layer across public and private systems.",
      "The eID ecosystem is designed to preserve a coherent digital identity across multiple channels.",
    ],
    sources: ["e-Estonia · e-Health Records", "e-Estonia · X-Road", "RIA · Estonian eID ecosystem"],
  },
  Ethiopia: {
    score: 61,
    subtitle:
      "A digital health ecosystem with clear national coordination, community-level digitisation and formal digital-identity foundations, while large-scale integration remains uneven across the full care continuum.",
    values: [64, 58, 62, 66, 57, 49],
    strengths: [
      "A dedicated Digital Health Lead Executive Office with an explicit mandate for architecture and interoperability",
      "eCHIS and DHIS2 as visible national digital health systems",
      "A legal foundation for a national digital identification system",
    ],
    watch: [
      "Interoperability maturity remains uneven across system layers",
      "Health-identity linkage is still less consolidated than in leading reference countries",
      "Correction and feedback mechanisms are less visible in public documentation",
    ],
    examples: [
      "The Ministry of Health presents eCHIS as a high-priority initiative for digitising community health information.",
      "The Ministry of Health states that DHIS2 is used for collecting and analysing health data.",
      "The Digital Health Lead Executive Office explicitly mandates architecture, interoperability standards and inclusive digital health frameworks.",
    ],
    sources: [
      "Ethiopia Ministry of Health · Digital Health Systems",
      "Ethiopia Ministry of Health · DHIS2",
      "Ethiopia Ministry of Health · Digital Health Lead Executive Office",
      "WHO · Ethiopian Digital Identification Proclamation No 1284/2023",
    ],
  },
  France: {
    score: 65,
    subtitle:
      "A legally elaborate and highly structured ecosystem with a strong health-identity foundation and advanced doctrine, but materially constrained by administrative bottlenecks, exhaustive validation routines and weak practical correction capacity, which together reduce operational maturity.",
    values: [70, 62, 84, 50, 84, 20],
    strengths: [
      "National Health Identity (INS) as a reference identity layer",
      "Pro Santé Connect for professional authentication",
      "A mature national interoperability doctrine and CI-SIS framework",
    ],
    watch: [
      "Administrative and validation routines can protect existing structures instead of accelerating public-interest correction",
      "Uneven operational implementation across actors despite exhaustive regulation",
      "Weak practical correction and feedback loop in critical cases",
    ],
    examples: [
      "The INS framework defines national identity usage conditions, implementation guidance and identity vigilance rules.",
      "Pro Santé Connect supports trusted authentication for health professionals.",
      "The French interoperability doctrine relies on CI-SIS and a progressive transition toward FHIR in priority areas.",
    ],
    sources: [
      "ANS · Référentiel INS",
      "ANS · Pro Santé Connect",
      "Doctrine du numérique en santé · Interoperability",
      "Mon espace santé / DMP documentation",
    ],
    critique: {
      title: "Analytical note · Criterion 6 in France",
      constat:
        "France has formal mechanisms for correction, complaints and recourse across identity, quality and information governance, and an extensive legislative and doctrinal framework. However, this study distinguishes the existence of these mechanisms from their practical effectiveness and from the administrative validation chains that often preserve the existing system rather than transform it.",
      example:
        "An analysed case involving urgent medical tests points to significant delays and insufficient information returned to the prescribing physician, despite the expectation of timely information flows in a digital health environment.",
      institution:
        "The interactions reported with the ARS and the CDC suggest systemic weaknesses in the way certain public-health responsibilities are supervised or delegated to private organisations. They also point to validation mechanisms that appear stronger at preserving formal conformity than at producing rapid and visible correction in the public interest.",
      information:
        "The difficulty is reinforced by the limited analytical value of health information when laboratory results are sent into the DMP in PDF form rather than as structured and interoperable data.",
      implication:
        "Within IML, France therefore scores markedly lower on standards-in-practice, adoption, correction, recourse and feedback than on identity or formal doctrine. The score is not lowered because legislation or mechanisms are missing, but because administrative bottlenecks and validation routines often limit visible operational effect, slow meaningful correction and reduce the practical value of the normative framework itself.",
      id4d:
        "From an ID4D perspective, a trusted system must support not only identification and exchange, but also contestability, correction, traceability and repair.",
      conclusion:
        "France illustrates how a strongly structured system may still remain incomplete when a dense legal framework coexists with administrative inertia, protection of the existing order, exhaustive validation routines and a weak correction loop in practice.",
    },
  },
  Guatemala: {
    score: 52,
    subtitle:
      "A foundational identity system exists and digital transformation policy explicitly mentions identifiers and interoperability, but health-sector integration remains comparatively early and uneven.",
    values: [54, 46, 62, 43, 55, 33],
    strengths: [
      "RENAP maintains the unique civil identification registry and issues the DPI",
      "Interinstitutional RENAP-MSPAS coordination exists",
      "The current digital transformation agenda explicitly includes digital identifiers and interoperability",
    ],
    watch: [
      "Health-sector interoperability remains early-stage",
      "Operational connection between identity and care pathways is still limited",
      "Correction and feedback loops are not yet strongly evidenced at ecosystem scale",
    ],
    examples: [
      "RENAP is responsible for the unique identification registry and the Documento Personal de Identificación.",
      "RENAP and MSPAS have an interinstitutional coordination agreement linking civil registration and health information concerns.",
      "Guatemala’s digital transformation strategy explicitly identifies digital identifiers and interoperability platforms as core infrastructure.",
    ],
    sources: [
      "RENAP · Institutional information",
      "RENAP · RENAP-MSPAS coordination agreement",
      "Transformación Digital Guatemala · Digital infrastructure",
      "Transformación Digital Guatemala · Principles",
    ],
  },
  India: {
    score: 79,
    subtitle:
      "A very large digital-health identity ecosystem built around the Ayushman Bharat Digital Mission, with ABHA, provider and facility registries, and controlled health-record linking under a national governance framework.",
    values: [80, 81, 86, 74, 79, 61],
    strengths: [
      "ABHA as a national health account and access layer",
      "Healthcare Professionals Registry and Health Facility Registry as structured ecosystem registries",
      "A citizen-facing personal-health-record logic with consent-linked record viewing and linking",
    ],
    watch: [
      "Implementation depth can vary across states, providers and software readiness levels",
      "Scale and diversity create uneven real-world adoption",
      "Correction and feedback capacity is less legible than the identity and registry architecture",
    ],
    examples: [
      "ABDM positions ABHA as a core digital health account for the ecosystem.",
      "The Health Facility Registry is described as a comprehensive repository of facilities across public and private sectors.",
      "The Healthcare Professionals Registry provides a unique digital identifier for verified professionals.",
      "The PHR logic supports record discovery, linking, viewing and consent management.",
    ],
    sources: [
      "ABDM · Health Facility Registry",
      "ABDM · Healthcare Professionals Registry",
      "ABDM / NHA · Health Records / PHR information",
    ],
  },
  Japan: {
    score: 84,
    subtitle:
      "A mature identity-linked health access environment combined with a strong regulatory data infrastructure for medicines safety and real-world analysis.",
    values: [82, 85, 88, 79, 86, 67],
    strengths: [
      "My Number Card is now central to health insurance eligibility confirmation",
      "Strong identity-linked access to care and pharmacy workflows",
      "MID-NET provides a large-scale medical information database for medicines safety analysis",
    ],
    watch: [
      "Identity-linked health access still requires careful governance and public trust management",
      "Operational maturity in insurance eligibility does not automatically equal full-system interoperability in every care domain",
      "Correction and recourse remain analytically distinct from technical maturity",
    ],
    examples: [
      "Japan’s system has shifted to one based on the My Number Card as the health insurance certificate after the expiration of existing health insurance cards.",
      "The Digital Agency describes online eligibility confirmation and identity verification through My Number Card-based workflows.",
      "PMDA’s MID-NET makes electronic medical records, claims and related data available for medicines safety uses at large scale.",
    ],
    sources: [
      "Digital Agency Japan · Use of health insurance card in My Number Card",
      "Digital Agency Japan · My Number scheme",
      "PMDA · MID-NET",
    ],
  },
  Morocco: {
    score: 55,
    subtitle:
      "An ecosystem in transition, supported by broader digital transformation efforts, but still requiring stronger convergence between identity, service delivery and health-sector interoperability.",
    values: [58, 49, 52, 61, 56, 34],
    strengths: [
      "Digital Morocco 2030 strategic direction",
      "National ID-based authentication service",
      "Potential alignment between state modernisation and social service delivery",
    ],
    watch: [
      "Sector-specific health interoperability remains less visible",
      "Identity and care pathways require tighter integration",
      "Correction and recourse capacity is still maturing",
    ],
    examples: [
      "Digital Morocco 2030 presents digital transformation as a social and economic development lever.",
      "A CNIE-based identification and authentication service has been launched by national authorities.",
      "A World Bank-supported identity and targeting project aims to strengthen inclusion and service access.",
    ],
    sources: [
      "Digital Morocco 2030",
      "ADD / DGSN · CNIE authentication service",
      "World Bank · Morocco Identity and Targeting for Social Protection Project",
    ],
  },
  "New Zealand": {
    score: 83,
    subtitle:
      "A longstanding health-identity environment built around the National Health Index, with strong identity governance and broad use across hospitals, general practice, pharmacies and other services.",
    values: [81, 82, 90, 77, 84, 66],
    strengths: [
      "National Health Index as a unique identifier for health-care users",
      "Longstanding cross-setting use across hospitals, GPs, pharmacies and laboratories",
      "Clear privacy, access and statement-of-use framing for health identity",
    ],
    watch: [
      "Identity maturity does not automatically mean identical interoperability maturity in every domain",
      "Operational integration still depends on connected systems beyond the identifier layer",
      "Correction and recourse remain analytically distinct from identity strength",
    ],
    examples: [
      "The National Health Index is the unique identifier assigned to everyone who uses health and disability support services in New Zealand.",
      "Health New Zealand states that the NHI is used by hospitals, family doctors, pharmacies, laboratories and midwives.",
      "The NHI statement of use frames the identifier as a cornerstone of clinical and administrative patient-related information.",
    ],
    sources: [
      "Health New Zealand · National Health Index",
      "Health New Zealand · NHI Statement of Use",
      "Health New Zealand · Health Identity",
    ],
  },
  Russia: {
    score: 63,
    subtitle:
      "A centrally steered digital-health trajectory with state-led information-system ambitions, including EGISZ and broader healthcare modernisation goals, though public documentation is less transparent and less clinically granular than in some comparator countries.",
    values: [66, 64, 58, 63, 62, 45],
    strengths: [
      "State-led health IT strategy and information-system ambition",
      "EGISZ as a visible federal reference point for digital health infrastructure",
      "Longstanding policy emphasis on technological modernisation in healthcare",
    ],
    watch: [
      "Public transparency and documentation depth are more limited than in several peer systems",
      "Identity-health linkage is less clearly documented in accessible public sources",
      "Correction, recourse and feedback remain difficult to assess from the current public evidence base",
    ],
    examples: [
      "The Russian Ministry of Health has publicly referred to EGISZ as a unified state information system in healthcare.",
      "Official government material on healthcare development emphasises IT solutions and technological upgrading of the sector.",
      "The accessible public evidence supports reading Russia as a state-driven digital health case, while leaving some operational details less visible.",
    ],
    sources: [
      "Ministry of Health of the Russian Federation · EGISZ",
      "Government of the Russian Federation · Healthcare Development",
    ],
  },
  Senegal: {
    score: 57,
    subtitle:
      "A promising but still uneven trajectory where digital economy reforms, biometric identity and health-system strengthening are visible, while integrated health identity and interoperability remain less consolidated.",
    values: [60, 52, 57, 58, 51, 36],
    strengths: [
      "Biometric ECOWAS identity card framework",
      "World Bank-supported digital economy reforms",
      "Recent health-system strengthening agenda emphasising information systems and data use",
    ],
    watch: [
      "Health interoperability architecture is not yet as visible or mature as in leading reference countries",
      "Identity-to-health integration remains partially evidenced",
      "Correction, recourse and feedback mechanisms appear less documented in public sources",
    ],
    examples: [
      "Senegal adopted the ECOWAS biometric identity card framework, signalling a stronger digital identity base.",
      "World Bank support for Senegal’s digital economy emphasised stronger ICT policy and institutional foundations.",
      "The NAATANGUE 2030 health program highlights health information systems and data use as systemic improvement priorities.",
    ],
    sources: [
      "Service Public Sénégal · ECOWAS biometric identity card",
      "World Bank · Senegal digital economy support",
      "World Bank · NAATANGUE 2030 health system program",
    ],
  },
  Sweden: {
    score: 88,
    subtitle:
      "A strong, medication-centred digital health ecosystem combining e-prescriptions, a national medication list and identity-and-authorisation safeguards for access to sensitive information.",
    values: [86, 90, 84, 85, 92, 70],
    strengths: [
      "Very high e-prescription adoption",
      "National Medication List as a shared information source",
      "Strong identity and authorisation requirements for access",
    ],
    watch: [
      "Correction and recourse still require governance beyond technical access control",
      "Interoperability strengths are clearer in medicines than in all care domains",
      "A mature architecture still needs visible public-interest feedback channels",
    ],
    examples: [
      "The Swedish eHealth Agency states that around 99 percent of prescriptions are electronic.",
      "The National Medication List gives healthcare, pharmacies and the patient access to the same up-to-date prescribing and dispensing information.",
      "The Agency’s security solution places strict requirements on identity and authorisation so that the right person sees the right information.",
    ],
    sources: [
      "Swedish eHealth Agency · How prescriptions for medicinal products work in Sweden",
      "Swedish eHealth Agency · National Medication List",
      "Swedish eHealth Agency · Security solution",
    ],
  },
  Tanzania: {
    score: 67,
    subtitle:
      "A structured digital health trajectory with a formal strategy, enterprise architecture and client-registry ambitions, supported by an increasingly coordinated digital health governance model.",
    values: [69, 70, 61, 68, 63, 55],
    strengths: [
      "A National Digital Health Strategy with explicit interoperability and registry objectives",
      "A Centre for Digital Health supporting coordination and implementation",
      "A health enterprise architecture designed for interoperability and data exchange",
    ],
    watch: [
      "Implementation maturity can vary across facilities and systems",
      "Identity-linked continuity across the full care pathway remains a work in progress",
      "Correction and feedback capacity is not yet as visible as core architecture ambitions",
    ],
    examples: [
      "The National Digital Health Strategy targets stronger interoperability across systems and other sectors.",
      "The strategy explicitly calls for client and health worker registries.",
      "The Ministry of Health describes the health enterprise architecture as supporting seamless interoperability and data exchange.",
    ],
    sources: [
      "WHO CPCD · Tanzania National Digital Health Strategy 2019-2024",
      "Tanzania Ministry of Health · Services / Center for Digital Health",
      "Tanzania National Health Portal",
    ],
  },
  "United States": {
    score: 80,
    subtitle:
      "A nationally significant but structurally heterogeneous interoperability environment, combining a federal governance floor through TEFCA and USCDI with major state-level and network-level variation in operational reality.",
    values: [82, 83, 72, 76, 84, 63],
    strengths: [
      "TEFCA as a nationwide governance and exchange floor",
      "USCDI as a standardized core data set for nationwide exchange",
      "Strong federal policy capacity around certification, APIs and information sharing",
    ],
    watch: [
      "Operational maturity varies significantly across states, regions, HIEs and vendor ecosystems",
      "The federal floor does not erase local disparities in implementation or governance",
      "A state-specific reading is needed for finer-grained comparison",
    ],
    examples: [
      "TEFCA is designed as a nationwide framework for health information sharing across providers, payers, public health agencies and patients.",
      "USCDI defines the standardized data classes and elements for nationwide interoperable exchange.",
      "The U.S. case is best read as a strong national framework layered over substantial state and network variation.",
    ],
    sources: [
      "ASTP/ONC · TEFCA",
      "HealthIT.gov · Interoperability",
      "USCDI official platform",
    ],
  },
};

const IML_RESEARCH_SOURCES = [
  "World Bank ID4D · Interoperability",
  "World Bank ID4D · Interoperability frameworks",
  "World Bank ID4D · Privacy & Security",
  "World Bank ID4D · Data protection and privacy laws",
  "HL7 FHIR · Patient",
  "HL7 FHIR · Linkage",
  "HL7 FHIR · ResearchSubject",
  "WHO · Coding and identifiers",
  "WHO · Clinical Registry",
];

const IML_IDENTIFIER = {
  visibleFormat: "IML1-S-DDMMYYYY-GEO4-SSSS-CC",
  example: "IML1-2-17041986-Q7L2-0421-58",
  guidance: [
    "Use the visible code only as a request-validated identifier, not as a universal public number propagated everywhere.",
    "Keep other personal data in a controlled integration envelope rather than encoding them directly in the visible identifier.",
    "The integration envelope can include name elements, contact channels, local medical-record numbers, national identifiers, consent state, study identifiers and linkage tables when legally justified.",
  ],
};

const IML_MARKERS = [
  { name: "Argentina", x: 246, y: 302 },
  { name: "Australia", x: 742, y: 324 },
  { name: "Brazil", x: 223, y: 258, labelDx: 12, labelDy: 16 },
  { name: "Canada", x: 140, y: 110, labelDx: 12, labelDy: -2, textSize: 11.4 },
  { name: "Costa Rica", x: 216, y: 196, labelDx: 16, labelDy: 18 },
  { name: "Estonia", x: 505, y: 103 },
  { name: "Ethiopia", x: 518, y: 226, labelDx: 12, labelDy: -8 },
  { name: "France", x: 470, y: 125 },
  { name: "Guatemala", x: 182, y: 182, labelDx: -72, labelDy: -10 },
  { name: "India", x: 662, y: 186 },
  { name: "Japan", x: 812, y: 166 },
  { name: "Morocco", x: 446, y: 170, labelDx: -36, labelDy: -10 },
  { name: "New Zealand", x: 805, y: 350 },
  { name: "Russia", x: 690, y: 120 },
  { name: "Senegal", x: 428, y: 205, labelDx: -48, labelDy: 10 },
  { name: "Sweden", x: 490, y: 88 },
  { name: "Tanzania", x: 505, y: 274, labelDx: 12, labelDy: 18 },
  { name: "United States", x: 120, y: 138, labelDx: 12, labelDy: 18, textSize: 12.4 },
];

const IML_US_STATES = ["California", "Ohio"];

const IML_US_STATE_BENCHMARKS = {
  California: {
    score: 82,
    subtitle:
      "A strong state-level interoperability profile built around the California Data Exchange Framework, with explicit whole-person care ambition, statewide governance tools and growing accountability for cross-entity exchange.",
    values: [88, 82, 74, 78, 80, 67],
    strengths: [
      "The Data Exchange Framework creates a statewide data sharing agreement and common policies for exchange.",
      "California explicitly links interoperability to whole-person care across health and social services.",
      "HCAI now oversees ongoing implementation, which gives the framework a clearer long-term administrative home.",
    ],
    watch: [
      "Implementation still depends on operational readiness across a very large and heterogeneous delivery system.",
      "Identity and matching practices remain less unified than the statewide governance ambition.",
      "The state is strong on governance design, but real-world correction and usage depth still need continued evidence.",
    ],
    examples: [
      "California’s Data Exchange Framework is described by the state as its first-ever statewide framework for health and social-service information exchange.",
      "The framework is built around a Data Sharing Agreement and common policies and procedures rather than a single centralized clinical repository.",
      "The state presents DxF as a whole-person care instrument designed to support secure, real-time exchange across sectors.",
    ],
    sources: [
      "California CDII · Data Exchange Framework",
      "California DxF website · A Healthy California for All",
      "California HCAI · Data Exchange Framework",
    ],
  },
  Ohio: {
    score: 74,
    subtitle:
      "A comparatively strong operational interoperability case anchored in the statewide CliniSync HIE, with substantial deployment reach and a legal environment that explicitly defines health information exchange and disclosure conditions.",
    values: [73, 79, 68, 81, 76, 61],
    strengths: [
      "CliniSync provides a statewide exchange environment with longitudinal record access, alerts and provider connectivity.",
      "Ohio’s model is notable for practical deployment across a large share of residents and providers.",
      "State law gives explicit definition and disclosure conditions for health information exchange under Chapter 3798.",
    ],
    watch: [
      "Ohio is stronger on operational HIE infrastructure than on a broader whole-person state reform frame like California’s DxF.",
      "Identity assurance and cross-domain linkage remain less visible than exchange functionality itself.",
      "Public-interest correction and redress mechanisms are present in law but less prominent in the interoperability narrative.",
    ],
    examples: [
      "CliniSync presents itself as a statewide HIE that helps providers find patient records, exchange information and receive event notifications.",
      "The Ohio Health Information Partnership describes CliniSync as a neutral nonprofit infrastructure built to make interoperability work across the state.",
      "Ohio law explicitly defines a health information exchange and sets conditions for disclosing protected health information to one.",
    ],
    sources: [
      "CliniSync · Home",
      "CliniSync · Our Approach",
      "Ohio Revised Code · Chapter 3798",
      "Ohio Revised Code · Section 3798.07",
    ],
  },
};

function joinClasses(...items) {
  return items.filter(Boolean).join(" ");
}

function ImlLogo({ small = false }) {
  return (
    <div className={joinClasses("relative flex items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm", small ? "h-10 w-10" : "h-14 w-14")}>
      <svg viewBox="0 0 64 64" className={joinClasses(small ? "h-8 w-8" : "h-11 w-11")} aria-label="IML geometric eye triangle logo">
        <g fill="none" stroke="#0f172a" strokeWidth="1.45" strokeLinecap="round" strokeLinejoin="round">
          <rect x="10.5" y="10.5" width="43" height="43" rx="1.6" />
          <path d="M32 15.5 L46 44 H18 Z" />
          <path d="M20.6 33 C23.7 28.1, 28.7 25.6, 31.7 25.6 C34.8 25.6, 39.8 28.1, 43.4 33 C39.8 37.9, 34.8 40.4, 31.7 40.4 C28.7 40.4, 23.7 37.9, 20.6 33 Z" />
          <circle cx="30.7" cy="33" r="4.2" fill="#0f172a" stroke="none" />
          <circle cx="32" cy="31.7" r="0.95" fill="white" stroke="none" />
          <path d="M21.3 34.2 L21.1 49.2" opacity="0.9" />
        </g>
      </svg>
    </div>
  );
}

function ImlSymbolBadge({ children, dark = false, large = false }) {
  return (
    <div className={joinClasses("flex items-center justify-center rounded-2xl border font-semibold", large ? "h-12 w-12 text-base" : "h-10 w-10 text-xs", dark ? "border-white/15 bg-white/10 text-white" : "border-slate-200 bg-slate-100 text-slate-800")}>
      {children}
    </div>
  );
}

function ImlNavButton({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={joinClasses(
        "rounded-2xl font-semibold transition-all duration-200",
        active ? "bg-slate-900 px-6 py-3 text-base text-white shadow-md scale-110 ring-2 ring-slate-300" : "bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800"
      )}
    >
      {children}
    </button>
  );
}

function ImlSectionTitle({ badge, title, text }) {
  const badgeMap = {
    Value: "Positioning",
    Framework: "",
    Methodology: "",
    "Integrated explanatory pack": "Reading guide",
    "ID4D alignment": "Identity infrastructure",
    "Identity note": "Trust layer",
    "Pharma, evaluation and regulation": "",
    "Global review": "Country notes",
    "": "",
  };

  const displayBadge = badgeMap[badge] ?? badge;

  return (
    <div className="mb-10 max-w-4xl space-y-3">
      {displayBadge ? (
        <span className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-slate-600">{displayBadge}</span>
      ) : null}
      <h2 className="text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">{title}</h2>
      <p className="text-base leading-7 text-slate-600 md:text-lg">{text}</p>
    </div>
  );
}

function ImlShell({ children }) {
  return (
    <section className="bg-white text-slate-900">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">{children}</div>
    </section>
  );
}

function ImlCard({ children, className = "" }) {
  return <div className={joinClasses("rounded-[28px] border border-slate-200 bg-white shadow-sm", className)}>{children}</div>;
}

function ImlButton({ children, onClick, type = "button", variant = "solid" }) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={joinClasses("rounded-2xl px-5 py-3 text-sm font-medium transition", variant === "solid" ? "bg-slate-900 text-white hover:bg-slate-800" : "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50")}
    >
      {children}
    </button>
  );
}

function ImlMiniProgress({ value }) {
  const safe = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
      <div className="h-full rounded-full bg-slate-900" style={{ width: `${safe}%` }} />
    </div>
  );
}

function ImlMetricCard({ symbol, title, value, subtitle }) {
  return (
    <ImlCard className="rounded-[24px]">
      <div className="p-5">
        <div className="flex items-start gap-4">
          <ImlSymbolBadge>{symbol}</ImlSymbolBadge>
          <div className="space-y-1">
            <div className="text-sm text-slate-500">{title}</div>
            <div className="text-2xl font-semibold tracking-tight text-slate-900">{value}</div>
            <div className="text-sm leading-6 text-slate-600">{subtitle}</div>
          </div>
        </div>
      </div>
    </ImlCard>
  );
}

function ImlRadarChart({ values = [] }) {
  const normalizedValues = IML_AXES.map((_, index) => Math.max(0, Math.min(100, Number(values[index]) || 0)));
  const size = 360;
  const center = size / 2;
  const radius = 118;
  const levels = 5;

  const polarToCartesian = (angle, r) => {
    const rad = (angle - 90) * (Math.PI / 180);
    return { x: center + r * Math.cos(rad), y: center + r * Math.sin(rad) };
  };

  const polygonPoints = (scale) =>
    IML_AXES.map((_, index) => {
      const angle = (360 / IML_AXES.length) * index;
      const point = polarToCartesian(angle, radius * scale);
      return `${point.x},${point.y}`;
    }).join(" ");

  const dataPoints = normalizedValues
    .map((value, index) => {
      const angle = (360 / IML_AXES.length) * index;
      const point = polarToCartesian(angle, radius * (value / 100));
      return `${point.x},${point.y}`;
    })
    .join(" ");

  return (
    <div className="flex w-full items-center justify-center">
      <svg viewBox={`0 0 ${size} ${size}`} className="h-auto w-full max-w-[380px] overflow-visible" aria-label="IML hexagon chart">
        {Array.from({ length: levels }).map((_, idx) => (
          <polygon key={idx} points={polygonPoints((idx + 1) / levels)} fill="none" stroke="currentColor" className="text-slate-200" strokeWidth="1" />
        ))}
        {IML_AXES.map((axis, index) => {
          const angle = (360 / IML_AXES.length) * index;
          const end = polarToCartesian(angle, radius);
          const label = polarToCartesian(angle, radius + 30);
          return (
            <g key={axis}>
              <line x1={center} y1={center} x2={end.x} y2={end.y} stroke="currentColor" className="text-slate-200" strokeWidth="1" />
              <text x={label.x} y={label.y} textAnchor="middle" className="fill-slate-500" style={{ fontSize: 11, fontWeight: 600 }}>
                {axis}
              </text>
            </g>
          );
        })}
        <polygon points={dataPoints} fill="rgba(15, 23, 42, 0.14)" stroke="rgba(15, 23, 42, 0.85)" strokeWidth="2" />
        {normalizedValues.map((value, index) => {
          const angle = (360 / IML_AXES.length) * index;
          const point = polarToCartesian(angle, radius * (value / 100));
          return <circle key={index} cx={point.x} cy={point.y} r="4" fill="rgba(15, 23, 42, 0.95)" />;
        })}
      </svg>
    </div>
  );
}

function ImlMiniHexagon({ values = [], size = 88 }) {
  const normalizedValues = IML_AXES.map((_, index) => Math.max(0, Math.min(100, Number(values[index]) || 0)));
  const center = size / 2;
  const radius = size * 0.32;
  const levels = 3;

  const polarToCartesian = (angle, r) => {
    const rad = (angle - 90) * (Math.PI / 180);
    return { x: center + r * Math.cos(rad), y: center + r * Math.sin(rad) };
  };

  const polygonPoints = (scale) =>
    IML_AXES.map((_, index) => {
      const angle = (360 / IML_AXES.length) * index;
      const point = polarToCartesian(angle, radius * scale);
      return `${point.x},${point.y}`;
    }).join(" ");

  const dataPoints = normalizedValues
    .map((value, index) => {
      const angle = (360 / IML_AXES.length) * index;
      const point = polarToCartesian(angle, radius * (value / 100));
      return `${point.x},${point.y}`;
    })
    .join(" ");

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-label="Mini maturity hexagon">
      {Array.from({ length: levels }).map((_, idx) => (
        <polygon key={idx} points={polygonPoints((idx + 1) / levels)} fill="none" stroke="#cbd5e1" strokeWidth="1" />
      ))}
      {IML_AXES.map((_, index) => {
        const angle = (360 / IML_AXES.length) * index;
        const end = polarToCartesian(angle, radius);
        return <line key={index} x1={center} y1={center} x2={end.x} y2={end.y} stroke="#cbd5e1" strokeWidth="1" />;
      })}
      <polygon points={dataPoints} fill="rgba(15,23,42,0.14)" stroke="#0f172a" strokeWidth="1.6" />
      {normalizedValues.map((value, index) => {
        const angle = (360 / IML_AXES.length) * index;
        const point = polarToCartesian(angle, radius * (value / 100));
        return <circle key={index} cx={point.x} cy={point.y} r="2.6" fill="#0f172a" />;
      })}
    </svg>
  );
}

function ImlWorldTooltip({ marker, country, onEnter, onLeave }) {
  if (!marker || !country) return null;

  const left = `${(marker.x / 900) * 100}%`;
  const top = `${(marker.y / 430) * 100}%`;
  const horizontal = marker.x > 650 ? "translate(calc(-100% - 18px), -16px)" : "translate(18px, -16px)";
  const vertical = marker.y > 270 ? " translateY(calc(-100% + 32px))" : "";

  return (
    <div className="pointer-events-auto absolute z-20" style={{ left, top, transform: `${horizontal}${vertical}` }} onMouseEnter={onEnter} onMouseLeave={onLeave}>
      <div className="w-[160px] rounded-[22px] border border-slate-200/90 bg-white/95 p-3 shadow-[0_18px_50px_rgba(15,23,42,0.18)] backdrop-blur">
        <div className="mb-2 flex items-center justify-between gap-3">
          <div className="text-sm font-semibold text-slate-950">{marker.name}</div>
          <div className="rounded-full bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-white">{country.score}%</div>
        </div>
        <div className="flex items-center justify-center">
          <ImlMiniHexagon values={country.values} />
        </div>
      </div>
    </div>
  );
}

function ImlWorldMap({ selectedCountry, onSelect }) {
  const [hoveredCountry, setHoveredCountry] = useState("");
  const closeTimerRef = useRef(null);

  const clearCloseTimer = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const openTooltip = (countryName) => {
    clearCloseTimer();
    setHoveredCountry(countryName);
    onSelect(countryName);
  };

  const scheduleClose = () => {
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => {
      setHoveredCountry("");
      closeTimerRef.current = null;
    }, 140);
  };

  const activeMarker = IML_MARKERS.find((marker) => marker.name === hoveredCountry) || null;
  const activeCountry = hoveredCountry ? IML_COUNTRIES[hoveredCountry] : null;

  return (
    <div className="relative w-full overflow-hidden rounded-[32px] border border-slate-200 bg-[linear-gradient(180deg,#fbfdff_0%,#f2f6fb_100%)] p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.22em] text-slate-500">Global coverage in progress</div>
          <div className="text-lg font-semibold text-slate-950">Interactive world review map</div>
        </div>
        <div className="hidden rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 md:block">
          Hover a marker to preview the country hexagon. The full note updates below.
        </div>
      </div>

      <div className="relative aspect-[900/430] w-full">
        <svg viewBox="0 0 900 430" className="h-full w-full" aria-label="Interactive world map">
          <defs>
            <linearGradient id="imlOceanFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f8fbff" />
              <stop offset="100%" stopColor="#eef3f9" />
            </linearGradient>
            <linearGradient id="imlLandFill" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#e7eef6" />
              <stop offset="100%" stopColor="#d5e0ec" />
            </linearGradient>
          </defs>

          <rect x="0" y="0" width="900" height="430" rx="28" fill="url(#imlOceanFill)" />

          <g opacity="0.45" stroke="#d5deea" strokeWidth="1">
            {Array.from({ length: 8 }).map((_, i) => (
              <line key={`h-${i}`} x1="40" y1={48 + i * 42} x2="860" y2={48 + i * 42} />
            ))}
            {Array.from({ length: 10 }).map((_, i) => (
              <line key={`v-${i}`} x1={70 + i * 80} y1="28" x2={70 + i * 80} y2="398" />
            ))}
          </g>

          <g fill="url(#imlLandFill)" stroke="#9fb0c4" strokeWidth="1.1">
            <path d="M88 112 C108 80, 170 70, 214 90 C248 105, 254 144, 232 170 C214 192, 174 197, 155 220 C139 240, 101 236, 79 207 C59 180, 58 141, 88 112 Z" />
            <path d="M180 233 C199 228, 226 239, 239 259 C251 276, 245 305, 223 319 C204 332, 176 326, 164 305 C154 287, 160 241, 180 233 Z" />
            <path d="M186 182 C196 172, 213 171, 227 176 C240 181, 248 190, 247 199 C245 208, 235 213, 222 212 C212 211, 205 215, 199 220 C193 224, 185 223, 180 217 C175 211, 175 201, 180 194 C183 189, 184 186, 186 182 Z" />
            <path d="M372 92 C422 70, 498 75, 548 103 C580 122, 595 160, 572 187 C551 211, 504 214, 482 233 C456 254, 417 247, 395 228 C376 211, 337 212, 320 189 C304 166, 317 116, 372 92 Z" />
            <path d="M468 238 C489 228, 523 235, 542 255 C559 271, 563 308, 538 333 C515 355, 479 354, 455 338 C433 323, 420 297, 428 273 C435 255, 448 247, 468 238 Z" />
            <ellipse cx="796" cy="170" rx="18" ry="12" />
            <path d="M609 103 C654 85, 730 92, 775 118 C816 141, 829 182, 806 212 C781 244, 733 246, 694 241 C657 236, 623 214, 604 190 C584 163, 579 118, 609 103 Z" />
            <ellipse cx="742" cy="324" rx="34" ry="18" />
            <ellipse cx="805" cy="350" rx="17" ry="10" />
          </g>

          <g>
            {IML_MARKERS.map((marker) => {
              const isSelected = selectedCountry === marker.name;
              const isHovered = hoveredCountry === marker.name;
              return (
                <g key={marker.name} onClick={() => onSelect(marker.name)} onMouseEnter={() => openTooltip(marker.name)} onMouseLeave={scheduleClose} className="cursor-pointer">
                  <circle cx={marker.x} cy={marker.y} r={isSelected || isHovered ? 12 : 8} fill={isSelected || isHovered ? "#0f172a" : "#334155"} />
                  <circle cx={marker.x} cy={marker.y} r={isSelected || isHovered ? 22 : 15} fill="rgba(15,23,42,0.10)" />
                  <circle cx={marker.x} cy={marker.y} r={isSelected || isHovered ? 30 : 22} fill="rgba(15,23,42,0.05)" />
                  <text x={marker.x + (marker.labelDx ?? 14)} y={marker.y + (marker.labelDy ?? 4)} fill="#0f172a" style={{ fontSize: marker.textSize ?? 13, fontWeight: 600 }}>
                    {marker.name}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>

        {activeMarker && activeCountry ? <ImlWorldTooltip marker={activeMarker} country={activeCountry} onEnter={() => openTooltip(activeMarker.name)} onLeave={scheduleClose} /> : null}
      </div>
    </div>
  );
}

function ImlCountryProfile({ selectedCountry }) {
  const selected = selectedCountry ? IML_COUNTRIES[selectedCountry] : null;
  if (!selected) return null;

  return (
    <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
      <ImlCard>
        <div className="p-6">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="text-xl font-semibold text-slate-950">{selectedCountry}</div>
            <div className="rounded-full bg-slate-900 px-3 py-1 text-sm font-medium text-white">Score {selected.score}/100</div>
          </div>
          <div className="mb-4 text-sm leading-7 text-slate-500">{selected.subtitle}</div>
          <ImlRadarChart values={selected.values} />
        </div>
      </ImlCard>

      <div className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <ImlMetricCard symbol="HX" title="Hexagon" value="6 criteria" subtitle="Standards, connectivity, identity, adoption, security and correction." />
          <ImlMetricCard symbol="BM" title="Benchmark type" value="Country profile" subtitle="A strategic view rather than a vendor comparison." />
          <ImlMetricCard symbol="ST" title="Strengths" value="Visible" subtitle="Assets that can accelerate interoperability maturity." />
          <ImlMetricCard symbol="PW" title="Points to watch" value="Critical" subtitle="Risks, gaps or friction points that can slow scale-up." />
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <ImlCard>
            <div className="p-6">
              <div className="mb-3 text-lg font-semibold text-slate-950">Strengths</div>
              <ul className="space-y-3 text-sm leading-7 text-slate-600">
                {selected.strengths.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
          </ImlCard>
          <ImlCard>
            <div className="p-6">
              <div className="mb-3 text-lg font-semibold text-slate-950">Points to watch</div>
              <ul className="space-y-3 text-sm leading-7 text-slate-600">
                {selected.watch.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
          </ImlCard>
        </div>

        <ImlCard className="bg-slate-50">
          <div className="p-6">
            <div className="mb-3 text-lg font-semibold text-slate-950">Examples and supporting elements</div>
            <ul className="space-y-3 text-sm leading-7 text-slate-700">
              {selected.examples.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>

            {selected.critique ? (
              <div className="mt-5 space-y-4 rounded-[24px] border border-amber-200 bg-amber-50 p-5 text-sm leading-7 text-amber-950">
                <div className="text-base font-semibold">{selected.critique.title}</div>
                <div>
                  <div className="mb-1 font-semibold">Finding</div>
                  <p>{selected.critique.constat}</p>
                </div>
                <div>
                  <div className="mb-1 font-semibold">Analysed case</div>
                  <p>{selected.critique.example}</p>
                </div>
                <div>
                  <div className="mb-1 font-semibold">Institutional reading</div>
                  <p>{selected.critique.institution}</p>
                </div>
                <div>
                  <div className="mb-1 font-semibold">Information-system limitation</div>
                  <p>{selected.critique.information}</p>
                </div>
                <div>
                  <div className="mb-1 font-semibold">Implication for IML</div>
                  <p>{selected.critique.implication}</p>
                </div>
                <div>
                  <div className="mb-1 font-semibold">ID4D reading</div>
                  <p>{selected.critique.id4d}</p>
                </div>
                <div>
                  <div className="mb-1 font-semibold">Conclusion</div>
                  <p>{selected.critique.conclusion}</p>
                </div>
              </div>
            ) : null}

            <div className="mt-5 border-t border-slate-200 pt-4">
              <div className="mb-2 text-sm font-semibold text-slate-900">Sources used</div>
              <ul className="space-y-2 text-sm text-slate-600">
                {selected.sources.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
          </div>
        </ImlCard>
      </div>
    </div>
  );
}

function ImlUsStateSection() {
  const [selectedState, setSelectedState] = useState("California");
  const selectedBenchmark = IML_US_STATE_BENCHMARKS[selectedState] || null;
  if (!selectedBenchmark) return null;

  return (
    <div className="mt-12 space-y-8">
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm leading-7 text-slate-700">
        <div className="mb-2 text-sm font-semibold text-slate-900">United States sample layer</div>
        <p>To keep the site readable, the U.S. state-level layer is simplified here to two first sample notes: California and Ohio. They illustrate two different interoperability patterns inside the same federal environment.</p>
      </div>

      <div className="w-full md:w-[360px]">
        <label className="mb-2 block text-sm font-medium text-slate-700">Choose a U.S. sample state</label>
        <select value={selectedState} onChange={(e) => setSelectedState(e.target.value)} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none">
          {IML_US_STATES.map((state) => (
            <option key={state} value={state}>{state}</option>
          ))}
        </select>
      </div>

      <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <ImlCard>
          <div className="p-6">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="text-xl font-semibold text-slate-950">{selectedState}</div>
              <div className="rounded-full bg-slate-900 px-3 py-1 text-sm font-medium text-white">Score {selectedBenchmark.score}/100</div>
            </div>
            <div className="mb-4 text-sm leading-7 text-slate-500">{selectedBenchmark.subtitle}</div>
            <ImlRadarChart values={selectedBenchmark.values} />
          </div>
        </ImlCard>

        <div className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <ImlMetricCard symbol="ST" title="Strengths" value="Visible" subtitle="Existing assets that support state-level maturity." />
            <ImlMetricCard symbol="PW" title="Points to watch" value="Critical" subtitle="Structural or operational limits that still matter." />
            <ImlMetricCard symbol="US" title="Benchmark type" value="State sample" subtitle="A focused U.S. comparison layer inside World Map." />
            <ImlMetricCard symbol="HX" title="Hexagon" value="6 criteria" subtitle="Governance, exchange, identity, adoption, security and correction." />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <ImlCard>
              <div className="p-6">
                <div className="mb-3 text-lg font-semibold text-slate-950">Strengths</div>
                <ul className="space-y-3 text-sm leading-7 text-slate-600">
                  {selectedBenchmark.strengths.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>
            </ImlCard>
            <ImlCard>
              <div className="p-6">
                <div className="mb-3 text-lg font-semibold text-slate-950">Points to watch</div>
                <ul className="space-y-3 text-sm leading-7 text-slate-600">
                  {selectedBenchmark.watch.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>
            </ImlCard>
          </div>

          <ImlCard className="bg-slate-50">
            <div className="p-6">
              <div className="mb-3 text-lg font-semibold text-slate-950">Examples and supporting elements</div>
              <ul className="space-y-3 text-sm leading-7 text-slate-700">
                {selectedBenchmark.examples.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>

              <div className="mt-5 border-t border-slate-200 pt-4">
                <div className="mb-2 text-sm font-semibold text-slate-900">Sources used</div>
                <ul className="space-y-2 text-sm text-slate-600">
                  {selectedBenchmark.sources.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </ImlCard>
        </div>
      </div>
    </div>
  );
}

function ImlHomePage() {
  return (
    <div>
      <section className="relative overflow-hidden border-b border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(15,23,42,0.06),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(15,23,42,0.05),_transparent_28%)]">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-24">
          <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr]">
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }} className="space-y-7">
              <div className="space-y-4">
                <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-slate-950 md:text-6xl">{IML_HOME.heroTitle}</h1>
                <div className="max-w-3xl space-y-4">
                  <p className="max-w-2xl text-lg leading-8 text-slate-600">{IML_HOME.heroText}</p>
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm leading-7 text-slate-700 shadow-sm">
                    <p>{IML_HOME.interopShiftNote}</p>
                  </div>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <ImlMetricCard symbol="6X" title="Assessment model" value="6 criteria" subtitle="Standards, connectivity, identity, adoption, security and correction." />
                <ImlMetricCard symbol="ID" title="Critical layer" value="Identity & trust" subtitle="The seam between interoperability and confidence." />
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.1 }} className="flex items-center">
              <ImlCard className="w-full shadow-xl shadow-slate-200/60">
                <div className="p-6 md:p-8">
                  <div className="mb-6 flex items-center gap-3">
                    <ImlLogo />
                    <div>
                      <div className="text-sm uppercase tracking-[0.2em] text-slate-500">Institutional overview</div>
                      <div className="text-xl font-semibold text-slate-950">Publication-ready structure</div>
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {[
                      ["Scoring", "A readable maturity score anchored in six criteria."],
                      ["Benchmarks", "Country profiles that quickly open strategic discussion."],
                      ["ID4D", "A trust and inclusion lens for identity-enabled public infrastructure."],
                    ].map(([title, text]) => (
                      <div key={title} className="rounded-2xl border border-slate-200 p-4">
                        <div className="mb-2 text-sm font-semibold text-slate-900">{title}</div>
                        <div className="text-sm leading-6 text-slate-600">{text}</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 rounded-2xl bg-slate-950 p-5 text-white">
                    <div className="mb-3 flex items-center justify-between gap-4">
                      <div>
                        <div className="text-sm text-slate-300">Signature</div>
                        <div className="text-lg font-semibold text-white">{IML_HOME.signature}</div>
                      </div>
                      <ImlSymbolBadge dark>✓</ImlSymbolBadge>
                    </div>
                    <p className="text-sm leading-7 text-slate-300">{IML_HOME.signatureText}</p>
                  </div>
                </div>
              </ImlCard>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <ImlSectionTitle badge="Value" title="Why IML matters" text="The platform frames interoperability as a strategic bridge between policy, architecture, trust and measurable system performance." />
        <div className="grid gap-5 md:grid-cols-3">
          {IML_HOME.valueCards.map((item, index) => (
            <motion.div key={item.title} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: index * 0.05 }}>
              <ImlCard className="rounded-[24px]">
                <div className="p-6">
                  <div className="mb-4 inline-flex"><ImlSymbolBadge>{item.title.slice(0, 2).toUpperCase()}</ImlSymbolBadge></div>
                  <h3 className="mb-2 text-xl font-semibold text-slate-950">{item.title}</h3>
                  <p className="text-sm leading-7 text-slate-600">{item.text}</p>
                </div>
              </ImlCard>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}

function ImlId4dPage() {
  return (
    <ImlShell>
      <ImlSectionTitle badge="ID4D alignment" title="Positioning IML in alignment with the ID4D approach" text="IML can be aligned with ID4D by treating digital identity as an enabling public infrastructure layer for inclusive access, trusted service delivery, interoperability and accountable governance." />
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {IML_ID4D.map((item) => (
          <ImlCard key={item.title} className="rounded-[24px]">
            <div className="p-6">
              <div className="mb-4 inline-flex"><ImlSymbolBadge>{item.title.slice(0, 2).toUpperCase()}</ImlSymbolBadge></div>
              <h3 className="text-lg font-semibold text-slate-950">{item.title}</h3>
              <p className="mt-2 text-sm leading-7 text-slate-600">{item.text}</p>
            </div>
          </ImlCard>
        ))}
      </div>

      <div className="mt-14 space-y-8">
        <ImlSectionTitle badge="Identity note" title="Identity and trust as a public infrastructure layer" text="Within the ID4D framing, identity is not a side module. It is one of the enabling layers that determine whether access, exchange, accountability and trusted service delivery can function at scale across health systems." />

        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <ImlCard>
            <div className="p-6">
              <div className="mb-4 text-xl font-semibold text-slate-950">Why identity belongs inside the ID4D reading</div>
              <div className="space-y-4 text-sm leading-7 text-slate-700">
                <p>Without a reliable identity layer, interoperability becomes unstable: matching degrades, access control becomes harder to defend, and continuity of care loses precision across institutions and care pathways.</p>
                <p>IML therefore treats identity, authentication, consent and auditability as structural variables rather than optional technical add-ons. A country can have standards and exchange pipes on paper while still remaining fragile if identity and trust are weak in practice.</p>
                <p>This is why identity affects not only a dedicated maturity dimension, but also the interpretation of deployment, security, correction and overall system trustworthiness.</p>
              </div>
            </div>
          </ImlCard>

          <ImlCard className="bg-slate-50">
            <div className="p-6">
              <div className="mb-4 text-xl font-semibold text-slate-950">Core operational capabilities</div>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  ["Master Patient Index", "Reduces duplication, supports record reconciliation and stabilises continuity of care."],
                  ["Authentication", "Applies fit-for-purpose levels of assurance according to context, role and service criticality."],
                  ["Consent", "Enables transparent access rules, traceable permissions and defensible trust practices."],
                  ["Audit", "Creates a verifiable record of access, actions and accountability across systems."],
                ].map(([title, text]) => (
                  <div key={title} className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="mb-1 text-sm font-semibold text-slate-950">{title}</div>
                    <div className="text-sm leading-7 text-slate-600">{text}</div>
                  </div>
                ))}
              </div>
            </div>
          </ImlCard>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <ImlCard>
            <div className="p-6">
              <div className="mb-3 text-xl font-semibold text-slate-950">Explanatory note on the proposed identity code</div>
              <div className="space-y-4 text-sm leading-7 text-slate-700">
                <p>The proposed request-validated identity code is presented here as a methodological annex, not as a universal civil identifier. Its role is to show how identity can be structured for interoperability, research and regulated use while remaining compatible with purpose limitation and controlled linkage.</p>
                <p>The visible format remains concise, but it is designed to connect to a broader integration envelope that can include additional personal information only when legally justified and operationally necessary.</p>
              </div>
              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-1 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Visible format</div>
                <div className="mb-2 text-2xl font-semibold tracking-tight text-slate-950">{IML_IDENTIFIER.visibleFormat}</div>
                <div className="text-sm text-slate-600">Example: <span className="font-mono text-slate-900">{IML_IDENTIFIER.example}</span></div>
              </div>
            </div>
          </ImlCard>

          <ImlCard className="bg-slate-50">
            <div className="p-6">
              <div className="mb-3 text-xl font-semibold text-slate-950">Governance and integration envelope</div>
              <div className="space-y-4 text-sm leading-7 text-slate-700">
                <p>The visible identifier should be linked to a controlled integration envelope that can include name elements, contact channels, local record numbers, national identifiers where permitted, consent state, research identifiers and linkage tables for matching or correction workflows.</p>
                {IML_IDENTIFIER.guidance.map((item) => (
                  <p key={item}>{item}</p>
                ))}
              </div>
            </div>
          </ImlCard>
        </div>
      </div>
    </ImlShell>
  );
}

function ImlMedicinesPage() {
  return (
    <ImlShell>
      <ImlSectionTitle badge="Pharma, evaluation and regulation" title="Evaluation and regulatory shifts in an interoperable environment" text="Interoperability maturity affects clinical evaluation, long-term follow-up and regulatory decision-making by making broader, longitudinal and better-governed evidence environments possible." />

      <div className="mb-10 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <ImlCard>
          <div className="p-6">
            <div className="mb-6 text-xl font-semibold text-slate-950">Core proposition</div>
            <div className="space-y-4 text-sm leading-7 text-slate-700">
              <p>A mature interoperability and identity layer can support a safeguarded, person-linked longitudinal view of clinically relevant information across prescriptions, dispensing events, laboratory results, care episodes, prior conditions and follow-up signals.</p>
              <p>This does not mean creating a single uncontrolled profile. It means enabling authorised and proportionate access to the information needed to understand medicines use in real care pathways, beyond protocol-specific datasets that may overlook comorbidities, medication history, laboratory trends, contraindications or care events outside a narrow trial boundary.</p>
            </div>
          </div>
        </ImlCard>

        <ImlCard className="bg-slate-50">
          <div className="p-6">
            <div className="mb-6 text-xl font-semibold text-slate-950">Why Nordic reference cases matter here</div>
            <div className="space-y-4 text-sm leading-7 text-slate-700">
              <p>Sweden shows the practical value of a shared medication information layer: the National Medication List gives healthcare, pharmacies and the patient access to the same up-to-date prescribing and dispensing information, within an identity- and authorisation-based access model.</p>
              <p>Denmark offers a complementary example in bacteriology: the MiBa and MiBAlert environment enables cross-sector access to microbiology results and early identification of patients carrying multidrug-resistant microorganisms, which is relevant for isolation decisions, antibiotic choice and infection-control action.</p>
            </div>
          </div>
        </ImlCard>
      </div>

      <div className="mb-10 grid gap-5 md:grid-cols-3">
        {[
          ["Clinical evaluation", "A broader clinically relevant data view can improve the interpretation of effectiveness, safety, adherence and real-world use patterns across longer time horizons."],
          ["Pharmaceutical industry", "A mature interoperability environment supports stronger evidence generation, including longitudinal datasets, real-world evidence and post-market signal detection."],
          ["Regulators and agencies", "Identity-linked and interoperable information strengthens traceability, oversight and the ability to investigate safety, efficacy and system-level outcomes."],
        ].map(([title, text], index) => (
          <ImlCard key={title} className={index === 1 ? "bg-slate-50" : ""}>
            <div className="p-6">
              <div className="mb-4 inline-flex"><ImlSymbolBadge>{title.slice(0, 2).toUpperCase()}</ImlSymbolBadge></div>
              <h3 className="mb-2 text-xl font-semibold text-slate-950">{title}</h3>
              <p className="text-sm leading-7 text-slate-600">{text}</p>
            </div>
          </ImlCard>
        ))}
      </div>

      <ImlCard className="mb-10 border-amber-200 bg-amber-50">
        <div className="p-6">
          <div className="mb-3 text-xl font-semibold text-amber-950">Special note for pharmaceutical industry and regulatory authorities</div>
          <div className="space-y-4 text-sm leading-7 text-amber-950">
            <p>The IML framework suggests that clinical evaluation can extend beyond short-term, protocol-bound trials toward governed longitudinal follow-up, stronger signal detection and more adaptive evidence generation across real-world use and extended time horizons.</p>
          </div>
        </div>
      </ImlCard>

      <ImlCard className="mb-10 border-slate-200 bg-white text-slate-900">
        <div className="p-6">
          <div className="mb-3 text-xl font-semibold text-slate-950">Regulatory shift · EMA / FDA</div>
          <div className="space-y-4 text-sm leading-7 text-slate-700">
            <p>For the EMA and the FDA, the shift implied by IML is not the replacement of randomized trials, but the expansion of the evidence architecture around them. A mature interoperability and identity environment can support more continuous, regulator-grade observation after authorization, with better visibility on delayed effects, treatment pathways, switching patterns, adherence and heterogeneous real-world response.</p>
            <p>For the EMA, this can strengthen comparison across health systems and cross-border care environments; for the FDA, it reinforces the role of real-world evidence, lifecycle monitoring and post-market signal refinement in large-scale delivery settings.</p>
          </div>
        </div>
      </ImlCard>

      <ImlCard>
        <div className="p-6">
          <div className="mb-3 text-xl font-semibold text-slate-950">Reference labels used in this section</div>
          <ul className="space-y-3 text-sm leading-7 text-slate-600">
            {IML_RESEARCH_SOURCES.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </div>
      </ImlCard>
    </ImlShell>
  );
}

function ImlMethodologyPage() {
  return (
    <ImlShell>
      <ImlSectionTitle badge="Framework" title="A framework that is simple to read and strong enough to defend" text="IML combines six assessment dimensions, a maturity score and comparative country notes, while treating identity and trust as structural conditions rather than optional technical modules." />

      <div className="mb-14 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {IML_PILLARS.map((pillar, index) => (
          <motion.div key={pillar.title} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: index * 0.05 }}>
            <ImlCard className="h-full rounded-[24px]">
              <div className="p-6">
                <div className="mb-5 inline-flex"><ImlSymbolBadge>{pillar.symbol}</ImlSymbolBadge></div>
                <h3 className="mb-3 text-xl font-semibold text-slate-950">{pillar.title}</h3>
                <p className="text-sm leading-7 text-slate-600">{pillar.text}</p>
              </div>
            </ImlCard>
          </motion.div>
        ))}
      </div>

      <div className="mb-14 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <ImlCard>
          <div className="p-6">
            <div className="mb-6 text-xl font-semibold text-slate-950">The six assessment criteria</div>
            <div className="space-y-4">
              {IML_CRITERIA.map(([n, title, text]) => (
                <div key={n} className="rounded-2xl border border-slate-200 p-4">
                  <div className="mb-1 text-sm font-semibold text-slate-900">Criterion {n} · {title}</div>
                  <div className="text-sm leading-7 text-slate-600">{text}</div>
                </div>
              ))}
            </div>
          </div>
        </ImlCard>

        <ImlCard className="bg-slate-50">
          <div className="p-6">
            <div className="mb-6 text-xl font-semibold text-slate-950">Score explainer</div>
            <div className="space-y-4 text-sm leading-7 text-slate-700">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">The score is a structured reading of a country or institution’s ability to govern, secure, deploy and scale interoperability. It is not a decorative ranking.</div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">A high score reflects more than technology: it also reflects governance discipline, trust services, operational uptake and visible correction capacity. A mid-range score often signals promising components that still lack convergence or scalable deployment.</div>
            </div>
          </div>
        </ImlCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <ImlCard>
          <div className="p-6">
            <div className="mb-6 text-xl font-semibold text-slate-950">Maturity scale</div>
            <div className="space-y-5">
              {IML_SCORING.map((item) => (
                <div key={item.label} className="space-y-2">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">{item.label}</div>
                      <div className="text-sm text-slate-500">{item.tone}</div>
                    </div>
                    <div className="text-sm font-semibold text-slate-700">{item.value}/100</div>
                  </div>
                  <ImlMiniProgress value={item.value} />
                </div>
              ))}
            </div>
          </div>
        </ImlCard>

        <ImlCard className="bg-slate-50">
          <div className="p-6">
            <div className="mb-6 text-xl font-semibold text-slate-950">Why criterion 6 matters</div>
            <div className="space-y-4 text-sm leading-7 text-slate-700">
              <p>Mature systems are often assessed on standards, identity, security and technical exchange, but much less on whether people and institutions can actually correct failures once they happen.</p>
              <p>Criterion 6 therefore asks whether a system can process complaints, support rectification, organise recourse, produce visible correction and transform feedback into institutional learning.</p>
              <p>A country may perform strongly on formal architecture and still score lower on maturity if the correction loop remains weak in practice.</p>
            </div>
          </div>
        </ImlCard>
      </div>

      <div className="mt-14 space-y-8">
        <ImlSectionTitle badge="Integrated explanatory pack" title="Methodology and explanatory pack in one place" text={IML_EXPLANATORY_PACK.intro} />

        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <ImlCard>
            <div className="p-6">
              <div className="mb-3 text-xl font-semibold text-slate-950">Purpose</div>
              <p className="text-sm leading-7 text-slate-700">{IML_EXPLANATORY_PACK.purpose}</p>
            </div>
          </ImlCard>

          <ImlCard className="bg-slate-50">
            <div className="p-6">
              <div className="mb-3 text-xl font-semibold text-slate-950">Reading rule</div>
              <p className="text-sm leading-7 text-slate-700">The score should always be read together with the hexagon, the strengths and the points to watch. The number is the headline, not the full story.</p>
            </div>
          </ImlCard>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <ImlCard>
            <div className="p-6">
              <div className="mb-4 text-xl font-semibold text-slate-950">What the score captures</div>
              <ul className="space-y-3 text-sm leading-7 text-slate-700">
                {IML_EXPLANATORY_PACK.scoreCaptures.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
          </ImlCard>

          <ImlCard className="bg-slate-50">
            <div className="p-6">
              <div className="mb-4 text-xl font-semibold text-slate-950">What the score does not claim</div>
              <ul className="space-y-3 text-sm leading-7 text-slate-700">
                {IML_EXPLANATORY_PACK.scoreLimits.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
          </ImlCard>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <ImlCard>
            <div className="p-6">
              <div className="mb-4 text-xl font-semibold text-slate-950">How to read the strengths</div>
              <ul className="space-y-3 text-sm leading-7 text-slate-700">
                {IML_EXPLANATORY_PACK.strengthsGuide.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
          </ImlCard>

          <ImlCard className="bg-slate-50">
            <div className="p-6">
              <div className="mb-4 text-xl font-semibold text-slate-950">How to read the points to watch</div>
              <ul className="space-y-3 text-sm leading-7 text-slate-700">
                {IML_EXPLANATORY_PACK.watchGuide.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
          </ImlCard>
        </div>
      </div>
    </ImlShell>
  );
}

function ImlCountriesPage() {
  const [selectedCountry, setSelectedCountry] = useState("");
  const countryOptions = useMemo(() => Object.keys(IML_COUNTRIES).sort((a, b) => a.localeCompare(b)), []);

  return (
    <ImlShell>
      <ImlSectionTitle badge="Global review" title="A growing global review rather than a closed country list" text="The countries currently included in the study are not presented as a fixed or exhaustive panel. They are analysed progressively, in a partly opportunistic sequence, with the longer-term objective of extending the review to as many countries as possible. The map below is therefore designed as a living navigation layer for a growing body of country notes." />

      <div className="mb-10 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <ImlCard>
          <div className="p-6">
            <div className="mb-4 text-xl font-semibold text-slate-950">How countries are selected</div>
            <div className="space-y-4 text-sm leading-7 text-slate-700">
              <p>The current edition does not claim to represent a statistically balanced world sample. Countries are added as analytical cases according to source availability, strategic relevance, contrast value and editorial sequencing.</p>
              <p>The objective is not to freeze the study around a small club of examples, but to progressively build a broader comparative archive that can eventually cover countries across all regions.</p>
              <p>The countries currently covered include Argentina, Australia, Brazil, Canada, Costa Rica, Estonia, Ethiopia, France, Guatemala, India, Japan, Morocco, New Zealand, Russia, Senegal, Sweden, Tanzania and the United States.</p>
            </div>
          </div>
        </ImlCard>

        <ImlCard className="bg-slate-50">
          <div className="p-6">
            <div className="mb-4 text-xl font-semibold text-slate-950">Interactive map logic</div>
            <div className="space-y-4 text-sm leading-7 text-slate-700">
              <p>Each highlighted point opens an existing analytical country note. Over time, new countries can be added to the map without redesigning the overall site architecture.</p>
              <p>The tooltip previews the six-axis shape, while the full country profile updates directly below. The United States also opens a simplified sample-state layer for California and Ohio inside this same page.</p>
            </div>
          </div>
        </ImlCard>
      </div>

      <div className="mb-8 w-full md:w-[360px]">
        <label className="mb-2 block text-sm font-medium text-slate-700">Choose a country</label>
        <select value={selectedCountry} onChange={(e) => setSelectedCountry(e.target.value)} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none">
          <option value="">Choose a country</option>
          {countryOptions.map((country) => (
            <option key={country} value={country}>{country}</option>
          ))}
        </select>
      </div>

      <div className="mb-10 flex justify-center">
        <div className="w-full max-w-6xl">
          <ImlWorldMap selectedCountry={selectedCountry} onSelect={setSelectedCountry} />
        </div>
      </div>

      {selectedCountry ? <ImlCountryProfile selectedCountry={selectedCountry} /> : null}
      {selectedCountry === "United States" ? <ImlUsStateSection /> : null}
    </ImlShell>
  );
}

function ImlContactPage() {
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState("idle");
  const [errorText, setErrorText] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    organization: "",
    subject: "",
    message: "",
  });

  const copyEmail = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText("iml.health@pm.me");
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
      }
    } catch {
      setCopied(false);
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus("sending");
    setErrorText("");

    try {
      const response = await fetch("https://formsubmit.co/ajax/iml.health@pm.me", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          organization: formData.organization,
          _subject: formData.subject ? `IML Contact · ${formData.subject}` : "IML Contact Form Submission",
          message: formData.message,
          _replyto: formData.email,
          _template: "table",
          _captcha: "true",
        }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok || payload?.success === "false") {
        throw new Error(payload?.message || "Submission failed.");
      }

      setStatus("success");
      setFormData({
        name: "",
        email: "",
        organization: "",
        subject: "",
        message: "",
      });
    } catch (error) {
      setStatus("error");
      setErrorText(error?.message || "Unable to send the message right now.");
    }
  };

  return (
    <ImlShell>
      <ImlSectionTitle badge="" title="Editorial and institutional contact" text="For publication matters, country notes, methodological discussion and institutional exchanges, please use the contact address below." />

      <div className="grid gap-6 lg:grid-cols-[1fr_0.95fr]">
        <ImlCard>
          <div className="p-6">
            <div className="mb-5 flex items-center gap-4">
              <ImlLogo />
              <div>
                <div className="text-sm uppercase tracking-[0.2em] text-slate-500">Primary contact</div>
                <div className="text-2xl font-semibold text-slate-950">IML Health</div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <div className="mb-2 text-sm font-semibold text-slate-900">Email</div>
              <div className="mb-4 text-lg font-medium text-slate-900">iml.health@pm.me</div>
              <p className="mb-5 text-sm leading-7 text-slate-600">This address can be used for publication matters, methodological questions, institutional exchanges and requests related to comparative country analyses.</p>
              <div className="flex flex-wrap items-center gap-3">
                <ImlButton type="button" onClick={copyEmail}>Copy email</ImlButton>
                {copied ? <span className="text-sm text-slate-600">Email copied.</span> : null}
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5">
              <div className="mb-3 text-lg font-semibold text-slate-950">Contact form</div>
              <p className="mb-5 text-sm leading-7 text-slate-600">
                Use this form to send a message directly to the IML inbox.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">Name</span>
                    <input
                      type="text"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-500"
                      placeholder="Your name"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">Email</span>
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-500"
                      placeholder="your@email.com"
                    />
                  </label>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">Organisation</span>
                    <input
                      type="text"
                      name="organization"
                      value={formData.organization}
                      onChange={handleChange}
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-500"
                      placeholder="Institution or organisation"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">Subject</span>
                    <input
                      type="text"
                      name="subject"
                      required
                      value={formData.subject}
                      onChange={handleChange}
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-500"
                      placeholder="Reason for contact"
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Message</span>
                  <textarea
                    name="message"
                    required
                    rows={7}
                    value={formData.message}
                    onChange={handleChange}
                    className="w-full rounded-[24px] border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-500"
                    placeholder="Write your message here"
                  />
                </label>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <ImlButton type="submit" variant="solid">
                    {status === "sending" ? "Sending..." : "Send message"}
                  </ImlButton>

                  {status === "success" ? (
                    <span className="text-sm text-emerald-700">Message sent successfully.</span>
                  ) : null}

                  {status === "error" ? (
                    <span className="text-sm text-rose-700">{errorText || "Unable to send the message right now."}</span>
                  ) : null}
                </div>

                <p className="text-xs leading-6 text-slate-500">
                  On the first submission, FormSubmit may ask you to confirm the destination inbox before forwarding future messages.
                </p>
              </form>
            </div>
          </div>
        </ImlCard>

        <ImlCard className="bg-slate-50">
          <div className="p-6">
            <div className="mb-4 text-xl font-semibold text-slate-950">Typical use cases</div>
            <ul className="space-y-3 text-sm leading-7 text-slate-700">
              <li>• Request a country note or benchmark update</li>
              <li>• Discuss the methodology with institutional partners</li>
              <li>• Open an editorial or publication conversation</li>
              <li>• Explore an identity-layer or medicines-analysis use case</li>
              <li>• Extend the U.S. sample-state section or add new countries</li>
            </ul>
          </div>
        </ImlCard>
      </div>
    </ImlShell>
  );
}

function ImlFooter({ goTo }) {
  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-10 lg:grid-cols-[1fr_1fr_1fr] lg:px-8">
        <div>
          <div className="mb-3 flex items-center gap-3">
            <ImlLogo small={true} />
            <div>
              <div className="text-sm font-semibold tracking-[0.2em] text-slate-500">IML</div>
              <div className="text-sm text-slate-700">{IML_HOME.brandLong}</div>
            </div>
          </div>
          <p className="max-w-sm text-sm leading-7 text-slate-600">{IML_HOME.tagline}</p>
        </div>
        <div>
          <div className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Navigation</div>
          <div className="flex flex-wrap gap-2">
            {IML_ROUTES.map((route) => (
              <ImlNavButton key={route.key} active={false} onClick={() => goTo(route.key)}>{route.label}</ImlNavButton>
            ))}
          </div>
        </div>
        <div>
          <div className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Positioning</div>
          <p className="text-sm leading-7 text-slate-600">Six-axis benchmark, country notes, identity and trust, regulatory use, and ID4D-aligned framing.</p>
        </div>
      </div>
    </footer>
  );
}

export default function ImlCanvasAppV3() {
  const getRouteFromHash = () => {
    if (typeof window === "undefined") return "home";
    const raw = window.location.hash.replace("#", "").trim();
    return IML_ROUTES.some((route) => route.key === raw) ? raw : "home";
  };

  const [currentPage, setCurrentPage] = useState(getRouteFromHash);

  useEffect(() => {
    const syncFromHash = () => setCurrentPage(getRouteFromHash());
    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
    return () => window.removeEventListener("hashchange", syncFromHash);
  }, []);

  const goTo = (page) => {
    if (typeof window !== "undefined") {
      window.location.hash = page;
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    setCurrentPage(page);
  };

  const renderedPage = useMemo(() => {
    switch (currentPage) {
      case "id4d":
        return <ImlId4dPage />;
      case "medicines":
        return <ImlMedicinesPage />;
      case "method":
        return <ImlMethodologyPage />;
      case "countries":
        return <ImlCountriesPage />;
      case "contact":
        return <ImlContactPage />;
      case "home":
      default:
        return <ImlHomePage />;
    }
  }, [currentPage]);

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4 lg:px-8">
          <button type="button" onClick={() => goTo("home")} className="flex items-center gap-3 text-left">
            <ImlLogo small={true} />
            <div>
              <div className="text-sm font-semibold tracking-[0.2em] text-slate-500">IML</div>
              <div className="text-sm text-slate-700">{IML_HOME.brandLong}</div>
            </div>
          </button>

          <nav className="hidden items-center gap-2 md:flex">
            {IML_ROUTES.map((route) => (
              <ImlNavButton key={route.key} active={currentPage === route.key} onClick={() => goTo(route.key)}>{route.label}</ImlNavButton>
            ))}
          </nav>
        </div>

        <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-6 pb-4 md:hidden lg:px-8">
          {IML_ROUTES.map((route) => (
            <ImlNavButton key={route.key} active={currentPage === route.key} onClick={() => goTo(route.key)}>{route.label}</ImlNavButton>
          ))}
        </div>
      </header>

      <main>{renderedPage}</main>
      <ImlFooter goTo={goTo} />
    </div>
  );
}
