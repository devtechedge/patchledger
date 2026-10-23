import Link from "next/link";
import { prisma } from "@/lib/db";
import { PLANS } from "@/lib/plans";

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

export default async function LandingPage() {
  const sample = await demoReportLink();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2 font-bold tracking-tight">
            <span
              className="inline-block h-6 w-6 rounded-md"
              style={{ background: "var(--accent)" }}
              aria-hidden
            />
            PatchLedger
          </div>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/pricing" className="text-[var(--muted)] hover:text-[var(--ink)]">
              Pricing
            </Link>
            <Link href="/login" className="text-[var(--muted)] hover:text-[var(--ink)]">
              Sign in
            </Link>
            <Link
              href="/signup"
              className="rounded-lg px-3 py-1.5 font-semibold text-white"
              style={{ background: "var(--accent)" }}
            >
              Start free
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-5xl px-6 py-16 text-center">
          <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
            Prove your security maintenance, not just promise it.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-[var(--muted)]">
            PatchLedger turns the vulnerability scanner output you already have
            (npm audit, osv-scanner) into a tracked record of what was fixed,
            how it was verified, and what remains - with a branded,
            client-ready report at the end.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/signup"
              className="rounded-lg px-5 py-2.5 font-semibold text-white"
              style={{ background: "var(--accent)" }}
            >
              Create your workspace
            </Link>
            {sample ? (
              <Link
                href={sample}
                className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-5 py-2.5 font-semibold"
              >
                See a sample client report
              </Link>
            ) : null}
          </div>
          <p className="mt-3 text-sm text-[var(--faint)]">
            No repository access. No tokens. No scanning. You paste the JSON you already generate.
          </p>
        </section>

        <section className="border-y border-[var(--border)] bg-[var(--surface)]">
          <div className="mx-auto grid max-w-5xl gap-8 px-6 py-14 sm:grid-cols-3">
            {[
              {
                step: "1. Import",
                body: "Run npm audit --json or osv-scanner --json in your project and paste the output. PatchLedger parses it deterministically - no AI, no guesswork, nothing leaves your machine except the pasted text.",
              },
              {
                step: "2. Track evidence",
                body: "Triage findings, attach fix evidence (PR or release link) and verification evidence (test or build run), and watch SLA status per severity. Fixed means you recorded it; verified means a passing run backs it.",
              },
              {
                step: "3. Share the proof",
                body: "Generate a branded, dated report: what changed, what was verified, what is still open and why. Honest limitations included, because a report that overpromises is a liability.",
              },
            ].map((c) => (
              <div key={c.step}>
                <h2 className="font-semibold" style={{ color: "var(--accent)" }}>
                  {c.step}
                </h2>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{c.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-6 py-14">
          <h2 className="text-2xl font-bold tracking-tight">What PatchLedger is not</h2>
          <ul className="mt-4 grid gap-3 text-[var(--muted)] sm:grid-cols-2">
            <li className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm">
              Not a scanner. Dependabot, osv-scanner and Trivy already scan for free.
              PatchLedger is the missing layer after the alert: triage, evidence, SLA and the client report.
            </li>
            <li className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm">
              Not an audit or certification. Reports state exactly which scanner, which date, which scope - and say plainly that they are not proof of security.
            </li>
            <li className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm">
              Not a plug-in for your repo. Read-only by design: it never asks for GitHub access, never opens PRs, never touches your code.
            </li>
            <li className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm">
              Not AI-dependent. Parsing, dedupe, SLA math and reports are deterministic. No customer data is ever sent to a model.
            </li>
          </ul>
        </section>

        <section className="border-t border-[var(--border)] bg-[var(--surface)]">
          <div className="mx-auto max-w-5xl px-6 py-14">
            <h2 className="text-center text-2xl font-bold tracking-tight">Pricing</h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-3">
              {Object.values(PLANS)
                .filter((p) => p.key !== "demo")
                .map((p) => (
                  <div
                    key={p.key}
                    className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-6"
                  >
                    <h3 className="font-semibold">{p.label}</h3>
                    <p className="mt-1 text-3xl font-bold">
                      ${p.priceUsd}
                      <span className="text-base font-normal text-[var(--faint)]">/mo</span>
                    </p>
                    <p className="mt-3 text-sm text-[var(--muted)]">{p.blurb}</p>
                  </div>
                ))}
            </div>
            <p className="mt-6 text-center text-sm text-[var(--faint)]">
              Billing is not enabled yet while the product is in validation. Free during the pilot.
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-6 text-sm text-[var(--muted)]">
          <span>PatchLedger - evidence-backed security maintenance for client projects.</span>
          <div className="flex gap-4">
            <Link href="/pricing" className="hover:text-[var(--ink)]">Pricing</Link>
            <Link href="/legal/privacy" className="hover:text-[var(--ink)]">Privacy</Link>
            <Link href="/legal/terms" className="hover:text-[var(--ink)]">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
