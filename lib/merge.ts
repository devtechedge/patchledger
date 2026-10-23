import { prisma } from "./db";
import type { ImportResult } from "./importers/types";

export class NotFoundError extends Error {
  constructor() {
    super("Not found.");
    this.name = "NotFoundError";
  }
}

export interface ImportOutcome {
  snapshotId: string;
  created: number;
  updated: number;
  reopened: number;
  autoFixed: number;
  total: number;
}

/**
 * Deterministically merge one parsed import into a project:
 * - new advisory keys become open findings;
 * - known keys are refreshed (severity, fix info) and keep their status,
 *   except "fixed"/"verified" findings that reappear, which reopen;
 * - open findings from the SAME source that no longer appear are auto-closed
 *   as "fixed" (auto evidence note) - never as "verified", because only a
 *   human-attached test/build run can verify a fix.
 *
 * Everything runs in one transaction: a snapshot row always lands together
 * with its findings.
 */
export async function applyImport(
  accountId: string,
  projectId: string,
  parsed: ImportResult,
  label: string,
  now: Date = new Date()
): Promise<ImportOutcome> {
  return prisma.$transaction(async (tx) => {
    const project = await tx.project.findFirst({
      where: { id: projectId, accountId },
      select: { id: true },
    });
    if (!project) throw new NotFoundError();

    // dedupe defensively across formats (same key twice in one file)
    const byKey = new Map<string, (typeof parsed.findings)[number]>();
    for (const f of parsed.findings) {
      byKey.set(`${f.ecosystem}:${f.packageName}:${f.advisoryId}`, f);
    }

    const statsJson = JSON.stringify({
      source: parsed.source,
      bySeverity: parsed.stats.bySeverity,
      total: parsed.stats.total,
      dependencies: parsed.stats.dependencies ?? null,
    });

    const snapshot = await tx.snapshot.create({
      data: {
        projectId,
        accountId,
        source: parsed.source,
        label: label.slice(0, 200),
        findingCount: byKey.size,
        statsJson,
        importedAt: now,
      },
    });

    let created = 0;
    let updated = 0;
    let reopened = 0;

    for (const f of byKey.values()) {
      const existing = await tx.finding.findUnique({
        where: {
          projectId_ecosystem_packageName_advisoryId: {
            projectId,
            ecosystem: f.ecosystem,
            packageName: f.packageName,
            advisoryId: f.advisoryId,
          },
        },
      });

      if (!existing) {
        await tx.finding.create({
          data: {
            projectId,
            accountId,
            ecosystem: f.ecosystem,
            packageName: f.packageName,
            advisoryId: f.advisoryId,
            advisoryUrl: f.advisoryUrl,
            title: f.title,
            severity: f.severity,
            installedVersion: f.installedVersion,
            vulnerableRange: f.vulnerableRange,
            isDirect: f.isDirect,
            isDev: f.isDev,
            fixAvailable: f.fixAvailable,
            fixVersion: f.fixVersion,
            fixIsSemverMajor: f.fixIsSemverMajor,
            status: "open",
            firstSource: parsed.source,
            lastSource: parsed.source,
            firstSeenAt: now,
            lastSeenAt: now,
          },
        });
        created++;
        continue;
      }

      // refresh scanner-provided facts, keep the agency's status/evidence
      const reappeared = existing.status === "fixed" || existing.status === "verified";
      if (reappeared) reopened++;

      await tx.finding.update({
        where: { id: existing.id },
        data: {
          advisoryUrl: f.advisoryUrl || existing.advisoryUrl,
          title: f.title || existing.title,
          severity: f.severity,
          installedVersion: f.installedVersion || existing.installedVersion,
          vulnerableRange: f.vulnerableRange || existing.vulnerableRange,
          isDirect: f.isDirect || existing.isDirect,
          fixAvailable: f.fixAvailable,
          fixVersion: f.fixVersion,
          fixIsSemverMajor: f.fixIsSemverMajor,
          lastSource: parsed.source,
          lastSeenAt: now,
          ...(reappeared
            ? {
                status: "open",
                resolvedAt: null,
                verifiedAt: null,
                statusReason: "",
              }
            : {}),
        },
      });

      if (reappeared) {
        await tx.findingEvent.create({
          data: {
            findingId: existing.id,
            kind: "auto_import",
            fromStatus: existing.status,
            toStatus: "open",
            note: `Advisory is reported again by ${parsed.source} import; reopened.`,
          },
        });
      }
      updated++;
    }

    // same-source open findings absent from this import are auto-closed as fixed
    const vanished = await tx.finding.findMany({
      where: {
        projectId,
        lastSource: parsed.source,
        status: { in: ["open", "in_progress"] },
        lastSeenAt: { lt: now },
      },
      select: { id: true, status: true },
    });
    for (const v of vanished) {
      await tx.finding.update({
        where: { id: v.id },
        data: {
          status: "fixed",
          resolvedAt: now,
          statusReason: `Auto-closed: no longer reported by ${parsed.source} import at ${now.toISOString().slice(0, 10)}. Confirm with your own test run.`,
        },
      });
      await tx.findingEvent.create({
        data: {
          findingId: v.id,
          kind: "auto_import",
          fromStatus: v.status,
          toStatus: "fixed",
          note: `No longer reported by ${parsed.source} import.`,
        },
      });
    }

    return {
      snapshotId: snapshot.id,
      created,
      updated,
      reopened,
      autoFixed: vanished.length,
      total: byKey.size,
    };
  });
}
