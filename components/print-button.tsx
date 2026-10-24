"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="no-print border border-[var(--border-strong)] px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ink)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
    >
      Print / Save as PDF
    </button>
  );
}
