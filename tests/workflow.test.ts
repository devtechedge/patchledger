import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createHash, randomBytes } from "node:crypto";
import { prisma } from "../lib/db";
import { rateLimit } from "../lib/rateLimit";
import type { Mailer } from "../lib/mailer";
import {
  InputError,
  NotFoundError,
  authenticate,
  countWaitlist,
  createAccount,
  createProject,
  createReport,
  deleteAccount,
  getFinding,
  getProject,
  getReportByPublicId,
  importScan,
  isResetTokenValid,
  joinWaitlist,
  listAuditEvents,
  listFindings,
  listProjects,
  requestPasswordReset,
  resetPassword,
  revokeReport,
  transitionFinding,
  updateProjectSettings,
} from "../lib/services";

const npmAudit = (entries: Record<string, unknown>) => ({ auditReportVersion: 2, vulnerabilities: entries });

function vuln(advisoryId: string, severity = "high") {
  return {
    severity,
    isDirect: false,
    via: [
      {
        source: 1,
        name: "pkg",
        title: `Issue ${advisoryId}`,
        url: `https://github.com/advisories/${advisoryId}`,
        severity,
        range: "<2.0.0",
        vulnerability: advisoryId,
      },
    ],
    range: "<2.0.0",
    nodes: [],
    fixAvailable: { name: "pkg", version: "2.0.0", isSemVerMajor: false },
  };
}

beforeAll(async () => {
  await prisma.auditEvent.deleteMany();
  await prisma.rateLimit.deleteMany();
  await prisma.account.deleteMany();
});

afterAll(async () => {
  await prisma.auditEvent.deleteMany();
  await prisma.rateLimit.deleteMany();
  await prisma.account.deleteMany();
  await prisma.$disconnect();
});

describe("accounts", () => {
  it("creates an account and rejects duplicate emails", async () => {
    const email = `t-${randomBytes(4).toString("hex")}@example.test`;
    const a = await createAccount({ email, password: "tr0ngPassw0rd", name: "T" });
    expect(a.id).toBeTruthy();
    await expect(
      createAccount({ email, password: "tr0ngPassw0rd", name: "T2" })
    ).rejects.toThrow(InputError);
  });

  it("authenticates only with the right password", async () => {
    const email = `t-${randomBytes(4).toString("hex")}@example.test`;
    await createAccount({ email, password: "tr0ngPassw0rd", name: "T" });
    expect(await authenticate(email, "tr0ngPassw0rd")).toBeTruthy();
    expect(await authenticate(email, "wrong-wrong-1")).toBeNull();
    expect(await authenticate("nobody@example.test", "whatever-123")).toBeNull();
  });
});

