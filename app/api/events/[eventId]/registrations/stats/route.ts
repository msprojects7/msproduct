import { NextRequest, NextResponse } from 'next/server';
import { requireEventContext } from '@/lib/auth/context';
import { handleApiError } from '@/lib/errors';
import { db } from '@/db/index';
import {
  eventTickets,
  registrationOrders,
  promoCodeRedemptions,
} from '@/db/schema/index';
import { eq, and, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

/**
 * GET /api/events/[eventId]/registrations/stats
 * Real database-backed statistics for ticketing, registrations, orders, and promo codes.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const context = await requireEventContext(params.eventId);
    context.assertPermission('event:view');

    // 1. Ticket inventory statistics
    const tickets = await db
      .select({
        id: eventTickets.id,
        name: eventTickets.name,
        category: eventTickets.category,
        ticketType: eventTickets.ticketType,
        price: eventTickets.price,
        currency: eventTickets.currency,
        totalQuantity: eventTickets.totalQuantity,
        soldQuantity: eventTickets.soldQuantity,
        reservedQuantity: eventTickets.reservedQuantity,
      })
      .from(eventTickets)
      .where(eq(eventTickets.eventId, context.event.id));

    let totalCapacity = 0;
    let totalSold = 0;
    let totalReserved = 0;
    const categoryBreakdown: Record<string, { total: number; sold: number; available: number }> = {};

    for (const t of tickets) {
      totalCapacity += t.totalQuantity;
      totalSold += t.soldQuantity;
      totalReserved += t.reservedQuantity;

      if (!categoryBreakdown[t.category]) {
        categoryBreakdown[t.category] = { total: 0, sold: 0, available: 0 };
      }
      categoryBreakdown[t.category].total += t.totalQuantity;
      categoryBreakdown[t.category].sold += t.soldQuantity;
      categoryBreakdown[t.category].available += Math.max(0, t.totalQuantity - t.soldQuantity - t.reservedQuantity);
    }

    const totalAvailable = Math.max(0, totalCapacity - totalSold - totalReserved);

    // 2. Orders & Financial Aggregates
    const orderAggregates = await db
      .select({
        status: registrationOrders.status,
        count: sql<number>`count(*)`,
        totalGross: sql<string>`coalesce(sum(cast(${registrationOrders.grossAmount} as numeric)), 0)`,
        totalDiscount: sql<string>`coalesce(sum(cast(${registrationOrders.discountAmount} as numeric)), 0)`,
        totalNet: sql<string>`coalesce(sum(cast(${registrationOrders.finalAmount} as numeric)), 0)`,
      })
      .from(registrationOrders)
      .where(eq(registrationOrders.eventId, context.event.id))
      .groupBy(registrationOrders.status);

    const ordersByStatus: Record<string, number> = {
      confirmed: 0,
      pending_payment: 0,
      cancelled: 0,
      failed: 0,
      refunded: 0,
      draft: 0,
    };

    let confirmedGrossRevenue = 0;
    let confirmedNetRevenue = 0;
    let totalDiscountsGiven = 0;

    for (const row of orderAggregates) {
      ordersByStatus[row.status] = Number(row.count) || 0;
      if (row.status === 'confirmed') {
        confirmedGrossRevenue += Number(row.totalGross) || 0;
        confirmedNetRevenue += Number(row.totalNet) || 0;
        totalDiscountsGiven += Number(row.totalDiscount) || 0;
      }
    }

    // 3. Free vs Paid counts
    const freeVsPaid = await db
      .select({
        paymentProvider: registrationOrders.paymentProvider,
        count: sql<number>`count(*)`,
      })
      .from(registrationOrders)
      .where(and(
        eq(registrationOrders.eventId, context.event.id),
        eq(registrationOrders.status, 'confirmed')
      ))
      .groupBy(registrationOrders.paymentProvider);

    let freeRegistrations = 0;
    let paidRegistrations = 0;

    for (const row of freeVsPaid) {
      if (row.paymentProvider === 'free') {
        freeRegistrations += Number(row.count) || 0;
      } else {
        paidRegistrations += Number(row.count) || 0;
      }
    }

    // 4. Promo code redemption totals
    const [promoTotals] = await db
      .select({
        redemptionsCount: sql<number>`count(*)`,
        totalSavings: sql<string>`coalesce(sum(cast(${promoCodeRedemptions.discountApplied} as numeric)), 0)`,
      })
      .from(promoCodeRedemptions)
      .where(eq(promoCodeRedemptions.eventId, context.event.id));

    return NextResponse.json({
      status: 'ok',
      inventory: {
        totalCapacity,
        totalSold,
        totalReserved,
        totalAvailable,
        percentSold: totalCapacity > 0 ? Math.round((totalSold / totalCapacity) * 100) : 0,
        categoryBreakdown,
      },
      orders: {
        totalOrders: Object.values(ordersByStatus).reduce((a, b) => a + b, 0),
        byStatus: ordersByStatus,
        freeRegistrations,
        paidRegistrations,
      },
      financials: {
        currency: tickets[0]?.currency || 'INR',
        grossRevenue: confirmedGrossRevenue,
        netRevenue: confirmedNetRevenue,
        totalDiscountsGiven,
      },
      promoCodes: {
        totalRedemptions: Number(promoTotals?.redemptionsCount) || 0,
        totalPromoSavings: Number(promoTotals?.totalSavings) || 0,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
