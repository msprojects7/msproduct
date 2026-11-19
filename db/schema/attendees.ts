import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  timestamp,
  jsonb,
  uniqueIndex,
  unique,
  index,
  foreignKey,
} from 'drizzle-orm/pg-core';
import { events } from './events';

export const importBatches = pgTable('import_batches', {
  id: uuid('id').defaultRandom().primaryKey(),
  eventId: uuid('event_id')
    .references(() => events.id, { onDelete: 'cascade' })
    .notNull(),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  storagePath: text('storage_path'), // S3 object key in assets bucket
  rowCount: integer('row_count').default(0).notNull(),
  importedCount: integer('imported_count').default(0).notNull(),
  rejectedCount: integer('rejected_count').default(0).notNull(),
  rejectionSummary: jsonb('rejection_summary'),
  createdBy: text('created_by').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  eventIdx: index('import_batches_event_idx').on(t.eventId),
  compositeIdEvent: unique('import_batches_composite_id_event').on(t.id, t.eventId),
}));

export const attendees = pgTable('attendees', {
  id: uuid('id').defaultRandom().primaryKey(),
  eventId: uuid('event_id')
    .references(() => events.id, { onDelete: 'cascade' })
    .notNull(),
  registrationNumber: varchar('registration_number', { length: 100 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  category: varchar('category', { length: 100 }).notNull(),
  phoneNumber: varchar('phone_number', { length: 50 }),
  email: varchar('email', { length: 255 }),
  gender: varchar('gender', { length: 50 }),
  medicalCouncilNumber: varchar('medical_council_number', { length: 100 }),
  foodPreference: varchar('food_preference', { length: 50 }).default('Not Specified').notNull(),
  paymentStatus: varchar('payment_status', { length: 50 }).default('Paid').notNull(),
  registrationType: varchar('registration_type', { length: 50 }).default('pre_registered').notNull(), // 'pre_registered' | 'spot'
  attendanceStatus: varchar('attendance_status', { length: 50 }).default('not_checked_in').notNull(), // 'not_checked_in' | 'checked_in' | 'checked_out'
  qrToken: uuid('qr_token').defaultRandom().notNull(),
  // Solves the composite ON DELETE SET NULL issue by referencing importBatches.id directly with set null
  importBatchId: uuid('import_batch_id')
    .references(() => importBatches.id, { onDelete: 'set null' }),
  createdBy: text('created_by'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  eventRegNoUnique: uniqueIndex('attendees_event_reg_no_unique').on(t.eventId, t.registrationNumber),
  eventQrTokenUnique: uniqueIndex('attendees_event_qr_token_unique').on(t.eventId, t.qrToken),
  // Composite unique key enables composite foreign keys from child tables (scan_events, badge_print_events)
  compositeIdEvent: unique('attendees_composite_id_event').on(t.id, t.eventId),
  eventIdx: index('attendees_event_idx').on(t.eventId),
  nameSearchIdx: index('attendees_name_search_idx').on(t.eventId, t.name),
  regNoIdx: index('attendees_reg_no_idx').on(t.eventId, t.registrationNumber),
  categoryIdx: index('attendees_category_idx').on(t.eventId, t.category),
  statusIdx: index('attendees_status_idx').on(t.eventId, t.attendanceStatus),
}));

export const scanEvents = pgTable('scan_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  eventId: uuid('event_id').notNull(),
  attendeeId: uuid('attendee_id').notNull(),
  action: varchar('action', { length: 50 }).notNull(), // 'check_in' | 'check_out'
  scannedAt: timestamp('scanned_at', { withTimezone: true }).defaultNow().notNull(),
  staffUserId: text('staff_user_id').notNull(),
  deviceInfo: text('device_info'),
  sessionId: text('session_id'),
}, (t) => ({
  // Composite foreign key guarantees scan cannot link to an attendee belonging to a different event
  attendeeCompositeFk: foreignKey({
    columns: [t.attendeeId, t.eventId],
    foreignColumns: [attendees.id, attendees.eventId],
  }).onDelete('cascade'),
  eventIdx: index('scan_events_event_idx').on(t.eventId),
  attendeeIdx: index('scan_events_attendee_idx').on(t.attendeeId),
  timeIdx: index('scan_events_time_idx').on(t.eventId, t.scannedAt),
}));

export const badgePrintEvents = pgTable('badge_print_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  eventId: uuid('event_id').notNull(),
  attendeeId: uuid('attendee_id').notNull(),
  printType: varchar('print_type', { length: 50 }).notNull(), // 'single' | 'reprint' | 'batch' | 'selected'
  reason: text('reason'),
  staffUserId: text('staff_user_id').notNull(),
  printedAt: timestamp('printed_at', { withTimezone: true }).defaultNow().notNull(),
  deviceInfo: text('device_info'),
}, (t) => ({
  attendeeCompositeFk: foreignKey({
    columns: [t.attendeeId, t.eventId],
    foreignColumns: [attendees.id, attendees.eventId],
  }).onDelete('cascade'),
  eventIdx: index('badge_prints_event_idx').on(t.eventId),
  attendeeIdx: index('badge_prints_attendee_idx').on(t.attendeeId),
}));

export const spotRegistrationKeys = pgTable('spot_registration_keys', {
  id: uuid('id').defaultRandom().primaryKey(),
  eventId: uuid('event_id').notNull(),
  idempotencyKey: varchar('idempotency_key', { length: 255 }).notNull(),
  attendeeId: uuid('attendee_id').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  eventKeyUnique: uniqueIndex('spot_keys_event_idempotency_unique').on(t.eventId, t.idempotencyKey),
  attendeeCompositeFk: foreignKey({
    columns: [t.attendeeId, t.eventId],
    foreignColumns: [attendees.id, attendees.eventId],
  }).onDelete('cascade'),
  eventIdx: index('spot_keys_event_idx').on(t.eventId),
}));
