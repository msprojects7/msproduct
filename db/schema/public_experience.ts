import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  numeric,
  timestamp,
  jsonb,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';
import { events } from './events';
import { organizations } from './organizations';
import { attendees } from './attendees';
import { eventTickets, registrationOrders } from './ticketing';

/**
 * 1. EVENT WEBSITES (Microsite Branding & Builder Configuration)
 * Stores website layout, hero styling, active sections, theme colors, and SEO meta.
 */
export const eventWebsites = pgTable('event_websites', {
  id: uuid('id').defaultRandom().primaryKey(),
  eventId: uuid('event_id')
    .references(() => events.id, { onDelete: 'cascade' })
    .notNull(),
  organizationId: uuid('organization_id')
    .references(() => organizations.id, { onDelete: 'cascade' })
    .notNull(),
  isPublished: boolean('is_published').default(true).notNull(),
  theme: jsonb('theme').default({
    primaryColor: '#2563eb',
    secondaryColor: '#4f46e5',
    accentColor: '#06b6d4',
    darkMode: false,
  }).notNull(),
  heroTitle: varchar('hero_title', { length: 255 }),
  heroSubtitle: text('hero_subtitle'),
  heroCoverUrl: text('hero_cover_url'),
  logoUrl: text('logo_url'),
  aboutText: text('about_text'),
  sectionsConfig: jsonb('sections_config').default([
    { id: 'about', title: 'About Event', isVisible: true, displayOrder: 0 },
    { id: 'tickets', title: 'Passes & Registration', isVisible: true, displayOrder: 1 },
    { id: 'speakers', title: 'Featured Speakers', isVisible: true, displayOrder: 2 },
    { id: 'agenda', title: 'Schedule & Sessions', isVisible: true, displayOrder: 3 },
    { id: 'sponsors', title: 'Partners & Sponsors', isVisible: true, displayOrder: 4 },
    { id: 'exhibitors', title: 'Exhibitors', isVisible: true, displayOrder: 5 },
    { id: 'contact', title: 'Venue & Contact', isVisible: true, displayOrder: 6 },
  ]).notNull(),
  contactEmail: varchar('contact_email', { length: 255 }),
  contactPhone: varchar('contact_phone', { length: 50 }),
  address: text('address'),
  footerText: text('footer_text'),
  socialLinks: jsonb('social_links').default({}).notNull(),
  seoTitle: varchar('seo_title', { length: 255 }),
  seoDescription: text('seo_description'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  eventUnique: uniqueIndex('event_websites_event_unique').on(t.eventId),
  orgIdx: index('event_websites_org_idx').on(t.organizationId),
}));

/**
 * 2. REGISTRATION ORDER ITEMS (Multi-Attendee & Itemized Ticket Lines)
 * Supports multiple attendees and multiple ticket classes per single order.
 */
export const registrationOrderItems = pgTable('registration_order_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id')
    .references(() => registrationOrders.id, { onDelete: 'cascade' })
    .notNull(),
  eventId: uuid('event_id')
    .references(() => events.id, { onDelete: 'cascade' })
    .notNull(),
  ticketId: uuid('ticket_id')
    .references(() => eventTickets.id, { onDelete: 'restrict' })
    .notNull(),
  attendeeId: uuid('attendee_id')
    .references(() => attendees.id, { onDelete: 'set null' }),
  quantity: integer('quantity').default(1).notNull(),
  unitPrice: numeric('unit_price', { precision: 10, scale: 2 }).default('0.00').notNull(),
  subtotal: numeric('subtotal', { precision: 10, scale: 2 }).default('0.00').notNull(),
  discountAmount: numeric('discount_amount', { precision: 10, scale: 2 }).default('0.00').notNull(),
  taxAmount: numeric('tax_amount', { precision: 10, scale: 2 }).default('0.00').notNull(),
  finalAmount: numeric('final_amount', { precision: 10, scale: 2 }).default('0.00').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  orderIdx: index('reg_order_items_order_idx').on(t.orderId),
  ticketIdx: index('reg_order_items_ticket_idx').on(t.ticketId),
  attendeeIdx: index('reg_order_items_attendee_idx').on(t.attendeeId),
  eventIdx: index('reg_order_items_event_idx').on(t.eventId),
}));

/**
 * 3. INVENTORY RESERVATIONS (Time-Locked Ticket Reservation Engine)
 * Prevents overselling during checkout and allows graceful expiry / release.
 */
