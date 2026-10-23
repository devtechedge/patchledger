import { hashPassword, verifyPassword } from "./password";
import { prisma } from "./db";
import { audit } from "./audit";
import { newPublicId } from "./ids";
import { NotFoundError, applyImport } from "./merge";
import { parseScannerJson, ImportParseError } from "./importers/detect";
import { buildReportSummary } from "./report";
import { SEVERITY_ORDER, type Severity } from "./severity";
import { planFor } from "./plans";
import { InputError } from "./validation";

export { NotFoundError, ImportParseError };
export { InputError } from "./validation";

// ---------------------------------------------------------------------------
// accounts + auth
// ---------------------------------------------------------------------------

export async function createAccount(input: {
  email: string;
  password: string;
  name: string;
  agencyName?: string;
}): Promise<{ id: string; email: string }> {
  const email = input.email.toLowerCase();
  const existing = await prisma.account.findUnique({ where: { email } });
  if (existing) throw new InputError("An account with this email already exists.");
  const account = await prisma.account.create({
    data: {
      email,
      passwordHash: await hashPassword(input.password),
      name: input.name,
      agencyName: input.agencyName ?? "",
    },
  });
  await audit(account.id, "signup", { meta: { email } });
  return { id: account.id, email: account.email };
}

export async function authenticate(
  email: string,
  password: string
): Promise<{ id: string; email: string } | null> {
  const account = await prisma.account.findUnique({
    where: { email: email.toLowerCase() },
  });
  if (!account) return null;
  if (!(await verifyPassword(password, account.passwordHash))) return null;
  return { id: account.id, email: account.email };
}

export async function getAccountProfile(accountId: string) {
  const a = await prisma.account.findUnique({ where: { id: accountId } });
  if (!a) throw new NotFoundError();
  return {
    id: a.id,
    email: a.email,
    name: a.name,
    agencyName: a.agencyName,
    contactEmail: a.contactEmail,
    accentColor: a.accentColor,
    plan: a.plan,
    isDemo: a.isDemo,
    createdAt: a.createdAt,
  };
}

export async function updateAccount(
  accountId: string,
  input: { name: string; agencyName: string; contactEmail: string | null; accentColor: string }
): Promise<void> {
  const res = await prisma.account.updateMany({
    where: { id: accountId },
    data: {
      name: input.name,
      agencyName: input.agencyName,
      contactEmail: input.contactEmail,
      accentColor: input.accentColor,
    },
  });
  if (res.count === 0) throw new NotFoundError();
  await audit(accountId, "account_update");
}

/** Full account deletion: cascades sessions/projects/findings/reports and
 * removes audit + rate-limit rows referencing the account or its email. */
export async function deleteAccount(accountId: string): Promise<void> {
  const account = await prisma.account.findUnique({
    where: { id: accountId },
    select: { email: true },
  });
  if (!account) throw new NotFoundError();
  await prisma.$transaction(async (tx) => {
    await tx.auditEvent.deleteMany({ where: { accountId } });
    await tx.rateLimit.deleteMany({
      where: { bucket: { contains: account.email } },
    });
    await tx.rateLimit.deleteMany({
      where: { bucket: { contains: accountId } },
    });
    await tx.account.delete({ where: { id: accountId } });
  });
}

// ---------------------------------------------------------------------------
// projects
// ---------------------------------------------------------------------------

export async function createProject(
  accountId: string,
  input: { name: string; clientName?: string; stack?: string }
): Promise<{ id: string }> {
  const name = input.name.trim();
  if (!name || name.length > 120) {
    throw new InputError("Project name is required (max 120 characters).");
  }
  const dupe = await prisma.project.findFirst({ where: { accountId, name } });
  if (dupe) throw new InputError("You already have a project with this name.");
  const plan = planFor(
    (await prisma.account.findUnique({ where: { id: accountId }, select: { plan: true } }))?.plan
  );
  const count = await prisma.project.count({ where: { accountId } });
  if (count >= plan.projects) {
    throw new InputError(
      `Your ${plan.label} plan tracks up to ${plan.projects} projects. Delete one or upgrade to add more.`
    );
  }
  const project = await prisma.project.create({
    data: {
      accountId,
      name,
      clientName: (input.clientName ?? "").trim().slice(0, 120),
      stack: (input.stack ?? "").trim().slice(0, 120),
    },
  });
  await audit(accountId, "project_create", { targetType: "project", targetId: project.id });
  return { id: project.id };
}

