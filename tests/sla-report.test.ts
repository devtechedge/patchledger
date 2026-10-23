import { describe, expect, it } from "vitest";
import { cvssToSeverity, cvssVectorToScore, normalizeSeverity } from "../lib/severity";
import { daysOpen, isBreached, slaDaysFor, slaSummary } from "../lib/sla";
import { buildReportSummary, REPORT_LIMITATIONS } from "../lib/report";

const project = { slaCriticalDays: 14, slaHighDays: 30, slaMediumDays: 90 };
const days = (n: number) => new Date(Date.now() - n * 86_400_000);

describe("severity mapping", () => {
  it("maps npm names and CVSS bands", () => {
    expect(normalizeSeverity("moderate")).toBe("medium");
    expect(normalizeSeverity("info")).toBe("low");
    expect(cvssToSeverity(9.1)).toBe("critical");
    expect(cvssToSeverity(7.0)).toBe("high");
    expect(cvssToSeverity(4.0)).toBe("medium");
    expect(cvssToSeverity(0.1)).toBe("low");
  });

  it("scores a CVSS vector string", () => {
    expect(cvssVectorToScore("CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H")).toBeGreaterThanOrEqual(9);
    expect(cvssVectorToScore("garbage")).toBeNull();
  });
});

describe("sla", () => {
  it("picks the right window per severity", () => {
    expect(slaDaysFor(project, "critical")).toBe(14);
    expect(slaDaysFor(project, "high")).toBe(30);
    expect(slaDaysFor(project, "medium")).toBe(90);
    expect(slaDaysFor(project, "low")).toBe(0);
  });

  it("breaches only past the window, only while open", () => {
    expect(isBreached({ severity: "critical", status: "open", firstSeenAt: days(15) }, project, new Date())).toBe(true);
    expect(isBreached({ severity: "critical", status: "open", firstSeenAt: days(10) }, project, new Date())).toBe(false);
    expect(isBreached({ severity: "critical", status: "fixed", firstSeenAt: days(100) }, project, new Date())).toBe(false);
    expect(isBreached({ severity: "low", status: "open", firstSeenAt: days(900) }, project, new Date())).toBe(false);
  });

  it("summarises compliance", () => {
    const s = slaSummary(
      [
        { severity: "critical", status: "open", firstSeenAt: days(20) },
        { severity: "critical", status: "open", firstSeenAt: days(2) },
        { severity: "high", status: "open", firstSeenAt: days(1) },
        { severity: "low", status: "open", firstSeenAt: days(400) },
      ],
      project,
      new Date()
    );
    expect(s.tracked).toBe(3);
    expect(s.breached).toBe(1);
    expect(s.compliancePct).toBe(67);
  });

  it("daysOpen floors at zero", () => {
    expect(daysOpen({ firstSeenAt: new Date() }, new Date())).toBe(0);
  });
});

describe("report builder", () => {
  const finding = (over: Partial<Parameters<typeof buildReportSummary>[0]["findings"][number]> = {}) => ({
    id: over.id ?? "f1",
    ecosystem: "npm",
    packageName: "lodash.template",
    advisoryId: "GHSA-1",
    advisoryUrl: "https://osv.dev/GHSA-1",
    title: "Command injection",
    severity: "critical",
    installedVersion: "4.4.0",
    fixVersion: "4.5.0",
    fixIsSemverMajor: false,
    status: "open",
    firstSeenAt: days(20),
    lastSeenAt: days(1),
    resolvedAt: null,
    fixUrl: null,
    fixNote: null,
    fixedInVersion: null,
    verifiedAt: null,
    verifyType: null,
    verifyUrl: null,
    verifyNote: null,
    ...over,
  });
  const now = new Date();
  const prevImport = new Date(now.getTime() - 7 * 86_400_000);

  const args = {
    project: { ...project, name: "Portal", clientName: "Northwind", stack: "Node" },
    snapshots: [
      { id: "s2", source: "npm_audit", importedAt: now, findingCount: 2 },
      { id: "s1", source: "npm_audit", importedAt: prevImport, findingCount: 3 },
    ],
    now,
  };

  it("splits fixed / verified / new and computes SLA state", () => {
    const summary = buildReportSummary({
      ...args,
      findings: [
        finding({ id: "open1" }),
        finding({ id: "fixed1", status: "fixed", resolvedAt: new Date(now.getTime() - 86_400_000), fixUrl: "https://pr/1", fixedInVersion: "4.5.0" }),
        finding({ id: "ver1", status: "verified", resolvedAt: new Date(now.getTime() - 2 * 86_400_000), verifiedAt: new Date(now.getTime() - 2 * 86_400_000), verifyType: "tests", verifyUrl: "https://ci/1" }),
        finding({ id: "new1", firstSeenAt: new Date(now.getTime() - 86_400_000) }),
      ],
    });
    expect(summary.counts.openTotal).toBe(2);
    expect(summary.fixedSince).toHaveLength(2); // fixed + verified both resolved in period
    expect(summary.verifiedSince).toHaveLength(1);
    expect(summary.newSince).toHaveLength(1);
    expect(summary.sla.tracked).toBe(2);
    expect(summary.sla.breached).toBe(1); // the 20-day-old critical breaches the 14d window, the 1-day-old does not
    expect(summary.oldestOpen[0].daysOpen).toBe(19); // floor of "completed days open" for a 20-day-old finding
    expect(summary.limitations).toBe(REPORT_LIMITATIONS);
    expect(summary.period.from).toBe(prevImport.toISOString());
  });

  it("caps long lists at 50 entries", () => {
    const many = Array.from({ length: 60 }, (_, i) =>
      finding({ id: `f${i}`, status: "fixed", resolvedAt: now, fixNote: "n" })
    );
    const summary = buildReportSummary({ ...args, findings: many });
    expect(summary.fixedSince).toHaveLength(50);
  });

  it("defaults the period window to 30 days when there is no previous snapshot", () => {
    const summary = buildReportSummary({
      ...args,
      snapshots: [{ id: "s1", source: "npm_audit", importedAt: now, findingCount: 1 }],
      findings: [finding({ status: "fixed", resolvedAt: new Date(now.getTime() - 40 * 86_400_000), fixNote: "old" })],
    });
    expect(summary.fixedSince).toHaveLength(0);
    expect(summary.period.from).toBeNull();
  });
});
