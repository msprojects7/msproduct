import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { drafts, organizationMembers } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { requireUserSession } from '@/lib/auth/context';
import { handleApiError } from '@/lib/errors';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { draftId: string } }
) {
  try {
    const session = await requireUserSession();
    const { draftId } = params;

    if (!draftId) {
      return NextResponse.json({ error: 'Missing draft identifier.' }, { status: 400 });
    }

    const [draft] = await db
      .select()
      .from(drafts)
      .where(eq(drafts.id, draftId))
      .limit(1);

    if (!draft) {
      return NextResponse.json({ error: 'Draft not found.' }, { status: 404 });
    }

    // Security check: draft must belong to the user, or user is an owner/admin of the organization
    if (draft.userId !== session.id) {
      const [membership] = await db
        .select()
        .from(organizationMembers)
        .where(
          and(
            eq(organizationMembers.organizationId, draft.organizationId),
            eq(organizationMembers.userId, session.id),
            eq(organizationMembers.isActive, true)
          )
        )
        .limit(1);

      if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
        return NextResponse.json(
          { error: 'Forbidden: You cannot delete another user’s draft.' },
          { status: 403 }
        );
      }
    }

    await db.delete(drafts).where(eq(drafts.id, draftId));

    return NextResponse.json({
      success: true,
      message: 'Draft discarded successfully.',
    });
  } catch (error: any) {
    return handleApiError(error);
  }
}
