import Link from "next/link";
import { RequestResetForm } from "@/components/forms";
import { ThemeToggle } from "@/components/theme-toggle";

export const metadata = { title: "Reset password - PatchLedger" };

export default function ForgotPasswordPage() {
  return (
    <div className="ledger-grid relative flex min-h-screen items-center justify-center px-6">
      <div className="fixed right-4 top-4 z-10">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-sm">
        <h1 className="text-center font-display text-2xl font-semibold tracking-tight">Reset your password</h1>
        <p className="mt-2 text-center text-sm text-[var(--muted)]">
          We send a single-use link that is valid for 15 minutes.
        </p>
        <div className="mt-8 border border-[var(--border)] bg-[var(--surface)] p-6">
          <RequestResetForm />
        </div>
        <p className="mt-4 text-center text-sm text-[var(--muted)]">
          Remembered it?{" "}
          <Link href="/login" className="font-semibold text-[var(--accent)] hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
