import Link from "next/link";
import { notFound } from "next/navigation";
import { currentAccount } from "@/lib/auth";
import { NotFoundError, getProject, listFindings, listSnapshots } from "@/lib/services";
import { isBreached, slaSummary } from "@/lib/sla";
import { Empty, Panel, SeverityChip, Stat, StatusChip } from "@/components/ui";

export const metadata = { title: "Project - PatchLedger" };

const STATUS_FILTERS = ["", "open", "in_progress", "fixed", "verified", "false_positive", "accepted"];
const SEVERITY_FILTERS = ["", "critical", "high", "medium", "low", "unknown"];

export default async function ProjectPage({
  params,
  searchParams,
}: PageProps<"/p/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  const account = (await currentAccount())!;

  let project;
  try {
    project = await getProject(account.id, id);
  } catch (e) {
    if (e instanceof NotFoundError) notFound();
    throw e;
  }

  const status = typeof sp.status === "string" && STATUS_FILTERS.includes(sp.status) ? sp.status : undefined;
  const severity =
    typeof sp.severity === "string" && SEVERITY_FILTERS.includes(sp.severity) ? sp.severity : undefined;

  const [findings, snapshots] = await Promise.all([
    listFindings(account.id, project.id, { status, severity }),
    listSnapshots(account.id, project.id),
  ]);
  const allFindings = await listFindings(account.id, project.id);
  const now = new Date();
  const sla = slaSummary(allFindings, project, now);
  const openNow = allFindings.filter((f) => f.status === "open" || f.status === "in_progress").length;

  const qs = (next: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const merged = { status, severity, ...next };
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v);
    const s = p.toString();
    return s ? `/p/${project.id}?${s}` : `/p/${project.id}`;
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[var(--border)] pb-5">
        <div>
          <p className="microlabel">
            Project{project.clientName ? ` / ${project.clientName}` : ""}
            {project.stack ? ` / ${project.stack}` : ""}
          </p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight">{project.name}</h1>
          <p className="mt-1 font-mono text-xs text-[var(--faint)]">
            sla targets: critical {project.slaCriticalDays}d - high {project.slaHighDays}d - medium {project.slaMediumDays}d
          </p>
        </div>
        <nav className="flex flex-wrap gap-3 font-mono text-xs font-semibold uppercase tracking-[0.16em]">
          <Link
            href={`/p/${project.id}/import`}
            className="bg-[var(--accent)] px-4 py-2 text-[var(--accent-ink)] hover:brightness-110"
          >
            Import scan
          </Link>
          <Link
            href={`/p/${project.id}/reports`}
            className="border border-[var(--border-strong)] px-4 py-2 text-[var(--ink)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            Reports
          </Link>
          <Link
            href={`/p/${project.id}/settings`}
            className="border border-[var(--border-strong)] px-4 py-2 text-[var(--ink)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            Settings
          </Link>
        </nav>
      </div>

      <div className="flex flex-wrap gap-px border border-[var(--border)] bg-[var(--border)]">
        <div className="min-w-[180px] flex-1">
          <Stat label="Open now" value={String(openNow)} />
        </div>
        <div className="min-w-[180px] flex-1">
          <Stat
            label="SLA compliance"
            value={sla.compliancePct === null ? "-" : `${sla.compliancePct}%`}
            note={sla.breached > 0 ? `${sla.breached} past due` : "none past due"}
            tone={sla.breached > 0 ? "bad" : undefined}
          />
        </div>
        <div className="min-w-[220px] flex-1">
          <Stat
            label="Last import"
            value={snapshots[0] ? snapshots[0].source.replace("_", " ") : "-"}
            note={
              snapshots[0]
                ? `${snapshots[0].importedAt.toISOString().slice(0, 10)} - ${snapshots[0].findingCount} advisories`
                : "no imports yet"
            }
          />
        </div>
      </div>

      <Panel title="Findings" index="R">
        <div className="mb-5 flex flex-wrap gap-2">
          {STATUS_FILTERS.map((s) => {
            const active = status === s || (!status && !s);
            return (
              <Link
                key={s || "all"}
                href={qs({ status: s || undefined })}
                className={`border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] ${active ? "border-[var(--accent)] text-[var(--accent)]" : "border-[var(--border)] text-[var(--faint)] hover:text-[var(--ink)]"}`}
              >
                {s ? s.replace("_", " ") : "all"}
              </Link>
            );
          })}
          <span className="mx-1 border-l border-[var(--border)]" />
          {SEVERITY_FILTERS.map((s) => {
            const active = severity === s || (!severity && !s);
            return (
              <Link
                key={s || "allsev"}
                href={qs({ severity: s || undefined })}
                className={`border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] ${active ? "border-[var(--accent)] text-[var(--accent)]" : "border-[var(--border)] text-[var(--faint)] hover:text-[var(--ink)]"}`}
              >
                {s ? s : "sev: any"}
              </Link>
            );
          })}
        </div>

        {findings.length === 0 ? (
          <Empty>
            Nothing here. Import scanner output to start tracking, or adjust the filters.
          </Empty>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[680px]">
              <div className="grid grid-cols-[1.6fr_1fr_auto_auto_auto] items-center gap-x-4 border-b border-[var(--border)] pb-2">
                <span className="microlabel">advisory</span>
                <span className="microlabel">package</span>
                <span className="microlabel text-right">sev</span>
                <span className="microlabel text-right">state</span>
                <span className="microlabel text-right">id</span>
              </div>
              {findings.map((f) => (
                <Link
                  key={f.id}
                  href={`/p/${project.id}/f/${f.id}`}
                  className="grid grid-cols-[1.6fr_1fr_auto_auto_auto] items-center gap-x-4 border-b border-[var(--border)] py-2.5 last:border-b-0 hover:bg-[var(--surface-2)]"
                >
                  <span className="truncate text-sm">{f.title}</span>
                  <span className="truncate font-mono text-xs text-[var(--muted)]">
                    {f.packageName}
                    {f.installedVersion ? `@${f.installedVersion}` : ""}
                  </span>
                  <span className="text-right">
                    <SeverityChip severity={f.severity} />
                  </span>
                  <span className="flex items-center justify-end gap-2">
                    {isBreached(f, project, now) ? (
                      <span className="border border-[var(--bad)] px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--bad)]">
                        past due
                      </span>
                    ) : null}
                    <StatusChip status={f.status} />
                  </span>
                  <span className="text-right font-mono text-[10px] text-[var(--faint)]">{f.advisoryId}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </Panel>

      <Panel title="Import history" index="LOG">
        {snapshots.length === 0 ? (
          <Empty>No imports yet.</Empty>
        ) : (
          <ul className="grid">
            {snapshots.map((s) => (
              <li
                key={s.id}
                className="flex justify-between gap-3 border-b border-[var(--border)] py-2 font-mono text-xs text-[var(--muted)] last:border-b-0"
              >
                <span>
                  {s.importedAt.toISOString().slice(0, 16).replace("T", " ")} - {s.source}
                  {s.label ? ` (${s.label})` : ""}
                </span>
                <span>{s.findingCount} advisories</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
