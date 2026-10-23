import { SignupForm } from "@/components/forms";

export const metadata = { title: "Create account - PatchLedger" };

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h1 className="text-center text-2xl font-bold tracking-tight">Create your workspace</h1>
        <p className="mt-2 text-center text-sm text-[var(--muted)]">
          Free during the pilot. No billing, no card.
        </p>
        <div className="mt-8 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <SignupForm />
        </div>
      </div>
    </div>
  );
}