export interface ProjectSummary {
  id: string;
  name: string;
  clientName: string;
  stack: string;
  createdAt: Date;
  openBySeverity: Record<string, number>;
  openTotal: number;
  lastImportAt: Date | null;
  lastImportSource: string | null;
  reportCount: number;
}

export async function listProjects(accountId: string): Promise<ProjectSummary[]> {
  const projects = await prisma.project.findMany({
    where: { accountId },
    orderBy: { createdAt: "desc" },
  });
  if (projects.length === 0) return [];
  const openBy = await prisma.finding.groupBy({
    by: ["projectId", "severity"],
    where: {
      accountId,
      projectId: { in: projects.map((p) => p.id) },
      status: { in: ["open", "in_progress"] },
    },
    _count: { _all: true },
  });
  const snaps = await prisma.snapshot.findMany({
    where: { accountId, projectId: { in: projects.map((p) => p.id) } },
    orderBy: { importedAt: "desc" },
    select: { projectId: true, importedAt: true, source: true },
  });
  const reportCounts = await prisma.report.groupBy({
    by: ["projectId"],
    where: {
      accountId,
      projectId: { in: projects.map((p) => p.id) },
      status: "published",
    },
    _count: { _all: true },
  });

  const lastSnap = new Map<string, { importedAt: Date; source: string }>();
  for (const s of snaps) {
    if (!lastSnap.has(s.projectId)) {
      lastSnap.set(s.projectId, { importedAt: s.importedAt, source: s.source });
    }
  }
  const sev = new Map<string, Record<string, number>>();
  for (const g of openBy) {
    const cur = sev.get(g.projectId) ?? {};
    cur[g.severity] = (cur[g.severity] ?? 0) + g._count._all;
    sev.set(g.projectId, cur);
  }
  const rep = new Map(reportCounts.map((r) => [r.projectId, r._count._all]));

  return projects.map((p) => {
    const openBySeverity = sev.get(p.id) ?? {};
    const openTotal = Object.values(openBySeverity).reduce((a, b) => a + b, 0);
    const last = lastSnap.get(p.id) ?? null;
    return {
      id: p.id,
      name: p.name,
      clientName: p.clientName,
      stack: p.stack,
      createdAt: p.createdAt,
      openBySeverity,
      openTotal,
      lastImportAt: last?.importedAt ?? null,
      lastImportSource: last?.source ?? null,
      reportCount: rep.get(p.id) ?? 0,
    };
  });
}

export async function getProject(accountId: string, projectId: string) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, accountId },
  });
  if (!project) throw new NotFoundError();
  return project;
}

export async function updateProjectSettings(
  accountId: string,
  projectId: string,
  input: {
    clientName: string;
    stack: string;
    notes: string;
    slaCriticalDays: number;
    slaHighDays: number;
    slaMediumDays: number;
  }
): Promise<void> {
  for (const [k, v] of Object.entries({
    slaCriticalDays: input.slaCriticalDays,
    slaHighDays: input.slaHighDays,
    slaMediumDays: input.slaMediumDays,
  })) {
    if (!Number.isInteger(v) || v < 0 || v > 365) {
      throw new InputError(`${k} must be a whole number between 0 and 365.`);
    }
  }
  if (input.clientName.length > 120 || input.stack.length > 120 || input.notes.length > 2000) {
    throw new InputError("Client name/stack/notes exceed their length limits.");
  }
  const res = await prisma.project.updateMany({
    where: { id: projectId, accountId },
    data: input,
  });
  if (res.count === 0) throw new NotFoundError();
  await audit(accountId, "project_update", { targetType: "project", targetId: projectId });
}

// ---------------------------------------------------------------------------
// imports
// ---------------------------------------------------------------------------

