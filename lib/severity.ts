export type Severity = "critical" | "high" | "medium" | "low" | "unknown";

export const SEVERITY_ORDER: Record<Severity, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
  unknown: 0,
};

export function isSeverity(s: string): s is Severity {
  return s in SEVERITY_ORDER;
}

/** npm audit uses "moderate" where PatchLedger stores "medium". */
export function normalizeSeverity(raw: string | undefined | null): Severity {
  switch ((raw ?? "").trim().toLowerCase()) {
    case "critical":
      return "critical";
    case "high":
      return "high";
    case "moderate":
    case "medium":
      return "medium";
    case "low":
    case "info":
    case "informational":
      return "low";
    default:
      return "unknown";
  }
}

/** CVSS 3.x/4.0 numeric score to a band (>=9 critical, >=7 high, >=4 medium, else low). */
export function cvssToSeverity(score: number): Severity {
  if (!Number.isFinite(score)) return "unknown";
  if (score >= 9) return "critical";
  if (score >= 7) return "high";
  if (score >= 4) return "medium";
  return "low";
}

/** Best-effort CVSS 3.x vector string to numeric score (spec weights). Returns null for non-CVSS-3 input. */
export function cvssVectorToScore(vector: string | undefined): number | null {
  if (!vector) return null;
  const m = /^CVSS:3\.[01]\/(.+)$/.exec(vector.trim());
  if (!m) return null;
  const metric: Record<string, string> = {};
  for (const p of m[1].split("/")) {
    const idx = p.indexOf(":");
    if (idx > 0) metric[p.slice(0, idx)] = p.slice(idx + 1);
  }
  const AV: Record<string, number> = { N: 0.85, A: 0.62, L: 0.55, P: 0.2 };
  const AC: Record<string, number> = { L: 0.77, H: 0.44 };
  const PRu: Record<string, number> = { N: 0.85, L: 0.62, H: 0.27 };
  const PRc: Record<string, number> = { N: 0.85, L: 0.68, H: 0.5 };
  const UI: Record<string, number> = { N: 0.85, R: 0.62 };
  const CIA: Record<string, number> = { H: 0.56, L: 0.22, N: 0 };
  const scopeChanged = metric["S"] === "C";
  const av = AV[metric["AV"] ?? ""];
  const ac = AC[metric["AC"] ?? ""];
  const pr = (scopeChanged ? PRc : PRu)[metric["PR"] ?? ""];
  const ui = UI[metric["UI"] ?? ""];
  const c = CIA[metric["C"] ?? ""] ?? 0;
  const i = CIA[metric["I"] ?? ""] ?? 0;
  const a = CIA[metric["A"] ?? ""] ?? 0;
  if (av === undefined || ac === undefined || pr === undefined || ui === undefined) {
    return null;
  }
  const iss = 1 - (1 - c) * (1 - i) * (1 - a);
  const impact = scopeChanged
    ? 7.52 * (iss - 0.029) - 3.25 * Math.pow(iss - 0.02, 15)
    : 6.42 * iss;
  const exploitability = 8.22 * av * ac * pr * ui;
  if (impact <= 0) return 0;
  const score = scopeChanged
    ? Math.min(1.08 * (impact + exploitability), 10)
    : Math.min(impact + exploitability, 10);
  return Math.round(score * 10) / 10;
}
