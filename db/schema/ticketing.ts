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
import { attendees } from './attendees';

/**
 * 1. EVENT TICKETS (Ticket Class Management)
 * Defines ticket classes, inventory quotas, pricing, and sale windows.
 */
export const eventTickets = pgTable('event_tickets', {
  id: uuid('id').defaultRandom().primaryKey(),
  eventId: uuid('event_id')
    .references(() => events.id, { onDelete: 'cascade' })
    .notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  ticketType: varchar('ticket_type', { length: 50 }).default('paid').notNull(), // 'free' | 'paid' | 'donation'
  category: varchar('category', { length: 100 }).default('general').notNull(), // 'general' | 'vip' | 'early_bird' | 'standard' | 'student' | 'group' | 'custom'
  price: numeric('price', { precision: 10, scale: 2 }).default('0.00').notNull(),
  currency: varchar('currency', { length: 10 }).default('INR').notNull(),
  totalQuantity: integer('total_quantity').default(100).notNull(),
  soldQuantity: integer('sold_quantity').default(0).notNull(),
  reservedQuantity: integer('reserved_quantity').default(0).notNull(),
  minPerOrder: integer('min_per_order').default(1).notNull(),
  maxPerOrder: integer('max_per_order').default(10).notNull(),
  salesStart: timestamp('sales_start', { withTimezone: true }),
  salesEnd: timestamp('sales_end', { withTimezone: true }),
  visibility: varchar('visibility', { length: 50 }).default('public').notNull(), // 'public' | 'hidden' | 'access_code_only'
  status: varchar('status', { length: 50 }).default('draft').notNull(), // 'draft' | 'scheduled' | 'on_sale' | 'sold_out' | 'paused' | 'closed'
  displayOrder: integer('display_order').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  eventIdx: index('event_tickets_event_idx').on(t.eventId),
  eventStatusIdx: index('event_tickets_event_status_idx').on(t.eventId, t.status),
  eventOrderIdx: index('event_tickets_event_order_idx').on(t.eventId, t.displayOrder),
}));

/**
 * 2. TICKET PRICE RULES (Dynamic & Tiered Pricing)
 * Supports early-bird discounts, scheduled price changes, and group/volume discounts.
 */
export const ticketPriceRules = pgTable('ticket_price_rules', {
  id: uuid('id').defaultRandom().primaryKey(),
  ticketId: uuid('ticket_id')
    .references(() => eventTickets.id, { onDelete: 'cascade' })
    .notNull(),
  eventId: uuid('event_id')
    .references(() => events.id, { onDelete: 'cascade' })
    .notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  ruleType: varchar('rule_type', { length: 50 }).notNull(), // 'early_bird' | 'group' | 'scheduled'
  discountType: varchar('discount_type', { length: 50 }).default('percentage').notNull(), // 'percentage' | 'fixed_amount'
  discountValue: numeric('discount_value', { precision: 10, scale: 2 }).notNull(),
  minQuantity: integer('min_quantity').default(1).notNull(),
  maxQuantity: integer('max_quantity'),
  validFrom: timestamp('valid_from', { withTimezone: true }),
  validTo: timestamp('valid_to', { withTimezone: true }),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  ticketIdx: index('ticket_price_rules_ticket_idx').on(t.ticketId),
  eventIdx: index('ticket_price_rules_event_idx').on(t.eventId),
}));

/**
 * 3. EVENT PROMO CODES (Discounts & Vouchers)
 * Supports percentage, fixed amount, and free ticket promotions.
 */
export const eventPromoCodes = pgTable('event_promo_codes', {
  id: uuid('id').defaultRandom().primaryKey(),
  eventId: uuid('event_id')
    .references(() => events.id, { onDelete: 'cascade' })
    .notNull(),
  code: varchar('code', { length: 50 }).notNull(),
  description: text('description'),
  discountType: varchar('discount_type', { length: 50 }).default('percentage').notNull(), // 'percentage' | 'fixed_amount' | 'free_ticket'
  discountValue: numeric('discount_value', { precision: 10, scale: 2 }).notNull(),
  applicableTicketIds: jsonb('applicable_ticket_ids'), // Array of ticket UUIDs, null/empty = all tickets
  minPurchaseAmount: numeric('min_purchase_amount', { precision: 10, scale: 2 }).default('0.00').notNull(),
  maxTotalRedemptions: integer('max_total_redemptions'), // null = unlimited
  currentRedemptions: integer('current_redemptions').default(0).notNull(),
  maxRedemptionsPerUser: integer('max_redemptions_per_user').default(1).notNull(),
  validFrom: timestamp('valid_from', { withTimezone: true }),
  validTo: timestamp('valid_to', { withTimezone: true }),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  eventCodeUnique: uniqueIndex('event_promo_codes_event_code_unique').on(t.eventId, t.code),
  eventIdx: index('event_promo_codes_event_idx').on(t.eventId),
}));

