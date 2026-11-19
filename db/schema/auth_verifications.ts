import {
  pgTable,
  uuid,
  varchar,
  integer,
  boolean,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';

export const emailVerifications = pgTable('email_verifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull(),
  otpHash: varchar('otp_hash', { length: 64 }).notNull(),
  purpose: varchar('purpose', { length: 50 }).default('registration').notNull(),
  attempts: integer('attempts').default(0).notNull(),
  maxAttempts: integer('max_attempts').default(5).notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  verifiedAt: timestamp('verified_at', { withTimezone: true }),
  verificationGrant: varchar('verification_grant', { length: 64 }),
  grantExpiresAt: timestamp('grant_expires_at', { withTimezone: true }),
  isConsumed: boolean('is_consumed').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  emailPurposeIdx: index('verifications_email_purpose_idx').on(t.email, t.purpose),
  grantIdx: index('verifications_grant_idx').on(t.verificationGrant),
  expiryIdx: index('verifications_expiry_idx').on(t.expiresAt),
}));

export type EmailVerification = typeof emailVerifications.$inferSelect;
export type NewEmailVerification = typeof emailVerifications.$inferInsert;
