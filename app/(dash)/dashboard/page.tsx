import Link from "next/link";
import { requirePageAccount } from "@/lib/auth";
import { listProjects } from "@/lib/services";
import { planFor } from "@/lib/plans";
import { CreateProjectForm } from "@/components/dashboard-forms";
import { Empty, Panel } from "@/components/ui";

export const metadata = { title: "Projects - PatchLedger" };

export default async function DashboardPage() {
  const account = await requirePageAccount();
  const projects = await listProjects(account.id);
  const plan = planFor(account.plan);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[var(--border)] pb-5">
        <div>
          <p className="microlabel">Ledger</p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight">Projects</h1>
        </div>
        <p className="font-mono text-xs text-[var(--faint)]">
          {projects.length} / {plan.projects} on the {plan.label} plan
        </p>
      </div>

      {projects.length === 0 ? (
        <>
          <Panel title="Add a client project" index="00">
            <CreateProjectForm />
          </Panel>
          <Empty>
            No projects yet. Add one above, then import npm audit --json or osv-scanner --json output for it.
          </Empty>
        </>
      ) : (
        <>
          <Panel title="Add a client project" index="+">
            <CreateProjectForm />
          </Panel>

          <div className="border border-[var(--border)]" role="table" aria-label="Client projects with open finding counts and last import dates">
            <div className="overflow-x-auto">
              <div className="min-w-[640px]">
                <div className="grid grid-cols-[1.4fr_1fr_110px_90px_150px] gap-x-4 border-b border-[var(--border)] bg-[var(--surface-2)] px-4 py-2.5" role="row">
                  <span className="microlabel">project</span>
                  <span className="microlabel">client</span>
                  <span className="microlabel text-right">open</span>
                  <span className="microlabel text-right">crit</span>
                  <span className="microlabel text-right">last import</span>
                </div>
                {projects.map((p, i) => {
                  const crit = p.openBySeverity["critical"] ?? 0;
                  return (
                    <Link
                      key={p.id}
                      href={`/p/${p.id}`}
                      className={`grid grid-cols-[1.4fr_1fr_110px_90px_150px] items-center gap-x-4 px-4 py-3.5 hover:bg-[var(--surface-2)] ${i > 0 ? "border-t border-[var(--border)]" : ""}`}
                    >
                      <span className="truncate text-sm font-medium text-[var(--ink)]">{p.name}</span>
                      <span className="truncate font-mono text-xs text-[var(--faint)]">{p.clientName || "-"}</span>
                      <span className="text-right font-mono text-sm">{p.openTotal}</span>
                      <span
                        className="text-right font-mono text-sm"
                        style={crit > 0 ? { color: "var(--bad)" } : { color: "var(--faint)" }}
                      >
                        {crit}
                      </span>
                      <span className="text-right font-mono text-xs text-[var(--faint)]">
                        {p.lastImportAt ? p.lastImportAt.toISOString().slice(0, 10) : "never"}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
          <p className="font-mono text-xs text-[var(--faint)]">
            published reports: {projects.reduce((a, p) => a + p.reportCount, 0)} across all projects
          </p>
        </>
      )}
    </div>
  );
}
