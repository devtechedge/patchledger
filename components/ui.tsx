/* Shared primitives for the "ledger" identity: sharp corners, hairline rules,
   mono uppercase tags. Data text uses the mono font; prose uses Plex Sans. */

const SEVERITY_STYLE: Record<string, string> = {
  critical: "border-[var(--bad)] text-[var(--bad)]",
  high: "border-[var(--warn)] text-[var(--warn)]",
  medium: "border-[var(--med)] text-[var(--med)]",
  low: "border-[var(--low)] text-[var(--low)]",
  unknown: "border-[var(--faint)] text-[var(--faint)]",
};

const STATUS_STYLE: Record<string, string> = {
  open: "border-[var(--bad)] text-[var(--bad)]",
  in_progress: "border-[var(--info)] text-[var(--info)]",
  fixed: "border-[var(--good)] text-[var(--good)]",
  verified: "border-[var(--good)] text-[var(--good)]",
  false_positive: "border-[var(--faint)] text-[var(--faint)]",
  accepted: "border-[var(--note)] text-[var(--note)]",
};

export function SeverityChip({ severity }: { severity: string }) {
  const cls = SEVERITY_STYLE[severity] ?? SEVERITY_STYLE.unknown;
  return (
    <span
      className={`inline-block border px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] ${cls}`}
    >
      {severity}
    </span>
  );
}

export function StatusChip({ status }: { status: string }) {
  const cls = STATUS_STYLE[status] ?? "border-[var(--faint)] text-[var(--faint)]";
  return (
    <span
      className={`inline-block border px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] ${cls}`}
    >
      {status.replace("_", " ")}
    </span>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="border border-dashed border-[var(--border-strong)] bg-transparent px-6 py-10 text-center font-mono text-sm text-[var(--muted)]">
      {children}
    </div>
  );
}

export function Panel({
  title,
  index,
  children,
  right,
}: {
  title: string;
  index?: string;
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <section className="border border-[var(--border)] bg-[var(--surface)]">
      <div className="mb-5 flex items-center justify-between gap-3 border-b border-[var(--border)] px-5 py-3">
        <h2 className="microlabel">
          {index ? `${index} / ` : ""}
          {title}
        </h2>
        {right}
      </div>
      <div className="px-5 pb-5">{children}</div>
    </section>
  );
}

export function Stat({
  label,
  value,
  note,
  tone,
}: {
  label: string;
  value: string;
  note?: string;
  tone?: "bad";
}) {
  return (
    <div className="bg-[var(--surface)] px-5 py-4">
      <p className="microlabel">{label}</p>
      <p
        className="mt-2 font-display text-3xl font-semibold tracking-tight"
        style={tone === "bad" ? { color: "var(--bad)" } : undefined}
      >
        {value}
      </p>
      {note ? <p className="mt-1 font-mono text-xs text-[var(--faint)]">{note}</p> : null}
    </div>
  );
}
