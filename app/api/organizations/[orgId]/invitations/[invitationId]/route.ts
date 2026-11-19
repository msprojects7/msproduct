import { NextRequest, NextResponse } from 'next/server';
import { requireOrgContext, AuthorizationError } from '@/lib/auth/context';
import { db } from '@/db/index';
import { organizationInvitations } from '@/db/schema/index';
import { eq, and } from 'drizzle-orm';
import { recordAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

/**
 * DELETE /api/organizations/[orgId]/invitations/[invitationId]
 * Revokes a pending invitation.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { orgId: string; invitationId: string } }
) {
  try {
    const context = await requireOrgContext(params.orgId);
    context.assertPermission('org:manage_members');

    const [invitation] = await db
      .select()
      .from(organizationInvitations)
      .where(
        and(
          eq(organizationInvitations.id, params.invitationId),
          eq(organizationInvitations.organizationId, context.organization.id)
        )
      )
      .limit(1);

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invitation not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    if (invitation.status !== 'pending') {
      return NextResponse.json(
        { error: `Cannot revoke invitation with status '${invitation.status}'`, code: 'INVALID_STATUS' },
        { status: 400 }
      );
    }

    await db.transaction(async (tx) => {
      await tx
        .update(organizationInvitations)
        .set({
          status: 'revoked',
          updatedAt: new Date(),
        })
        .where(eq(organizationInvitations.id, invitation.id));

      await recordAuditEvent(
        {
          organizationId: context.organization.id,
          userId: context.user.id,
          action: 'invitation:revoked',
          entityType: 'organization_invitations',
          entityId: invitation.id,
          details: { email: invitation.email },
        },
        tx
      );
    });

    return NextResponse.json({
      status: 'ok',
      message: 'Invitation revoked successfully',
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
