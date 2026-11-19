import { db } from '@/db/index';
import { auditEvents } from '@/db/schema/index';

export interface AuditLogParams {
  organizationId: string;
  eventId?: string | null;
  userId: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  details?: Record<string, unknown>;
  ipAddress?: string | null;
  userAgent?: string | null;
}

/**
 * Records an immutable audit log entry in PostgreSQL.
 * Supports running within an optional transaction.
 */
export async function recordAuditEvent(
  params: AuditLogParams,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tx?: any
) {
  const client = tx || db;
  const [record] = await client
    .insert(auditEvents)
    .values({
      organizationId: params.organizationId,
      eventId: params.eventId || null,
      userId: params.userId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId || null,
      details: params.details || null,
      ipAddress: params.ipAddress || null,
      userAgent: params.userAgent || null,
    })
    .returning({ id: auditEvents.id });

  return record;
}