describe("projects + imports + evidence workflow", () => {
  const email = `flow-${randomBytes(4).toString("hex")}@example.test`;
  let accountId = "";
  let projectId = "";

  beforeAll(async () => {
    accountId = (await createAccount({ email, password: "tr0ngPassw0rd", name: "Flow" })).id;
    projectId = (await createProject(accountId, { name: "Client A" })).id;
  });

  it("enforces the starter plan project limit", async () => {
    await createProject(accountId, { name: "P2" });
    await createProject(accountId, { name: "P3" });
    await expect(createProject(accountId, { name: "P4" })).rejects.toThrow(/plan tracks up to/);
    await expect(createProject(accountId, { name: "Client A" })).rejects.toThrow(/already have a project/);
  });

  it("imports npm audit output and creates open findings", async () => {
    const out = await importScan(
      accountId,
      projectId,
      npmAudit({ pkgA: vuln("GHSA-aaaa-1111"), pkgB: vuln("GHSA-bbbb-2222", "critical") }),
      "first"
    );
    expect(out.source).toBe("npm_audit");
    expect(out.created).toBe(2);
    const findings = await listFindings(accountId, projectId);
    expect(findings).toHaveLength(2);
    expect(findings.every((f) => f.status === "open")).toBe(true);
    // critical sorts first
    expect(findings[0].severity).toBe("critical");
  });

  it("requires evidence to mark fixed, more to verify", async () => {
    const [f] = await listFindings(accountId, projectId, { severity: "high" });
    await expect(
      transitionFinding(accountId, f.id, { toStatus: "fixed" })
    ).rejects.toThrow(/evidence/i);
    await transitionFinding(accountId, f.id, {
      toStatus: "fixed",
      fixNote: "bumped to 2.0.0",
      fixUrl: "https://github.com/x/y/pull/1",
    });
    await expect(
      transitionFinding(accountId, f.id, { toStatus: "verified", verifyType: "tests" })
    ).rejects.toThrow(/evidence/i);
    await transitionFinding(accountId, f.id, {
      toStatus: "verified",
      verifyType: "tests",
      verifyUrl: "https://ci.example.test/run/1",
    });
    const verified = await getFinding(accountId, f.id);
    expect(verified.status).toBe("verified");
    expect(verified.verifiedAt).toBeTruthy();
    expect(verified.events).toHaveLength(2);
  });

  it("requires a client-readable reason for false positives and accepted risk", async () => {
    const [f] = await listFindings(accountId, projectId, { severity: "critical" });
    await expect(
      transitionFinding(accountId, f.id, { toStatus: "false_positive" })
    ).rejects.toThrow(/reason/i);
    await transitionFinding(accountId, f.id, {
      toStatus: "false_positive",
      reason: "devDependency only, not shipped",
    });
    expect((await getFinding(accountId, f.id)).status).toBe("false_positive");
  });

  it("re-import of a subset leaves verified findings untouched", async () => {
    // pkgA is verified; an import that no longer lists it must not touch it
    // (only open/in_progress findings auto-close)
    const out = await importScan(
      accountId,
      projectId,
      npmAudit({ pkgB: vuln("GHSA-bbbb-2222", "critical") }),
      "second"
    );
    expect(out.created).toBe(0);
    expect(out.updated).toBe(1);
    expect(out.autoFixed).toBe(0);
    const a = await prisma.finding.findFirstOrThrow({
      where: { projectId, packageName: "pkgA" },
    });
    expect(a.status).toBe("verified");
    expect(await listFindings(accountId, projectId)).toHaveLength(2);
  });

  it("auto-closes same-source findings that disappear, and reopens reappearing fixed ones", async () => {
    // pkgA (verified) reappears -> reopened; pkgB (false_positive) disappears -> kept; pkgC is new
    const out = await importScan(
      accountId,
      projectId,
      npmAudit({ pkgA: vuln("GHSA-aaaa-1111"), pkgC: vuln("GHSA-cccc-3333", "low") }),
      "third"
    );
    expect(out.created).toBe(1);
    expect(out.reopened).toBe(1);
    // pkgB was false_positive, not open, so it is untouched (kept, not auto-closed)
    const b = await prisma.finding.findFirstOrThrow({
      where: { projectId, packageName: "pkgB" },
    });
    expect(b.status).toBe("false_positive");

    // now import with only pkgC: the reopened, open pkgA auto-closes as fixed (not verified)
    const out2 = await importScan(
      accountId,
      projectId,
      npmAudit({ pkgC: vuln("GHSA-cccc-3333", "low") }),
      "fourth"
    );
    expect(out2.autoFixed).toBe(1);
    const a = await prisma.finding.findFirstOrThrow({
      where: { projectId, packageName: "pkgA" },
    });
    expect(a.status).toBe("fixed");
    expect(a.statusReason).toMatch(/Auto-closed/);
    expect(a.verifiedAt).toBeNull();
  });

  it("does not auto-close across different sources", async () => {
    // pkgC is open via npm_audit; an osv-scanner import reporting pkgD must not close pkgC
    await importScan(
      accountId,
      projectId,
      ({
        results: [
          {
            source: { type: "lockfile", path: "/x" },
            packages: [
              {
                package: { name: "pkgD", ecosystem: "npm", version: "0.1.0" },
                vulnerabilities: [{ id: "GHSA-dddd-4444", summary: "s" }],
              },
            ],
          },
        ],
      }),
      "osv"
    );
    const c = await prisma.finding.findFirstOrThrow({
      where: { projectId, packageName: "pkgC" },
    });
    expect(c.status).toBe("open");
    const d = await prisma.finding.findFirstOrThrow({
      where: { projectId, packageName: "pkgD" },
    });
    expect(d.installedVersion).toBe("0.1.0");
  });

  it("freezes reports, serves them by public id, and revokes them", async () => {
    const r = await createReport(accountId, projectId, { agencyNote: "hello" });
    const report = await getReportByPublicId(r.publicId);
    expect(report).toBeTruthy();
    const summary = JSON.parse(report!.summaryJson);
    expect(summary.limitations).toMatch(/not a penetration test/);
    expect(summary.project.name).toBe("Client A");

    await revokeReport(accountId, r.id);
    expect(await getReportByPublicId(r.publicId)).toBeNull();
    await expect(revokeReport(accountId, r.id)).rejects.toThrow(NotFoundError);
  });

  it("records audit events for imports and transitions", async () => {
    const events = await listAuditEvents(accountId, 100);
    const actions = events.map((e) => e.action);
    expect(actions).toContain("import");
    expect(actions).toContain("status_change");
    expect(actions).toContain("report_create");
  });

  it("saves project settings (SLA targets)", async () => {
    await updateProjectSettings(accountId, projectId, {
      clientName: "Client A Ltd",
      stack: "Node",
      notes: "",
      slaCriticalDays: 7,
      slaHighDays: 21,
      slaMediumDays: 60,
    });
    const p = await getProject(accountId, projectId);
    expect(p.slaCriticalDays).toBe(7);
    await expect(
      updateProjectSettings(accountId, projectId, {
        clientName: "",
        stack: "",
        notes: "",
        slaCriticalDays: -1,
        slaHighDays: 30,
        slaMediumDays: 90,
      })
    ).rejects.toThrow(InputError);
  });
});

