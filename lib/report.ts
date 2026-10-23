import { SEVERITY_ORDER, type Severity } from "./severity";
import { daysOpen, isBreached, slaSummary, type SlaConfig } from "./sla";

export interface ReportFindingLike {
  id: string;
  ecosystem: string;
  packageName: string;
  advisoryId: string;
  advisoryUrl: string;
  title: string;
  severity: string;
  installedVersion: string;
  fixVersion: string;
  fixIsSemverMajor: boolean;
  status: string;
  firstSeenAt: Date;
  lastSeenAt: Date;
  resolvedAt: Date | null;
  fixUrl: string | null;
  fixNote: string | null;
  fixedInVersion: string | null;
  verifiedAt: Date | null;
  verifyType: string | null;
  verifyUrl: string | null;
  verifyNote: string | null;
}

export interface ReportSnapshotLike {
  id: string;
  source: string;
  importedAt: Date;
  findingCount: number;
}

export interface ReportProjectLike extends SlaConfig {
  name: string;
  clientName: string;
  stack: string;
}

const LIST_CAP = 50;

function sevRank(s: string): number {
  return SEVERITY_ORDER[(s as Severity) in SEVERITY_ORDER ? (s as Severity) : "unknown"];
}

function listItem(f: ReportFindingLike) {
  return {
    package: `${f.packageName}${f.installedVersion ? `@${f.installedVersion}` : ""}`,
    ecosystem: f.ecosystem,
    advisoryId: f.advisoryId,
    advisoryUrl: f.advisoryUrl,
    severity: f.severity,
    title: f.title.length > 140 ? f.title.slice(0, 137) + "..." : f.title,
    firstSeenAt: f.firstSeenAt.toISOString(),
    resolvedAt: f.resolvedAt ? f.resolvedAt.toISOString() : null,
    fixUrl: f.fixUrl,
    fixedInVersion: f.fixedInVersion,
    verifyUrl: f.verifyUrl,
    verifyType: f.verifyType,
  };
}

export const REPORT_LIMITATIONS =
  "This report summarises imported output from third-party vulnerability scanners (source and import date shown above). It reflects only the advisories those tools reported for the scanned manifests, at the moment they were run. It is not a penetration test, code audit, or security certification, and it is not a guarantee that the software is free of vulnerabilities. 'Fixed' entries reflect the recorded remediation evidence; 'Verified' entries additionally carry a recorded passing test/build run.";

export interface ReportSummary {
  generatedAt: string;
  period: { from: string | null; to: string };
  project: { name: string; clientName: string; stack: string };
  latestImport: { source: string; importedAt: string; findingCount: number } | null;
  counts: {
    bySeverity: Record<string, number>;
    byStatus: Record<string, number>;
    openTotal: number;
  };
  sla: {
    criticalDays: number;
    highDays: number;
    mediumDays: number;
    tracked: number;
    within: number;
    breached: number;
    compliancePct: number | null;
  };
  fixedSince: ReturnType<typeof listItem>[];
  verifiedSince: ReturnType<typeof listItem>[];
  newSince: ReturnType<typeof listItem>[];
  breachedOpen: ReturnType<typeof listItem>[];
  oldestOpen: (ReturnType<typeof listItem> & { daysOpen: number })[];
  limitations: string;
}

/**
 * Pure report builder: freezes the state of a project into a JSON-able
 * summary. Called at report creation time; the result is stored immutably on
 * the Report row so shared links never shift under the reader.
 */
export function buildReportSummary(args: {
  project: ReportProjectLike;
  findings: ReportFindingLike[];
  snapshots: ReportSnapshotLike[]; // newest first
  now?: Date;
}): ReportSummary {
  const now = args.now ?? new Date();
  const latest = args.snapshots[0] ?? null;
  const prev = args.snapshots[1] ?? null;
  const since = prev ? prev.importedAt : new Date(now.getTime() - 30 * 86_400_000);

  const open = args.findings.filter(
    (f) => f.status === "open" || f.status === "in_progress"
  );

  const bySeverity: Record<string, number> = {};
  for (const f of open) bySeverity[f.severity] = (bySeverity[f.severity] ?? 0) + 1;
  const byStatus: Record<string, number> = {};
  for (const f of args.findings) byStatus[f.status] = (byStatus[f.status] ?? 0) + 1;

  const cap = <T,>(list: T[]): T[] =>
    list.length > LIST_CAP ? list.slice(0, LIST_CAP) : list;

  const fixedSince = args.findings
    .filter(
      (f) =>
        (f.status === "fixed" || f.status === "verified") &&
        f.resolvedAt &&
        f.resolvedAt >= since
    )
    .sort((a, b) => (b.resolvedAt! > a.resolvedAt! ? 1 : -1))
    .map(listItem);

  const verifiedSince = args.findings
    .filter((f) => f.status === "verified" && f.verifiedAt && f.verifiedAt >= since)
    .sort((a, b) => (b.verifiedAt! > a.verifiedAt! ? 1 : -1))
    .map(listItem);

  const newSince = args.findings
    .filter((f) => f.firstSeenAt >= since)
    .sort((a, b) => (b.firstSeenAt > a.firstSeenAt ? 1 : -1))
    .map(listItem);

  const breachedOpen = open
    .filter((f) => isBreached(f, args.project, now))
    .sort((a, b) => sevRank(b.severity) - sevRank(a.severity))
    .map(listItem);

  const oldestOpen = [...open]
    .sort((a, b) => a.firstSeenAt.getTime() - b.firstSeenAt.getTime())
    .slice(0, 5)
    .map((f) => ({ ...listItem(f), daysOpen: daysOpen(f, now) }));

  const sla = slaSummary(args.findings, args.project, now);

  return {
    generatedAt: now.toISOString(),
    period: { from: prev ? prev.importedAt.toISOString() : null, to: now.toISOString() },
    project: {
      name: args.project.name,
      clientName: args.project.clientName,
      stack: args.project.stack,
    },
    latestImport: latest
      ? {
          source: latest.source,
          importedAt: latest.importedAt.toISOString(),
          findingCount: latest.findingCount,
        }
      : null,
    counts: { bySeverity, byStatus, openTotal: open.length },
    sla: {
      criticalDays: args.project.slaCriticalDays,
      highDays: args.project.slaHighDays,
      mediumDays: args.project.slaMediumDays,
      tracked: sla.tracked,
      within: sla.within,
      breached: sla.breached,
      compliancePct: sla.compliancePct,
    },
    fixedSince: cap(fixedSince),
    verifiedSince: cap(verifiedSince),
    newSince: cap(newSince),
    breachedOpen: cap(breachedOpen),
    oldestOpen,
    limitations: REPORT_LIMITATIONS,
  };
}
