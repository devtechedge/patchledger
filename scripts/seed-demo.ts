/**
 * Seeds a demo workspace: demo@patchledger.test / demo-password-1
 * - one project with two npm-audit imports (a month apart),
 * - one fixed-with-evidence finding and one verified finding,
 * - one published client report.
 * Idempotent: deletes the previous demo account first.
 */
try {
  process.loadEnvFile();
} catch {
  // no .env file (CI); env must come from the environment
}

import { prisma } from "../lib/db";
import { hashPassword } from "../lib/password";
import { applyImport } from "../lib/merge";
import { createReport } from "../lib/services";

const DEMO_EMAIL = "demo@patchledger.test";

const auditMonthAgo = {
  auditReportVersion: 2,
  vulnerabilities: {
    underscore: {
      name: "underscore",
      severity: "high",
      isDirect: false,
      via: [
        {
          source: 1234,
          name: "underscore",
          title: "Arbitrary Code Execution in underscore",
          url: "https://github.com/advisories/GHSA-cf4h-3j7x-mhff",
          severity: "high",
          range: "<=1.12.0",
          vulnerability: "GHSA-cf4h-3j7x-mhff",
        },
      ],
      range: "<=1.12.0",
      nodes: ["node_modules/underscore"],
      fixAvailable: { name: "underscore", version: "1.13.0", isSemVerMajor: false },
    },
    "lodash.template": {
      name: "lodash.template",
      severity: "critical",
      isDirect: false,
      via: [
        {
          source: 5678,
          name: "lodash.template",
          title: "Command Injection in lodash",
          url: "https://github.com/advisories/GHSA-jf85-c6p8-p8pp",
          severity: "critical",
          range: "<4.5.0",
          vulnerability: "GHSA-jf85-c6p8-p8pp",
        },
      ],
      range: "<4.5.0",
      nodes: ["node_modules/lodash.template"],
      fixAvailable: { name: "lodash.template", version: "4.5.0", isSemVerMajor: false },
    },
    axios: {
      name: "axios",
      severity: "moderate",
      isDirect: true,
      via: [
        {
          source: 9012,
          name: "axios",
          title: "SSRF in axios",
          url: "https://github.com/advisories/GHSA-wf5p-g6vw-rhxx",
          severity: "moderate",
          range: "<1.8.2",
          vulnerability: "GHSA-wf5p-g6vw-rhxx",
        },
      ],
      range: "<1.8.2",
      nodes: ["node_modules/axios"],
      fixAvailable: { name: "axios", version: "1.8.2", isSemVerMajor: false },
    },
  },
  metadata: {
    vulnerabilities: { info: 0, low: 0, moderate: 1, high: 1, critical: 1, total: 3 },
    dependencies: { prod: 48, dev: 63, optional: 0, total: 111, id: 1 },
  },
};

// a month later: lodash.template and axios no longer reported; a fresh advisory appeared
const auditToday = {
  auditReportVersion: 2,
  vulnerabilities: {
    underscore: auditMonthAgo.vulnerabilities.underscore,
    "next": {
      name: "next",
      severity: "high",
      isDirect: true,
      via: [
        {
          source: 3456,
          name: "next",
          title: "Cache poisoning in Next.js middleware",
          url: "https://github.com/advisories/GHSA-abc1-23de-45fg",
          severity: "high",
          range: "<14.2.15",
          vulnerability: "GHSA-abc1-23de-45fg",
        },
      ],
      range: "<14.2.15",
      nodes: ["node_modules/next"],
      fixAvailable: { name: "next", version: "15.0.0", isSemVerMajor: true },
    },
  },
  metadata: {
    vulnerabilities: { info: 0, low: 0, moderate: 0, high: 2, critical: 0, total: 2 },
    dependencies: { prod: 44, dev: 60, optional: 0, total: 104, id: 2 },
  },
};

async function main() {
  const prev = await prisma.account.findUnique({ where: { email: DEMO_EMAIL } });
  if (prev) {
    await prisma.account.delete({ where: { id: prev.id } });
  }

  const account = await prisma.account.create({
    data: {
      email: DEMO_EMAIL,
      passwordHash: await hashPassword("demo-password-1"),
      name: "Demo Studio",
      agencyName: "Demo Studio Ltd",
      contactEmail: "care@demostudio.test",
      accentColor: "#0d9488",
      plan: "demo",
      isDemo: true,
    },
  });

  const project = await prisma.project.create({
    data: {
      accountId: account.id,
      name: "Northwind Portal",
      clientName: "Northwind Traders",
      stack: "Next.js + Node",
      slaCriticalDays: 14,
      slaHighDays: 30,
      slaMediumDays: 90,
    },
  });

  const monthAgo = new Date(Date.now() - 30 * 86_400_000);
  const weekAgo = new Date(Date.now() - 7 * 86_400_000);

  await applyImport(account.id, project.id, await importParse(auditMonthAgo), "monthly audit", monthAgo);

  // record a real fix + verification on lodash.template (now-2w), and a fix on axios (now-10d)
  const lodash = await prisma.finding.findUniqueOrThrow({
    where: {
      projectId_ecosystem_packageName_advisoryId: {
        projectId: project.id,
        ecosystem: "npm",
        packageName: "lodash.template",
        advisoryId: "GHSA-jf85-c6p8-p8pp",
      },
    },
  });
  await prisma.finding.update({
    where: { id: lodash.id },
    data: {
      status: "fixed",
      resolvedAt: weekAgo,
      fixUrl: "https://github.com/northwind/portal/pull/482",
      fixNote: "Bumped lodash.template to 4.5.0 across the app; no API usage changed.",
      fixedInVersion: "4.5.0",
    },
  });
  await prisma.findingEvent.create({
    data: {
      findingId: lodash.id,
      kind: "manual",
      fromStatus: "open",
      toStatus: "fixed",
      note: "PR 482 merged; full suite green.",
      createdAt: weekAgo,
    },
  });

  await applyImport(account.id, project.id, await importParse(auditToday), "monthly audit", new Date(Date.now() - 86_400_000));

  // after the second import, lodash.template vanished from the scan and was auto-closed.
  // upgrade it to verified with a recorded passing run
  await prisma.finding.update({
    where: { id: lodash.id },
    data: {
      status: "verified",
      verifyType: "tests",
      verifyUrl: "https://github.com/northwind/portal/actions/runs/1234567",
      verifyNote: "Regression suite (412 tests) green on the release branch.",
      verifiedAt: new Date(),
    },
  });
  await prisma.findingEvent.create({
    data: {
      findingId: lodash.id,
      kind: "manual",
      fromStatus: "fixed",
      toStatus: "verified",
      note: "CI run 1234567 passed.",
    },
  });

  await createReport(account.id, project.id, {
    title: "Security maintenance report - Northwind Portal",
    periodLabel: new Date().toLocaleString("en-US", { month: "long", year: "numeric" }),
    agencyNote:
      "Two advisories closed this cycle (one verified with the release CI run). The Next.js middleware advisory needs a major-version bump; scheduled for the sprint after next with your sign-off.",
  });

  const report = await prisma.report.findFirstOrThrow({
    where: { accountId: account.id },
    orderBy: { createdAt: "desc" },
  });

  console.log(`demo seeded: ${DEMO_EMAIL} / demo-password-1`);
  console.log(`sample report: /r/${report.publicId}`);
}

// reuse the real parser so the seed exercises production code paths
async function importParse(raw: unknown) {
  const { parseScannerJson } = await import("../lib/importers/detect");
  return parseScannerJson(raw);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