describe("tenant isolation", () => {
  it("other accounts cannot read or mutate another tenant's data", async () => {
    const owner = await createAccount({
      email: `iso-${randomBytes(4).toString("hex")}@example.test`,
      password: "tr0ngPassw0rd",
      name: "Owner",
    });
    const intruder = await createAccount({
      email: `iso2-${randomBytes(4).toString("hex")}@example.test`,
      password: "tr0ngPassw0rd",
      name: "Intruder",
    });
    const project = await createProject(owner.id, { name: "Secret" });
    await importScan(
      owner.id,
      project.id,
      npmAudit({ pkgX: vuln("GHSA-xxxx-9999") }),
      "x"
    );
    const [f] = await listFindings(owner.id, project.id);

    await expect(getProject(intruder.id, project.id)).rejects.toThrow(NotFoundError);
    await expect(listFindings(intruder.id, project.id)).rejects.toThrow(NotFoundError);
    await expect(getFinding(intruder.id, f.id)).rejects.toThrow(NotFoundError);
    await expect(
      transitionFinding(intruder.id, f.id, { toStatus: "in_progress" })
    ).rejects.toThrow(NotFoundError);
    await expect(
      importScan(intruder.id, project.id, npmAudit({}), "y")
    ).rejects.toThrow(NotFoundError);
    // intruder's own dashboard sees only their projects
    expect(await listProjects(intruder.id)).toHaveLength(0);
  });
});

