import { NextRequest, NextResponse } from 'next/server';
import { requireOrgContext, AuthorizationError } from '@/lib/auth/context';
import { db } from '@/db/index';
import { organizations } from '@/db/schema/index';
import { eq } from 'drizzle-orm';
import { recordAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

/**
 * POST /api/organizations/[orgId]/deactivate
 * Deactivates an organization workspace. Requires owner-level 'org:delete' permission.
 * Non-destructive: preserves all attendee and event records while immediately revoking access.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { orgId: string } }
) {
  try {
    const context = await requireOrgContext(params.orgId);
    // Strict RBAC: only owner holds 'org:delete'
    context.assertPermission('org:delete');

    await db.transaction(async (tx) => {
      await tx
        .update(organizations)
        .set({
          isActive: false,
          updatedAt: new Date(),
        })
        .where(eq(organizations.id, context.organization.id));

      await recordAuditEvent(
        {
          organizationId: context.organization.id,
          userId: context.user.id,
          action: 'org:deactivated',
          entityType: 'organizations',
          entityId: context.organization.id,
          details: { reason: 'Owner deactivated organization' },
        },
        tx
      );
    });

    return NextResponse.json({
      status: 'ok',
      message: 'Organization successfully deactivated',
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
