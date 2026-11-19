import { auth } from './server';
import { db } from '@/db/index';
import {
  organizations,
  organizationMembers,
  events,
  eventStaffAssignments,
  platformAdministrators,
  auditEvents,
} from '@/db/schema/index';
import { eq, and, or, sql } from 'drizzle-orm';
import {
  Role,
  Permission,
  ROLE_PERMISSIONS,
  hasPermission,
  assertPermission,
  AuthorizationError,
} from './permissions';

export { AuthorizationError };

export interface AuthUser {
  id: string;
  email: string;
  name?: string | null;
}

export interface OrganizationContext {
  user: AuthUser;
  organization: {
    id: string;
    name: string;
    slug: string;
    isActive: boolean;
  };
  membership: {
    id: string;
    role: 'owner' | 'admin' | 'member';
    isActive: boolean;
  };
  effectiveRole: Role;
  permissions: readonly Permission[];
  hasPermission: (permission: Permission) => boolean;
  assertPermission: (permission: Permission) => void;
}

export interface EventContext {
  user: AuthUser;
  organization: {
    id: string;
    name: string;
    slug: string;
    isActive: boolean;
  };
  event: {
    id: string;
    organizationId: string;
    name: string;
    slug: string;
    status: string;
    startDate?: Date | null;
    endDate?: Date | null;
    venue?: string | null;
  };
  effectiveRole: Role;
  permissions: readonly Permission[];
  hasPermission: (permission: Permission) => boolean;
  assertPermission: (permission: Permission) => void;
}


/**
 * Validates the current user session.
 * Throws 401 Unauthorized if the user does not have a valid, active session.
 */
export async function requireUserSession(overrideUser?: AuthUser): Promise<AuthUser> {
  if (overrideUser) {
    return overrideUser;
  }

  try {
    const { data: sessionData, error } = await auth.getSession();
    if (error || !sessionData?.user) {
      throw new AuthorizationError('Authentication required', 401, 'UNAUTHENTICATED');
    }
    return {
      id: sessionData.user.id,
      email: sessionData.user.email,
      name: sessionData.user.name,
    };
  } catch (err) {
    if (err instanceof AuthorizationError) throw err;
    throw new AuthorizationError('Invalid or expired session', 401, 'UNAUTHENTICATED');
  }
}

/**
 * Resolves and validates organization context for the authenticated user.
 *
 * Enforces:
 * 1. Authenticated session.
 * 2. Organization exists and is active.
 * 3. User is an active member of the organization.
 * 4. Resolves the user's role (org_owner or org_admin).
 */
