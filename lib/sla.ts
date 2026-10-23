import type { Severity } from "./severity";

export interface SlaConfig {
  slaCriticalDays: number;
  slaHighDays: number;
  slaMediumDays: number;
}

export interface SlaFindingLike {
  severity: string;
  status: string;
  firstSeenAt: Date;
}

/** Days allowed before an open finding breaches SLA; 0 = no SLA tracked. */
export function slaDaysFor(project: SlaConfig, severity: Severity | string): number {
  switch (severity) {
    case "critical":
      return project.slaCriticalDays;
    case "high":
      return project.slaHighDays;
    case "medium":
      return project.slaMediumDays;
    default:
      return 0;
  }
}

export function isBreached(finding: SlaFindingLike, project: SlaConfig, now: Date): boolean {
  const days = slaDaysFor(project, finding.severity);
  if (days <= 0) return false;
  if (finding.status !== "open" && finding.status !== "in_progress") return false;
  const deadline = finding.firstSeenAt.getTime() + days * 86_400_000;
  return now.getTime() > deadline;
}

export function daysOpen(finding: { firstSeenAt: Date }, now: Date): number {
  return Math.max(
    0,
    Math.floor((now.getTime() - finding.firstSeenAt.getTime()) / 86_400_000)
  );
}

export interface SlaSummary {
  tracked: number; // open findings with an SLA
  within: number;
  breached: number;
  compliancePct: number | null; // null when nothing is tracked
}

export function slaSummary(
  findings: SlaFindingLike[],
  project: SlaConfig,
  now: Date
): SlaSummary {
  let tracked = 0;
  let breached = 0;
  for (const f of findings) {
    const open = f.status === "open" || f.status === "in_progress";
    if (!open) continue;
    if (slaDaysFor(project, f.severity) <= 0) continue;
    tracked++;
    if (isBreached(f, project, now)) breached++;
  }
  return {
    tracked,
    within: tracked - breached,
    breached,
    compliancePct: tracked === 0 ? null : Math.round(((tracked - breached) / tracked) * 100),
  };
}
