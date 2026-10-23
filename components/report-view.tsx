import type { ReportSummary } from "@/lib/report";

export interface ReportBranding {
  agencyName: string;
  contactEmail: string;
  accentColor: string;
  clientName: string;
  projectName: string;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--faint)]">
        {title}
      </h2>
      {children}
    </section>
  );
}

function FindingRows({
  items,
  empty,
}: {
  items: ReportSummary["fixedSince"];
  empty: string;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-[var(--muted)]">{empty}</p>;
  }
  return (
    <ul className="grid gap-2">
      {items.map((f) => (
        <li
          key={`${f.ecosystem}-${f.package}-${f.advisoryId}`}
          className="rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-sm"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold">{f.package}</span>
            <span
              className="inline-block rounded-full border px-2 py-0.5 text-xs font-semibold"
              data-severity={f.severity}
              style={{
                borderColor: "var(--border)",
                color:
                  f.severity === "critical"
                    ? "var(--bad)"
                    : f.severity === "high"
                      ? "var(--warn)"
                      : "var(--muted)",
              }}
            >
              {f.severity}
            </span>
            <span className="font-mono text-xs text-[var(--faint)]">{f.advisoryId}</span>
          </div>
          <p className="mt-1 text-[var(--muted)]">{f.title}</p>
          <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--faint)]">
            {f.fixedInVersion ? <span>fixed in {f.fixedInVersion}</span> : null}
            {f.fixUrl ? (
              <a href={f.fixUrl} className="underline" style={{ color: "var(--accent)" }}>
                fix reference
              </a>
            ) : null}
            {f.verifyUrl ? (
              <a href={f.verifyUrl} className="underline" style={{ color: "var(--accent)" }}>
                verification run ({f.verifyType ?? "evidence"})
              </a>
            ) : null}
            {f.verifyType && !f.verifyUrl ? <span>verified via {f.verifyType}</span> : null}
            {f.resolvedAt ? <span>resolved {f.resolvedAt.slice(0, 10)}</span> : null}
          </p>
        </li>
      ))}
    </ul>
  );
}

const SOURCE_LABEL: Record<string, string> = {
  npm_audit: "npm audit",
  osv_scanner: "osv-scanner",
};

/**
 * Renders the frozen report summary. Used by the public share page; the
 * summary passed in was fixed at generation time and never recomputed.
 */
export function ReportView({
  branding,
  summary,
  agencyNote,
  title,
  periodLabel,
}: {
  branding: ReportBranding;
  summary: ReportSummary;
  agencyNote: string;
  title: string;
  periodLabel: string;
}) {
  const accent = /^#[0-9a-fA-F]{6}$/.test(branding.accentColor)
    ? branding.accentColor
    : "#2563eb";
  const openCounts = Object.entries(summary.counts.bySeverity).filter(
    ([, n]) => n > 0
  );

  return (
    <article className="mx-auto grid max-w-3xl gap-6 px-6 py-10">
      <header
        className="rounded-2xl border p-8"
        style={{ borderColor: accent, background: "var(--surface)" }}
      >
        <p className="text-sm font-semibold uppercase tracking-wide" style={{ color: accent }}>
          {branding.agencyName || "Maintenance report"}
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">{title}</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          {periodLabel}
          {branding.clientName ? ` - prepared for ${branding.clientName}` : ""}
          {` - project: ${summary.project.name}`}
        </p>
        {summary.latestImport ? (
          <p className="mt-3 text-xs text-[var(--faint)]">
            Latest import: {SOURCE_LABEL[summary.latestImport.source] ?? summary.latestImport.source},{" "}
            {summary.latestImport.importedAt.slice(0, 10)} ({summary.latestImport.findingCount} advisories
            reported at import time).
          </p>
        ) : null}
      </header>

      <Section title="Open findings at a glance">
        {openCounts.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">
            No open advisories from the latest import. This reflects the imported scanner output, not a
            security guarantee.
          </p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {openCounts.map(([sev, n]) => (
              <div
                key={sev}
                className="rounded-xl border border-[var(--border)] bg-[var(--bg)] px-5 py-3 text-center"
              >
                <div className="text-2xl font-bold">{n}</div>
                <div className="text-xs uppercase tracking-wide text-[var(--faint)]">{sev}</div>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title={`SLA compliance (critical ${summary.sla.criticalDays}d / high ${summary.sla.highDays}d / medium ${summary.sla.mediumDays}d)`}>
        {summary.sla.tracked === 0 ? (
          <p className="text-sm text-[var(--muted)]">
            No SLA-tracked open findings right now.
          </p>
        ) : (
          <>
            <p className="text-sm">
              <span className="text-2xl font-bold">{summary.sla.compliancePct}%</span>{" "}
              of open SLA-tracked findings are inside their target window ({summary.sla.within} of{" "}
              {summary.sla.tracked}; {summary.sla.breached} past due).
            </p>
            {summary.breachedOpen.length > 0 ? (
              <div className="mt-3">
                <p className="mb-2 text-sm font-semibold">Past due:</p>
                <FindingRows items={summary.breachedOpen} empty="" />
              </div>
            ) : null}
          </>
        )}
      </Section>

      <Section title="Fixed in this period (with recorded evidence)">
        <FindingRows
          items={summary.fixedSince}
          empty="Nothing was recorded as fixed in this period."
        />
      </Section>

      <Section title="Verified with a passing run">
        <FindingRows
          items={summary.verifiedSince}
          empty="No fixes carry verification evidence in this period."
        />
      </Section>

      <Section title="Newly reported in this period">
        <FindingRows items={summary.newSince} empty="No new advisories appeared in this period." />
      </Section>

      {summary.oldestOpen.length > 0 ? (
        <Section title="Longest-standing open items">
          <ul className="grid gap-1 text-sm text-[var(--muted)]">
            {summary.oldestOpen.map((f) => (
              <li key={`${f.ecosystem}-${f.package}-${f.advisoryId}`}>
                {f.package} ({f.severity}) - open for {f.daysOpen} day{f.daysOpen === 1 ? "" : "s"}
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {agencyNote ? (
        <Section title="Note from us">
          <p className="whitespace-pre-line text-sm text-[var(--muted)]">{agencyNote}</p>
        </Section>
      ) : null}

      <footer className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-6">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[var(--faint)]">
          Scope and limitations
        </h2>
        <p className="text-xs leading-5 text-[var(--muted)]">{summary.limitations}</p>
        <p className="mt-4 text-xs text-[var(--faint)]">
          Generated {summary.generatedAt.slice(0, 10)} by PatchLedger.
          {branding.contactEmail ? ` Questions: ${branding.contactEmail}` : ""}
        </p>
      </footer>
    </article>
  );
}