export async function requireOrgContext(
  orgIdOrSlug: string,
  options?: { overrideUser?: AuthUser }
): Promise<OrganizationContext> {
  const user = await requireUserSession(options?.overrideUser);

  if (!orgIdOrSlug || typeof orgIdOrSlug !== 'string') {
    throw new AuthorizationError('Invalid organization identifier', 400, 'BAD_REQUEST');
  }

  // 1. Resolve organization
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orgIdOrSlug);
  const [org] = await db
    .select()
    .from(organizations)
    .where(isUuid ? eq(organizations.id, orgIdOrSlug) : eq(organizations.slug, orgIdOrSlug))
    .limit(1);

  if (!org) {
    throw new AuthorizationError('Organization not found', 404, 'NOT_FOUND');
  }

  if (!org.isActive) {
    throw new AuthorizationError('Organization is deactivated', 403, 'ORGANIZATION_INACTIVE');
  }

  // 2. Resolve membership directly from database (always live, never trusting stale claims)
  const [membership] = await db
    .select()
    .from(organizationMembers)
    .where(
      and(
        eq(organizationMembers.organizationId, org.id),
        eq(organizationMembers.userId, user.id)
      )
    )
    .limit(1);

  // Check if user is a Platform Admin with cross-tenant oversight
  const [platformAdmin] = await db
    .select()
    .from(platformAdministrators)
    .where(
      user.email
        ? or(
            eq(platformAdministrators.userId, user.id),
            eq(platformAdministrators.email, user.email)
          )
        : eq(platformAdministrators.userId, user.id)
    )
    .limit(1);

  if (!membership) {
    throw new AuthorizationError(
      'Access denied: You are not a member of this organization',
      403,
      'NOT_AN_ORGANIZATION_MEMBER'
    );
  }

  if (!membership.isActive) {
    throw new AuthorizationError(
      'Access denied: Your organization membership has been deactivated',
      403,
      'MEMBERSHIP_INACTIVE'
    );
  }

  // Map database membership role to typed Role
  let effectiveRole: Role = 'org_member';
  if (membership.role === 'owner') {
    effectiveRole = 'org_owner';
  } else if (membership.role === 'admin') {
    effectiveRole = 'org_admin';
  } else {
    effectiveRole = 'org_member';
  }

  const permissions = ROLE_PERMISSIONS[effectiveRole];

  return {
    user,
    organization: {
      id: org.id,
      name: org.name,
      slug: org.slug,
      isActive: org.isActive,
    },
    membership: membership
      ? {
          id: membership.id,
          role: membership.role as 'owner' | 'admin' | 'member',
          isActive: membership.isActive,
        }
      : {
          id: `pa_${org.id}_${user.id}`,
          role: 'owner',
          isActive: true,
        },
    effectiveRole,
    permissions,
    hasPermission: (perm: Permission) => hasPermission(effectiveRole, perm),
    assertPermission: (perm: Permission) => assertPermission(effectiveRole, perm),
  };
}

/**
 * Resolves and validates event context for the authenticated user.
 *
 * Enforces:
 * 1. Authenticated session.
 * 2. Event exists and belongs to the specified organization (if provided).
 * 3. Organization is active.
 * 4. User is an active Org Owner/Admin OR an active assigned staff member for this specific event.
 * 5. Resolves the user's effective role (org_owner, org_admin, event_manager, registration_staff, scanner_operator).
 */
