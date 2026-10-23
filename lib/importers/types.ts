import type { Severity } from "../severity";

/** One advisory-level vulnerability, normalized across scanner formats. */
export interface ImportedFinding {
  ecosystem: string;
  packageName: string;
  advisoryId: string;
  advisoryUrl: string;
  title: string;
  severity: Severity;
  installedVersion: string;
  vulnerableRange: string;
  isDirect: boolean;
  isDev: boolean;
  fixAvailable: boolean;
  fixVersion: string;
  fixIsSemverMajor: boolean;
}

export interface ImportStats {
  total: number;
  bySeverity: Record<string, number>;
  dependencies?: number;
}

export type ImportSource = "npm_audit" | "osv_scanner";

export interface ImportResult {
  source: ImportSource;
  findings: ImportedFinding[];
  stats: ImportStats;
}

export class ImportParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImportParseError";
  }
}
