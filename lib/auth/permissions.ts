/**
 * MS BACKSTAGE — CENTRALIZED PERMISSIONS & RBAC MODEL
 *
 * Implements strict, server-side role-based authorization for multi-tenant organizations
 * and scoped events.
 */

export type Role =
  | 'platform_admin'
  | 'org_owner'
  | 'org_admin'
  | 'org_member'
  | 'event_manager'
  | 'registration_staff'
  | 'scanner_operator';

export type Permission =
  // Platform permissions
  | 'platform:manage'
  | 'platform:audit'
  | 'platform:assume_support'

  // Organization-level permissions
  | 'org:view'
  | 'org:update'
  | 'org:delete'
  | 'org:transfer_ownership'
  | 'org:manage_members'
  | 'org:create_event'
  | 'org:view_audit'

  // Event-level permissions
  | 'event:view'
  | 'event:update'
  | 'event:delete'
  | 'event:manage_staff'
  | 'event:update_settings'
  | 'event:manage_counters'
  | 'event:import_attendees'
  | 'event:export_attendees'
  | 'event:view_attendee_pii'
  | 'event:create_attendee'
  | 'event:update_attendee'
  | 'event:delete_attendee'
  | 'event:print_badge'
  | 'event:scan_badge'
  | 'event:view_scans'
  | 'event:manage_content'
  // Stage 2: Ticketing, Pricing, Promo Codes & Dynamic Registration
  | 'event:manage_tickets'
  | 'event:manage_pricing'
  | 'event:manage_promocodes'
  | 'event:manage_registration_forms'
  | 'event:view_registrations'
  // Stage 3: Public Website & Microsite Builder
  | 'event:manage_website'
  // Stage 4: Attendee Self-Service, Onsite Check-In, Kiosk, Analytics & Certificates
  | 'event:manage_checkin'
  | 'event:override_checkin'
  | 'event:manage_kiosk'
  | 'event:manage_session_attendance'
  | 'event:view_attendance_analytics'
  | 'event:manage_badge_printing'
  | 'event:manage_certificates'
  | 'event:issue_certificates'
  | 'event:revoke_certificates';

/**
 * Strict permission matrix mapping roles to their allowed permissions.
 */
export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  platform_admin: [
    'platform:manage',
    'platform:audit',
    'platform:assume_support',
    // Platform administrators do NOT receive automatic global bypass to tenant PII
  ],

  org_owner: [
    'org:view',
    'org:update',
    'org:delete',
    'org:transfer_ownership',
    'org:manage_members',
    'org:create_event',
    'org:view_audit',
    'event:view',
    'event:update',
    'event:delete',
    'event:manage_staff',
    'event:update_settings',
    'event:manage_counters',
    'event:import_attendees',
    'event:export_attendees',
    'event:view_attendee_pii',
    'event:create_attendee',
    'event:update_attendee',
    'event:delete_attendee',
    'event:print_badge',
    'event:scan_badge',
    'event:view_scans',
    'event:manage_content',
    'event:manage_tickets',
    'event:manage_pricing',
    'event:manage_promocodes',
    'event:manage_registration_forms',
    'event:view_registrations',
    'event:manage_website',
    'event:manage_checkin',
    'event:override_checkin',
    'event:manage_kiosk',
    'event:manage_session_attendance',
    'event:view_attendance_analytics',
    'event:manage_badge_printing',
    'event:manage_certificates',
    'event:issue_certificates',
    'event:revoke_certificates',
  ],

  org_admin: [
    'org:view',
    'org:update',
    // Prohibited from org:delete and org:transfer_ownership
    'org:manage_members',
    'org:create_event',
    'org:view_audit',
    'event:view',
    'event:update',
    'event:delete',
    'event:manage_staff',
    'event:update_settings',
    'event:manage_counters',
    'event:import_attendees',
    'event:export_attendees',
    'event:view_attendee_pii',
    'event:create_attendee',
    'event:update_attendee',
    'event:delete_attendee',
    'event:print_badge',
    'event:scan_badge',
    'event:view_scans',
    'event:manage_content',
    'event:manage_tickets',
    'event:manage_pricing',
    'event:manage_promocodes',
    'event:manage_registration_forms',
    'event:view_registrations',
    'event:manage_website',
    'event:manage_checkin',
    'event:override_checkin',
    'event:manage_kiosk',
    'event:manage_session_attendance',
    'event:view_attendance_analytics',
    'event:manage_badge_printing',
    'event:manage_certificates',
    'event:issue_certificates',
    'event:revoke_certificates',
  ],

  org_member: [
    'org:view',
    // Regular members hold only baseline view access; cannot manage org, events, or members
  ],

  event_manager: [
    'event:view',
    'event:update',
    // Prohibited from deleting event
    'event:manage_staff',
    'event:update_settings',
    'event:manage_counters',
    'event:import_attendees',
    'event:export_attendees',
    'event:view_attendee_pii',
    'event:create_attendee',
    'event:update_attendee',
    'event:delete_attendee',
    'event:print_badge',
    'event:scan_badge',
    'event:view_scans',
    'event:manage_content',
    'event:manage_tickets',
    'event:manage_pricing',
    'event:manage_promocodes',
    'event:manage_registration_forms',
    'event:view_registrations',
    'event:manage_website',
    'event:manage_checkin',
    'event:override_checkin',
    'event:manage_kiosk',
    'event:manage_session_attendance',
    'event:view_attendance_analytics',
    'event:manage_badge_printing',
    'event:manage_certificates',
    'event:issue_certificates',
    'event:revoke_certificates',
  ],

  registration_staff: [
    'event:view',
    'event:view_attendee_pii',
    'event:create_attendee', // Spot registration
    'event:update_attendee', // Updating attendee details
    // Prohibited: event:delete_attendee
    'event:print_badge',
    'event:scan_badge',
    'event:view_scans',
    'event:view_registrations',
    'event:manage_checkin',
    'event:override_checkin',
    'event:manage_kiosk',
    'event:manage_session_attendance',
    'event:view_attendance_analytics',
    'event:manage_badge_printing',
    'event:issue_certificates',
  ],

  scanner_operator: [
    'event:view',
    // Prohibited: event:view_attendee_pii (receives only minimal verification data)
    // Prohibited: event:create_attendee, event:update_attendee, event:delete_attendee
    // Prohibited: event:update_settings, event:manage_counters, event:print_badge
    'event:scan_badge',
    'event:view_scans',
    'event:manage_checkin',
    'event:manage_session_attendance',
  ],
};

export class AuthorizationError extends Error {
  statusCode: number;
  code: string;

  constructor(message: string, statusCode = 403, code = 'FORBIDDEN') {
    super(message);
    this.name = 'AuthorizationError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

/**
 * Checks whether a given role holds a specific permission.
 */
export function hasPermission(role: Role, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  if (!permissions) return false;
  return permissions.includes(permission);
}

/**
 * Throws an authorization error if the role does not have the required permission.
 */
export function assertPermission(role: Role, permission: Permission): void {
  if (!hasPermission(role, permission)) {
    throw new AuthorizationError(
      `Forbidden: Role '${role}' lacks permission '${permission}'`,
      403,
      'FORBIDDEN'
    );
  }
}