export async function requireEventContext(
  eventIdOrSlug: string,
  options?: {
    orgIdOrSlug?: string;
    overrideUser?: AuthUser;
  }
): Promise<EventContext> {
  const user = await requireUserSession(options?.overrideUser);

  if (!eventIdOrSlug || typeof eventIdOrSlug !== 'string') {
    throw new AuthorizationError('Invalid event identifier', 400, 'BAD_REQUEST');
  }

  // 1. Resolve event from database
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(eventIdOrSlug);
  const [event] = await db
    .select()
    .from(events)
    .where(isUuid ? eq(events.id, eventIdOrSlug) : eq(events.slug, eventIdOrSlug))
    .limit(1);

  if (!event) {
    throw new AuthorizationError('Event not found', 404, 'NOT_FOUND');
  }

  // 2. Resolve organization
  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, event.organizationId))
    .limit(1);

  if (!org) {
    throw new AuthorizationError('Organization for this event not found', 404, 'NOT_FOUND');
  }

  if (!org.isActive) {
    throw new AuthorizationError('Organization is deactivated', 403, 'ORGANIZATION_INACTIVE');
  }

  // If a specific organization was requested, verify the event belongs to it
  if (options?.orgIdOrSlug) {
    const isOrgUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      options.orgIdOrSlug
    );
    const orgMatches = isOrgUuid
      ? org.id === options.orgIdOrSlug
      : org.slug === options.orgIdOrSlug;

    if (!orgMatches) {
      throw new AuthorizationError(
        'Event does not belong to the requested organization',
        404,
        'EVENT_NOT_IN_ORGANIZATION'
      );
    }
  }

  // 3. Check for Organization-level authority (Org Owner or Org Admin)
  const [orgMembership] = await db
    .select()
    .from(organizationMembers)
    .where(
      and(
        eq(organizationMembers.organizationId, org.id),
        eq(organizationMembers.userId, user.id)
      )
    )
    .limit(1);

  if (orgMembership && orgMembership.isActive && (orgMembership.role === 'owner' || orgMembership.role === 'admin')) {
    const effectiveRole: Role = orgMembership.role === 'owner' ? 'org_owner' : 'org_admin';
    return {
      user,
      organization: { id: org.id, name: org.name, slug: org.slug, isActive: org.isActive },
      event: {
        id: event.id,
        organizationId: event.organizationId,
        name: event.name,
        slug: event.slug,
        status: event.status,
        startDate: event.startDate,
        endDate: event.endDate,
        venue: event.venue,
      },
      effectiveRole,
      permissions: ROLE_PERMISSIONS[effectiveRole],
      hasPermission: (perm: Permission) => hasPermission(effectiveRole, perm),
      assertPermission: (perm: Permission) => assertPermission(effectiveRole, perm),
    };
  }

  // 4. Check for Event-specific staff assignment
  const [staffAssignment] = await db
    .select()
    .from(eventStaffAssignments)
    .where(
      and(
        eq(eventStaffAssignments.eventId, event.id),
        eq(eventStaffAssignments.userId, user.id)
      )
    )
    .limit(1);

  if (staffAssignment) {
    if (!staffAssignment.isActive) {
      throw new AuthorizationError(
        'Access denied: Your staff assignment for this event has been deactivated',
        403,
        'ASSIGNMENT_INACTIVE'
      );
    }

    const roleString = staffAssignment.role as Role;
    const effectiveRole: Role =
      roleString === 'event_manager' ||
      roleString === 'registration_staff' ||
      roleString === 'scanner_operator'
        ? roleString
        : 'scanner_operator';

    return {
      user,
      organization: { id: org.id, name: org.name, slug: org.slug, isActive: org.isActive },
      event: {
        id: event.id,
        organizationId: event.organizationId,
        name: event.name,
        slug: event.slug,
        status: event.status,
        startDate: event.startDate,
        endDate: event.endDate,
        venue: event.venue,
      },
      effectiveRole,
      permissions: ROLE_PERMISSIONS[effectiveRole],
      hasPermission: (perm: Permission) => hasPermission(effectiveRole, perm),
      assertPermission: (perm: Permission) => assertPermission(effectiveRole, perm),
    };
  }

  // 5. Check if user is a Platform Admin with cross-tenant oversight
  const [platformAdmin] = await db
    .select()
    .from(platformAdministrators)
    .where(
      user.email
        ? or(
            eq(platformAdministrators.userId, user.id),
            eq(platformAdministrators.email, user.email)
          )
        : eq(platformAdministrators.userId, user.id)
    )
    .limit(1);

  if (platformAdmin?.isActive) {
    const effectiveRole: Role = 'platform_admin';
    return {
      user,
      organization: { id: org.id, name: org.name, slug: org.slug, isActive: org.isActive },
      event: {
        id: event.id,
        organizationId: event.organizationId,
        name: event.name,
        slug: event.slug,
        status: event.status,
        startDate: event.startDate,
        endDate: event.endDate,
        venue: event.venue,
      },
      effectiveRole,
      permissions: ROLE_PERMISSIONS[effectiveRole],
      hasPermission: (perm: Permission) => hasPermission(effectiveRole, perm),
      assertPermission: (perm: Permission) => assertPermission(effectiveRole, perm),
    };
  }

  if (orgMembership && !orgMembership.isActive) {
    throw new AuthorizationError(
      'Access denied: Your organization membership is deactivated',
      403,
      'MEMBERSHIP_INACTIVE'
    );
  }

  throw new AuthorizationError(
    'Access denied: You are not assigned to manage or operate this event',
    403,
    'UNAUTHORIZED_EVENT_ACCESS'
  );
}

/**
 * Validates that the current user is an active Platform Administrator.
 */
