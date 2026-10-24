export default function DashLoading() {
  return (
    <div className="flex flex-col gap-8" aria-busy="true" aria-label="Loading">
      <div className="border-b border-[var(--border)] pb-5">
        <div className="h-3 w-40 animate-pulse bg-[var(--surface-2)]" />
        <div className="mt-3 h-7 w-64 animate-pulse bg-[var(--surface-2)]" />
      </div>
      <div className="flex flex-wrap gap-px border border-[var(--border)] bg-[var(--border)]">
        {[0, 1, 2].map((i) => (
          <div key={i} className="min-w-[180px] flex-1 bg-[var(--surface)] px-5 py-4">
            <div className="h-2.5 w-20 animate-pulse bg-[var(--surface-2)]" />
            <div className="mt-3 h-8 w-16 animate-pulse bg-[var(--surface-2)]" />
          </div>
        ))}
      </div>
      <div className="border border-[var(--border)] bg-[var(--surface)]">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="border-b border-[var(--border)] px-4 py-3.5 last:border-b-0">
            <div className="h-4 w-full max-w-md animate-pulse bg-[var(--surface-2)]" />
          </div>
        ))}
      </div>
    </div>
  );
}
