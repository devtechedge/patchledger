import { cvssToSeverity, cvssVectorToScore, normalizeSeverity } from "../severity";
import {
  ImportParseError,
  type ImportResult,
  type ImportedFinding,
} from "./types";

interface OsvVuln {
  id?: unknown;
  summary?: unknown;
  aliases?: unknown;
  severity?: unknown;
  database_specific?: unknown;
  references?: unknown;
  affected?: unknown;
}

const ECOSYSTEMS: Record<string, string> = {
  npm: "npm",
  "crates.io": "crates",
  "Go": "go",
  PyPI: "pypi",
  Maven: "maven",
  Packagist: "packagist",
  "RubyGems": "rubygems",
  "NuGet": "nuget",
  "Pub": "pub",
  "Hex": "hex",
  "ConanCenter": "conan",
};

function normalizeEcosystem(raw: string): string {
  return ECOSYSTEMS[raw] ?? "other";
}

/** Naive semver-ish compare; only used to pick the highest "fixed" version. */
function compareVersion(a: string, b: string): number {
  const pa = a.split(/[.-]/).map((x) => Number(x) || 0);
  const pb = b.split(/[.-]/).map((x) => Number(x) || 0);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d !== 0) return d;
  }
  return 0;
}

function severityOf(vuln: OsvVuln): ReturnType<typeof cvssToSeverity> {
  const dbSpecific = vuln.database_specific as { severity?: unknown } | undefined;
  const fromDb = typeof dbSpecific?.severity === "string" ? dbSpecific.severity : "";
  if (fromDb) return normalizeSeverity(fromDb);
  let best: number | null = null;
  const list = Array.isArray(vuln.severity) ? vuln.severity : [];
  for (const s of list) {
    if (!s || typeof s !== "object") continue;
    const entry = s as { score?: unknown };
    const score = typeof entry.score === "string" ? entry.score : String(entry.score ?? "");
    if (/^\d+(\.\d+)?$/.test(score)) {
      const n = Number(score);
      if (best === null || n > best) best = n;
    } else if (score.startsWith("CVSS")) {
      const n = cvssVectorToScore(score);
      if (n !== null && (best === null || n > best)) best = n;
    }
  }
  return best === null ? "unknown" : cvssToSeverity(best);
}

function fixedVersionOf(vuln: OsvVuln): string {
  let fixed = "";
  const affected = Array.isArray(vuln.affected) ? vuln.affected : [];
  for (const a of affected) {
    if (!a || typeof a !== "object") continue;
    const ranges = Array.isArray((a as { ranges?: unknown }).ranges)
      ? (a as { ranges: { events?: unknown }[] }).ranges
      : [];
    for (const r of ranges) {
      const events = Array.isArray(r?.events) ? r.events : [];
      for (const e of events) {
        if (!e || typeof e !== "object") continue;
        const f = (e as { fixed?: unknown }).fixed;
        if (typeof f === "string" && f && compareVersion(f, fixed) > 0) {
          fixed = f;
        }
      }
    }
  }
  return fixed;
}

/**
 * Parse `osv-scanner --json` output (schema v2, osv-scanner 1.x/2.x). The same
 * advisory can appear through several scanned lockfiles; entries are deduped
 * by (ecosystem, package, advisory id).
 */
export function parseOsvScanner(raw: unknown): ImportResult {
  if (!raw || typeof raw !== "object") {
    throw new ImportParseError("Unrecognized input.");
  }
  const results = (raw as { results?: unknown }).results;
  if (!Array.isArray(results)) {
    throw new ImportParseError("This does not look like osv-scanner JSON output.");
  }

  const findings: ImportedFinding[] = [];
  const seen = new Set<string>();

  for (const result of results) {
    if (!result || typeof result !== "object") continue;
    const packages = Array.isArray((result as { packages?: unknown }).packages)
      ? (result as { packages: unknown[] }).packages
      : [];
    for (const p of packages) {
      if (!p || typeof p !== "object") continue;
      const pkg = (p as { package?: { name?: unknown; ecosystem?: unknown; version?: unknown } }).package;
      const name = typeof pkg?.name === "string" ? pkg.name : "";
      if (!name) continue;
      const ecosystem = normalizeEcosystem(typeof pkg?.ecosystem === "string" ? pkg.ecosystem : "");
      const version = typeof pkg?.version === "string" ? pkg.version : "";
      const vulns = Array.isArray((p as { vulnerabilities?: unknown }).vulnerabilities)
        ? ((p as { vulnerabilities: unknown[] }).vulnerabilities as OsvVuln[])
        : [];
      for (const vuln of vulns) {
        if (!vuln || typeof vuln !== "object") continue;
        const id = typeof vuln.id === "string" && vuln.id ? vuln.id : "";
        if (!id) continue;
        const key = `${ecosystem}:${name}:${id}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const fixed = fixedVersionOf(vuln);
        findings.push({
          ecosystem,
          packageName: name,
          advisoryId: id,
          advisoryUrl: `https://osv.dev/vulnerability/${encodeURIComponent(id)}`,
          title: typeof vuln.summary === "string" ? vuln.summary : `Vulnerability in ${name}`,
          severity: severityOf(vuln),
          installedVersion: version,
          vulnerableRange: "",
          isDirect: false,
          isDev: false,
          fixAvailable: fixed !== "",
          fixVersion: fixed,
          fixIsSemverMajor: false,
        });
      }
    }
  }

  const bySeverity: Record<string, number> = {};
  for (const f of findings) {
    bySeverity[f.severity] = (bySeverity[f.severity] ?? 0) + 1;
  }

  return {
    source: "osv_scanner",
    findings,
    stats: { total: findings.length, bySeverity },
  };
}