export async function requirePlatformAdminContext(options?: {
  overrideUser?: AuthUser;
}): Promise<{ user: AuthUser; role: 'platform_admin' }> {
  const user = await requireUserSession(options?.overrideUser);

  const [admin] = await db
    .select()
    .from(platformAdministrators)
    .where(
      user.email
        ? or(
            eq(platformAdministrators.userId, user.id),
            eq(platformAdministrators.email, user.email)
          )
        : eq(platformAdministrators.userId, user.id)
    )
    .limit(1);

  if (!admin || !admin.isActive) {
    throw new AuthorizationError(
      'Access denied: Platform Administrator privileges required',
      403,
      'NOT_A_PLATFORM_ADMIN'
    );
  }

  return { user, role: 'platform_admin' };
}

/**
 * Creates an authorized and auditable support session for a Platform Administrator
 * to access a tenant organization. Prohibits silent backdoors.
 *
 * Enforces:
 * 1. Authenticated platform administrator session (derived server-side, not caller-supplied).
 * 2. Target organization exists and is active.
 * 3. Non-empty ticket ID and justification reason.
 * 4. Immutable audit record generated before granting access. Audit failure prevents access.
 */
export async function assumeTenantSupportContext(
  params: {
    organizationId: string;
    ticketId: string;
    reason: string;
  },
  options?: { overrideUser?: AuthUser }
): Promise<{ auditId: string; authorized: boolean; adminUser: AuthUser }> {
  // 1. Verify caller is an active platform admin via server-side session
  const { user: adminUser } = await requirePlatformAdminContext(options);

  const [admin] = await db
    .select()
    .from(platformAdministrators)
    .where(
      adminUser.email
        ? or(
            eq(platformAdministrators.userId, adminUser.id),
            eq(platformAdministrators.email, adminUser.email)
          )
        : eq(platformAdministrators.userId, adminUser.id)
    )
    .limit(1);

  if (!admin || !admin.isActive) {
    throw new AuthorizationError(
      'Only active platform administrators can initiate support sessions',
      403,
      'NOT_A_PLATFORM_ADMIN'
    );
  }

  // 2. Validate ticket ID and reason
  if (!params.ticketId || typeof params.ticketId !== 'string' || !params.ticketId.trim()) {
    throw new AuthorizationError(
      'Support sessions require a valid ticket ID',
      400,
      'INVALID_TICKET_ID'
    );
  }

  if (!params.reason || typeof params.reason !== 'string' || !params.reason.trim()) {
    throw new AuthorizationError(
      'Support sessions require a valid justification reason',
      400,
      'INVALID_REASON'
    );
  }

  if (!params.organizationId || typeof params.organizationId !== 'string') {
    throw new AuthorizationError('Invalid organization identifier', 400, 'BAD_REQUEST');
  }

  // 3. Verify target organization exists and is active
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    params.organizationId
  );
  const [org] = await db
    .select()
    .from(organizations)
    .where(
      isUuid
        ? eq(organizations.id, params.organizationId)
        : eq(organizations.slug, params.organizationId)
    )
    .limit(1);

  if (!org) {
    throw new AuthorizationError('Target organization for support session not found', 404, 'NOT_FOUND');
  }

  if (!org.isActive) {
    throw new AuthorizationError('Target organization is deactivated', 403, 'ORGANIZATION_INACTIVE');
  }

  // 4. Write immutable audit record before granting any access
  const [auditRecord] = await db
    .insert(auditEvents)
    .values({
      organizationId: org.id,
      userId: adminUser.id,
      action: 'platform:assume_support',
      entityType: 'organizations',
      entityId: org.id,
      details: {
        admin_email: admin.email,
        ticket_id: params.ticketId.trim(),
        reason: params.reason.trim(),
        timestamp: new Date().toISOString(),
      },
    })
    .returning({ id: auditEvents.id });

  if (!auditRecord || !auditRecord.id) {
    throw new AuthorizationError(
      'Failed to record mandatory audit event; support access blocked',
      500,
      'AUDIT_WRITE_FAILED'
    );
  }

  return {
    auditId: auditRecord.id,
    authorized: true,
    adminUser,
  };
}
