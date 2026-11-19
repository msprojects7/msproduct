import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  timestamp,
  jsonb,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';
import { organizations } from './organizations';
import { events } from './events';

/**
 * REUSABLE SPEAKERS DIRECTORY (Scoped to Organization)
 * Reusable speaker profiles across multiple events within an organization.
 */
export const speakers = pgTable('speakers', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id')
    .references(() => organizations.id, { onDelete: 'cascade' })
    .notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  title: varchar('title', { length: 255 }),
  company: varchar('company', { length: 255 }),
  bio: text('bio'),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 50 }),
  photoUrl: text('photo_url'),
  websiteUrl: text('website_url'),
  linkedinUrl: text('linkedin_url'),
  twitterUrl: text('twitter_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  orgIdx: index('speakers_org_idx').on(t.organizationId),
  orgNameIdx: index('speakers_org_name_idx').on(t.organizationId, t.name),
}));

/**
 * EVENT SPEAKERS (Event-Specific Associations)
 * Links an organization speaker to a specific event with featured status and display ordering.
 */
export const eventSpeakers = pgTable('event_speakers', {
  id: uuid('id').defaultRandom().primaryKey(),
  eventId: uuid('event_id')
    .references(() => events.id, { onDelete: 'cascade' })
    .notNull(),
  speakerId: uuid('speaker_id')
    .references(() => speakers.id, { onDelete: 'cascade' })
    .notNull(),
  featured: boolean('featured').default(false).notNull(),
  displayOrder: integer('display_order').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  eventSpeakerUnique: uniqueIndex('event_speakers_event_speaker_unique').on(t.eventId, t.speakerId),
  eventIdx: index('event_speakers_event_idx').on(t.eventId),
  speakerIdx: index('event_speakers_speaker_idx').on(t.speakerId),
}));

/**
 * EVENT TRACKS & ROOMS
 * Configurable multi-track streams and room allocations per event.
 */
export const eventTracks = pgTable('event_tracks', {
  id: uuid('id').defaultRandom().primaryKey(),
  eventId: uuid('event_id')
    .references(() => events.id, { onDelete: 'cascade' })
    .notNull(),
  name: varchar('name', { length: 100 }).notNull(), // e.g. "Main Track", "Clinical Surgery", "Pediatrics"
  roomName: varchar('room_name', { length: 100 }), // e.g. "Auditorium Hall A", "Workshop Room 2"
  capacity: integer('capacity').default(0).notNull(),
  color: varchar('color', { length: 30 }).default('#3B82F6').notNull(),
  displayOrder: integer('display_order').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  eventTrackNameUnique: uniqueIndex('event_tracks_event_name_unique').on(t.eventId, t.name),
  eventIdx: index('event_tracks_event_idx').on(t.eventId),
}));

/**
 * EVENT SESSIONS
 * Scheduled agenda sessions within tracks, with room assignment, time boundaries, and tags.
 */
export const eventSessions = pgTable('event_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  eventId: uuid('event_id')
    .references(() => events.id, { onDelete: 'cascade' })
    .notNull(),
  trackId: uuid('track_id')
    .references(() => eventTracks.id, { onDelete: 'set null' }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  sessionDate: timestamp('session_date', { withTimezone: true }),
  startTime: timestamp('start_time', { withTimezone: true }).notNull(),
  endTime: timestamp('end_time', { withTimezone: true }).notNull(),
  room: varchar('room', { length: 100 }),
  capacity: integer('capacity'),
  status: varchar('status', { length: 50 }).default('scheduled').notNull(), // 'scheduled' | 'live' | 'completed' | 'cancelled'
  tags: jsonb('tags'), // Array of string tags e.g. ["Keynote", "Surgery", "CME"]
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  eventIdx: index('event_sessions_event_idx').on(t.eventId),
  trackIdx: index('event_sessions_track_idx').on(t.trackId),
  timeIdx: index('event_sessions_time_idx').on(t.eventId, t.startTime, t.endTime),
}));

/**
 * SESSION SPEAKERS
 * Many-to-many relationship supporting multiple speakers, keynotes, panelists, and moderators per session.
 */
export const sessionSpeakers = pgTable('session_speakers', {
  id: uuid('id').defaultRandom().primaryKey(),
  sessionId: uuid('session_id')
    .references(() => eventSessions.id, { onDelete: 'cascade' })
    .notNull(),
  speakerId: uuid('speaker_id')
    .references(() => speakers.id, { onDelete: 'cascade' })
    .notNull(),
  role: varchar('role', { length: 50 }).default('speaker').notNull(), // 'keynote' | 'speaker' | 'panelist' | 'moderator'
  displayOrder: integer('display_order').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  sessionSpeakerUnique: uniqueIndex('session_speakers_session_speaker_unique').on(t.sessionId, t.speakerId),
  sessionIdx: index('session_speakers_session_idx').on(t.sessionId),
  speakerIdx: index('session_speakers_speaker_idx').on(t.speakerId),
}));

/**
 * EVENT SPONSORS
 * Tiered sponsor showcase supporting hierarchical display ordering and links.
 */
export const eventSponsors = pgTable('event_sponsors', {
  id: uuid('id').defaultRandom().primaryKey(),
  eventId: uuid('event_id')
    .references(() => events.id, { onDelete: 'cascade' })
    .notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  tier: varchar('tier', { length: 50 }).notNull(), // 'Title' | 'Platinum' | 'Gold' | 'Silver' | 'Bronze' | 'Partner' | 'Custom'
  logoUrl: text('logo_url'),
  websiteUrl: text('website_url'),
  displayOrder: integer('display_order').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  eventIdx: index('event_sponsors_event_idx').on(t.eventId),
  tierOrderIdx: index('event_sponsors_tier_order_idx').on(t.eventId, t.tier, t.displayOrder),
}));

/**
 * EVENT EXHIBITORS
 * Exhibitor booth directory enforcing collision-free stall allocations and contact metadata.
 */
export const eventExhibitors = pgTable('event_exhibitors', {
  id: uuid('id').defaultRandom().primaryKey(),
  eventId: uuid('event_id')
    .references(() => events.id, { onDelete: 'cascade' })
    .notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  boothNumber: varchar('booth_number', { length: 50 }).notNull(),
  contactName: varchar('contact_name', { length: 255 }),
  contactEmail: varchar('contact_email', { length: 255 }),
  contactPhone: varchar('contact_phone', { length: 50 }),
  description: text('description'),
  websiteUrl: text('website_url'),
  logoUrl: text('logo_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  eventBoothUnique: uniqueIndex('event_exhibitors_event_booth_unique').on(t.eventId, t.boothNumber),
  eventIdx: index('event_exhibitors_event_idx').on(t.eventId),
}));
