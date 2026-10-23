import Link from "next/link";
import { LoginForm } from "@/components/forms";

export const metadata = { title: "Sign in - PatchLedger" };

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h1 className="text-center text-2xl font-bold tracking-tight">Sign in to PatchLedger</h1>
        <p className="mt-2 text-center text-sm text-[var(--muted)]">
          Evidence-backed security maintenance for client projects.
        </p>
        <div className="mt-8 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <LoginForm />
        </div>
        <p className="mt-4 text-center text-sm text-[var(--muted)]">
          No account yet?{" "}
          <Link href="/signup" className="font-semibold" style={{ color: "var(--accent)" }}>
            Create one
          </Link>
        </p>
        <p className="mt-6 text-center text-xs text-[var(--faint)]">
          Demo workspace (if seeded): demo@patchledger.test / demo-password-1
        </p>
      </div>
    </div>
  );
}