export const inventoryReservations = pgTable('inventory_reservations', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id')
    .references(() => registrationOrders.id, { onDelete: 'cascade' })
    .notNull(),
  eventId: uuid('event_id')
    .references(() => events.id, { onDelete: 'cascade' })
    .notNull(),
  ticketId: uuid('ticket_id')
    .references(() => eventTickets.id, { onDelete: 'cascade' })
    .notNull(),
  quantity: integer('quantity').notNull(),
  status: varchar('status', { length: 50 }).default('reserved').notNull(), // 'reserved' | 'confirmed' | 'released' | 'expired'
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  releasedAt: timestamp('released_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  orderIdx: index('inv_res_order_idx').on(t.orderId),
  ticketIdx: index('inv_res_ticket_idx').on(t.ticketId),
  statusIdx: index('inv_res_status_idx').on(t.eventId, t.status, t.expiresAt),
}));

/**
 * 4. PAYMENT TRANSACTIONS (Razorpay Gateway Records & Audit Trail)
 */
export const paymentTransactions = pgTable('payment_transactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id')
    .references(() => registrationOrders.id, { onDelete: 'cascade' })
    .notNull(),
  eventId: uuid('event_id')
    .references(() => events.id, { onDelete: 'cascade' })
    .notNull(),
  paymentProvider: varchar('payment_provider', { length: 50 }).default('razorpay').notNull(),
  gatewayOrderId: varchar('gateway_order_id', { length: 255 }),
  gatewayPaymentId: varchar('gateway_payment_id', { length: 255 }),
  gatewaySignature: text('gateway_signature'),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 10 }).default('INR').notNull(),
  status: varchar('status', { length: 50 }).default('created').notNull(), // 'created' | 'authorized' | 'captured' | 'failed' | 'refunded'
  errorMessage: text('error_message'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  orderIdx: index('pay_tx_order_idx').on(t.orderId),
  gatewayOrderIdx: index('pay_tx_gateway_order_idx').on(t.gatewayOrderId),
  gatewayPaymentIdx: index('pay_tx_gateway_pay_idx').on(t.gatewayPaymentId),
  eventIdx: index('pay_tx_event_idx').on(t.eventId),
}));

/**
 * 5. PAYMENT WEBHOOK EVENTS (Idempotent Webhook Processing Log)
 */
export const paymentWebhookEvents = pgTable('payment_webhook_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  gatewayEventId: varchar('gateway_event_id', { length: 255 }).notNull(),
  eventType: varchar('event_type', { length: 100 }).notNull(),
  paymentProvider: varchar('payment_provider', { length: 50 }).default('razorpay').notNull(),
  payload: jsonb('payload'),
  processed: boolean('processed').default(false).notNull(),
  processingError: text('processing_error'),
  processedAt: timestamp('processed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  gatewayEventUnique: uniqueIndex('pay_webhook_event_unique').on(t.gatewayEventId),
  processedIdx: index('pay_webhook_processed_idx').on(t.processed),
}));

/**
 * 6. TICKET DOCUMENTS (PDF Ticket Delivery & Download Tokens)
 */
export const ticketDocuments = pgTable('ticket_documents', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id')
    .references(() => registrationOrders.id, { onDelete: 'cascade' })
    .notNull(),
  attendeeId: uuid('attendee_id')
    .references(() => attendees.id, { onDelete: 'cascade' })
    .notNull(),
  eventId: uuid('event_id')
    .references(() => events.id, { onDelete: 'cascade' })
    .notNull(),
  ticketToken: varchar('ticket_token', { length: 255 }).notNull(),
  downloadUrl: text('download_url'),
  storageKey: text('storage_key'),
  status: varchar('status', { length: 50 }).default('ready').notNull(),
  generatedAt: timestamp('generated_at', { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  ticketTokenUnique: uniqueIndex('ticket_docs_token_unique').on(t.ticketToken),
  attendeeIdx: index('ticket_docs_attendee_idx').on(t.attendeeId),
  orderIdx: index('ticket_docs_order_idx').on(t.orderId),
  eventIdx: index('ticket_docs_event_idx').on(t.eventId),
}));

/**
 * 7. EMAIL DELIVERY LOGS (Audit & Retry Trail for Registration Communications)
 */
export const emailDeliveryLogs = pgTable('email_delivery_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  eventId: uuid('event_id')
    .references(() => events.id, { onDelete: 'cascade' })
    .notNull(),
  orderId: uuid('order_id')
    .references(() => registrationOrders.id, { onDelete: 'set null' }),
  recipientEmail: varchar('recipient_email', { length: 255 }).notNull(),
  emailType: varchar('email_type', { length: 100 }).notNull(), // 'registration_confirmation' | 'payment_receipt' | 'ticket_delivery' | 'organizer_alert'
  subject: text('subject').notNull(),
  status: varchar('status', { length: 50 }).default('sent').notNull(), // 'queued' | 'sent' | 'failed'
  errorMessage: text('error_message'),
  sentAt: timestamp('sent_at', { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  eventIdx: index('email_logs_event_idx').on(t.eventId),
  orderIdx: index('email_logs_order_idx').on(t.orderId),
  recipientIdx: index('email_logs_recipient_idx').on(t.recipientEmail),
}));
