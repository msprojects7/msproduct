import { NextRequest, NextResponse } from 'next/server';
import { requireOrgContext, AuthorizationError } from '@/lib/auth/context';
import { db } from '@/db/index';
import { speakers } from '@/db/schema/index';
import { eq, and } from 'drizzle-orm';
import { recordAuditEvent } from '@/lib/audit';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const updateSpeakerSchema = z.object({
  name: z.string().min(1, 'Speaker name is required').max(255).optional(),
  title: z.string().max(255).optional().nullable(),
  company: z.string().max(255).optional().nullable(),
  bio: z.string().optional().nullable(),
  email: z.string().email('Invalid email address').max(255).optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  photoUrl: z.string().url('Invalid photo URL').optional().nullable().or(z.literal('')),
  websiteUrl: z.string().url('Invalid website URL').optional().nullable().or(z.literal('')),
  linkedinUrl: z.string().url('Invalid LinkedIn URL').optional().nullable().or(z.literal('')),
  twitterUrl: z.string().url('Invalid Twitter/X URL').optional().nullable().or(z.literal('')),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { orgId: string; speakerId: string } }
) {
  try {
    const context = await requireOrgContext(params.orgId);
    context.assertPermission('org:view');

    const [speaker] = await db
      .select()
      .from(speakers)
      .where(
        and(
          eq(speakers.id, params.speakerId),
          eq(speakers.organizationId, context.organization.id)
        )
      )
      .limit(1);

    if (!speaker) {
      return NextResponse.json({ error: 'Speaker not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, speaker });
  } catch (err: unknown) {
    if (err instanceof AuthorizationError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: err.statusCode });
    }
    console.error('Error fetching speaker:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { orgId: string; speakerId: string } }
) {
  try {
    const context = await requireOrgContext(params.orgId);
    context.assertPermission('org:update');

    const body = await request.json();
    const validated = updateSpeakerSchema.parse(body);

    const [existing] = await db
      .select()
      .from(speakers)
      .where(
        and(
          eq(speakers.id, params.speakerId),
          eq(speakers.organizationId, context.organization.id)
        )
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: 'Speaker not found' }, { status: 404 });
    }

    const [updated] = await db
      .update(speakers)
      .set({
        ...(validated.name !== undefined ? { name: validated.name.trim() } : {}),
        ...(validated.title !== undefined ? { title: validated.title?.trim() || null } : {}),
        ...(validated.company !== undefined ? { company: validated.company?.trim() || null } : {}),
        ...(validated.bio !== undefined ? { bio: validated.bio?.trim() || null } : {}),
        ...(validated.email !== undefined ? { email: validated.email?.trim() || null } : {}),
        ...(validated.phone !== undefined ? { phone: validated.phone?.trim() || null } : {}),
        ...(validated.photoUrl !== undefined ? { photoUrl: validated.photoUrl?.trim() || null } : {}),
        ...(validated.websiteUrl !== undefined ? { websiteUrl: validated.websiteUrl?.trim() || null } : {}),
        ...(validated.linkedinUrl !== undefined ? { linkedinUrl: validated.linkedinUrl?.trim() || null } : {}),
        ...(validated.twitterUrl !== undefined ? { twitterUrl: validated.twitterUrl?.trim() || null } : {}),
        updatedAt: new Date(),
      })
      .where(eq(speakers.id, params.speakerId))
      .returning();

    await recordAuditEvent({
      organizationId: context.organization.id,
      userId: context.user.id,
      action: 'speaker:update',
      entityType: 'speaker',
      entityId: updated.id,
      details: { updatedFields: Object.keys(validated) },
      ipAddress: request.headers.get('x-forwarded-for') || null,
      userAgent: request.headers.get('user-agent') || null,
    });

    return NextResponse.json({ success: true, speaker: updated });
  } catch (err: unknown) {
    if (err instanceof AuthorizationError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: err.statusCode });
    }
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: err.issues }, { status: 400 });
    }
    console.error('Error updating speaker:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { orgId: string; speakerId: string } }
) {
  try {
    const context = await requireOrgContext(params.orgId);
    context.assertPermission('org:update');

    const [existing] = await db
      .select()
      .from(speakers)
      .where(
        and(
          eq(speakers.id, params.speakerId),
          eq(speakers.organizationId, context.organization.id)
        )
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: 'Speaker not found' }, { status: 404 });
    }

    await db.delete(speakers).where(eq(speakers.id, params.speakerId));

    await recordAuditEvent({
      organizationId: context.organization.id,
      userId: context.user.id,
      action: 'speaker:delete',
      entityType: 'speaker',
      entityId: params.speakerId,
      details: { name: existing.name },
      ipAddress: request.headers.get('x-forwarded-for') || null,
      userAgent: request.headers.get('user-agent') || null,
    });

    return NextResponse.json({ success: true, message: 'Speaker deleted successfully' });
  } catch (err: unknown) {
    if (err instanceof AuthorizationError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: err.statusCode });
    }
    console.error('Error deleting speaker:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
