import { NextRequest, NextResponse } from 'next/server';
import { requireEventContext, AuthorizationError } from '@/lib/auth/context';
import { db } from '@/db/index';
import { eventExhibitors } from '@/db/schema/index';
import { eq, and, asc } from 'drizzle-orm';
import { recordAuditEvent } from '@/lib/audit';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const exhibitorSchema = z.object({
  name: z.string().min(1, 'Exhibitor name is required').max(255),
  boothNumber: z.string().min(1, 'Booth number is required').max(50),
  contactName: z.string().max(255).optional().nullable(),
  contactEmail: z.string().email('Invalid email').max(255).optional().nullable(),
  contactPhone: z.string().max(50).optional().nullable(),
  description: z.string().optional().nullable(),
  websiteUrl: z.string().url('Invalid website URL').optional().nullable().or(z.literal('')),
  logoUrl: z.string().url('Invalid logo URL').optional().nullable().or(z.literal('')),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const context = await requireEventContext(params.eventId);
    context.assertPermission('event:view');

    const exhibitors = await db
      .select()
      .from(eventExhibitors)
      .where(eq(eventExhibitors.eventId, context.event.id))
      .orderBy(asc(eventExhibitors.boothNumber), asc(eventExhibitors.name));

    return NextResponse.json({ success: true, exhibitors });
  } catch (err: unknown) {
    if (err instanceof AuthorizationError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: err.statusCode });
    }
    console.error('Error fetching exhibitors:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const context = await requireEventContext(params.eventId);
    context.assertPermission('event:manage_content');

    const body = await request.json();
    const validated = exhibitorSchema.parse(body);

    // Business rule: Prevent duplicate booth assignments within the same event
    const [existingBooth] = await db
      .select()
      .from(eventExhibitors)
      .where(
        and(
          eq(eventExhibitors.eventId, context.event.id),
          eq(eventExhibitors.boothNumber, validated.boothNumber.trim())
        )
      )
      .limit(1);

    if (existingBooth) {
      return NextResponse.json(
        {
          error: `Booth '${validated.boothNumber}' is already assigned to '${existingBooth.name}' in this event`,
          code: 'DUPLICATE_BOOTH',
        },
        { status: 409 }
      );
    }

    const [newExhibitor] = await db
      .insert(eventExhibitors)
      .values({
        eventId: context.event.id,
        name: validated.name.trim(),
        boothNumber: validated.boothNumber.trim(),
        contactName: validated.contactName?.trim() || null,
        contactEmail: validated.contactEmail?.trim() || null,
        contactPhone: validated.contactPhone?.trim() || null,
        description: validated.description?.trim() || null,
        websiteUrl: validated.websiteUrl?.trim() || null,
        logoUrl: validated.logoUrl?.trim() || null,
      })
      .returning();

    await recordAuditEvent({
      organizationId: context.organization.id,
      eventId: context.event.id,
      userId: context.user.id,
      action: 'exhibitor:create',
      entityType: 'event_exhibitor',
      entityId: newExhibitor.id,
      details: { name: newExhibitor.name, boothNumber: newExhibitor.boothNumber },
      ipAddress: request.headers.get('x-forwarded-for') || null,
      userAgent: request.headers.get('user-agent') || null,
    });

    return NextResponse.json({ success: true, exhibitor: newExhibitor }, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof AuthorizationError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: err.statusCode });
    }
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: err.issues }, { status: 400 });
    }
    console.error('Error creating exhibitor:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
