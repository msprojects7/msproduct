import { NextRequest, NextResponse } from 'next/server';
import { requireEventContext, AuthorizationError } from '@/lib/auth/context';
import { db } from '@/db/index';
import { eventSponsors } from '@/db/schema/index';
import { eq, and } from 'drizzle-orm';
import { recordAuditEvent } from '@/lib/audit';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const updateSponsorSchema = z.object({
  name: z.string().min(1, 'Sponsor name is required').max(255).optional(),
  tier: z.string().min(1, 'Tier is required').max(50).optional(),
  logoUrl: z.string().url('Invalid logo URL').optional().nullable().or(z.literal('')),
  websiteUrl: z.string().url('Invalid website URL').optional().nullable().or(z.literal('')),
  displayOrder: z.number().int().min(0).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { eventId: string; sponsorId: string } }
) {
  try {
    const context = await requireEventContext(params.eventId);
    context.assertPermission('event:manage_content');

    const body = await request.json();
    const validated = updateSponsorSchema.parse(body);

    const [existing] = await db
      .select()
      .from(eventSponsors)
      .where(
        and(
          eq(eventSponsors.id, params.sponsorId),
          eq(eventSponsors.eventId, context.event.id)
        )
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: 'Sponsor not found' }, { status: 404 });
    }

    const [updated] = await db
      .update(eventSponsors)
      .set({
        ...(validated.name !== undefined ? { name: validated.name.trim() } : {}),
        ...(validated.tier !== undefined ? { tier: validated.tier.trim() } : {}),
        ...(validated.logoUrl !== undefined ? { logoUrl: validated.logoUrl?.trim() || null } : {}),
        ...(validated.websiteUrl !== undefined ? { websiteUrl: validated.websiteUrl?.trim() || null } : {}),
        ...(validated.displayOrder !== undefined ? { displayOrder: validated.displayOrder } : {}),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(eventSponsors.id, params.sponsorId),
          eq(eventSponsors.eventId, context.event.id)
        )
      )
      .returning();

    await recordAuditEvent({
      organizationId: context.organization.id,
      eventId: context.event.id,
      userId: context.user.id,
      action: 'sponsor:update',
      entityType: 'event_sponsor',
      entityId: updated.id,
      details: { updatedFields: Object.keys(validated) },
      ipAddress: request.headers.get('x-forwarded-for') || null,
      userAgent: request.headers.get('user-agent') || null,
    });

    return NextResponse.json({ success: true, sponsor: updated });
  } catch (err: unknown) {
    if (err instanceof AuthorizationError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: err.statusCode });
    }
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: err.issues }, { status: 400 });
    }
    console.error('Error updating sponsor:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { eventId: string; sponsorId: string } }
) {
  try {
    const context = await requireEventContext(params.eventId);
    context.assertPermission('event:manage_content');

    const [existing] = await db
      .select()
      .from(eventSponsors)
      .where(
        and(
          eq(eventSponsors.id, params.sponsorId),
          eq(eventSponsors.eventId, context.event.id)
        )
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: 'Sponsor not found' }, { status: 404 });
    }

    await db
      .delete(eventSponsors)
      .where(
        and(
          eq(eventSponsors.id, params.sponsorId),
          eq(eventSponsors.eventId, context.event.id)
        )
      );

    await recordAuditEvent({
      organizationId: context.organization.id,
      eventId: context.event.id,
      userId: context.user.id,
      action: 'sponsor:delete',
      entityType: 'event_sponsor',
      entityId: params.sponsorId,
      details: { name: existing.name },
      ipAddress: request.headers.get('x-forwarded-for') || null,
      userAgent: request.headers.get('user-agent') || null,
    });

    return NextResponse.json({ success: true, message: 'Sponsor deleted successfully' });
  } catch (err: unknown) {
    if (err instanceof AuthorizationError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: err.statusCode });
    }
    console.error('Error deleting sponsor:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
