// Reviewed software-watch entries are added newest first.
// Expected fields: id, date, dateLabel, scope, title, summary, imlImpact, sources, status.
export const softwareWatch = [
  {
    id: "software-watch-2026-08-16",
    date: "2026-08-16",
    dateLabel: "16 August 2026",
    scope: "Open-source clinical ecosystem",
    title: "Reuse mature components without making them mandatory dependencies.",
    summary: "Current review confirms active, functional open-source building blocks across clinical records, FHIR, laboratories and imaging. OpenMRS remains a useful clinical reference; HAPI FHIR provides a mature FHIR implementation; OpenELIS Global is actively evolving laboratory and analyser workflows; and Orthanc remains a lightweight DICOM option.",
    imlImpact: "IML should continue to reuse, adapt or connect specialised components behind documented interfaces while keeping the Open Clinical Workspace small, replaceable and independent of any single external stack. Version, security, licence and maintenance status must be reviewed before adoption.",
    sources: [
      { label: "OpenMRS", url: "https://openmrs.org/" },
      { label: "HAPI FHIR", url: "https://hapifhir.io/" },
      { label: "OpenELIS Global", url: "https://github.com/DIGI-UW/OpenELIS-Global-2" },
      { label: "Orthanc", url: "https://www.orthanc-server.com/" },
    ],
    status: "reviewed",
  },
];

export const latestSoftwareWatch =
  softwareWatch.find((entry) => entry.status === "reviewed") || null;
