import Link from "next/link";
import { currentAccount } from "@/lib/auth";
import { listProjects } from "@/lib/services";
import { planFor } from "@/lib/plans";
import { CreateProjectForm } from "@/components/dashboard-forms";
import { Empty, Panel } from "@/components/ui";

export const metadata = { title: "Projects - PatchLedger" };

export default async function DashboardPage() {
  const account = (await currentAccount())!;
  const projects = await listProjects(account.id);
  const plan = planFor(account.plan);

  return (
    <div className="grid gap-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          {projects.length} of {plan.projects} projects on the {plan.label} plan.
          Each project holds its own imports, findings, evidence and reports.
        </p>
      </div>

      <Panel title="Add a client project">
        <CreateProjectForm />
      </Panel>

      {projects.length === 0 ? (
        <Empty>
          No projects yet. Add one above, then import <code>npm audit --json</code> or{" "}
          <code>osv-scanner --json</code> output for it.
        </Empty>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {projects.map((p) => {
            const crit = p.openBySeverity["critical"] ?? 0;
            const high = p.openBySeverity["high"] ?? 0;
            return (
              <li key={p.id}>
                <Link
                  href={`/p/${p.id}`}
                  className="block rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 hover:border-[var(--accent)]"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <h2 className="font-semibold">{p.name}</h2>
                    {p.clientName ? (
                      <span className="text-xs text-[var(--faint)]">{p.clientName}</span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    {p.openTotal === 0
                      ? "No open findings"
                      : `${p.openTotal} open (${crit} critical, ${high} high)`}
                  </p>
                  <p className="mt-1 text-xs text-[var(--faint)]">
                    {p.lastImportAt
                      ? `Last import ${p.lastImportAt.toISOString().slice(0, 10)} (${p.lastImportSource})`
                      : "No imports yet"}
                    {p.reportCount ? ` - ${p.reportCount} report${p.reportCount === 1 ? "" : "s"}` : ""}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
