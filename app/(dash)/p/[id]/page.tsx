import Link from "next/link";
import { notFound } from "next/navigation";
import { currentAccount } from "@/lib/auth";
import { NotFoundError, getProject, listFindings, listSnapshots } from "@/lib/services";
import { isBreached, slaSummary } from "@/lib/sla";
import { Empty, Panel, SeverityChip, StatusChip } from "@/components/ui";

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

  const qs = (next: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const merged = { status, severity, ...next };
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v);
    const s = p.toString();
    return s ? `/p/${project.id}?${s}` : `/p/${project.id}`;
  };

  return (
    <div className="grid gap-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {project.clientName ? `Client: ${project.clientName}. ` : ""}
            {project.stack ? `Stack: ${project.stack}. ` : ""}
            SLA {project.slaCriticalDays}d/{project.slaHighDays}d/{project.slaMediumDays}d.
          </p>
        </div>
        <nav className="flex flex-wrap gap-2 text-sm">
          <Link
            href={`/p/${project.id}/import`}
            className="rounded-lg px-3 py-1.5 font-semibold text-white"
            style={{ background: "var(--accent)" }}
          >
            Import scan
          </Link>
          <Link href={`/p/${project.id}/reports`} className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 font-semibold">
            Reports
          </Link>
          <Link href={`/p/${project.id}/settings`} className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 font-semibold">
            Settings
          </Link>
        </nav>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <p className="text-xs uppercase tracking-wide text-[var(--faint)]">Open now</p>
          <p className="mt-1 text-3xl font-bold">
            {allFindings.filter((f) => f.status === "open" || f.status === "in_progress").length}
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <p className="text-xs uppercase tracking-wide text-[var(--faint)]">SLA compliance</p>
          <p className="mt-1 text-3xl font-bold">
            {sla.compliancePct === null ? "-" : `${sla.compliancePct}%`}
          </p>
          {sla.breached > 0 ? (
            <p className="text-xs" style={{ color: "var(--bad)" }}>{sla.breached} past due</p>
          ) : null}
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <p className="text-xs uppercase tracking-wide text-[var(--faint)]">Last import</p>
          <p className="mt-1 text-sm">
            {snapshots[0]
              ? `${snapshots[0].source} - ${snapshots[0].importedAt.toISOString().slice(0, 10)} (${snapshots[0].findingCount} advisories)`
              : "none yet"}
          </p>
        </div>
      </div>

      <Panel title="Findings">
        <div className="mb-4 flex flex-wrap gap-2 text-xs">
          {STATUS_FILTERS.map((s) => (
            <Link
              key={s || "all"}
              href={qs({ status: s || undefined })}
              className={`rounded-full border px-3 py-1 ${status === s || (!status && !s) ? "border-[var(--accent)] font-semibold" : "border-[var(--border)]"}`}
              style={{ background: status === s || (!status && !s) ? "var(--surface-2)" : "transparent" }}
            >
              {s ? s.replace("_", " ") : "all statuses"}
            </Link>
          ))}
          {SEVERITY_FILTERS.map((s) => (
            <Link
              key={s || "allsev"}
              href={qs({ severity: s || undefined })}
              className={`rounded-full border px-3 py-1 ${severity === s || (!severity && !s) ? "border-[var(--accent)] font-semibold" : "border-[var(--border)]"}`}
              style={{ background: severity === s || (!severity && !s) ? "var(--surface-2)" : "transparent" }}
            >
              {s ? s : "all severities"}
            </Link>
          ))}
        </div>

        {findings.length === 0 ? (
          <Empty>
            Nothing here. Import scanner output to start tracking, or adjust the filters.
          </Empty>
        ) : (
          <ul className="grid gap-2">
            {findings.map((f) => (
              <li key={f.id}>
                <Link
                  href={`/p/${project.id}/f/${f.id}`}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-sm hover:border-[var(--accent)]"
                >
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{f.packageName}</span>
                    {f.installedVersion ? (
                      <span className="font-mono text-xs text-[var(--faint)]">@{f.installedVersion}</span>
                    ) : null}
                    <SeverityChip severity={f.severity} />
                    <StatusChip status={f.status} />
                    {isBreached(f, project, now) ? (
                      <span className="rounded-full border px-2 py-0.5 text-xs font-semibold"
                        style={{ borderColor: "var(--bad)", color: "var(--bad)" }}>
                        SLA past due
                      </span>
                    ) : null}
                    {f.fixAvailable && (f.status === "open" || f.status === "in_progress") ? (
                      <span className="text-xs text-[var(--faint)]">
                        fix: {f.fixVersion || "available"}
                        {f.fixIsSemverMajor ? " (major bump)" : ""}
                      </span>
                    ) : null}
                  </span>
                  <span className="font-mono text-xs text-[var(--faint)]">{f.advisoryId}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="Import history">
        {snapshots.length === 0 ? (
          <Empty>No imports yet.</Empty>
        ) : (
          <ul className="grid gap-1 text-sm text-[var(--muted)]">
            {snapshots.map((s) => (
              <li key={s.id} className="flex justify-between gap-3">
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
