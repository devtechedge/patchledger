import { parseNpmAudit } from "./npm-audit";
import { parseOsvScanner } from "./osv-scanner";
import { ImportParseError, type ImportResult } from "./types";

/**
 * Detect which scanner produced the pasted JSON and parse it. Deterministic:
 * shape sniffing only, no heuristics beyond "does it match the known schema".
 */
export function parseScannerJson(raw: unknown): ImportResult {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const obj = raw as Record<string, unknown>;
    if (obj.vulnerabilities && typeof obj.vulnerabilities === "object") {
      return parseNpmAudit(raw);
    }
    if (Array.isArray(obj.results)) {
      return parseOsvScanner(raw);
    }
  }
  throw new ImportParseError(
    "Unrecognized scanner format. Paste `npm audit --json` or `osv-scanner --json` output."
  );
}

export { ImportParseError };
