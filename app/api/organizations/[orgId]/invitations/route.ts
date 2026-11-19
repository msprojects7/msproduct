import { NextRequest, NextResponse } from 'next/server';
import { requireOrgContext, AuthorizationError } from '@/lib/auth/context';
import { db } from '@/db/index';
import { organizationInvitations, organizationMembers } from '@/db/schema/index';
import { eq, and } from 'drizzle-orm';
import crypto from 'crypto';
import { recordAuditEvent } from '@/lib/audit';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import { sendEmail, isSmtpConfigured } from '@/lib/email';
import { invitationTemplate } from '@/lib/email/templates';

export const dynamic = 'force-dynamic';

/**
 * GET /api/organizations/[orgId]/invitations
 * Lists pending/active invitations for the organization.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { orgId: string } }
) {
  try {
    const context = await requireOrgContext(params.orgId);
    context.assertPermission('org:manage_members');

    const invitations = await db
      .select({
        id: organizationInvitations.id,
        email: organizationInvitations.email,
        role: organizationInvitations.role,
        status: organizationInvitations.status,
        expiresAt: organizationInvitations.expiresAt,
        createdAt: organizationInvitations.createdAt,
        invitedBy: organizationInvitations.invitedBy,
      })
      .from(organizationInvitations)
      .where(eq(organizationInvitations.organizationId, context.organization.id));

    return NextResponse.json({
      status: 'ok',
      organizationId: context.organization.id,
      invitations,
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
 * POST /api/organizations/[orgId]/invitations
 * Creates an organization invitation with a cryptographically secure token.
 * Only the SHA-256 hash of the token is stored in PostgreSQL.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { orgId: string } }
) {
  const ip = getClientIp(request.headers);
  const rateLimit = checkRateLimit(`invite_create:${ip}`, { windowMs: 60000, maxRequests: 20 });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many invitation requests. Please wait before retrying.', code: 'RATE_LIMIT_EXCEEDED' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(rateLimit.resetMs / 1000)) } }
    );
  }

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

    const { email, role } = body;

    if (!email || typeof email !== 'string' || !email.includes('@') || email.trim().length < 5) {
      return NextResponse.json(
        { error: 'A valid email address is required', code: 'INVALID_EMAIL' },
        { status: 400 }
      );
    }

    if (role !== 'admin' && role !== 'member') {
      return NextResponse.json(
        { error: "Invitation role must be 'admin' or 'member'", code: 'INVALID_ROLE' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if the user is already an active member of this organization
    const [existingMember] = await db
      .select({ id: organizationMembers.id, role: organizationMembers.role })
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.organizationId, context.organization.id),
          eq(organizationMembers.userId, normalizedEmail) // or checked during acceptance
        )
      )
      .limit(1);

    if (existingMember) {
      return NextResponse.json(
        { error: 'User is already an active member of this organization', code: 'ALREADY_MEMBER' },
        { status: 409 }
      );
    }

    // Generate high-entropy token (32 bytes = 256 bits of entropy)
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const [createdInvitation] = await db.transaction(async (tx) => {
      // Mark any prior pending invitations for this email in this org as revoked
      await tx
        .update(organizationInvitations)
        .set({ status: 'revoked', updatedAt: new Date() })
        .where(
          and(
            eq(organizationInvitations.organizationId, context.organization.id),
            eq(organizationInvitations.email, normalizedEmail),
            eq(organizationInvitations.status, 'pending')
          )
        );

      const [invitation] = await tx
        .insert(organizationInvitations)
        .values({
          organizationId: context.organization.id,
          email: normalizedEmail,
          role,
          tokenHash,
          invitedBy: context.user.id,
          status: 'pending',
          expiresAt,
        })
        .returning({
          id: organizationInvitations.id,
          organizationId: organizationInvitations.organizationId,
          email: organizationInvitations.email,
          role: organizationInvitations.role,
          status: organizationInvitations.status,
          expiresAt: organizationInvitations.expiresAt,
          createdAt: organizationInvitations.createdAt,
        });

      await recordAuditEvent(
        {
          organizationId: context.organization.id,
          userId: context.user.id,
          action: 'invitation:created',
          entityType: 'organization_invitations',
          entityId: invitation.id,
          details: {
            email: normalizedEmail,
            role,
            expiresAt: expiresAt.toISOString(),
          },
        },
        tx
      );

      return [invitation];
    });

    const origin = request.headers.get('origin') || request.nextUrl.origin;
    const inviteUrl = `${origin}/invitations/accept?token=${rawToken}`;

    let emailDelivered = false;
    let emailNotice = 'Email delivery provider is unconfigured. Share the invitation link directly with the recipient.';

    if (isSmtpConfigured()) {
      const emailContent = invitationTemplate({
        organizationName: context.organization.name,
        role,
        inviteUrl,
        recipientEmail: normalizedEmail,
        expiresInDays: 7,
      });
      const emailResult = await sendEmail({
        to: normalizedEmail,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
      });
      emailDelivered = emailResult.success;
      emailNotice = emailResult.success
        ? 'Invitation email successfully dispatched to recipient.'
        : `Email delivery attempt unfulfilled: ${emailResult.error}`;
    }

    return NextResponse.json(
      {
        status: 'ok',
        invitation: createdInvitation,
        token: rawToken,
        inviteUrl,
        emailDelivered,
        notice: emailNotice,
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
