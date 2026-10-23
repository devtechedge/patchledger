import Link from "next/link";
import { notFound } from "next/navigation";
import { currentAccount } from "@/lib/auth";
import { NotFoundError, getFinding } from "@/lib/services";
import { daysOpen, isBreached } from "@/lib/sla";
import { SeverityChip, StatusChip } from "@/components/ui";
import { TransitionForms } from "@/components/dashboard-forms";

export const metadata = { title: "Finding - PatchLedger" };

export default async function FindingPage({
  params,
}: PageProps<"/p/[id]/f/[findingId]">) {
  const { id, findingId } = await params;
  const account = (await currentAccount())!;
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
          className="text-sm text-[var(--muted)] hover:text-[var(--ink)]"
        >
          &larr; {finding.project.name}
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight">{finding.packageName}</h1>
          <SeverityChip severity={finding.severity} />
          <StatusChip status={finding.status} />
          {breached ? (
            <span
              className="rounded-full border px-2 py-0.5 text-xs font-semibold"
              style={{ borderColor: "var(--bad)", color: "var(--bad)" }}
            >
              SLA past due ({daysOpen(finding, now)} days open)
            </span>
          ) : null}
        </div>
        <p className="mt-1 max-w-2xl text-sm text-[var(--muted)]">{finding.title}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="grid gap-4">
          <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 text-sm">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--faint)]">
              Advisory
            </h2>
            <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2">
              <dt className="text-[var(--faint)]">Advisory</dt>
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
              <dt className="text-[var(--faint)]">Ecosystem</dt>
              <dd>{finding.ecosystem}</dd>
              {finding.installedVersion ? (
                <>
                  <dt className="text-[var(--faint)]">Installed</dt>
                  <dd className="font-mono text-xs">{finding.installedVersion}</dd>
                </>
              ) : null}
              {finding.vulnerableRange ? (
                <>
                  <dt className="text-[var(--faint)]">Range</dt>
                  <dd className="font-mono text-xs">{finding.vulnerableRange}</dd>
                </>
              ) : null}
              <dt className="text-[var(--faint)]">Fix</dt>
              <dd>
                {finding.fixAvailable
                  ? `${finding.fixVersion || "available"}${finding.fixIsSemverMajor ? " (major bump - breaking-change risk)" : ""}`
                  : "none reported by scanner"}
              </dd>
              <dt className="text-[var(--faint)]">First seen</dt>
              <dd>{finding.firstSeenAt.toISOString().slice(0, 10)}</dd>
              <dt className="text-[var(--faint)]">Sources</dt>
              <dd>
                {finding.firstSource}
                {finding.lastSource !== finding.firstSource ? ` -> ${finding.lastSource}` : ""}
              </dd>
            </dl>
            {finding.statusReason ? (
              <p className="mt-4 rounded-lg bg-[var(--surface-2)] p-3 text-xs text-[var(--muted)]">
                {finding.statusReason}
              </p>
            ) : null}
          </section>

          <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 text-sm">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--faint)]">
              Recorded evidence
            </h2>
            {finding.fixUrl || finding.fixNote || finding.verifyUrl || finding.verifyNote ? (
              <ul className="grid gap-2 text-[var(--muted)]">
                {finding.fixUrl ? (
                  <li>
                    Fix reference:{" "}
                    <a href={finding.fixUrl} className="underline" style={{ color: "var(--accent)" }}>
                      {finding.fixUrl.slice(0, 80)}
                    </a>
                  </li>
                ) : null}
                {finding.fixNote ? <li>Fix note: {finding.fixNote}</li> : null}
                {finding.fixedInVersion ? <li>Fixed in: {finding.fixedInVersion}</li> : null}
                {finding.verifyUrl ? (
                  <li>
                    Verification ({finding.verifyType}):{" "}
                    <a href={finding.verifyUrl} className="underline" style={{ color: "var(--accent)" }}>
                      {finding.verifyUrl.slice(0, 80)}
                    </a>
                  </li>
                ) : null}
                {finding.verifyNote ? <li>Verification note: {finding.verifyNote}</li> : null}
              </ul>
            ) : (
              <p className="text-[var(--muted)]">No evidence recorded yet.</p>
            )}
          </section>

          <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 text-sm">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--faint)]">
              History
            </h2>
            {finding.events.length === 0 ? (
              <p className="text-[var(--muted)]">No status changes yet.</p>
            ) : (
              <ul className="grid gap-2">
                {finding.events.map((e) => (
                  <li key={e.id} className="text-xs text-[var(--muted)]">
                    <span className="font-mono">{e.createdAt.toISOString().slice(0, 16).replace("T", " ")}</span>{" "}
                    {e.fromStatus} &rarr; {e.toStatus}
                    {e.kind === "auto_import" ? " (auto)" : ""}
                    {e.note ? ` - ${e.note}` : ""}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--faint)]">
            Actions
          </h2>
          <TransitionForms findingId={finding.id} projectId={finding.project.id} status={finding.status} />
        </div>
      </div>
    </div>
  );
}
