import { SignupForm } from "@/components/forms";
import { ThemeToggle } from "@/components/theme-toggle";

export const metadata = { title: "Create account - PatchLedger" };

export default function SignupPage() {
  return (
    <div className="ledger-grid relative flex min-h-screen items-center justify-center px-6">
      <div className="fixed right-4 top-4 z-10">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2.5">
          <span aria-hidden className="grid h-6 w-6 place-items-center border-2 border-[var(--accent)]">
            <span className="block h-2.5 w-2.5 bg-[var(--accent)]" />
          </span>
          <span className="font-mono text-sm font-semibold tracking-[0.18em]">PATCHLEDGER</span>
        </div>
        <h1 className="mt-6 text-center font-display text-2xl font-semibold tracking-tight">Create your ledger</h1>
        <p className="mt-2 text-center text-sm text-[var(--muted)]">
          Free during the pilot. No billing, no card.
        </p>
        <div className="mt-8 border border-[var(--border)] bg-[var(--surface)] p-6">
          <SignupForm />
        </div>
      </div>
    </div>
  );
}
