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
  unique,
  index,
} from 'drizzle-orm/pg-core';
import { organizations } from './organizations';

export const events = pgTable('events', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id')
    .references(() => organizations.id, { onDelete: 'cascade' })
    .notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull(),
  venue: varchar('venue', { length: 255 }),
  startDate: timestamp('start_date', { withTimezone: true }),
  endDate: timestamp('end_date', { withTimezone: true }),
  status: varchar('status', { length: 50 }).default('draft').notNull(), // 'draft' | 'published' | 'ongoing' | 'archived'
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  orgEventSlugUnique: unique('events_org_slug_unique').on(t.organizationId, t.slug),
  orgIdx: index('events_org_idx').on(t.organizationId),
  compositeIdOrg: unique('events_composite_id_org').on(t.id, t.organizationId),
}));

export const eventStaffAssignments = pgTable('event_staff_assignments', {
  id: uuid('id').defaultRandom().primaryKey(),
  eventId: uuid('event_id')
    .references(() => events.id, { onDelete: 'cascade' })
    .notNull(),
  userId: text('user_id').notNull(),
  role: varchar('role', { length: 50 }).notNull(), // 'event_manager' | 'registration_staff' | 'scanner_operator'
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  eventUserUnique: uniqueIndex('staff_event_user_unique').on(t.eventId, t.userId),
  eventIdx: index('staff_event_idx').on(t.eventId),
  userIdx: index('staff_user_idx').on(t.userId),
}));

export const registrationCounters = pgTable('registration_counters', {
  id: uuid('id').defaultRandom().primaryKey(),
  eventId: uuid('event_id')
    .references(() => events.id, { onDelete: 'cascade' })
    .notNull(),
  counterKey: varchar('counter_key', { length: 100 }).notNull(), // 'faculty_counter', 'delegate_counter', etc.
  displayName: varchar('display_name', { length: 100 }).notNull(),
  prefix: varchar('prefix', { length: 20 }).notNull(), // 'PMCON26', 'BPCON-S'
  startValue: integer('start_value').default(1).notNull(),
  nextValue: integer('next_value').default(1).notNull(),
  padding: integer('padding').default(4).notNull(),
  lastUsedValue: integer('last_used_value'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  eventCounterUnique: uniqueIndex('counters_event_key_unique').on(t.eventId, t.counterKey),
  eventIdx: index('counters_event_idx').on(t.eventId),
}));

export const eventSettings = pgTable('event_settings', {
  id: uuid('id').defaultRandom().primaryKey(),
  eventId: uuid('event_id')
    .references(() => events.id, { onDelete: 'cascade' })
    .notNull(),
  key: varchar('key', { length: 100 }).notNull(), // 'badge_layout', 'spot_sticker_layout'
  value: jsonb('value').notNull(),
  updatedBy: text('updated_by'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  eventKeyUnique: uniqueIndex('settings_event_key_unique').on(t.eventId, t.key),
  eventIdx: index('settings_event_idx').on(t.eventId),
}));
