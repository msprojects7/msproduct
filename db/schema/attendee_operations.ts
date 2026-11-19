import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  jsonb,
  timestamp,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';
import { events } from './events';
import { attendees } from './attendees';
import { eventSessions } from './content';

/**
 * ATTENDEE ACCESS TOKENS
 * Secure, tokenized magic-link access to attendee self-service portals.
 */
export const attendeeAccessTokens = pgTable('attendee_access_tokens', {
  id: uuid('id').defaultRandom().primaryKey(),
  attendeeId: uuid('attendee_id')
    .references(() => attendees.id, { onDelete: 'cascade' })
    .notNull(),
  eventId: uuid('event_id')
    .references(() => events.id, { onDelete: 'cascade' })
    .notNull(),
  tokenHash: varchar('token_hash', { length: 128 }).notNull().unique(),
  tokenValue: text('token_value'),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  usedAt: timestamp('used_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  eventAttendeeIdx: index('attendee_access_tokens_event_att_idx').on(t.eventId, t.attendeeId),
  tokenHashIdx: index('attendee_access_tokens_token_hash_idx').on(t.tokenHash),
}));

/**
 * ATTENDEE PREFERENCES & BADGE PRE-SELECTION
 * Self-service preferences, preferred badge display names, and accessibility/dietary requirements.
 */
export const attendeePreferences = pgTable('attendee_preferences', {
  id: uuid('id').defaultRandom().primaryKey(),
  attendeeId: uuid('attendee_id')
    .references(() => attendees.id, { onDelete: 'cascade' })
    .notNull(),
  eventId: uuid('event_id')
    .references(() => events.id, { onDelete: 'cascade' })
    .notNull(),
  preferredName: varchar('preferred_name', { length: 255 }),
  badgeOrganization: varchar('badge_organization', { length: 255 }),
  dietaryRequirements: text('dietary_requirements'),
  accessibilityNeeds: text('accessibility_needs'),
  badgeTemplateId: varchar('badge_template_id', { length: 100 }),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  uniqueAttendeeEvent: uniqueIndex('attendee_preferences_unique_att_event').on(t.attendeeId, t.eventId),
  eventIdx: index('attendee_preferences_event_idx').on(t.eventId),
}));

/**
 * SESSION ATTENDANCE
 * Fine-grained multi-track room scanning and session-level attendance logs.
 */
export const sessionAttendance = pgTable('session_attendance', {
  id: uuid('id').defaultRandom().primaryKey(),
  eventId: uuid('event_id')
    .references(() => events.id, { onDelete: 'cascade' })
    .notNull(),
  sessionId: uuid('session_id')
    .references(() => eventSessions.id, { onDelete: 'cascade' })
    .notNull(),
  attendeeId: uuid('attendee_id')
    .references(() => attendees.id, { onDelete: 'cascade' })
    .notNull(),
  action: varchar('action', { length: 50 }).default('check_in').notNull(), // 'check_in' | 'check_out'
  scannedAt: timestamp('scanned_at', { withTimezone: true }).defaultNow().notNull(),
  staffUserId: text('staff_user_id').notNull(),
  deviceInfo: text('device_info'),
}, (t) => ({
  eventIdx: index('session_attendance_event_idx').on(t.eventId),
  sessionAttendeeIdx: index('session_attendance_session_att_idx').on(t.sessionId, t.attendeeId),
  timeIdx: index('session_attendance_time_idx').on(t.eventId, t.scannedAt),
}));

/**
 * KIOSK SESSIONS
 * Dedicated session authentication for self-service onsite check-in kiosks.
 */
export const kioskSessions = pgTable('kiosk_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  eventId: uuid('event_id')
    .references(() => events.id, { onDelete: 'cascade' })
    .notNull(),
  kioskName: varchar('kiosk_name', { length: 100 }).notNull(),
  sessionToken: varchar('session_token', { length: 255 }).notNull().unique(),
  isActive: boolean('is_active').default(true).notNull(),
  lastActiveAt: timestamp('last_active_at', { withTimezone: true }).defaultNow().notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdById: text('created_by_id').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  eventIdx: index('kiosk_sessions_event_idx').on(t.eventId),
  tokenIdx: index('kiosk_sessions_token_idx').on(t.sessionToken),
}));

/**
 * CERTIFICATE TEMPLATES
 * Configurable certificate templates with criteria, signatures, and logos.
 */
