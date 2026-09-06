export const regulatoryWatch = [
  {
    id: "2026-09-06-patient-harm-redress-learning",
    date: "2026-09-06",
    dateLabel: "6 September 2026",
    scope: "Patient safety · Rights, redress and learning",
    title: "Exploratory workstream: patient harm, redress and learning",
    summary: "IML is opening a comparative study of what happens after a patient experiences harm associated with care: how the event is explained and reviewed, how redress can be sought, and how the system uses the event to prevent recurrence.",
    imlImpact: "The workstream has been added to the Founding Manuscript as future comparative work. It is not scored and no country-level conclusion is drawn at this stage. The first phase is limited to terminology, official-source mapping and comparative protocol design.",
    note: "The initial comparative map will examine access to remedies, evidentiary burden and causation, timeliness, scope of redress, disclosure and access to records, independence and appeal, equity of access, and links between incidents or claims and patient-safety learning.",
    sources: [
      {
        label: "WHO — Patient Safety Rights Charter",
        url: "https://www.who.int/publications/i/item/9789240093249",
      },
      {
        label: "Danish Patient Compensation — official scheme information",
        url: "https://eng.patienterstatningen.dk/",
      },
      {
        label: "Löf — Swedish patient insurance",
        url: "https://lof.se/language",
      },
      {
        label: "ACC New Zealand — treatment injury information",
        url: "https://www.acc.co.nz/",
      },
      {
        label: "ONIAM France — accident médical compensation framework",
        url: "https://www.oniam.fr/",
      },
    ],
    monitoredSources: [
      "WHO",
      "Patienterstatningen",
      "Löf",
      "ACC New Zealand",
      "ONIAM / CCI",
      "peer-reviewed patient-safety literature",
    ],
    status: "reviewed",
  },
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
