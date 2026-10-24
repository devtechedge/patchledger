import Link from "next/link";
import { PLANS } from "@/lib/plans";
import { ThemeToggle } from "@/components/theme-toggle";

export const metadata = { title: "Pricing - PatchLedger" };

export default function PricingPage() {
  return (
    <div className="ledger-grid min-h-screen">
      <header className="border-b border-[var(--border)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <span aria-hidden className="grid h-6 w-6 place-items-center border-2 border-[var(--accent)]">
              <span className="block h-2.5 w-2.5 bg-[var(--accent)]" />
            </span>
            <span className="font-mono text-sm font-semibold tracking-[0.18em]">PATCHLEDGER</span>
          </Link>
          <ThemeToggle />
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-6 py-16">
        <p className="microlabel">Rates</p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">Flat monthly. No per-seat metering.</h1>
        <p className="mt-3 max-w-xl text-[var(--muted)]">
          Billing is not enabled while the product is in pilot validation - everything is free
          until then. Plan limits below apply from signup.
        </p>
        <div className="mt-10 border border-[var(--border)]">
          {Object.values(PLANS)
            .filter((p) => p.key !== "demo")
            .map((p, i) => (
              <div
                key={p.key}
                className={`grid items-center gap-2 bg-[var(--surface)] px-6 py-5 sm:grid-cols-[140px_120px_1fr] ${i > 0 ? "border-t border-[var(--border)]" : ""}`}
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
        <p className="mt-8 font-mono text-xs text-[var(--faint)]">
          see also{" "}
          <Link href="/legal/terms" className="underline hover:text-[var(--ink)]">terms</Link> and{" "}
          <Link href="/legal/privacy" className="underline hover:text-[var(--ink)]">privacy</Link>
        </p>
      </main>
    </div>
  );
}
