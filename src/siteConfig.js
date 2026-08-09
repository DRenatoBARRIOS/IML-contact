export const navigation = [
  { href: "/interoperability", label: "Interoperability" },
  { href: "/identity-trust", label: "Identity & Trust" },
  { href: "/clinical-workspace", label: "Clinical Workspace" },
  { href: "/country-profiles", label: "Country Profiles" },
  { href: "/manuscripts", label: "Manuscripts" },
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
  ["GOV", "Governance", "Stewardship, accountability and policy direction"],
  ["TEC", "Technical", "Standards, architecture and reliable exchange"],
  ["IDT", "Identity", "People, professionals, organisations and consent"],
  ["ADP", "Adoption", "Real use in care and public-health workflows"],
  ["SEC", "Security", "Protection, access control and resilience"],
  ["LRN", "Learning", "Feedback, correction and system improvement"],
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
