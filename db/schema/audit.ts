import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';
import { organizations } from './organizations';
import { events } from './events';

export const auditEvents = pgTable('audit_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id')
    .references(() => organizations.id, { onDelete: 'restrict' })
    .notNull(),
  eventId: uuid('event_id')
    .references(() => events.id, { onDelete: 'set null' }),
  userId: text('user_id').notNull(),
  action: varchar('action', { length: 100 }).notNull(),
  entityType: varchar('entity_type', { length: 100 }).notNull(),
  entityId: text('entity_id'),
  details: jsonb('details'),
  ipAddress: varchar('ip_address', { length: 50 }),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  orgTimeIdx: index('audit_events_org_time_idx').on(t.organizationId, t.createdAt),
  eventTimeIdx: index('audit_events_event_time_idx').on(t.eventId, t.createdAt),
  userIdx: index('audit_events_user_idx').on(t.userId),
  actionIdx: index('audit_events_action_idx').on(t.organizationId, t.action),
}));
