import { NextRequest, NextResponse } from 'next/server';
import { requireOrgContext, AuthorizationError } from '@/lib/auth/context';
import { db } from '@/db/index';
import { organizationMembers } from '@/db/schema/index';
import { eq, and } from 'drizzle-orm';
import { recordAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/organizations/[orgId]/members/[memberId]
 * Updates an organization member's role (admin or member).
 * Enforces self-escalation prevention and owner immutability.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { orgId: string; memberId: string } }
) {
  try {
    const context = await requireOrgContext(params.orgId);
    context.assertPermission('org:manage_members');

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Invalid request body', code: 'BAD_REQUEST' },
        { status: 400 }
      );
    }

    const { role: newRole } = body;
    if (newRole !== 'admin' && newRole !== 'member') {
      return NextResponse.json(
        { error: "Role must be 'admin' or 'member'. To change ownership, use the transfer-ownership endpoint.", code: 'INVALID_ROLE' },
        { status: 400 }
      );
    }

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

    // Rule: Cannot edit own role
    if (targetMember.userId === context.user.id) {
      return NextResponse.json(
        { error: 'You cannot modify your own role. Ask an organization owner to adjust your permissions.', code: 'SELF_ROLE_CHANGE_FORBIDDEN' },
        { status: 400 }
      );
    }

    // Rule: Cannot change role of organization owner
    if (targetMember.role === 'owner') {
      return NextResponse.json(
        { error: 'The organization owner cannot be demoted directly. Use ownership transfer.', code: 'OWNER_IMMUTABLE' },
        { status: 400 }
      );
    }

    const previousRole = targetMember.role;

    // Update role in transaction with audit logging
    const [updatedMember] = await db.transaction(async (tx) => {
      const [res] = await tx
        .update(organizationMembers)
        .set({
          role: newRole,
          updatedAt: new Date(),
        })
        .where(eq(organizationMembers.id, targetMember.id))
        .returning();

      await recordAuditEvent(
        {
          organizationId: context.organization.id,
          userId: context.user.id,
          action: 'membership:role_changed',
          entityType: 'organization_members',
          entityId: targetMember.id,
          details: {
            targetUserId: targetMember.userId,
            previousRole,
            newRole,
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
