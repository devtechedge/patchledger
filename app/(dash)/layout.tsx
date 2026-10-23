import Link from "next/link";
import { redirect } from "next/navigation";
import { currentAccount } from "@/lib/auth";
import { LogoutButton } from "@/components/dashboard-forms";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function DashLayout({ children }: { children: React.ReactNode }) {
  const account = await currentAccount();
  if (!account) redirect("/login");

  return (
    <div className="min-h-screen">
      <header className="border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-3">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-2 font-bold tracking-tight">
              <span
                className="inline-block h-5 w-5 rounded-md"
                style={{ background: account.accentColor }}
                aria-hidden
              />
              PatchLedger
            </Link>
            <nav className="flex items-center gap-4 text-sm text-[var(--muted)]">
              <Link href="/dashboard" className="hover:text-[var(--ink)]">Projects</Link>
              <Link href="/account" className="hover:text-[var(--ink)]">Account</Link>
            </nav>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-[var(--faint)]">{account.email}</span>
            <ThemeToggle />
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </div>
  );
}
