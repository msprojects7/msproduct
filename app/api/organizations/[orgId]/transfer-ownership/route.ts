import { NextRequest, NextResponse } from 'next/server';
import { requireOrgContext, AuthorizationError } from '@/lib/auth/context';
import { db } from '@/db/index';
import { organizationMembers } from '@/db/schema/index';
import { eq, and } from 'drizzle-orm';
import { recordAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

/**
 * POST /api/organizations/[orgId]/transfer-ownership
 * Atomically transfers organization ownership to another active member.
 * Only the current organization owner holds 'org:transfer_ownership'.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { orgId: string } }
) {
  try {
    const context = await requireOrgContext(params.orgId);
    // Strict RBAC: only owner holds 'org:transfer_ownership'
    context.assertPermission('org:transfer_ownership');

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object' || !body.targetUserId || typeof body.targetUserId !== 'string') {
      return NextResponse.json(
        { error: 'targetUserId is required', code: 'BAD_REQUEST' },
        { status: 400 }
      );
    }

    const { targetUserId, demoteToRole = 'admin' } = body;

    if (demoteToRole !== 'admin' && demoteToRole !== 'member') {
      return NextResponse.json(
        { error: "demoteToRole must be 'admin' or 'member'", code: 'INVALID_ROLE' },
        { status: 400 }
      );
    }

    if (targetUserId === context.user.id) {
      return NextResponse.json(
        { error: 'You are already the owner of this organization', code: 'ALREADY_OWNER' },
        { status: 400 }
      );
    }

    // Transactional ownership transfer with row-level locks
    await db.transaction(async (tx) => {
      // 1. Lock current owner row FOR UPDATE and verify still active owner
      const [currentOwner] = await tx
        .select()
        .from(organizationMembers)
        .where(
          and(
            eq(organizationMembers.organizationId, context.organization.id),
            eq(organizationMembers.userId, context.user.id)
          )
        )
        .for('update')
        .limit(1);

      if (!currentOwner || currentOwner.role !== 'owner' || !currentOwner.isActive) {
        throw new AuthorizationError(
          'You are no longer the active owner of this organization',
          409,
          'OWNER_CONFLICT'
        );
      }

      // 2. Lock target member row FOR UPDATE and verify active member
      const [targetMember] = await tx
        .select()
        .from(organizationMembers)
        .where(
          and(
            eq(organizationMembers.organizationId, context.organization.id),
            eq(organizationMembers.userId, targetUserId)
          )
        )
        .for('update')
        .limit(1);

      if (!targetMember) {
        throw new AuthorizationError(
          'Target user is not a member of this organization',
          404,
          'TARGET_NOT_MEMBER'
        );
      }

      if (!targetMember.isActive) {
        throw new AuthorizationError(
          'Cannot transfer ownership to an inactive member',
          400,
          'TARGET_INACTIVE'
        );
      }

      // 3. Demote current owner first (so at no time can two active owners exist)
      const [demoted] = await tx
        .update(organizationMembers)
        .set({
          role: demoteToRole,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(organizationMembers.id, currentOwner.id),
            eq(organizationMembers.role, 'owner')
          )
        )
        .returning();

      if (!demoted) {
        throw new AuthorizationError(
          'Concurrent ownership transfer conflict detected',
          409,
          'OWNER_CONFLICT'
        );
      }

      // 4. Promote target member to owner
      await tx
        .update(organizationMembers)
        .set({
          role: 'owner',
          updatedAt: new Date(),
        })
        .where(eq(organizationMembers.id, targetMember.id));

      // 5. Write immutable audit log atomically
      await recordAuditEvent(
        {
          organizationId: context.organization.id,
          userId: context.user.id,
          action: 'org:ownership_transferred',
          entityType: 'organizations',
          entityId: context.organization.id,
          details: {
            previousOwnerId: context.user.id,
            newOwnerId: targetUserId,
            previousOwnerNewRole: demoteToRole,
          },
        },
        tx
      );
    });

    return NextResponse.json({
      status: 'ok',
      message: 'Organization ownership transferred successfully',
      newOwnerId: targetUserId,
      formerOwnerRole: demoteToRole,
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