export async function importScan(
  accountId: string,
  projectId: string,
  rawJson: unknown,
  label: string
) {
  const parsed = parseScannerJson(rawJson);
  const outcome = await applyImport(accountId, projectId, parsed, label);
  await audit(accountId, "import", {
    targetType: "project",
    targetId: projectId,
    meta: {
      source: parsed.source,
      created: outcome.created,
      updated: outcome.updated,
      reopened: outcome.reopened,
      autoFixed: outcome.autoFixed,
    },
  });
  return { ...outcome, source: parsed.source };
}

// ---------------------------------------------------------------------------
// findings + status transitions
// ---------------------------------------------------------------------------

export type FindingStatus =
  | "open"
  | "in_progress"
  | "fixed"
  | "verified"
  | "false_positive"
  | "accepted";

export const FINDING_STATUSES: FindingStatus[] = [
  "open",
  "in_progress",
  "fixed",
  "verified",
  "false_positive",
  "accepted",
];

const VERIFY_TYPES = ["tests", "build", "deploy_check", "manual"] as const;

export interface TransitionInput {
  toStatus: FindingStatus;
  reason?: string;
  fixUrl?: string | null;
  fixNote?: string | null;
  fixedInVersion?: string | null;
  verifyType?: string | null;
  verifyUrl?: string | null;
  verifyNote?: string | null;
}

const ALLOWED: Record<FindingStatus, FindingStatus[]> = {
  open: ["in_progress", "fixed", "false_positive", "accepted"],
  in_progress: ["open", "fixed", "false_positive", "accepted"],
  fixed: ["verified", "open", "in_progress"],
  verified: ["open", "in_progress"],
  false_positive: ["open", "in_progress"],
  accepted: ["open", "in_progress"],
};

export async function transitionFinding(
  accountId: string,
  findingId: string,
  input: TransitionInput
): Promise<void> {
  const finding = await prisma.finding.findFirst({
    where: { id: findingId, accountId },
  });
  if (!finding) throw new NotFoundError();

  const from = finding.status as FindingStatus;
  const to = input.toStatus;
  if (!ALLOWED[from]?.includes(to)) {
    throw new InputError(`Cannot move from "${from}" to "${to}".`);
  }

  const now = new Date();
  const data: Record<string, unknown> = { status: to, statusReason: input.reason ?? "" };

  if (to === "fixed") {
    const hasEvidence = !!(input.fixUrl || input.fixNote);
    if (!hasEvidence) {
      throw new InputError(
        "Record the fix evidence first: a PR/commit/release link or a note describing the change."
      );
    }
    data.fixUrl = input.fixUrl ?? null;
    data.fixNote = input.fixNote ?? null;
    data.fixedInVersion = input.fixedInVersion ?? null;
    data.resolvedAt = now;
    data.verifiedAt = null;
  }

  if (to === "verified") {
    if (!input.verifyType || !(VERIFY_TYPES as readonly string[]).includes(input.verifyType)) {
      throw new InputError("Pick a verification type (tests, build, deploy check or manual).");
    }
    if (!input.verifyUrl && !input.verifyNote) {
      throw new InputError(
        "Verification needs evidence: a CI/test run link or a note describing what was checked."
      );
    }
    data.verifyType = input.verifyType;
    data.verifyUrl = input.verifyUrl ?? null;
    data.verifyNote = input.verifyNote ?? null;
    data.verifiedAt = now;
  }

  if ((to === "false_positive" || to === "accepted") && !(input.reason ?? "").trim()) {
    throw new InputError(`Marking as "${to}" requires a reason your client can read.`);
  }

  if (to === "open" || to === "in_progress") {
    data.resolvedAt = null;
    data.verifiedAt = null;
  }

  await prisma.$transaction(async (tx) => {
    await tx.finding.update({ where: { id: finding.id }, data });
    await tx.findingEvent.create({
      data: {
        findingId: finding.id,
        kind: "manual",
        fromStatus: from,
        toStatus: to,
        note: (input.reason ?? "").slice(0, 2000),
      },
    });
  });
  await audit(accountId, "status_change", {
    targetType: "finding",
    targetId: finding.id,
    meta: { from, to },
  });
}

export async function getFinding(accountId: string, findingId: string) {
  const finding = await prisma.finding.findFirst({
    where: { id: findingId, accountId },
    include: {
      events: { orderBy: { createdAt: "desc" } },
      project: {
        select: {
          id: true,
          name: true,
          clientName: true,
          slaCriticalDays: true,
          slaHighDays: true,
          slaMediumDays: true,
        },
      },
    },
  });
  if (!finding) throw new NotFoundError();
  return finding;
}

