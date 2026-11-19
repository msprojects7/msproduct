import { NextRequest, NextResponse } from 'next/server';
import { requireEventContext, AuthorizationError } from '@/lib/auth/context';
import { db } from '@/db/index';
import { eventSponsors } from '@/db/schema/index';
import { eq, asc } from 'drizzle-orm';
import { recordAuditEvent } from '@/lib/audit';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const SPONSOR_TIERS = [
  'Title',
  'Platinum',
  'Gold',
  'Silver',
  'Bronze',
  'Partner',
  'Custom',
] as const;

const TIER_RANKS: Record<string, number> = {
  Title: 1,
  Platinum: 2,
  Gold: 3,
  Silver: 4,
  Bronze: 5,
  Partner: 6,
  Custom: 7,
};

const sponsorSchema = z.object({
  name: z.string().min(1, 'Sponsor name is required').max(255),
  tier: z.string().min(1, 'Tier is required').max(50),
  logoUrl: z.string().url('Invalid logo URL').optional().nullable().or(z.literal('')),
  websiteUrl: z.string().url('Invalid website URL').optional().nullable().or(z.literal('')),
  displayOrder: z.number().int().min(0).optional().default(0),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const context = await requireEventContext(params.eventId);
    context.assertPermission('event:view');

    const sponsors = await db
      .select()
      .from(eventSponsors)
      .where(eq(eventSponsors.eventId, context.event.id))
      .orderBy(asc(eventSponsors.displayOrder), asc(eventSponsors.name));

    // Sort by tier rank then displayOrder
    const sorted = [...sponsors].sort((a, b) => {
      const rankA = TIER_RANKS[a.tier] || 99;
      const rankB = TIER_RANKS[b.tier] || 99;
      if (rankA !== rankB) return rankA - rankB;
      return a.displayOrder - b.displayOrder;
    });

    return NextResponse.json({ success: true, sponsors: sorted });
  } catch (err: unknown) {
    if (err instanceof AuthorizationError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: err.statusCode });
    }
    console.error('Error fetching sponsors:', err);
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
    const validated = sponsorSchema.parse(body);

    const [newSponsor] = await db
      .insert(eventSponsors)
      .values({
        eventId: context.event.id,
        name: validated.name.trim(),
        tier: validated.tier.trim(),
        logoUrl: validated.logoUrl?.trim() || null,
        websiteUrl: validated.websiteUrl?.trim() || null,
        displayOrder: validated.displayOrder || 0,
      })
      .returning();

    await recordAuditEvent({
      organizationId: context.organization.id,
      eventId: context.event.id,
      userId: context.user.id,
      action: 'sponsor:create',
      entityType: 'event_sponsor',
      entityId: newSponsor.id,
      details: { name: newSponsor.name, tier: newSponsor.tier },
      ipAddress: request.headers.get('x-forwarded-for') || null,
      userAgent: request.headers.get('user-agent') || null,
    });

    return NextResponse.json({ success: true, sponsor: newSponsor }, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof AuthorizationError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: err.statusCode });
    }
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: err.issues }, { status: 400 });
    }
    console.error('Error creating sponsor:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
