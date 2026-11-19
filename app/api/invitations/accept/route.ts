import { NextRequest, NextResponse } from 'next/server';
import { requireUserSession, AuthorizationError } from '@/lib/auth/context';
import { db } from '@/db/index';
import { organizations, organizationMembers, organizationInvitations } from '@/db/schema/index';
import { eq, and } from 'drizzle-orm';
import crypto from 'crypto';
import { recordAuditEvent } from '@/lib/audit';

import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

/**
 * POST /api/invitations/accept
 * Accepts an organization invitation using its high-entropy token.
 * Authenticated user joins the organization with the predefined role.
 */
export async function POST(request: NextRequest) {
  const ip = getClientIp(request.headers);
  const rateLimit = checkRateLimit(`invite_accept:${ip}`, { windowMs: 60000, maxRequests: 15 });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many invitation attempts. Please wait before retrying.', code: 'RATE_LIMIT_EXCEEDED' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(rateLimit.resetMs / 1000)) } }
    );
  }
  try {
    const user = await requireUserSession();

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object' || !body.token || typeof body.token !== 'string') {
      return NextResponse.json(
        { error: 'Invitation token is required', code: 'BAD_REQUEST' },
        { status: 400 }
      );
    }

    const { token } = body;
    const tokenHash = crypto.createHash('sha256').update(token.trim()).digest('hex');

    // Transactionally validate, lock, and accept invitation
    const result = await db.transaction(async (tx) => {
      // 1. Resolve and lock invitation row FOR UPDATE
      const [invitation] = await tx
        .select()
        .from(organizationInvitations)
        .where(eq(organizationInvitations.tokenHash, tokenHash))
        .for('update')
        .limit(1);

      if (!invitation) {
        throw new AuthorizationError('Invalid invitation token', 404, 'INVITATION_NOT_FOUND');
      }

      if (invitation.status !== 'pending') {
        throw new AuthorizationError(
          `This invitation has already been ${invitation.status}`,
          400,
          'INVITATION_INACTIVE'
        );
      }

      if (new Date() > new Date(invitation.expiresAt)) {
        await tx
          .update(organizationInvitations)
          .set({ status: 'expired', updatedAt: new Date() })
          .where(eq(organizationInvitations.id, invitation.id));

        throw new AuthorizationError('This invitation has expired', 400, 'INVITATION_EXPIRED');
      }

      // 2. Validate invitee email identity (Audit B requirement 10)
      if (user.email.toLowerCase() !== invitation.email.toLowerCase()) {
        throw new AuthorizationError(
          `This invitation was issued to ${invitation.email}. Please sign in with the invited email address.`,
          403,
          'EMAIL_MISMATCH'
        );
      }

      // 3. Resolve organization status
      const [org] = await tx
        .select()
        .from(organizations)
        .where(eq(organizations.id, invitation.organizationId))
        .limit(1);

      if (!org || !org.isActive) {
        throw new AuthorizationError('The organization is no longer active', 403, 'ORGANIZATION_INACTIVE');
      }

      // 4. Check if user already has a membership in this org
      const [existingMem] = await tx
        .select()
        .from(organizationMembers)
        .where(
          and(
            eq(organizationMembers.organizationId, org.id),
            eq(organizationMembers.userId, user.id)
          )
        )
        .for('update')
        .limit(1);

      let targetMem;
      if (existingMem) {
        if (existingMem.isActive) {
          throw new AuthorizationError('You are already an active member of this organization', 409, 'ALREADY_MEMBER');
        }
        // Reactivate membership with invited role
        const [reactivated] = await tx
          .update(organizationMembers)
          .set({
            role: invitation.role,
            isActive: true,
            updatedAt: new Date(),
          })
          .where(eq(organizationMembers.id, existingMem.id))
          .returning();
        targetMem = reactivated;
      } else {
        const [created] = await tx
          .insert(organizationMembers)
          .values({
            organizationId: org.id,
            userId: user.id,
            role: invitation.role,
            isActive: true,
          })
          .returning();
        targetMem = created;
      }

      // 5. Mark invitation as accepted atomically
      const [acceptedInv] = await tx
        .update(organizationInvitations)
        .set({
          status: 'accepted',
          acceptedBy: user.id,
          acceptedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(organizationInvitations.id, invitation.id),
            eq(organizationInvitations.status, 'pending')
          )
        )
        .returning();

      if (!acceptedInv) {
        throw new AuthorizationError('Invitation was concurrently accepted or modified', 409, 'CONFLICT');
      }

      // 6. Write audit log atomically
      await recordAuditEvent(
        {
          organizationId: org.id,
          userId: user.id,
          action: 'invitation:accepted',
          entityType: 'organization_invitations',
          entityId: invitation.id,
          details: {
            role: invitation.role,
            email: invitation.email,
          },
        },
        tx
      );

      return {
        org,
        membership: targetMem,
      };
    });

    return NextResponse.json({
      status: 'ok',
      message: `Successfully joined ${result.org.name}`,
      organization: {
        id: result.org.id,
        name: result.org.name,
        slug: result.org.slug,
      },
      membership: {
        role: result.membership.role,
        isActive: result.membership.isActive,
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
