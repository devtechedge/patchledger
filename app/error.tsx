"use client";

import Link from "next/link";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="ledger-grid flex min-h-screen flex-col items-center justify-center px-6">
      <div className="w-full max-w-md border border-[var(--border)] bg-[var(--surface)] px-8 py-10 text-center">
        <div className="flex items-center justify-center gap-2.5">
          <span aria-hidden className="grid h-6 w-6 place-items-center border-2 border-[var(--accent)]">
            <span className="block h-2.5 w-2.5 bg-[var(--accent)]" />
          </span>
          <span className="font-mono text-sm font-semibold tracking-[0.18em]">PATCHLEDGER</span>
        </div>
        <p className="mt-8 font-display text-3xl font-semibold">Something went wrong</p>
        <p className="mt-3 text-sm text-[var(--muted)]">
          The page failed to load. Nothing was lost - retry, and if it keeps failing try again in a few minutes.
        </p>
        <div className="mt-8 flex justify-center gap-4 font-mono text-xs font-semibold uppercase tracking-[0.16em]">
          <button
            type="button"
            onClick={reset}
            className="bg-[var(--accent)] px-4 py-2 text-[var(--accent-ink)] hover:brightness-110"
          >
            Retry
          </button>
          <Link
            href="/"
            className="border border-[var(--border-strong)] px-4 py-2 text-[var(--ink)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
