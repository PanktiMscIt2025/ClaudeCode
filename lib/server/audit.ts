import { db } from "./db";
import type { Prisma } from "@/lib/generated/prisma/client";

type Tx = Prisma.TransactionClient;

/** Append-only audit trail for grade changes, resets, and imports. Never pass passwords in `details`. */
export function audit(actorId: string | null, action: string, target: string, details: Record<string, unknown> = {}, tx: Tx = db) {
  return tx.auditLog.create({ data: { actorId, action, target, details: JSON.stringify(details) } });
}
