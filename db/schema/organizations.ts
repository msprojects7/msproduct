import { sql } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  timestamp,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';

export const organizations = pgTable('organizations', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  logoUrl: text('logo_url'),
  isActive: boolean('is_active').default(true).notNull(),
  planId: varchar('plan_id', { length: 50 }).default('free').notNull(),
  planActivatedAt: timestamp('plan_activated_at', { withTimezone: true }),
  planExpiresAt: timestamp('plan_expires_at', { withTimezone: true }),
  extraAttendeesQuota: integer('extra_attendees_quota').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const organizationMembers = pgTable('organization_members', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id')
    .references(() => organizations.id, { onDelete: 'cascade' })
    .notNull(),
  userId: text('user_id').notNull(),
  role: varchar('role', { length: 50 }).notNull(), // 'owner' | 'admin' | 'member'
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  orgUserUnique: uniqueIndex('org_members_org_user_unique').on(t.organizationId, t.userId),
  orgIdx: index('org_members_org_idx').on(t.organizationId),
  userIdx: index('org_members_user_idx').on(t.userId),
  singleOwnerUnique: uniqueIndex('org_members_single_owner_unique').on(t.organizationId).where(sql`"role" = 'owner'`),
}));

export const platformAdministrators = pgTable('platform_administrators', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull().unique(),
  email: varchar('email', { length: 255 }).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  userIdx: index('platform_admins_user_idx').on(t.userId),
}));

export const organizationInvitations = pgTable('organization_invitations', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id')
    .references(() => organizations.id, { onDelete: 'cascade' })
    .notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).notNull(), // 'admin' | 'member'
  tokenHash: varchar('token_hash', { length: 64 }).notNull().unique(),
  invitedBy: text('invited_by').notNull(),
  status: varchar('status', { length: 50 }).default('pending').notNull(), // 'pending' | 'accepted' | 'revoked' | 'expired'
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  acceptedBy: text('accepted_by'),
  acceptedAt: timestamp('accepted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  orgIdx: index('invitations_org_idx').on(t.organizationId),
  emailIdx: index('invitations_email_idx').on(t.email),
  tokenHashIdx: index('invitations_token_hash_idx').on(t.tokenHash),
  statusIdx: index('invitations_status_idx').on(t.status),
}));
