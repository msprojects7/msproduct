import { NextRequest, NextResponse } from 'next/server';
import { requireOrgContext, AuthorizationError } from '@/lib/auth/context';
import { handleApiError } from '@/lib/errors';
import { db } from '@/db/index';
import { organizationMembers } from '@/db/schema/index';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

/**
 * GET /api/organizations/[orgId]/members
 * Lists all members of the specified organization.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { orgId: string } }
) {
  try {
    const context = await requireOrgContext(params.orgId);
    context.assertPermission('org:view');

    const members = await db
      .select({
        id: organizationMembers.id,
        userId: organizationMembers.userId,
        role: organizationMembers.role,
        isActive: organizationMembers.isActive,
        createdAt: organizationMembers.createdAt,
      })
      .from(organizationMembers)
      .where(eq(organizationMembers.organizationId, context.organization.id));

    return NextResponse.json({
      status: 'ok',
      organizationId: context.organization.id,
      members,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