export interface FindingFilters {
  severity?: string;
  status?: string;
}

export async function listFindings(accountId: string, projectId: string, filters: FindingFilters = {}) {
  const project = await getProject(accountId, projectId);
  const where: Record<string, unknown> = { projectId: project.id };
  if (filters.severity) where.severity = filters.severity;
  if (filters.status) where.status = filters.status;
  const findings = await prisma.finding.findMany({ where });
  return findings.sort((a, b) => {
    const d = SEVERITY_ORDER[(b.severity as Severity) in SEVERITY_ORDER ? (b.severity as Severity) : "unknown"] -
      SEVERITY_ORDER[(a.severity as Severity) in SEVERITY_ORDER ? (a.severity as Severity) : "unknown"];
    if (d !== 0) return d;
    return b.firstSeenAt.getTime() - a.firstSeenAt.getTime();
  });
}

// ---------------------------------------------------------------------------
// reports
// ---------------------------------------------------------------------------

export async function createReport(
  accountId: string,
  projectId: string,
  input: { title?: string; periodLabel?: string; agencyNote?: string }
) {
  const project = await getProject(accountId, projectId);
  const account = await prisma.account.findUniqueOrThrow({
    where: { id: accountId },
  });
  const [findings, snapshots] = await Promise.all([
    prisma.finding.findMany({ where: { projectId: project.id } }),
    prisma.snapshot.findMany({
      where: { projectId: project.id },
      orderBy: { importedAt: "desc" },
      take: 2,
    }),
  ]);

  const now = new Date();
  const summary = buildReportSummary({
    project: {
      name: project.name,
      clientName: project.clientName,
      stack: project.stack,
      slaCriticalDays: project.slaCriticalDays,
      slaHighDays: project.slaHighDays,
      slaMediumDays: project.slaMediumDays,
    },
    findings,
    snapshots,
    now,
  });

  const month = now.toLocaleString("en-US", { month: "long", year: "numeric" });
  const report = await prisma.report.create({
    data: {
      projectId: project.id,
      accountId,
      publicId: newPublicId(),
      title: (input.title?.trim() || `Security maintenance report - ${project.name}`).slice(0, 200),
      periodLabel: (input.periodLabel?.trim() || month).slice(0, 80),
      agencyNote: (input.agencyNote ?? "").slice(0, 1000),
      brandingJson: JSON.stringify({
        agencyName: account.agencyName || account.name,
        contactEmail: account.contactEmail ?? "",
        accentColor: account.accentColor,
        clientName: project.clientName,
        projectName: project.name,
      }),
      summaryJson: JSON.stringify(summary),
      status: "published",
    },
  });
  await audit(accountId, "report_create", {
    targetType: "report",
    targetId: report.id,
    meta: { projectId: project.id },
  });
  return { id: report.id, publicId: report.publicId };
}

export async function listReports(accountId: string, projectId: string) {
  await getProject(accountId, projectId);
  return prisma.report.findMany({
    where: { projectId, accountId },
    orderBy: { createdAt: "desc" },
  });
}

export async function revokeReport(accountId: string, reportId: string): Promise<void> {
  const res = await prisma.report.updateMany({
    where: { id: reportId, accountId, status: "published" },
    data: { status: "revoked", revokedAt: new Date() },
  });
  if (res.count === 0) throw new NotFoundError();
  await audit(accountId, "report_revoke", { targetType: "report", targetId: reportId });
}

export async function getReportByPublicId(publicId: string) {
  const report = await prisma.report.findUnique({
    where: { publicId },
  });
  if (!report || report.status !== "published") return null;
  return report;
}

export async function listSnapshots(accountId: string, projectId: string) {
  await getProject(accountId, projectId);
  return prisma.snapshot.findMany({
    where: { projectId },
    orderBy: { importedAt: "desc" },
    take: 24,
  });
}

export async function listAuditEvents(accountId: string, limit = 50) {
  return prisma.auditEvent.findMany({
    where: { accountId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
