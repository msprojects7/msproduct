import { NextRequest, NextResponse } from 'next/server';
import { requireOrgContext, AuthorizationError } from '@/lib/auth/context';
import { db } from '@/db/index';
import { organizationMembers } from '@/db/schema/index';
import { eq, and } from 'drizzle-orm';
import { recordAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/organizations/[orgId]/members/[memberId]/status
 * Toggles a member's active status (deactivation / reactivation).
 * Prevents self-deactivation and deactivating the organization owner.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { orgId: string; memberId: string } }
) {
  try {
    const context = await requireOrgContext(params.orgId);
    context.assertPermission('org:manage_members');

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object' || typeof body.isActive !== 'boolean') {
      return NextResponse.json(
        { error: 'isActive boolean field is required', code: 'BAD_REQUEST' },
        { status: 400 }
      );
    }

    const { isActive } = body;

    // Resolve target member
    const [targetMember] = await db
      .select()
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.id, params.memberId),
          eq(organizationMembers.organizationId, context.organization.id)
        )
      )
      .limit(1);

    if (!targetMember) {
      return NextResponse.json(
        { error: 'Member not found in this organization', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Rule: Cannot deactivate self
    if (targetMember.userId === context.user.id) {
      return NextResponse.json(
        { error: 'You cannot deactivate your own membership', code: 'SELF_DEACTIVATION_FORBIDDEN' },
        { status: 400 }
      );
    }

    // Rule: Cannot deactivate owner
    if (targetMember.role === 'owner') {
      return NextResponse.json(
        { error: 'The organization owner cannot be deactivated. Transfer ownership first.', code: 'OWNER_IMMUTABLE' },
        { status: 400 }
      );
    }

    const previousStatus = targetMember.isActive;

    const [updatedMember] = await db.transaction(async (tx) => {
      const [res] = await tx
        .update(organizationMembers)
        .set({
          isActive,
          updatedAt: new Date(),
        })
        .where(eq(organizationMembers.id, targetMember.id))
        .returning();

      await recordAuditEvent(
        {
          organizationId: context.organization.id,
          userId: context.user.id,
          action: 'membership:status_changed',
          entityType: 'organization_members',
          entityId: targetMember.id,
          details: {
            targetUserId: targetMember.userId,
            previousStatus,
            newStatus: isActive,
          },
        },
        tx
      );

      return [res];
    });

    return NextResponse.json({
      status: 'ok',
      member: {
        id: updatedMember.id,
        userId: updatedMember.userId,
        role: updatedMember.role,
        isActive: updatedMember.isActive,
      },
    });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
