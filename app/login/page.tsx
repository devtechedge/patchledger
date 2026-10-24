import Link from "next/link";
import { LoginForm } from "@/components/forms";
import { ThemeToggle } from "@/components/theme-toggle";

export const metadata = { title: "Sign in - PatchLedger" };

export default function LoginPage() {
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
        <h1 className="mt-6 text-center font-display text-2xl font-semibold tracking-tight">Open your ledger</h1>
        <p className="mt-2 text-center text-sm text-[var(--muted)]">
          Evidence-backed security maintenance records.
        </p>
        <div className="mt-8 border border-[var(--border)] bg-[var(--surface)] p-6">
          <LoginForm />
        </div>
        <p className="mt-4 text-center text-sm text-[var(--muted)]">
          No account yet?{" "}
          <Link href="/signup" className="font-semibold text-[var(--accent)] hover:underline">
            Create one
          </Link>
        </p>
        <p className="mt-6 text-center font-mono text-xs text-[var(--faint)]">
          demo@patchledger.test / demo-password-1
        </p>
      </div>
    </div>
  );
}
