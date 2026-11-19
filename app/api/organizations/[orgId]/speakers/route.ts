import { NextRequest, NextResponse } from 'next/server';
import { requireOrgContext, AuthorizationError } from '@/lib/auth/context';
import { db } from '@/db/index';
import { speakers } from '@/db/schema/index';
import { eq, asc } from 'drizzle-orm';
import { recordAuditEvent } from '@/lib/audit';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const speakerSchema = z.object({
  name: z.string().min(1, 'Speaker name is required').max(255),
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
  { params }: { params: { orgId: string } }
) {
  try {
    const context = await requireOrgContext(params.orgId);
    context.assertPermission('org:view');

    const orgSpeakers = await db
      .select()
      .from(speakers)
      .where(eq(speakers.organizationId, context.organization.id))
      .orderBy(asc(speakers.name));

    return NextResponse.json({
      success: true,
      speakers: orgSpeakers,
    });
  } catch (err: unknown) {
    if (err instanceof AuthorizationError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: err.statusCode });
    }
    console.error('Error fetching organization speakers:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { orgId: string } }
) {
  try {
    const context = await requireOrgContext(params.orgId);
    context.assertPermission('org:update');

    const body = await request.json();
    const validated = speakerSchema.parse(body);

    const [newSpeaker] = await db
      .insert(speakers)
      .values({
        organizationId: context.organization.id,
        name: validated.name.trim(),
        title: validated.title?.trim() || null,
        company: validated.company?.trim() || null,
        bio: validated.bio?.trim() || null,
        email: validated.email?.trim() || null,
        phone: validated.phone?.trim() || null,
        photoUrl: validated.photoUrl?.trim() || null,
        websiteUrl: validated.websiteUrl?.trim() || null,
        linkedinUrl: validated.linkedinUrl?.trim() || null,
        twitterUrl: validated.twitterUrl?.trim() || null,
      })
      .returning();

    await recordAuditEvent({
      organizationId: context.organization.id,
      userId: context.user.id,
      action: 'speaker:create',
      entityType: 'speaker',
      entityId: newSpeaker.id,
      details: { name: newSpeaker.name, company: newSpeaker.company },
      ipAddress: request.headers.get('x-forwarded-for') || null,
      userAgent: request.headers.get('user-agent') || null,
    });

    return NextResponse.json({
      success: true,
      speaker: newSpeaker,
    }, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof AuthorizationError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: err.statusCode });
    }
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: err.issues }, { status: 400 });
    }
    console.error('Error creating speaker:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
