import { prisma } from "./db";

/**
 * Append-only audit trail. Metadata must stay small (labels, counts) - never
 * raw imported scanner payloads, which can contain package inventory a tenant
 * would not want duplicated into logs.
 */
export async function audit(
  accountId: string,
  action: string,
  opts: { targetType?: string; targetId?: string; meta?: Record<string, unknown> } = {}
): Promise<void> {
  await prisma.auditEvent.create({
    data: {
      accountId,
      action,
      targetType: opts.targetType ?? "",
      targetId: opts.targetId ?? "",
      metaJson: JSON.stringify(opts.meta ?? {}).slice(0, 2000),
    },
  });
}
