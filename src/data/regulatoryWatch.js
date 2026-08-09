export const regulatoryWatch = [
  {
    id: "2026-08-09-eu-ai-act-article-50",
    date: "2026-08-09",
    dateLabel: "9 August 2026",
    scope: "IML France",
    title: "Article 50 transparency obligations",
    summary: "From 2 August 2026, the transparency obligations under Article 50 of the EU AI Act apply to certain interactive and generative AI systems.",
    imlImpact: "IML will therefore strengthen transparency and traceability for AI-assisted clinical functions, including clear identification of AI-generated content, provenance, human review and validation.",
    note: "No other significant change requiring immediate adaptation was identified for the modules reviewed this week.",
    sources: [
      {
        label: "European Commission — Guidelines on transparency obligations for providers and deployers of certain AI systems, 20 July 2026",
        url: "https://digital-strategy.ec.europa.eu/en/library/guidelines-transparency-obligations-providers-and-deployers-ai-systems",
      },
      {
        label: "EUR-Lex — Regulation (EU) 2024/1689, Article 50",
        url: "https://eur-lex.europa.eu/eli/reg/2024/1689/oj",
      },
    ],
    monitoredSources: [
      "European Commission",
      "EUR-Lex",
      "HAS",
      "ANS",
      "Assurance Maladie",
      "CNIL",
      "ANSM",
      "Légifrance",
    ],
    status: "reviewed",
  },
];

export const latestRegulatoryWatch =
  regulatoryWatch.find((entry) => entry.status === "reviewed") || null;
