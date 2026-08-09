// Reviewed software-watch entries are added newest first.
// Expected fields: id, date, dateLabel, scope, title, summary, imlImpact, sources, status.
export const softwareWatch = [];

export const latestSoftwareWatch =
  softwareWatch.find((entry) => entry.status === "reviewed") || null;
