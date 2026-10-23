import { isSeverity } from "./severity";

export const IMPORT_MAX_CHARS = 2_000_000; // ~2 MB of pasted JSON

export class InputError extends Error {}

export function requireString(
  value: FormDataEntryValue | null | undefined,
  field: string,
  opts: { min?: number; max?: number; label?: string } = {}
): string {
  const s = typeof value === "string" ? value.trim() : "";
  const label = opts.label ?? field;
  if (s.length < (opts.min ?? 1)) {
    throw new InputError(`${label} is required.`);
  }
  if (s.length > (opts.max ?? 500)) {
    throw new InputError(`${label} must be at most ${opts.max ?? 500} characters.`);
  }
  return s;
}

export function optionalString(
  value: FormDataEntryValue | null | undefined,
  max = 500
): string {
  const s = typeof value === "string" ? value.trim() : "";
  if (s.length > max) throw new InputError(`Input must be at most ${max} characters.`);
  return s;
}

export function validEmail(email: string): string {
  const e = email.toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) || e.length > 254) {
    throw new InputError("Enter a valid email address.");
  }
  return e;
}

/** Only http(s) URLs are accepted for evidence links; anything else is rejected. */
export function validUrlOrNull(value: FormDataEntryValue | null | undefined): string | null {
  const s = typeof value === "string" ? value.trim() : "";
  if (!s) return null;
  if (s.length > 2000) throw new InputError("URL must be at most 2000 characters.");
  let u: URL;
  try {
    u = new URL(s);
  } catch {
    throw new InputError("Evidence links must be valid http(s) URLs.");
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") {
    throw new InputError("Evidence links must use http or https.");
  }
  return u.toString();
}

export function validSeverity(value: FormDataEntryValue | null | undefined): string {
  const s = typeof value === "string" ? value.trim() : "";
  if (!isSeverity(s)) throw new InputError("Unknown severity.");
  return s;
}

export function validSlaDays(value: FormDataEntryValue | null | undefined): number {
  const n = Number(typeof value === "string" ? value.trim() : "");
  if (!Number.isInteger(n) || n < 0 || n > 365) {
    throw new InputError("SLA days must be a whole number between 0 and 365.");
  }
  return n;
}

export function validHexColor(value: FormDataEntryValue | null | undefined, fallback = "#2563eb"): string {
  const s = typeof value === "string" ? value.trim() : "";
  if (!s) return fallback;
  if (!/^#[0-9a-fA-F]{6}$/.test(s)) throw new InputError("Color must look like #2563eb.");
  return s.toLowerCase();
}

/** Parse pasted scanner JSON with a hard size cap. Throws InputError with a safe message. */
export function parseJsonInput(value: FormDataEntryValue | null | undefined): unknown {
  const s = typeof value === "string" ? value.trim() : "";
  if (!s) throw new InputError("Paste the scanner JSON output first.");
  if (s.length > IMPORT_MAX_CHARS) {
    throw new InputError(
      `Input too large (${Math.round(s.length / 1000)}k characters). Keep it under ${IMPORT_MAX_CHARS / 1000}k.`
    );
  }
  try {
    return JSON.parse(s);
  } catch {
    throw new InputError("That is not valid JSON. Re-run the scanner with JSON output enabled.");
  }
}