/**
 * 4. PROMO CODE REDEMPTIONS (Historical Audit & Per-User Limits)
 */
export const promoCodeRedemptions = pgTable('promo_code_redemptions', {
  id: uuid('id').defaultRandom().primaryKey(),
  promoCodeId: uuid('promo_code_id')
    .references(() => eventPromoCodes.id, { onDelete: 'cascade' })
    .notNull(),
  eventId: uuid('event_id')
    .references(() => events.id, { onDelete: 'cascade' })
    .notNull(),
  orderId: uuid('order_id'), // Soft reference or set via order flow
  attendeeEmail: varchar('attendee_email', { length: 255 }).notNull(),
  discountApplied: numeric('discount_applied', { precision: 10, scale: 2 }).notNull(),
  redeemedAt: timestamp('redeemed_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  promoIdx: index('promo_redemptions_promo_idx').on(t.promoCodeId),
  eventIdx: index('promo_redemptions_event_idx').on(t.eventId),
  userPromoIdx: index('promo_redemptions_user_promo_idx').on(t.promoCodeId, t.attendeeEmail),
}));

/**
 * 5. REGISTRATION FORMS (Dynamic Form Configuration Container)
 */
export const registrationForms = pgTable('registration_forms', {
  id: uuid('id').defaultRandom().primaryKey(),
  eventId: uuid('event_id')
    .references(() => events.id, { onDelete: 'cascade' })
    .notNull(),
  title: varchar('title', { length: 255 }).default('Standard Registration Form').notNull(),
  description: text('description'),
  isPublished: boolean('is_published').default(true).notNull(),
  settings: jsonb('settings'), // E.g., { confirmationMessage, notifyOrganizer, allowMultipleAttendees }
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  eventFormUnique: uniqueIndex('registration_forms_event_unique').on(t.eventId),
  eventIdx: index('registration_forms_event_idx').on(t.eventId),
}));

/**
 * 6. REGISTRATION FORM FIELDS (Dynamic Field Definitions)
 * Supports 17 field types, validation rules, conditional logic, and display order.
 */
export const registrationFormFields = pgTable('registration_form_fields', {
  id: uuid('id').defaultRandom().primaryKey(),
  formId: uuid('form_id')
    .references(() => registrationForms.id, { onDelete: 'cascade' })
    .notNull(),
  eventId: uuid('event_id')
    .references(() => events.id, { onDelete: 'cascade' })
    .notNull(),
  fieldKey: varchar('field_key', { length: 100 }).notNull(), // Machine identifier, e.g. 'dietary_pref'
  fieldLabel: varchar('field_label', { length: 255 }).notNull(),
  fieldType: varchar('field_type', { length: 50 }).notNull(), // 'text' | 'textarea' | 'email' | 'phone' | 'number' | 'dropdown' | 'radio' | 'checkbox' | 'date' | 'country' | 'state' | 'address' | 'url' | 'file' | 'consent' | 'section' | 'info'
  description: text('description'),
  placeholder: varchar('placeholder', { length: 255 }),
  isRequired: boolean('is_required').default(false).notNull(),
  defaultValue: text('default_value'),
  options: jsonb('options'), // Array of { label: string, value: string }
  validationRules: jsonb('validation_rules'), // E.g., { min: number, max: number, pattern: string }
  conditionalLogic: jsonb('conditional_logic'), // E.g., { dependsOnFieldKey: string, operator: 'equals', value: any }
  displayOrder: integer('display_order').default(0).notNull(),
  isVisible: boolean('is_visible').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  formFieldKeyUnique: uniqueIndex('reg_form_fields_form_key_unique').on(t.formId, t.fieldKey),
  formOrderIdx: index('reg_form_fields_form_order_idx').on(t.formId, t.displayOrder),
  eventIdx: index('reg_form_fields_event_idx').on(t.eventId),
}));

