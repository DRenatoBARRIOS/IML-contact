export const navigation = [
  { href: "/interoperability", label: "Interoperability" },
  { href: "/clinical-workspace", label: "Clinical Workspace" },
  { href: "/country-profiles", label: "Country Profiles" },
  { href: "/identity-trust", label: "Identity & Trust" },
  { href: "/collaborate", label: "Collaborate" },
];

export const interoperabilityLayers = [
  ["01", "Technical", "Can systems exchange data reliably?"],
  ["02", "Semantic", "Is clinical meaning preserved?"],
  ["03", "Organisational", "Do workflows and responsibilities align?"],
  ["04", "Institutional", "Are governance, law and accountability credible?"],
  ["05", "Clinical & public health", "Does information improve decisions, safety and learning?"],
];

export const methodologyDomains = [
  ["STD", "Standards", "Institutional ownership, legal frameworks, standards governance, accountability and national steering capacity."],
  ["CON", "Connectivity", "Exchange models, APIs, semantics, technical integration quality, service continuity and architecture coherence."],
  ["IDT", "Identity", "Identity matching, authentication, consent, provider and patient identification, and trust services."],
  ["ADP", "Adoption", "Operational rollout, user uptake, field deployment, integration into workflows and implementation depth."],
  ["SEC", "Security", "Privacy safeguards, access control, traceability, cyber readiness and defensible trust practices."],
  ["COR", "Correction", "Redress, correction, complaint handling, recourse pathways and institutional learning from failures."],
];

export const LEGACY_HASHES = {
  "#id4d": "/identity-trust",
  "#evaluation": "/interoperability",
  "#methodology": "/interoperability#methodology",
  "#world": "/country-profiles",
  "#profiles": "/country-profiles",
  "#contact": "/collaborate",
};

export const LEGACY_PATHS = {
  "/id4d": "/identity-trust",
  "/evaluation": "/interoperability",
  "/methodology": "/interoperability#methodology",
  "/world": "/country-profiles",
  "/profiles": "/country-profiles",
  "/contact": "/collaborate",
};
