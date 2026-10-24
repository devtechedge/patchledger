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
      <header className="border-b border-[var(--border)] bg-[var(--bg)]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-6 py-3">
          <div className="flex items-center gap-4 sm:gap-7">
            <Link href="/dashboard" className="flex items-center gap-2.5">
              <span aria-hidden className="grid h-5 w-5 place-items-center border-2 border-[var(--accent)]">
                <span className="block h-2 w-2 bg-[var(--accent)]" />
              </span>
              <span className="font-mono text-xs font-semibold tracking-[0.18em]">PATCHLEDGER</span>
            </Link>
            <nav className="flex items-center gap-4 font-mono text-xs uppercase tracking-[0.14em] text-[var(--muted)] sm:gap-5">
              <Link href="/dashboard" className="hover:text-[var(--accent)]">Projects</Link>
              <Link href="/account" className="hover:text-[var(--accent)]">Account</Link>
            </nav>
          </div>
          <div className="flex items-center gap-3 font-mono text-xs text-[var(--faint)] sm:gap-4">
            <span className="hidden sm:inline">{account.email}</span>
            <ThemeToggle />
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