/**
 * 7. REGISTRATION ORDERS (Order & Payment Lifecycle)
 * Seamlessly bridges ticket purchases with the existing attendees table.
 */
export const registrationOrders = pgTable('registration_orders', {
  id: uuid('id').defaultRandom().primaryKey(),
  eventId: uuid('event_id')
    .references(() => events.id, { onDelete: 'cascade' })
    .notNull(),
  orderNumber: varchar('order_number', { length: 100 }).notNull(),
  ticketId: uuid('ticket_id')
    .references(() => eventTickets.id, { onDelete: 'restrict' })
    .notNull(),
  promoCodeId: uuid('promo_code_id')
    .references(() => eventPromoCodes.id, { onDelete: 'set null' }),
  attendeeId: uuid('attendee_id')
    .references(() => attendees.id, { onDelete: 'set null' }),
  status: varchar('status', { length: 50 }).default('draft').notNull(), // 'draft' | 'pending_payment' | 'confirmed' | 'cancelled' | 'failed' | 'refunded'
  currency: varchar('currency', { length: 10 }).default('INR').notNull(),
  unitPrice: numeric('unit_price', { precision: 10, scale: 2 }).default('0.00').notNull(),
  quantity: integer('quantity').default(1).notNull(),
  grossAmount: numeric('gross_amount', { precision: 10, scale: 2 }).default('0.00').notNull(),
  discountAmount: numeric('discount_amount', { precision: 10, scale: 2 }).default('0.00').notNull(),
  taxAmount: numeric('tax_amount', { precision: 10, scale: 2 }).default('0.00').notNull(),
  finalAmount: numeric('final_amount', { precision: 10, scale: 2 }).default('0.00').notNull(),
  customerName: varchar('customer_name', { length: 255 }).notNull(),
  customerEmail: varchar('customer_email', { length: 255 }).notNull(),
  customerPhone: varchar('customer_phone', { length: 50 }),
  paymentProvider: varchar('payment_provider', { length: 50 }).default('none').notNull(), // 'none' | 'free' | 'razorpay'
  paymentReference: varchar('payment_reference', { length: 255 }),
  orderReference: varchar('order_reference', { length: 100 }), // Secure, unguessable public order token
  reservationExpiresAt: timestamp('reservation_expires_at', { withTimezone: true }), // Expiry timestamp for pending reservations
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  eventOrderNoUnique: uniqueIndex('reg_orders_event_order_no_unique').on(t.eventId, t.orderNumber),
  orderRefIdx: index('reg_orders_order_ref_idx').on(t.orderReference),
  eventIdx: index('reg_orders_event_idx').on(t.eventId),
  attendeeIdx: index('reg_orders_attendee_idx').on(t.attendeeId),
  ticketIdx: index('reg_orders_ticket_idx').on(t.ticketId),
  statusIdx: index('reg_orders_event_status_idx').on(t.eventId, t.status),
}));

/**
 * 8. REGISTRATION ANSWERS (Dynamic Form Field Submissions)
 * Stores respondent values against dynamic fields linked to attendee and order.
 */
export const registrationAnswers = pgTable('registration_answers', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id')
    .references(() => registrationOrders.id, { onDelete: 'cascade' })
    .notNull(),
  attendeeId: uuid('attendee_id')
    .references(() => attendees.id, { onDelete: 'cascade' })
    .notNull(),
  fieldId: uuid('field_id')
    .references(() => registrationFormFields.id, { onDelete: 'set null' }),
  fieldKey: varchar('field_key', { length: 100 }).notNull(),
  answerValue: jsonb('answer_value'), // Stores string, number, string[], boolean, or object
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  orderIdx: index('reg_answers_order_idx').on(t.orderId),
  attendeeIdx: index('reg_answers_attendee_idx').on(t.attendeeId),
  fieldIdx: index('reg_answers_field_idx').on(t.fieldId),
}));
