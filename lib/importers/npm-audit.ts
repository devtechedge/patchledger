import { advisorySlug } from "../ids";
import { normalizeSeverity } from "../severity";
import {
  ImportParseError,
  type ImportResult,
  type ImportedFinding,
} from "./types";

interface NpmViaObject {
  source?: unknown;
  name?: unknown;
  title?: unknown;
  url?: unknown;
  severity?: unknown;
  range?: unknown;
  vulnerability?: unknown;
}

interface NpmVulnEntry {
  severity?: unknown;
  isDirect?: unknown;
  via?: unknown;
  range?: unknown;
  fixAvailable?: unknown;
}

const ID_RE = /(GHSA-[a-z0-9-]{8,}|CVE-\d{4}-\d{4,}|OSV-[A-Z0-9-]+|DWA-\d+-[A-Z0-9]+)/i;

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

/** Extract the advisory id npm audit exposes, or derive a stable slug when absent. */
function advisoryIdOf(via: NpmViaObject, fallbackRange: string): string {
  const vuln = str(via.vulnerability);
  if (ID_RE.test(vuln)) return vulvMatch(vuln);
  const url = str(via.url);
  if (ID_RE.test(url)) return vulvMatch(url);
  const title = str(via.title);
  const t = title.match(ID_RE);
  if (t) return t[0];
  return advisorySlug(title, str(via.range) || fallbackRange);
}

function vulvMatch(s: string): string {
  const m = s.match(ID_RE);
  return m ? m[0] : "";
}

/**
 * Parse `npm audit --json` output (auditReportVersion 2). Entries that are
 * pure cascade (via contains only package-name strings) are skipped: the root
 * advisory is already captured on the package that owns it.
 */
export function parseNpmAudit(raw: unknown): ImportResult {
  if (!raw || typeof raw !== "object") {
    throw new ImportParseError("Unrecognized input.");
  }
  const obj = raw as Record<string, unknown>;
  if (typeof obj.error === "object" && obj.error !== null) {
    throw new ImportParseError(
      "npm audit returned an error document. Re-run it with a reachable registry."
    );
  }
  const vulns = obj.vulnerabilities;
  if (!vulns || typeof vulns !== "object" || Array.isArray(vulns)) {
    throw new ImportParseError("This does not look like `npm audit --json` output.");
  }

  const findings: ImportedFinding[] = [];
  const seen = new Set<string>();

  for (const [pkgName, entryRaw] of Object.entries(vulns as Record<string, unknown>)) {
    if (!entryRaw || typeof entryRaw !== "object") continue;
    const entry = entryRaw as NpmVulnEntry;
    const viaList = Array.isArray(entry.via) ? entry.via : [];
    const advisories = viaList.filter(
      (v): v is NpmViaObject => !!v && typeof v === "object"
    );
    if (advisories.length === 0) {
      // pure cascade: the root advisory is captured on the package that owns it
      continue;
    }
    const entryRange = str(entry.range);
    const fix = entry.fixAvailable;
    const fixAvailable =
      typeof fix === "object" && fix !== null
        ? true
        : fix === true;
    const fixVersion =
      typeof fix === "object" && fix !== null ? str((fix as { version?: unknown }).version) : "";
    const fixIsSemverMajor =
      typeof fix === "object" && fix !== null
        ? (fix as { isSemVerMajor?: unknown }).isSemVerMajor === true
        : false;

    for (const via of advisories) {
      const advisoryId = advisoryIdOf(via, entryRange);
      const key = `npm:${pkgName}:${advisoryId}`;
      if (seen.has(key)) continue;
      seen.add(key);
      findings.push({
        ecosystem: "npm",
        packageName: pkgName,
        advisoryId,
        advisoryUrl: str(via.url),
        title: str(via.title) || `Vulnerability in ${pkgName}`,
        severity: normalizeSeverity(
          str(via.severity) || str(entry.severity)
        ),
        // npm audit JSON does not carry the installed version; range only
        installedVersion: "",
        vulnerableRange: str(via.range) || entryRange,
        isDirect: entry.isDirect === true,
        isDev: false,
        fixAvailable,
        fixVersion,
        fixIsSemverMajor,
      });
    }
  }

  const meta =
    obj.metadata && typeof obj.metadata === "object"
      ? (obj.metadata as { vulnerabilities?: Record<string, unknown>; dependencies?: Record<string, unknown> })
      : {};
  const vulnCounts = meta.vulnerabilities ?? {};
  const bySeverity: Record<string, number> = {};
  for (const [k, v] of Object.entries(vulnCounts)) {
    if (typeof v === "number" && k !== "total") {
      bySeverity[normalizeSeverity(k)] = (bySeverity[normalizeSeverity(k)] ?? 0) + v;
    }
  }

  return {
    source: "npm_audit",
    findings,
    stats: {
      total: findings.length,
      bySeverity,
      dependencies:
        typeof meta.dependencies?.total === "number" ? meta.dependencies.total : undefined,
    },
  };
}
