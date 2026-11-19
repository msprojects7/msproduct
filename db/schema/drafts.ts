import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { organizations } from './organizations';
import { events } from './events';

export const drafts = pgTable('drafts', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull(),
  organizationId: uuid('organization_id')
    .references(() => organizations.id, { onDelete: 'cascade' })
    .notNull(),
  eventId: uuid('event_id')
    .references(() => events.id, { onDelete: 'cascade' }),
  draftType: varchar('draft_type', { length: 100 }).notNull(), // 'event_form', 'attendee_form', 'badge_layout', 'spot_form', 'org_settings'
  data: jsonb('data').notNull(),
  version: integer('version').default(1).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  userOrgTypeIdx: index('drafts_user_org_type_idx').on(t.userId, t.organizationId, t.draftType),
  orgIdx: index('drafts_org_idx').on(t.organizationId),
  eventIdx: index('drafts_event_idx').on(t.eventId),
  timeIdx: index('drafts_time_idx').on(t.updatedAt),
}));

export type Draft = typeof drafts.$inferSelect;
export type NewDraft = typeof drafts.$inferInsert;
