export const IML_DOMAINS = [
  { key: "governance", short: "GOV", axis: "Governance", title: "Governance and Standards", description: "Responsibilities, standards, legal clarity and accountable ecosystem governance." },
  { key: "technical", short: "TEC", axis: "Technical", title: "Technical Interoperability", description: "Secure, reliable and maintainable exchange across heterogeneous systems." },
  { key: "identity", short: "ID", axis: "Identity", title: "Identity, Consent and Trust", description: "Reliable identification, appropriate consent, provenance and confidence." },
  { key: "adoption", short: "USE", axis: "Adoption", title: "Adoption and Use", description: "Integration into workflows, training, access rights and professional roles." },
  { key: "security", short: "SEC", axis: "Security", title: "Security and Resilience", description: "Protection, availability, recovery, traceability and continuity." },
  { key: "learning", short: "LRN", axis: "Learning", title: "Feedback, Correction and Learning", description: "Correction pathways, evaluation and institutional learning." },
];

export const AXES = IML_DOMAINS.map((domain) => domain.axis);
export const AXIS_KEYS = IML_DOMAINS.map((domain) => domain.key);
