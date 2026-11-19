import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { drafts, organizationMembers } from '@/db/schema';
import { eq, and, desc, isNull } from 'drizzle-orm';
import { requireUserSession } from '@/lib/auth/context';
import { handleApiError } from '@/lib/errors';

export async function GET(req: NextRequest) {
  try {
    const session = await requireUserSession();
    const { searchParams } = new URL(req.url);

    const organizationId = searchParams.get('organizationId');
    const draftType = searchParams.get('draftType');
    const eventId = searchParams.get('eventId');

    if (!organizationId || !draftType) {
      return NextResponse.json(
        { error: 'organizationId and draftType query parameters are required.' },
        { status: 400 }
      );
    }

    // Tenant isolation: verify user is a member of the organization
    const [membership] = await db
      .select()
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.organizationId, organizationId),
          eq(organizationMembers.userId, session.id),
          eq(organizationMembers.isActive, true)
        )
      )
      .limit(1);

    if (!membership) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have access to drafts in this organization.' },
        { status: 403 }
      );
    }

    // Query draft scoped by user, org, draftType, and optional eventId
    const conditions = [
      eq(drafts.userId, session.id),
      eq(drafts.organizationId, organizationId),
      eq(drafts.draftType, draftType),
    ];

    if (eventId) {
      conditions.push(eq(drafts.eventId, eventId));
    } else {
      conditions.push(isNull(drafts.eventId));
    }

    const [draft] = await db
      .select()
      .from(drafts)
      .where(and(...conditions))
      .orderBy(desc(drafts.updatedAt))
      .limit(1);

    return NextResponse.json({
      success: true,
      draft: draft || null,
    });
  } catch (error: any) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireUserSession();
    const body = await req.json().catch(() => null);

    if (!body || !body.organizationId || !body.draftType || body.data === undefined) {
      return NextResponse.json(
        { error: 'organizationId, draftType, and data are required.' },
        { status: 400 }
      );
    }

    const { organizationId, draftType, data, eventId } = body;

    // Enforce payload size limit (max 500KB)
    const jsonString = JSON.stringify(data);
    if (jsonString.length > 512000) {
      return NextResponse.json(
        { error: 'Draft payload exceeds maximum allowable size (500KB).' },
        { status: 413 }
      );
    }

    // Tenant isolation: verify user is an active member
    const [membership] = await db
      .select()
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.organizationId, organizationId),
          eq(organizationMembers.userId, session.id),
          eq(organizationMembers.isActive, true)
        )
      )
      .limit(1);

    if (!membership) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have access to save drafts in this organization.' },
        { status: 403 }
      );
    }

    // Check if an existing draft exists
    const conditions = [
      eq(drafts.userId, session.id),
      eq(drafts.organizationId, organizationId),
      eq(drafts.draftType, draftType),
    ];

    if (eventId) {
      conditions.push(eq(drafts.eventId, eventId));
    } else {
      conditions.push(isNull(drafts.eventId));
    }

    const [existing] = await db
      .select()
      .from(drafts)
      .where(and(...conditions))
      .limit(1);

    let savedDraft;

    if (existing) {
      // Update existing draft with version bump
      const [updated] = await db
        .update(drafts)
        .set({
          data,
          version: existing.version + 1,
          updatedAt: new Date(),
        })
        .where(eq(drafts.id, existing.id))
        .returning();

      savedDraft = updated;
    } else {
      // Create new draft
      const [created] = await db
        .insert(drafts)
        .values({
          userId: session.id,
          organizationId,
          eventId: eventId || null,
          draftType,
          data,
          version: 1,
        })
        .returning();

      savedDraft = created;
    }

    return NextResponse.json({
      success: true,
      draft: savedDraft,
      lastSavedAt: savedDraft.updatedAt,
      version: savedDraft.version,
    });
  } catch (error: any) {
    return handleApiError(error);
  }
}