export const certificateTemplates = pgTable('certificate_templates', {
  id: uuid('id').defaultRandom().primaryKey(),
  eventId: uuid('event_id')
    .references(() => events.id, { onDelete: 'cascade' })
    .notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  bodyText: text('body_text').notNull(),
  signatoryName: varchar('signatory_name', { length: 255 }).notNull(),
  signatoryTitle: varchar('signatory_title', { length: 255 }).notNull(),
  logoUrl: text('logo_url'),
  signatureUrl: text('signature_url'),
  criteriaType: varchar('criteria_type', { length: 50 }).default('check_in').notNull(), // 'check_in' | 'session_count' | 'manual'
  minSessionCount: integer('min_session_count').default(1).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  eventIdx: index('cert_templates_event_idx').on(t.eventId),
}));

/**
 * ISSUED CERTIFICATES
 * Verified digital credentials with tamper-proof reference codes and QR verification.
 */
export const issuedCertificates = pgTable('issued_certificates', {
  id: uuid('id').defaultRandom().primaryKey(),
  eventId: uuid('event_id')
    .references(() => events.id, { onDelete: 'cascade' })
    .notNull(),
  attendeeId: uuid('attendee_id')
    .references(() => attendees.id, { onDelete: 'cascade' })
    .notNull(),
  templateId: uuid('template_id')
    .references(() => certificateTemplates.id, { onDelete: 'cascade' })
    .notNull(),
  certificateReference: varchar('certificate_reference', { length: 100 }).notNull().unique(),
  verificationToken: varchar('verification_token', { length: 128 }).notNull().unique(),
  status: varchar('status', { length: 50 }).default('valid').notNull(), // 'valid' | 'revoked'
  issuedAt: timestamp('issued_at', { withTimezone: true }).defaultNow().notNull(),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  revocationReason: text('revocation_reason'),
}, (t) => ({
  uniqueCert: uniqueIndex('issued_certs_att_template_unique').on(t.eventId, t.attendeeId, t.templateId),
  eventIdx: index('issued_certs_event_idx').on(t.eventId),
  refIdx: index('issued_certs_ref_idx').on(t.certificateReference),
  tokenIdx: index('issued_certs_token_idx').on(t.verificationToken),
}));

/**
 * EVENT ZONES & ACCESS CONTROL
 * Named venue zones (VIP Lounge, Speaker Lounge, Main Hall, Media Zone, Backstage)
 * with capacity limits, operational hours, and authorized ticket classes.
 */
export const eventZones = pgTable('event_zones', {
  id: uuid('id').defaultRandom().primaryKey(),
  eventId: uuid('event_id')
    .references(() => events.id, { onDelete: 'cascade' })
    .notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  location: varchar('location', { length: 100 }),
  capacity: integer('capacity').default(0).notNull(),
  openTime: timestamp('open_time', { withTimezone: true }),
  closeTime: timestamp('close_time', { withTimezone: true }),
  isActive: boolean('is_active').default(true).notNull(),
  allowedTicketTypes: jsonb('allowed_ticket_types').default([]).notNull(), // array of ticket category strings or IDs
  allowedRoles: jsonb('allowed_roles').default([]).notNull(), // array of role strings (e.g. 'speaker', 'vip', 'staff')
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  eventIdx: index('event_zones_event_idx').on(t.eventId),
}));

/**
 * ZONE ACCESS LOGS
 * Complete, immutable ledger of all zone entry and exit scans.
 */
export const zoneAccessLogs = pgTable('zone_access_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  eventId: uuid('event_id')
    .references(() => events.id, { onDelete: 'cascade' })
    .notNull(),
  zoneId: uuid('zone_id')
    .references(() => eventZones.id, { onDelete: 'cascade' })
    .notNull(),
  attendeeId: uuid('attendee_id')
    .references(() => attendees.id, { onDelete: 'cascade' })
    .notNull(),
  action: varchar('action', { length: 50 }).default('check_in').notNull(), // 'check_in' | 'check_out'
  status: varchar('status', { length: 50 }).default('granted').notNull(), // 'granted' | 'denied'
  denialReason: varchar('denial_reason', { length: 100 }),
  scannedAt: timestamp('scanned_at', { withTimezone: true }).defaultNow().notNull(),
  staffUserId: text('staff_user_id').notNull(),
  deviceInfo: text('device_info'),
}, (t) => ({
  eventIdx: index('zone_access_logs_event_idx').on(t.eventId),
  zoneAttIdx: index('zone_access_logs_zone_att_idx').on(t.zoneId, t.attendeeId),
  timeIdx: index('zone_access_logs_time_idx').on(t.eventId, t.scannedAt),
}));

