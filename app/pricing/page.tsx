import Link from "next/link";
import { PLANS } from "@/lib/plans";

export const metadata = { title: "Pricing - PatchLedger" };

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="text-center text-3xl font-bold tracking-tight">Pricing</h1>
      <p className="mx-auto mt-3 max-w-xl text-center text-[var(--muted)]">
        Flat monthly prices, no per-seat charges, no per-repo metering. Billing is not
        enabled while the product is in pilot validation - everything is free until then.
      </p>
      <div className="mt-10 grid gap-6 sm:grid-cols-3">
        {Object.values(PLANS)
          .filter((p) => p.key !== "demo")
          .map((p) => (
            <div key={p.key} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
              <h2 className="font-semibold">{p.label}</h2>
              <p className="mt-1 text-4xl font-bold">
                ${p.priceUsd}
                <span className="text-base font-normal text-[var(--faint)]">/mo</span>
              </p>
              <p className="mt-3 text-sm text-[var(--muted)]">{p.blurb}</p>
            </div>
          ))}
      </div>
      <p className="mt-10 text-center text-sm text-[var(--faint)]">
        See also <Link href="/legal/terms" className="underline">terms</Link> and{" "}
        <Link href="/legal/privacy" className="underline">privacy</Link>.
      </p>
    </div>
  );
}