describe("password reset", () => {
  it("runs the full single-use flow and never reveals unknown emails", async () => {
    const email = `rst-${randomBytes(4).toString("hex")}@example.test`;
    await createAccount({ email, password: "oldPassw0rd1", name: "R" });

    // unknown email: no token, no signal
    let sent: { to: string; body: string }[] = [];
    const capture = (): Mailer => ({
      send: async (to, _s, body) => {
        sent.push({ to, body });
      },
    });
    await requestPasswordReset(`nobody-${randomBytes(2).toString("hex")}@example.test`, { ip: "1.2.3.4", mailer: capture() });
    expect(sent).toHaveLength(0);

    // known email: a link is dispatched
    await requestPasswordReset(email, { ip: "1.2.3.4", mailer: capture() });
    expect(sent).toHaveLength(1);
    expect(sent[0].to).toBe(email);
    const raw = /\/reset\/([a-f0-9]{64})/.exec(sent[0].body)![1];

    // token validates before use
    expect(await isResetTokenValid(raw)).toBe(true);

    // reset rotates the password and kills sessions
    const acc = await prisma.account.findUniqueOrThrow({ where: { email } });
    await prisma.session.create({ data: { id: "dead".repeat(16), accountId: acc.id, expiresAt: new Date(Date.now() + 86_400_000) } });
    await resetPassword(raw, "newPassw0rd2", { ip: "1.2.3.4" });
    expect(await authenticate(email, "newPassw0rd2")).toBeTruthy();
    expect(await authenticate(email, "oldPassw0rd1")).toBeNull();
    expect(await prisma.session.count({ where: { accountId: acc.id } })).toBe(0);
    expect(await isResetTokenValid(raw)).toBe(false);

    // reuse is rejected
    await expect(resetPassword(raw, "againPassw0rd3", { ip: "1.2.3.4" })).rejects.toThrow(InputError);

    // malformed and expired tokens are rejected
    await expect(resetPassword("deadbeef", "whateverPassw0rd1", { ip: "1.2.3.4" })).rejects.toThrow(InputError);
    const expired = await prisma.passwordResetToken.create({
      data: {
        accountId: acc.id,
        tokenHash: createHash("sha256").update("a".repeat(64)).digest("hex"),
        expiresAt: new Date(Date.now() - 1000),
      },
    });
    expect(await isResetTokenValid("a".repeat(64))).toBe(false);
    await expect(resetPassword("a".repeat(64), "whateverPassw0rd1", { ip: "1.2.3.4" })).rejects.toThrow(InputError);
    void expired;
  });
});

describe("waitlist", () => {
  it("dedupes by email and counts entries", async () => {
    const email = `wl-${randomBytes(4).toString("hex")}@example.test`;
    await joinWaitlist(email, "landing");
    await joinWaitlist(email, "landing"); // duplicate resolves silently
    const total = await countWaitlist();
    expect(total).toBeGreaterThanOrEqual(1);
    const rows = await prisma.waitlistEntry.findMany({ where: { email } });
    expect(rows).toHaveLength(1);
  });
});

describe("rate limiting + deletion", () => {
  it("enforces the sliding window", async () => {
    const bucket = `test:${randomBytes(4).toString("hex")}`;
    for (let i = 0; i < 3; i++) {
      expect((await rateLimit(bucket, "t", 3, 60_000)).allowed).toBe(true);
    }
    expect((await rateLimit(bucket, "t", 3, 60_000)).allowed).toBe(false);
  });

  it("deleting an account cascades everything and clears its audit trail", async () => {
    const email = `del-${randomBytes(4).toString("hex")}@example.test`;
    const account = await createAccount({ email, password: "tr0ngPassw0rd", name: "Doomed" });
    const project = await createProject(account.id, { name: "Gone" });
    await importScan(
      account.id,
      project.id,
      npmAudit({ pkgZ: vuln("GHSA-zzzz-0000") }),
      "z"
    );
    await createReport(account.id, project.id, {});
    const beforeCounts = await Promise.all([
      prisma.project.count({ where: { accountId: account.id } }),
      prisma.finding.count({ where: { accountId: account.id } }),
      prisma.report.count({ where: { accountId: account.id } }),
      prisma.auditEvent.count({ where: { accountId: account.id } }),
    ]);
    expect(beforeCounts).toEqual([1, 1, 1, expect.any(Number)]);

    await deleteAccount(account.id);
    const afterCounts = await Promise.all([
      prisma.project.count({ where: { accountId: account.id } }),
      prisma.finding.count({ where: { accountId: account.id } }),
      prisma.report.count({ where: { accountId: account.id } }),
      prisma.auditEvent.count({ where: { accountId: account.id } }),
      prisma.session.count({ where: { accountId: account.id } }),
    ]);
    expect(afterCounts).toEqual([0, 0, 0, 0, 0]);
    expect(await authenticate(email, "tr0ngPassw0rd")).toBeNull();
  });
});
