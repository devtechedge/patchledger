import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePageAccount } from "@/lib/auth";
import { NotFoundError, getFinding } from "@/lib/services";
import { daysOpen, isBreached } from "@/lib/sla";
import { SeverityChip, StatusChip } from "@/components/ui";
import { TransitionForms } from "@/components/dashboard-forms";

export const metadata = { title: "Finding - PatchLedger" };

function Record({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border border-[var(--border)] bg-[var(--surface)]">
      <h2 className="border-b border-[var(--border)] px-5 py-3 microlabel">{title}</h2>
      <div className="px-5 py-4 text-sm">{children}</div>
    </section>
  );
}

export default async function FindingPage({
  params,
}: PageProps<"/p/[id]/f/[findingId]">) {
  const { id, findingId } = await params;
  const account = await requirePageAccount();
  let finding;
  try {
    finding = await getFinding(account.id, findingId);
  } catch (e) {
    if (e instanceof NotFoundError) notFound();
    throw e;
  }
  if (finding.project.id !== id) notFound();

  const now = new Date();
  const breached = isBreached(finding, finding.project, now);

  return (
    <div className="grid gap-8">
      <div>
        <Link
          href={`/p/${finding.project.id}`}
          className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--muted)] hover:text-[var(--accent)]"
        >
          &larr; {finding.project.name}
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h1 className="font-display text-2xl font-semibold tracking-tight">{finding.packageName}</h1>
          {finding.installedVersion ? (
            <span className="font-mono text-xs text-[var(--faint)]">@{finding.installedVersion}</span>
          ) : null}
          <SeverityChip severity={finding.severity} />
          <StatusChip status={finding.status} />
          {breached ? (
            <span className="border border-[var(--bad)] px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--bad)]">
              past due - {daysOpen(finding, now)}d open
            </span>
          ) : null}
        </div>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">{finding.title}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="grid gap-5">
          <Record title="Advisory record">
            <dl className="grid grid-cols-[120px_1fr] gap-x-5 gap-y-2.5">
              <dt className="microlabel">id</dt>
              <dd className="font-mono text-xs">
                {finding.advisoryId}
                {finding.advisoryUrl ? (
                  <>
                    {" "}
                    <a href={finding.advisoryUrl} className="underline" style={{ color: "var(--accent)" }}>
                      source
                    </a>
                  </>
                ) : null}
              </dd>
              <dt className="microlabel">ecosystem</dt>
              <dd className="font-mono text-xs">{finding.ecosystem}</dd>
              {finding.installedVersion ? (
                <>
                  <dt className="microlabel">installed</dt>
                  <dd className="font-mono text-xs">{finding.installedVersion}</dd>
                </>
              ) : null}
              {finding.vulnerableRange ? (
                <>
                  <dt className="microlabel">range</dt>
                  <dd className="font-mono text-xs">{finding.vulnerableRange}</dd>
                </>
              ) : null}
              <dt className="microlabel">fix</dt>
              <dd className="text-[var(--muted)]">
                {finding.fixAvailable
                  ? `${finding.fixVersion || "available"}${finding.fixIsSemverMajor ? " (major bump - breaking-change risk)" : ""}`
                  : "none reported by scanner"}
              </dd>
              <dt className="microlabel">first seen</dt>
              <dd className="font-mono text-xs">{finding.firstSeenAt.toISOString().slice(0, 10)}</dd>
              <dt className="microlabel">sources</dt>
              <dd className="font-mono text-xs">
                {finding.firstSource}
                {finding.lastSource !== finding.firstSource ? ` -> ${finding.lastSource}` : ""}
              </dd>
            </dl>
            {finding.statusReason ? (
              <p className="mt-4 border-l-2 border-[var(--border-strong)] bg-[var(--surface-2)] px-3 py-2 font-mono text-xs text-[var(--muted)]">
                {finding.statusReason}
              </p>
            ) : null}
          </Record>

          <Record title="Evidence on file">
            {finding.fixUrl || finding.fixNote || finding.verifyUrl || finding.verifyNote ? (
              <ul className="grid gap-2 text-[var(--muted)]">
                {finding.fixUrl ? (
                  <li>
                    <span className="microlabel mr-2">fix ref</span>
                    <a href={finding.fixUrl} className="underline" style={{ color: "var(--accent)" }}>
                      {finding.fixUrl.slice(0, 80)}
                    </a>
                  </li>
                ) : null}
                {finding.fixNote ? (
                  <li><span className="microlabel mr-2">fix note</span>{finding.fixNote}</li>
                ) : null}
                {finding.fixedInVersion ? (
                  <li><span className="microlabel mr-2">fixed in</span><span className="font-mono text-xs">{finding.fixedInVersion}</span></li>
                ) : null}
                {finding.verifyUrl ? (
                  <li>
                    <span className="microlabel mr-2">verify ({finding.verifyType})</span>
                    <a href={finding.verifyUrl} className="underline" style={{ color: "var(--accent)" }}>
                      {finding.verifyUrl.slice(0, 80)}
                    </a>
                  </li>
                ) : null}
                {finding.verifyNote ? (
                  <li><span className="microlabel mr-2">verify note</span>{finding.verifyNote}</li>
                ) : null}
              </ul>
            ) : (
              <p className="font-mono text-xs text-[var(--faint)]">no evidence recorded yet</p>
            )}
          </Record>

          <Record title="Status history">
            {finding.events.length === 0 ? (
              <p className="font-mono text-xs text-[var(--faint)]">no status changes yet</p>
            ) : (
              <ul className="grid gap-2">
                {finding.events.map((e) => (
                  <li key={e.id} className="font-mono text-xs text-[var(--muted)]">
                    <span className="text-[var(--faint)]">
                      {e.createdAt.toISOString().slice(0, 16).replace("T", " ")}
                    </span>{" "}
                    {e.fromStatus} &rarr; {e.toStatus}
                    {e.kind === "auto_import" ? " (auto)" : ""}
                    {e.note ? ` - ${e.note}` : ""}
                  </li>
                ))}
              </ul>
            )}
          </Record>
        </div>

        <div>
          <h2 className="mb-3 microlabel">Actions</h2>
          <TransitionForms findingId={finding.id} projectId={finding.project.id} status={finding.status} />
        </div>
      </div>
    </div>
  );
}
