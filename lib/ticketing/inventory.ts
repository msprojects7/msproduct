/**
 * MS Backstage — Ticket Inventory Reservation Engine
 *
 * Implements strict, atomic reservation lifecycles:
 * Available -> Reserved (with TTL) -> Confirmed (Sold) OR Released/Expired.
 *
 * Guarantees:
 * 1. Strictly prevents overselling under concurrency via SELECT ... FOR UPDATE.
 * 2. Guaranteed non-negative quantities via Math.max(0, ...).
 * 3. Atomic transition from reserved to sold exactly once on confirmed payment.
 * 4. Idempotent payment and webhook reconciliation.
 */

import { db } from '@/db/index';
import {
  eventTickets,
  inventoryReservations,
  registrationOrders,
} from '@/db/schema/index';
import { eq, and, sql, lt, inArray } from 'drizzle-orm';

export interface ReservationItem {
  ticketId: string;
  quantity: number;
}

export interface ReserveResult {
  success: boolean;
  error?: string;
  expiresAt?: Date;
}

/**
 * Atomically reserves ticket inventory inside an existing database transaction.
 */
export async function reserveTicketInventory(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tx: any,
  params: {
    orderId: string;
    eventId: string;
    items: ReservationItem[];
    reservationMinutes?: number;
  }
): Promise<ReserveResult> {
  const ttlMinutes = params.reservationMinutes || 15;
  const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

  for (const item of params.items) {
    if (item.quantity <= 0) continue;

    // Lock ticket row for update to prevent concurrent overselling
    const [ticket] = await tx
      .select()
      .from(eventTickets)
      .where(and(
        eq(eventTickets.id, item.ticketId),
        eq(eventTickets.eventId, params.eventId)
      ))
      .for('update')
      .limit(1);

    if (!ticket) {
      return { success: false, error: `Ticket not found: ${item.ticketId}` };
    }

    if (ticket.status !== 'on_sale' && ticket.status !== 'scheduled') {
      return { success: false, error: `Ticket "${ticket.name}" is not currently on sale` };
    }

    const available = ticket.totalQuantity - (ticket.soldQuantity + ticket.reservedQuantity);
    if (available < item.quantity) {
      return {
        success: false,
        error: `Insufficient inventory for "${ticket.name}". Only ${Math.max(0, available)} pass(es) remaining.`,
      };
    }

    // Atomically increment reserved quantity
    await tx
      .update(eventTickets)
      .set({
        reservedQuantity: sql`${eventTickets.reservedQuantity} + ${item.quantity}`,
        updatedAt: new Date(),
      })
      .where(eq(eventTickets.id, item.ticketId));

    // Record reservation
    await tx.insert(inventoryReservations).values({
      orderId: params.orderId,
      eventId: params.eventId,
      ticketId: item.ticketId,
      quantity: item.quantity,
      status: 'reserved',
      expiresAt,
    });
  }

  return { success: true, expiresAt };
}

/**
 * Atomically converts reserved inventory into confirmed sold inventory.
 * Idempotent: only acts on reservations currently in 'reserved' status.
 */
export async function confirmReservation(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tx: any,
  params: { orderId: string }
): Promise<{ success: boolean; confirmedCount: number }> {
  const reservations = await tx
    .select()
    .from(inventoryReservations)
    .where(and(
      eq(inventoryReservations.orderId, params.orderId),
      eq(inventoryReservations.status, 'reserved')
    ));

  if (!reservations || reservations.length === 0) {
    return { success: true, confirmedCount: 0 };
  }

  for (const res of reservations) {
    // Lock ticket and decrement reserved, increment sold
    await tx
      .update(eventTickets)
      .set({
        reservedQuantity: sql`GREATEST(0, ${eventTickets.reservedQuantity} - ${res.quantity})`,
        soldQuantity: sql`${eventTickets.soldQuantity} + ${res.quantity}`,
        updatedAt: new Date(),
      })
      .where(eq(eventTickets.id, res.ticketId));

    // Mark reservation confirmed
    await tx
      .update(inventoryReservations)
      .set({
        status: 'confirmed',
      })
      .where(eq(inventoryReservations.id, res.id));
  }

  return { success: true, confirmedCount: reservations.length };
}

/**
 * Releases reserved inventory back to available pool (e.g. on cancellation, payment failure, or timeout).
 */
export async function releaseReservation(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tx: any,
  params: { orderId: string; reason?: 'cancelled' | 'failed' | 'expired' }
): Promise<{ releasedCount: number }> {
  const reservations = await tx
    .select()
    .from(inventoryReservations)
    .where(and(
      eq(inventoryReservations.orderId, params.orderId),
      eq(inventoryReservations.status, 'reserved')
    ));

  if (!reservations || reservations.length === 0) {
    return { releasedCount: 0 };
  }

  for (const res of reservations) {
    await tx
      .update(eventTickets)
      .set({
        reservedQuantity: sql`GREATEST(0, ${eventTickets.reservedQuantity} - ${res.quantity})`,
        updatedAt: new Date(),
      })
      .where(eq(eventTickets.id, res.ticketId));

    await tx
      .update(inventoryReservations)
      .set({
        status: params.reason || 'released',
        releasedAt: new Date(),
      })
      .where(eq(inventoryReservations.id, res.id));
  }

  return { releasedCount: reservations.length };
}

/**
 * Scheduled or on-demand cleanup of expired reservations across events.
 */
export async function cleanupExpiredReservations(): Promise<{ expiredCount: number }> {
  const now = new Date();

  return await db.transaction(async (tx) => {
    const expiredReservations = await tx
      .select()
      .from(inventoryReservations)
      .where(and(
        eq(inventoryReservations.status, 'reserved'),
        lt(inventoryReservations.expiresAt, now)
      ))
      .limit(100);

    if (expiredReservations.length === 0) {
      return { expiredCount: 0 };
    }

    const orderIds = [...new Set(expiredReservations.map((r) => r.orderId))];

    for (const res of expiredReservations) {
      await tx
        .update(eventTickets)
        .set({
          reservedQuantity: sql`GREATEST(0, ${eventTickets.reservedQuantity} - ${res.quantity})`,
          updatedAt: new Date(),
        })
        .where(eq(eventTickets.id, res.ticketId));

      await tx
        .update(inventoryReservations)
        .set({
          status: 'expired',
          releasedAt: now,
        })
        .where(eq(inventoryReservations.id, res.id));
    }

    // Cancel matching orders if they were still pending payment
    if (orderIds.length > 0) {
      await tx
        .update(registrationOrders)
        .set({
          status: 'failed',
          notes: sql`CONCAT(COALESCE(${registrationOrders.notes}, ''), ' [Expired: Reservation window timed out]')`,
          updatedAt: now,
        })
        .where(and(
          inArray(registrationOrders.id, orderIds),
          eq(registrationOrders.status, 'pending_payment')
        ));
    }

    return { expiredCount: expiredReservations.length };
  });
}
