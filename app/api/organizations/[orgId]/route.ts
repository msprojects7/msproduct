import { NextRequest, NextResponse } from 'next/server';
import { requireOrgContext, AuthorizationError } from '@/lib/auth/context';
import { db } from '@/db/index';
import { organizations } from '@/db/schema/index';
import { eq } from 'drizzle-orm';
import { recordAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

/**
 * GET /api/organizations/[orgId]
 * Retrieves details of a specific organization.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { orgId: string } }
) {
  try {
    const context = await requireOrgContext(params.orgId);
    context.assertPermission('org:view');

    return NextResponse.json({
      status: 'ok',
      organization: context.organization,
      effectiveRole: context.effectiveRole,
      membership: {
        role: context.membership.role,
        isActive: context.membership.isActive,
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

/**
 * PATCH /api/organizations/[orgId]
 * Updates organization profile details (name, logoUrl).
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { orgId: string } }
) {
  try {
    const context = await requireOrgContext(params.orgId);
    context.assertPermission('org:update');

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Invalid request body', code: 'BAD_REQUEST' },
        { status: 400 }
      );
    }

    const { name, logoUrl } = body;
    const updates: Partial<{ name: string; logoUrl: string | null; updatedAt: Date }> = {
      updatedAt: new Date(),
    };

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 100) {
        return NextResponse.json(
          { error: 'Name must be between 2 and 100 characters', code: 'INVALID_NAME' },
          { status: 400 }
        );
      }
      updates.name = name.trim();
    }

    if (logoUrl !== undefined) {
      updates.logoUrl = typeof logoUrl === 'string' && logoUrl.trim() ? logoUrl.trim() : null;
    }

    const [updatedOrg] = await db.transaction(async (tx) => {
      const [res] = await tx
        .update(organizations)
        .set(updates)
        .where(eq(organizations.id, context.organization.id))
        .returning();

      await recordAuditEvent(
        {
          organizationId: context.organization.id,
          userId: context.user.id,
          action: 'org:updated',
          entityType: 'organizations',
          entityId: context.organization.id,
          details: { updates },
        },
        tx
      );

      return [res];
    });

    return NextResponse.json({
      status: 'ok',
      organization: updatedOrg,
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
