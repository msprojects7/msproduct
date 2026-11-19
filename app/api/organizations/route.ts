import { NextRequest, NextResponse } from 'next/server';
import { requireUserSession, AuthorizationError } from '@/lib/auth/context';
import { db } from '@/db/index';
import { organizations, organizationMembers } from '@/db/schema/index';
import { eq, and } from 'drizzle-orm';
import { recordAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

/**
 * GET /api/organizations
 * Lists all active organizations where the authenticated user is an active member.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireUserSession();

    const userOrgs = await db
      .select({
        id: organizations.id,
        name: organizations.name,
        slug: organizations.slug,
        logoUrl: organizations.logoUrl,
        isActive: organizations.isActive,
        createdAt: organizations.createdAt,
        role: organizationMembers.role,
      })
      .from(organizationMembers)
      .innerJoin(organizations, eq(organizationMembers.organizationId, organizations.id))
      .where(
        and(
          eq(organizationMembers.userId, user.id),
          eq(organizationMembers.isActive, true),
          eq(organizations.isActive, true)
        )
      );

    return NextResponse.json({
      status: 'ok',
      organizations: userOrgs,
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
 * POST /api/organizations
 * Creates a new organization workspace. The creator is atomically granted 'owner' role.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireUserSession();

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Invalid request body', code: 'BAD_REQUEST' },
        { status: 400 }
      );
    }

    const { name, slug, logoUrl } = body;

    // Validate name
    if (!name || typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 100) {
      return NextResponse.json(
        { error: 'Organization name must be between 2 and 100 characters', code: 'INVALID_NAME' },
        { status: 400 }
      );
    }

    // Validate slug
    if (!slug || typeof slug !== 'string') {
      return NextResponse.json(
        { error: 'Organization slug is required', code: 'INVALID_SLUG' },
        { status: 400 }
      );
    }

    const normalizedSlug = slug.trim().toLowerCase();
    const slugRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/;
    if (!slugRegex.test(normalizedSlug) || normalizedSlug.length < 2 || normalizedSlug.length > 60) {
      return NextResponse.json(
        { error: 'Slug must contain only lowercase letters, numbers, and hyphens (2-60 chars)', code: 'INVALID_SLUG' },
        { status: 400 }
      );
    }

    // Check slug uniqueness
    const [existingOrg] = await db
      .select({ id: organizations.id })
      .from(organizations)
      .where(eq(organizations.slug, normalizedSlug))
      .limit(1);

    if (existingOrg) {
      return NextResponse.json(
        { error: 'An organization with this slug already exists', code: 'SLUG_CONFLICT' },
        { status: 409 }
      );
    }

    // Create organization and owner membership atomically
    const newOrg = await db.transaction(async (tx) => {
      const [createdOrg] = await tx
        .insert(organizations)
        .values({
          name: name.trim(),
          slug: normalizedSlug,
          logoUrl: typeof logoUrl === 'string' && logoUrl.trim() ? logoUrl.trim() : null,
          isActive: true,
        })
        .returning();

      await tx.insert(organizationMembers).values({
        organizationId: createdOrg.id,
        userId: user.id,
        role: 'owner',
        isActive: true,
      });

      await recordAuditEvent(
        {
          organizationId: createdOrg.id,
          userId: user.id,
          action: 'org:created',
          entityType: 'organizations',
          entityId: createdOrg.id,
          details: { name: createdOrg.name, slug: createdOrg.slug },
        },
        tx
      );

      return createdOrg;
    });

    return NextResponse.json(
      {
        status: 'ok',
        organization: newOrg,
        role: 'owner',
      },
      { status: 201 }
    );
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
