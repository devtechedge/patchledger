const SEVERITY_STYLE: Record<string, string> = {
  critical: "bg-red-100 text-red-800 border-red-200",
  high: "bg-orange-100 text-orange-800 border-orange-200",
  medium: "bg-amber-100 text-amber-800 border-amber-200",
  low: "bg-slate-100 text-slate-700 border-slate-200",
  unknown: "bg-slate-100 text-slate-500 border-slate-200",
};

const STATUS_STYLE: Record<string, string> = {
  open: "bg-red-50 text-red-700 border-red-200",
  in_progress: "bg-blue-50 text-blue-700 border-blue-200",
  fixed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  verified: "bg-emerald-100 text-emerald-900 border-emerald-300",
  false_positive: "bg-slate-50 text-slate-600 border-slate-200",
  accepted: "bg-violet-50 text-violet-700 border-violet-200",
};

export function SeverityChip({ severity }: { severity: string }) {
  const cls = SEVERITY_STYLE[severity] ?? SEVERITY_STYLE.unknown;
  return (
    <span className={`inline-block rounded-full border px-2 py-0.5 text-xs font-semibold ${cls}`}>
      {severity}
    </span>
  );
}

export function StatusChip({ status }: { status: string }) {
  const cls = STATUS_STYLE[status] ?? "bg-slate-50 text-slate-600 border-slate-200";
  return (
    <span className={`inline-block rounded-full border px-2 py-0.5 text-xs font-semibold ${cls}`}>
      {status.replace("_", " ")}
    </span>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-6 py-10 text-center text-sm text-[var(--muted)]">
      {children}
    </div>
  );
}

export function Panel({
  title,
  children,
  right,
}: {
  title: string;
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-semibold">{title}</h2>
        {right}
      </div>
      {children}
    </section>
  );
}
