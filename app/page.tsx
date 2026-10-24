import Link from "next/link";
import { prisma } from "@/lib/db";
import { PLANS } from "@/lib/plans";
import { ThemeToggle } from "@/components/theme-toggle";

export const dynamic = "force-dynamic";

async function demoReportLink(): Promise<string | null> {
  const demo = await prisma.account.findFirst({
    where: { isDemo: true },
    select: { id: true },
  });
  if (!demo) return null;
  const report = await prisma.report.findFirst({
    where: { accountId: demo.id, status: "published" },
    orderBy: { createdAt: "desc" },
    select: { publicId: true },
  });
  return report ? `/r/${report.publicId}` : null;
}

const TERMINAL_ROWS = [
  { pkg: "lodash.template", sev: "critical", rest: "GHSA-jf85-c6p8-p8pp", state: "VERIFIED", stateCls: "text-[var(--good)]" },
  { pkg: "axios", sev: "medium", rest: "GHSA-wf5p-g6vw-rhxx", state: "FIXED", stateCls: "text-[var(--good)]" },
  { pkg: "next", sev: "high", rest: "GHSA-abc1-23de-45fg", state: "OPEN", stateCls: "text-[var(--bad)]" },
  { pkg: "underscore", sev: "high", rest: "GHSA-cf4h-3j7x-mhff", state: "OPEN", stateCls: "text-[var(--bad)]" },
];

const STEPS = [
  {
    n: "01",
    k: "IMPORT",
    title: "Paste the scanner output you already have",
    body: "npm audit --json or osv-scanner --json, straight from your terminal. PatchLedger parses it deterministically - advisory-level dedupe, severity normalization, CVSS 3.1 vector scoring. No repository access, no tokens, nothing scanned.",
  },
  {
    n: "02",
    k: "RECORD",
    title: "Every advisory becomes an evidence record",
    body: "Fixed means a PR, commit or release is on the record. Verified means a passing test or build run backs it. False positives and accepted risks stay visible with the reason, where your client can read them.",
  },
  {
    n: "03",
    k: "PROVE",
    title: "Ship the monthly proof, not a promise",
    body: "A branded report freezes the state: what was fixed, what was verified with a passing run, what is still open and inside or past its SLA. Honest limitations printed on every page, because a report that overpromises is a liability.",
  },
];

const NOTS = [
  ["Not a scanner", "Dependabot, osv-scanner and Trivy scan for free. PatchLedger is the record that starts after the alert."],
  ["Not an audit", "Reports state the scanner, the date and the scope - and say plainly they are not security certification."],
  ["Not repo-connected", "Read-only by design: no GitHub app, no tokens, no PRs opened, no code uploaded anywhere."],
  ["Not AI-generated", "Parsing, dedupe, SLA math and reports are deterministic. No customer data reaches a model."],
];

