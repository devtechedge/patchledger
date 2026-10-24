import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { parseNpmAudit } from "../lib/importers/npm-audit";
import { parseOsvScanner } from "../lib/importers/osv-scanner";
import { parseScannerJson } from "../lib/importers/detect";
import { ImportParseError } from "../lib/importers/types";

const fixture = (name: string) =>
  JSON.parse(readFileSync(path.join(import.meta.dirname, "fixtures", name), "utf8"));

describe("npm audit parser", () => {
  const base = {
    via: [
      {
        source: 1234,
        name: "underscore",
        title: "Arbitrary Code Execution in underscore",
        url: "https://github.com/advisories/GHSA-cf4h-3j7x-mhff",
        severity: "high",
        range: "<=1.12.0",
        vulnerability: "GHSA-cf4h-3j7x-mhff",
      },
    ],
    range: "<=1.12.0",
    nodes: ["node_modules/underscore"],
  };

  it("extracts the advisory id from the vulnerability field", () => {
    const r = parseNpmAudit({
      vulnerabilities: { underscore: { ...base, severity: "high", isDirect: true, fixAvailable: true } },
    });
    expect(r.source).toBe("npm_audit");
    expect(r.findings).toHaveLength(1);
    expect(r.findings[0].advisoryId).toBe("GHSA-cf4h-3j7x-mhff");
    expect(r.findings[0].severity).toBe("high");
    expect(r.findings[0].isDirect).toBe(true);
    expect(r.findings[0].fixAvailable).toBe(true);
    expect(r.findings[0].fixVersion).toBe("");
  });

  it("falls back to the advisory URL when the vulnerability field is missing", () => {
    const via = { ...base.via[0] } as Record<string, unknown>;
    delete via.vulnerability;
    const r = parseNpmAudit({
      vulnerabilities: { underscore: { ...base, via: [via] } },
    });
    expect(r.findings[0].advisoryId).toBe("GHSA-cf4h-3j7x-mhff");
  });

  it("skips pure-cascade entries (string-only via)", () => {
    const r = parseNpmAudit({
      vulnerabilities: {
        underscore: { ...base },
        cascader: { severity: "high", isDirect: false, via: ["underscore"], range: "*", nodes: [] },
      },
    });
    expect(r.findings).toHaveLength(1);
    expect(r.findings[0].packageName).toBe("underscore");
  });

  it("reads fixAvailable objects including semver-major risk", () => {
    const r = parseNpmAudit({
      vulnerabilities: {
        next: {
          severity: "high",
          isDirect: true,
          via: [{ ...base.via[0], vulnerability: "GHSA-abc1-23de-45fg" }],
          fixAvailable: { name: "next", version: "15.0.0", isSemVerMajor: true },
        },
      },
    });
    expect(r.findings[0].fixVersion).toBe("15.0.0");
    expect(r.findings[0].fixIsSemverMajor).toBe(true);
  });

  it("maps moderate to medium and aggregates metadata counts", () => {
    const r = parseNpmAudit({
      vulnerabilities: {
        axios: {
          severity: "moderate",
          isDirect: true,
          via: [{ ...base.via[0], vulnerability: "GHSA-wf5p-g6vw-rhxx", severity: "moderate" }],
          fixAvailable: false,
        },
      },
      metadata: {
        vulnerabilities: { info: 1, low: 1, moderate: 1, high: 1, critical: 1, total: 5 },
        dependencies: { total: 42 },
      },
    });
    expect(r.findings[0].severity).toBe("medium");
    expect(r.stats.bySeverity["medium"]).toBe(1);
    expect(r.stats.bySeverity["low"]).toBe(2); // info + low
    expect(r.stats.dependencies).toBe(42);
  });

  it("rejects error documents and non-audit shapes", () => {
    expect(() => parseNpmAudit({ error: { code: "ENOTFOUND" } })).toThrow(ImportParseError);
    expect(() => parseNpmAudit({ results: [] })).toThrow(ImportParseError);
    expect(() => parseNpmAudit([1, 2, 3])).toThrow(ImportParseError);
  });

  it("parses a trimmed real npm audit v2 output end to end", () => {
    const r = parseNpmAudit(fixture("npm-audit-fixture.json"));
    // cascade-only entry ("cascaded" -> via ["got"]) is skipped; the two
    // advisory-bearing entries produce exactly two findings
    expect(r.findings).toHaveLength(2);
    const minimist = r.findings.find((f) => f.packageName === "minimist")!;
    expect(minimist.advisoryId).toBe("GHSA-vh95-rmgr-6w4m");
    expect(minimist.severity).toBe("critical");
    expect(minimist.fixAvailable).toBe(true);
    expect(minimist.fixVersion).toBe("");
    const got = r.findings.find((f) => f.packageName === "got")!;
    // the via entry says moderate but the entry says high; via wins
    expect(got.severity).toBe("medium");
    expect(got.fixIsSemverMajor).toBe(true);
    expect(got.fixVersion).toBe("12.0.0");
    expect(r.stats.dependencies).toBe(15);
    expect(r.findings.some((f) => f.packageName === "cascaded")).toBe(false);
  });

  it("pins advisory id casing: ids pass through exactly as the scanner reported them", () => {
    const r = parseNpmAudit({
      vulnerabilities: {
        x: {
          severity: "high",
          isDirect: true,
          via: [{ title: "t", range: "<1", vulnerability: "ghsa-lowercase-1234" }],
        },
      },
    });
    expect(r.findings[0].advisoryId).toBe("ghsa-lowercase-1234");
  });
});

