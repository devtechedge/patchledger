import Link from "next/link";
import { isResetTokenValid } from "@/lib/services";
import { ResetPasswordForm } from "@/components/forms";
import { ThemeToggle } from "@/components/theme-toggle";

export const metadata = { title: "Choose a new password - PatchLedger" };

export default async function ResetPage({ params }: PageProps<"/reset/[token]">) {
  const { token } = await params;
  const valid = await isResetTokenValid(token);

  return (
    <div className="ledger-grid relative flex min-h-screen items-center justify-center px-6">
      <div className="fixed right-4 top-4 z-10">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-sm">
        <h1 className="text-center font-display text-2xl font-semibold tracking-tight">
          Choose a new password
        </h1>
        <div className="mt-8 border border-[var(--border)] bg-[var(--surface)] p-6">
          {valid ? (
            <ResetPasswordForm token={token} />
          ) : (
            <div className="grid gap-4 text-center">
              <p role="alert" className="border border-[var(--bad)] bg-[var(--bad)]/10 px-3 py-2 text-sm text-[var(--bad)]">
                This reset link is invalid or has expired.
              </p>
              <Link href="/forgot-password" className="font-semibold text-[var(--accent)] hover:underline">
                Request a new link
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
