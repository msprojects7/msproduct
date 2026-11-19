import { NextRequest, NextResponse } from 'next/server';
import { requireEventContext, AuthorizationError } from '@/lib/auth/context';
import { db } from '@/db/index';
import { eventExhibitors } from '@/db/schema/index';
import { eq, and, ne } from 'drizzle-orm';
import { recordAuditEvent } from '@/lib/audit';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const updateExhibitorSchema = z.object({
  name: z.string().min(1, 'Exhibitor name is required').max(255).optional(),
  boothNumber: z.string().min(1, 'Booth number is required').max(50).optional(),
  contactName: z.string().max(255).optional().nullable(),
  contactEmail: z.string().email('Invalid email').max(255).optional().nullable(),
  contactPhone: z.string().max(50).optional().nullable(),
  description: z.string().optional().nullable(),
  websiteUrl: z.string().url('Invalid website URL').optional().nullable().or(z.literal('')),
  logoUrl: z.string().url('Invalid logo URL').optional().nullable().or(z.literal('')),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { eventId: string; exhibitorId: string } }
) {
  try {
    const context = await requireEventContext(params.eventId);
    context.assertPermission('event:manage_content');

    const body = await request.json();
    const validated = updateExhibitorSchema.parse(body);

    const [existing] = await db
      .select()
      .from(eventExhibitors)
      .where(
        and(
          eq(eventExhibitors.id, params.exhibitorId),
          eq(eventExhibitors.eventId, context.event.id)
        )
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: 'Exhibitor not found' }, { status: 404 });
    }

    // Check booth conflict if boothNumber changed
    if (validated.boothNumber && validated.boothNumber.trim() !== existing.boothNumber) {
      const [duplicate] = await db
        .select()
        .from(eventExhibitors)
        .where(
          and(
            eq(eventExhibitors.eventId, context.event.id),
            eq(eventExhibitors.boothNumber, validated.boothNumber.trim()),
            ne(eventExhibitors.id, params.exhibitorId)
          )
        )
        .limit(1);

      if (duplicate) {
        return NextResponse.json(
          {
            error: `Booth '${validated.boothNumber}' is already assigned to '${duplicate.name}' in this event`,
            code: 'DUPLICATE_BOOTH',
          },
          { status: 409 }
        );
      }
    }

    const [updated] = await db
      .update(eventExhibitors)
      .set({
        ...(validated.name !== undefined ? { name: validated.name.trim() } : {}),
        ...(validated.boothNumber !== undefined ? { boothNumber: validated.boothNumber.trim() } : {}),
        ...(validated.contactName !== undefined ? { contactName: validated.contactName?.trim() || null } : {}),
        ...(validated.contactEmail !== undefined ? { contactEmail: validated.contactEmail?.trim() || null } : {}),
        ...(validated.contactPhone !== undefined ? { contactPhone: validated.contactPhone?.trim() || null } : {}),
        ...(validated.description !== undefined ? { description: validated.description?.trim() || null } : {}),
        ...(validated.websiteUrl !== undefined ? { websiteUrl: validated.websiteUrl?.trim() || null } : {}),
        ...(validated.logoUrl !== undefined ? { logoUrl: validated.logoUrl?.trim() || null } : {}),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(eventExhibitors.id, params.exhibitorId),
          eq(eventExhibitors.eventId, context.event.id)
        )
      )
      .returning();

    await recordAuditEvent({
      organizationId: context.organization.id,
      eventId: context.event.id,
      userId: context.user.id,
      action: 'exhibitor:update',
      entityType: 'event_exhibitor',
      entityId: updated.id,
      details: { updatedFields: Object.keys(validated) },
      ipAddress: request.headers.get('x-forwarded-for') || null,
      userAgent: request.headers.get('user-agent') || null,
    });

    return NextResponse.json({ success: true, exhibitor: updated });
  } catch (err: unknown) {
    if (err instanceof AuthorizationError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: err.statusCode });
    }
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: err.issues }, { status: 400 });
    }
    console.error('Error updating exhibitor:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { eventId: string; exhibitorId: string } }
) {
  try {
    const context = await requireEventContext(params.eventId);
    context.assertPermission('event:manage_content');

    const [existing] = await db
      .select()
      .from(eventExhibitors)
      .where(
        and(
          eq(eventExhibitors.id, params.exhibitorId),
          eq(eventExhibitors.eventId, context.event.id)
        )
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: 'Exhibitor not found' }, { status: 404 });
    }

    await db
      .delete(eventExhibitors)
      .where(
        and(
          eq(eventExhibitors.id, params.exhibitorId),
          eq(eventExhibitors.eventId, context.event.id)
        )
      );

    await recordAuditEvent({
      organizationId: context.organization.id,
      eventId: context.event.id,
      userId: context.user.id,
      action: 'exhibitor:delete',
      entityType: 'event_exhibitor',
      entityId: params.exhibitorId,
      details: { name: existing.name, boothNumber: existing.boothNumber },
      ipAddress: request.headers.get('x-forwarded-for') || null,
      userAgent: request.headers.get('user-agent') || null,
    });

    return NextResponse.json({ success: true, message: 'Exhibitor deleted successfully' });
  } catch (err: unknown) {
    if (err instanceof AuthorizationError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: err.statusCode });
    }
    console.error('Error deleting exhibitor:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