export default async function LandingPage() {
  const sample = await demoReportLink();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-[var(--border)] bg-[var(--bg)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <span aria-hidden className="grid h-6 w-6 place-items-center border-2 border-[var(--accent)]">
              <span className="block h-2.5 w-2.5 bg-[var(--accent)]" />
            </span>
            <span className="font-mono text-sm font-semibold tracking-[0.18em] text-[var(--ink)]">
              PATCHLEDGER
            </span>
          </Link>
          <nav className="flex items-center gap-3 sm:gap-5 text-sm">
            <Link href="/pricing" className="hidden text-[var(--muted)] hover:text-[var(--ink)] sm:inline">
              Pricing
            </Link>
            <Link href="/login" className="hidden text-[var(--muted)] hover:text-[var(--ink)] sm:inline">
              Sign in
            </Link>
            <Link
              href="/signup"
              className="bg-[var(--accent)] px-3 py-1.5 font-mono text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent-ink)] hover:brightness-110 sm:px-4"
            >
              Start free
            </Link>
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* hero: split, left copy, right terminal record */}
        <section className="ledger-grid border-b border-[var(--border)]">
          <div className="mx-auto grid max-w-6xl gap-10 px-6 py-20 lg:grid-cols-[1.05fr_1fr] lg:items-center">
            <div>
              <p className="microlabel">Evidence ledger for dev agencies</p>
              <h1 className="mt-4 font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl">
                Prove your security maintenance, not just promise it.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-[var(--muted)]">
                Scanner output in - an evidence-backed record out. PatchLedger tracks every
                advisory from the vulnerability scans you already run, holds the fix and
                verification evidence against it, and prints the branded monthly report
                your clients can actually rely on.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  href="/signup"
                  className="bg-[var(--accent)] px-6 py-3 font-mono text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-ink)] hover:brightness-110"
                >
                  Create your ledger
                </Link>
                {sample ? (
                  <Link
                    href={sample}
                    className="border border-[var(--border-strong)] px-6 py-3 font-mono text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
                  >
                    See a sample client report
                  </Link>
                ) : null}
              </div>
              <p className="mt-4 font-mono text-xs text-[var(--faint)]">
                no repo access / no tokens / no scanning / no AI in the data path
              </p>
            </div>

            <div className="min-w-0 border border-[var(--border)] bg-[var(--surface)] shadow-[0_0_0_1px_var(--border)]">
              <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-2.5">
                <span className="font-mono text-xs text-[var(--faint)]">npm audit --json</span>
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--accent)]">
                  live record
                </span>
              </div>
              <div className="overflow-x-auto">
                <div className="min-w-[460px]">
                  <div className="grid grid-cols-[1.6fr_1.4fr_auto] gap-x-4 border-b border-[var(--border)] px-4 py-2">
                    <span className="microlabel">package</span>
                    <span className="microlabel">advisory</span>
                    <span className="microlabel text-right">state</span>
                  </div>
                  {TERMINAL_ROWS.map((r) => (
                    <div
                      key={r.rest}
                      className="grid grid-cols-[1.6fr_1.4fr_auto] items-center gap-x-4 border-b border-[var(--border)] px-4 py-2.5 font-mono text-xs last:border-b-0"
                    >
                      <span className="text-[var(--ink)]">{r.pkg}</span>
                      <span className="truncate text-[var(--faint)]">
                        <span className={`mr-2 uppercase ${r.sev === "critical" ? "text-[var(--bad)]" : r.sev === "high" ? "text-[var(--warn)]" : "text-[var(--med)]"}`}>
                          {r.sev}
                        </span>
                        {r.rest}
                      </span>
                      <span className={`text-right text-[10px] font-semibold tracking-[0.16em] ${r.stateCls}`}>
                        {r.state}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-[var(--border)] px-4 py-2.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--faint)]">
                  sla 14d / 30d / 90d
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--good)]">
                  2 fixed - 1 verified
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* numbered ledger rows */}
        <section className="border-b border-[var(--border)] bg-[var(--surface)]">
          <div className="mx-auto max-w-6xl px-6 py-16">
            {STEPS.map((s) => (
              <div
                key={s.n}
                className="grid gap-4 border-b border-[var(--border)] py-8 last:border-b-0 md:grid-cols-[80px_160px_1fr_1.6fr] md:items-baseline md:gap-8"
              >
                <span className="font-display text-3xl font-semibold text-[var(--accent)]">{s.n}</span>
                <span className="microlabel">{s.k}</span>
                <h2 className="font-display text-lg font-semibold tracking-tight">{s.title}</h2>
                <p className="text-sm leading-6 text-[var(--muted)]">{s.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* spec sheet: what it is not */}
        <section className="border-b border-[var(--border)]">
          <div className="mx-auto max-w-6xl px-6 py-16">
            <p className="microlabel">Scope statement</p>
            <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight">What PatchLedger is not</h2>
            <dl className="mt-8 grid gap-px border border-[var(--border)] bg-[var(--border)] sm:grid-cols-2">
              {NOTS.map(([term, def]) => (
                <div key={term} className="bg-[var(--surface)] p-6">
                  <dt className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
                    {term}
                  </dt>
                  <dd className="mt-2 text-sm leading-6 text-[var(--muted)]">{def}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* pricing: ledger table */}
        <section>
          <div className="mx-auto max-w-6xl px-6 py-16">
            <p className="microlabel">Rates</p>
            <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight">Flat monthly. No per-seat metering.</h2>
            <div className="mt-8 border border-[var(--border)]">
              {Object.values(PLANS)
                .filter((p) => p.key !== "demo")
                .map((p, i) => (
                  <div
                    key={p.key}
                    className={`grid items-center gap-2 px-6 py-5 sm:grid-cols-[140px_120px_1fr] ${i > 0 ? "border-t border-[var(--border)]" : ""} bg-[var(--surface)]`}
                  >
                    <span className="font-mono text-sm font-semibold uppercase tracking-[0.16em]">{p.label}</span>
                    <span className="font-display text-2xl font-semibold text-[var(--accent)]">
                      ${p.priceUsd}
                      <span className="font-body text-sm font-normal text-[var(--faint)]">/mo</span>
                    </span>
                    <span className="text-sm text-[var(--muted)]">{p.blurb}</span>
                  </div>
                ))}
            </div>
            <p className="mt-4 font-mono text-xs text-[var(--faint)]">
              billing disabled during pilot - free until then
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-6 font-mono text-xs text-[var(--muted)]">
          <span className="uppercase tracking-[0.18em]">PatchLedger - evidence, not promises</span>
          <div className="flex gap-5">
            <Link href="/pricing" className="hover:text-[var(--ink)]">Pricing</Link>
            <Link href="/legal/privacy" className="hover:text-[var(--ink)]">Privacy</Link>
            <Link href="/legal/terms" className="hover:text-[var(--ink)]">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
