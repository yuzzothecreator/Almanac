import { prisma } from "@/lib/db";
import type { Prisma } from "@/prisma/generated/client/client";

export type AuditInput = {
  actorEmail: string;
  actorRole?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  summary: string;
  metadata?: Record<string, unknown> | null;
};

export async function writeAuditLog(input: AuditInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actor_email: input.actorEmail.toLowerCase(),
        actor_role: input.actorRole || null,
        action: input.action,
        entity_type: input.entityType,
        entity_id: input.entityId || null,
        summary: input.summary,
        metadata:
          input.metadata == null
            ? undefined
            : (input.metadata as Prisma.InputJsonValue),
      },
    });
  } catch (error) {
    // Never block the main action if audit write fails
    console.error("audit log write failed:", error);
  }
}

export type SerializedAuditLog = {
  id: string;
  created_date: string;
  actor_email: string;
  actor_role: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  summary: string;
  metadata: Record<string, unknown> | null;
};

export async function listAuditLogs(opts?: {
  limit?: number;
  action?: string;
  entityType?: string;
  q?: string;
}): Promise<SerializedAuditLog[]> {
  const limit = Math.min(opts?.limit ?? 100, 300);
  const rows = await prisma.auditLog.findMany({
    where: {
      ...(opts?.action ? { action: opts.action } : {}),
      ...(opts?.entityType ? { entity_type: opts.entityType } : {}),
      ...(opts?.q
        ? {
            OR: [
              { summary: { contains: opts.q, mode: "insensitive" } },
              { actor_email: { contains: opts.q, mode: "insensitive" } },
              { entity_id: { contains: opts.q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { created_date: "desc" },
    take: limit,
  });

  return rows.map((r) => ({
    id: r.id,
    created_date: r.created_date.toISOString(),
    actor_email: r.actor_email,
    actor_role: r.actor_role,
    action: r.action,
    entity_type: r.entity_type,
    entity_id: r.entity_id,
    summary: r.summary,
    metadata:
      r.metadata && typeof r.metadata === "object" && !Array.isArray(r.metadata)
        ? (r.metadata as Record<string, unknown>)
        : null,
  }));
}