describe("osv-scanner parser", () => {
  const osvResult = (path: string, vulns: unknown[], pkg = { name: "axios", ecosystem: "npm", version: "1.0.0" }) => ({
    source: { type: "lockfile", path },
    packages: [{ package: pkg, vulnerabilities: vulns }],
  });

  it("parses v2 results with database_specific severity", () => {
    const r = parseOsvScanner({
      results: [
        osvResult("/app/package-lock.json", [
          {
            id: "GHSA-wf5p-g6vw-rhxx",
            summary: "SSRF in axios",
            database_specific: { severity: "HIGH" },
          },
        ]),
      ],
    });
    expect(r.source).toBe("osv_scanner");
    expect(r.findings).toHaveLength(1);
    expect(r.findings[0].severity).toBe("high");
    expect(r.findings[0].installedVersion).toBe("1.0.0");
    expect(r.findings[0].advisoryUrl).toContain("osv.dev");
  });

  it("derives severity from a CVSS vector string when database_specific is absent", () => {
    const r = parseOsvScanner({
      results: [
        osvResult("/a", [
          {
            id: "CVE-2026-1234",
            summary: "RCE",
            severity: [{ type: "CVSS_V3", score: "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H" }],
          },
        ]),
      ],
    });
    expect(r.findings[0].severity).toBe("critical");
  });

  it("extracts the highest fixed version from range events", () => {
    const r = parseOsvScanner({
      results: [
        osvResult("/a", [
          {
            id: "GHSA-x",
            affected: [
              {
                package: { name: "axios", ecosystem: "npm" },
                ranges: [
                  { type: "SEMVER", events: [{ introduced: "0" }, { fixed: "1.6.0" }] },
                  { type: "SEMVER", events: [{ introduced: "1.7.0" }, { fixed: "1.8.2" }] },
                ],
              },
            ],
          },
        ]),
      ],
    });
    expect(r.findings[0].fixAvailable).toBe(true);
    expect(r.findings[0].fixVersion).toBe("1.8.2");
  });

  it("dedupes the same advisory reported through two lockfiles", () => {
    const vuln = [{ id: "GHSA-dup", summary: "x" }];
    const r = parseOsvScanner({
      results: [osvResult("/a/package-lock.json", vuln), osvResult("/b/package-lock.json", vuln)],
    });
    expect(r.findings).toHaveLength(1);
  });

  it("normalizes ecosystems (PyPI -> pypi, crates.io -> crates)", () => {
    const r = parseOsvScanner({
      results: [
        osvResult("/a", [{ id: "PYSEC-1" }], { name: "requests", ecosystem: "PyPI", version: "2.0" }),
        osvResult("/b", [{ id: "RUSTSEC-1" }], { name: "serde", ecosystem: "crates.io", version: "1.0" }),
      ],
    });
    expect(r.findings.map((f) => f.ecosystem).sort()).toEqual(["crates", "pypi"]);
  });

  it("parses a trimmed real osv-scanner v2 output: dedupe, CVSS numeric-free vector, missing version, unfixed advisory", () => {
    const r = parseOsvScanner(fixture("osv-scanner-fixture.json"));
    // axios reported through two lockfiles dedupes to one finding
    const axios = r.findings.filter((f) => f.packageName === "axios");
    expect(axios).toHaveLength(1);
    expect(axios[0].installedVersion).toBe("1.6.1");
    // AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:N/A:N scores 7.5 -> high
    expect(axios[0].severity).toBe("high");
    expect(axios[0].fixVersion).toBe("1.8.2");
    const nofix = r.findings.find((f) => f.packageName === "nofix")!;
    expect(nofix.fixAvailable).toBe(false);
    const py = r.findings.find((f) => f.ecosystem === "pypi")!;
    expect(py.advisoryId).toBe("PYSEC-2024-01");
  });

  it("accepts a numeric CVSS score in the severity array", () => {
    const r = parseOsvScanner({
      results: [
        osvResult("/a", [
          {
            id: "CVE-2026-9999",
            severity: [{ type: "CVSS_V3", score: 9.8 }],
          },
        ]),
      ],
    });
    expect(r.findings[0].severity).toBe("critical");
  });

  it("handles a package entry with no version at all", () => {
    const r = parseOsvScanner({
      results: [osvResult("/a", [{ id: "GHSA-noversion" }], { name: "pkg", ecosystem: "npm" })],
    });
    expect(r.findings[0].installedVersion).toBe("");
  });
});

describe("format detection", () => {
  it("routes npm audit vs osv-scanner shapes", () => {
    expect(
      parseScannerJson({ vulnerabilities: { a: { via: [{ title: "t" }] } } }).source
    ).toBe("npm_audit");
    expect(parseScannerJson({ results: [] }).source).toBe("osv_scanner");
  });

  it("throws a helpful error for anything else", () => {
    expect(() => parseScannerJson({ hello: 1 })).toThrow(/Unrecognized scanner format/);
    expect(() => parseScannerJson("nope")).toThrow(ImportParseError);
  });
});
