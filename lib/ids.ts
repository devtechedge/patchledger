import { createHash, randomBytes } from "node:crypto";

/** Random opaque id used for public share links (no sequential guessing). */
export function newPublicId(): string {
  return randomBytes(16).toString("hex");
}

/**
 * Stable advisory id when a scanner gives none: derived from the title and
 * range so the same advisory dedupes across imports of the same project.
 */
export function advisorySlug(title: string, range: string): string {
  const h = createHash("sha256")
    .update(`${title}::${range}`)
    .digest("hex")
    .slice(0, 12);
  return `ADVISORY-${h}`;
}
