import { NextRequest, NextResponse } from 'next/server';
import { requireOrgContext, AuthorizationError } from '@/lib/auth/context';
import { db } from '@/db/index';
import { organizations } from '@/db/schema/index';
import { eq, sql } from 'drizzle-orm';
import {
  PLAN_TIERS,
  createServerRazorpayOrder,
  verifyRazorpayPaymentSignature,
} from '@/lib/payments/razorpay';
import { recordAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

/**
 * GET /api/organizations/[orgId]/subscription
 * Fetches authoritative server-side subscription and plan status for the organization.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { orgId: string } }
) {
  try {
    const context = await requireOrgContext(params.orgId);
    context.assertPermission('org:view');

    // Read live plan and subscription timeline from organization record
    const [liveOrg] = await db
      .select({
        planId: organizations.planId,
        planActivatedAt: organizations.planActivatedAt,
        planExpiresAt: organizations.planExpiresAt,
        extraAttendeesQuota: organizations.extraAttendeesQuota,
        createdAt: organizations.createdAt,
      })
      .from(organizations)
      .where(eq(organizations.id, context.organization.id))
      .limit(1);

    let activePlanId = liveOrg?.planId || 'free';
    let activatedAt = liveOrg?.planActivatedAt || null;
    let expiresAt = liveOrg?.planExpiresAt || null;
    const extraQuota = liveOrg?.extraAttendeesQuota || 0;

    // For Free tier: enforce a 15-day trial period from organization creation/activation
    if (activePlanId === 'free') {
      if (!activatedAt) {
        activatedAt = liveOrg?.createdAt || new Date();
      }
      if (!expiresAt) {
        expiresAt = new Date(new Date(activatedAt).getTime() + 15 * 24 * 60 * 60 * 1000);
      }
    }

    // Check if subscription has expired
    const now = new Date();
    let isExpired = false;
    let isExpiringSoon = false; // Within 7 days
    let daysRemaining: number | null = null;

    if (expiresAt) {
      const diffMs = new Date(expiresAt).getTime() - now.getTime();
      daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
      if (diffMs <= 0) {
        isExpired = true;
        // If paid plan expired, drop back to free tier
        if (activePlanId !== 'free') {
          activePlanId = 'free';
        }
      } else if (diffMs <= 7 * 24 * 60 * 60 * 1000) {
        isExpiringSoon = true; // Within 1 week (7 days) reminder window
      }
    }

    const plan = PLAN_TIERS[activePlanId] || PLAN_TIERS.free;
    const totalMaxAttendees = plan.maxAttendees + extraQuota;

    return NextResponse.json({
      status: 'ok',
      organizationId: context.organization.id,
      subscription: {
        planId: plan.id,
        planName: plan.name,
        status: isExpired ? 'expired' : 'active',
        billingCycle: plan.billingUnit,
        validityDuration: plan.validityDuration,
        activatedAt: activatedAt ? activatedAt.toISOString() : null,
        expiresAt: expiresAt ? expiresAt.toISOString() : null,
        isExpiringSoon,
        daysRemaining: daysRemaining !== null && daysRemaining > 0 ? daysRemaining : 0,
        isExpired,
        extraAttendeesQuota: extraQuota,
        totalMaxAttendees,
        extraAttendeePriceInPaise: plan.extraAttendeePriceInPaise || 2000,
        entitlements: {
          maxAttendees: totalMaxAttendees,
          baseMaxAttendees: plan.maxAttendees,
          extraQuota,
          maxEvents: plan.maxEvents,
          features: plan.features,
        },
      },
      availablePlans: Object.values(PLAN_TIERS),
      razorpayKeyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
    });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/organizations/[orgId]/subscription
 * Initiates an upgrade order or verifies payment confirmation server-side.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { orgId: string } }
) {
  try {
    const context = await requireOrgContext(params.orgId);
    context.assertPermission('org:update');

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Invalid request body', code: 'BAD_REQUEST' },
        { status: 400 }
      );
    }

    const { action, targetPlanId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = body;

    // Action 1: Create Order
    if (action === 'create_order') {
      if (!targetPlanId || typeof targetPlanId !== 'string') {
        return NextResponse.json(
          { error: 'Target plan ID is required', code: 'INVALID_PLAN' },
          { status: 400 }
        );
      }

      const plan = PLAN_TIERS[targetPlanId];
      if (!plan || plan.id === 'free' || plan.id === 'lifetime') {
        return NextResponse.json(
          { error: 'Invalid target plan selected', code: 'INVALID_PLAN' },
          { status: 400 }
        );
      }

      // Read current plan to prevent re-purchasing the same plan
      const [currentOrg] = await db
        .select({ planId: organizations.planId, planExpiresAt: organizations.planExpiresAt })
        .from(organizations)
        .where(eq(organizations.id, context.organization.id))
        .limit(1);

      const currentPlanId = currentOrg?.planId || 'free';
      const planExpired = currentOrg?.planExpiresAt
        ? new Date(currentOrg.planExpiresAt) < new Date()
        : false;

      // Allow re-purchase only if the same plan has expired
      if (currentPlanId === plan.id && !planExpired) {
        return NextResponse.json(
          { error: `You already have an active ${plan.name} subscription.`, code: 'ALREADY_ON_PLAN' },
          { status: 400 }
        );
      }

      const order = await createServerRazorpayOrder({
        amount: plan.priceInPenceOrPaise,
        currency: plan.currency,
        receipt: `rcpt_${context.organization.id.substring(0, 8)}_${Date.now()}`,
        notes: {
          organizationId: context.organization.id,
          planId: plan.id,
          initiatedBy: context.user.id,
        },
      });

      if (!order) {
        return NextResponse.json(
          { error: 'Failed to initiate payment order', code: 'ORDER_CREATION_FAILED' },
          { status: 502 }
        );
      }

      return NextResponse.json({
        status: 'ok',
        order,
        plan,
        keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
      });
    }

    // Action 2: Verify Payment Confirmation
    if (action === 'verify_payment') {
      if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
        return NextResponse.json(
          { error: 'Incomplete payment verification credentials', code: 'INCOMPLETE_PAYMENT_DATA' },
          { status: 400 }
        );
      }

      // Validate the plan before writing to DB — never fall back to a default plan
      if (!targetPlanId || typeof targetPlanId !== 'string') {
        return NextResponse.json(
          { error: 'Target plan ID is missing from payment verification request', code: 'INVALID_PLAN' },
          { status: 400 }
        );
      }

      const verifiedPlan = PLAN_TIERS[targetPlanId];
      if (!verifiedPlan || verifiedPlan.id === 'free' || verifiedPlan.id === 'lifetime') {
        return NextResponse.json(
          { error: 'Cannot activate invalid or non-purchasable plan after payment', code: 'INVALID_PLAN' },
          { status: 400 }
        );
      }

      const isValid = verifyRazorpayPaymentSignature({
        orderId: razorpayOrderId,
        paymentId: razorpayPaymentId,
        signature: razorpaySignature,
      });

      if (!isValid) {
        return NextResponse.json(
          { error: 'Payment signature verification failed. Please contact support.', code: 'SIGNATURE_VERIFICATION_FAILED' },
          { status: 400 }
        );
      }

      const now = new Date();
      // Subscription period: 30 days active validity
      const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      // Persist the verified plan ID to the organization database record
      await db
        .update(organizations)
        .set({
          planId: verifiedPlan.id,
          planActivatedAt: now,
          planExpiresAt: expiresAt,
          updatedAt: now,
        })
        .where(eq(organizations.id, context.organization.id));

      // Record immutable audit event for verified plan upgrade
      await recordAuditEvent({
        organizationId: context.organization.id,
        userId: context.user.id,
        action: 'subscription:upgraded',
        entityType: 'organizations',
        entityId: context.organization.id,
        details: {
          orderId: razorpayOrderId,
          paymentId: razorpayPaymentId,
          targetPlanId: verifiedPlan.id,
          planName: verifiedPlan.name,
          activatedAt: now.toISOString(),
          expiresAt: expiresAt.toISOString(),
        },
      });

      return NextResponse.json({
        status: 'ok',
        message: `Payment verified. ${verifiedPlan.name} subscription activated successfully.`,
        planId: verifiedPlan.id,
        planName: verifiedPlan.name,
        activatedAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
      });
    }

    // Action 3: Create Order for Extra Attendees (₹20 per attendee over limit)
    if (action === 'create_extra_attendees_order') {
      const quantity = Number(body.quantity);
      if (!quantity || quantity <= 0 || !Number.isInteger(quantity)) {
        return NextResponse.json(
          { error: 'Quantity of extra attendees must be a positive integer', code: 'INVALID_QUANTITY' },
          { status: 400 }
        );
      }

      // Check current plan: free plan requires upgrade; paid plans (pro, pro_max) allow extra attendees
      const [currentOrg] = await db
        .select({ planId: organizations.planId })
        .from(organizations)
        .where(eq(organizations.id, context.organization.id))
        .limit(1);

      const plan = PLAN_TIERS[currentOrg?.planId || 'free'] || PLAN_TIERS.free;
      if (plan.id === 'free') {
        return NextResponse.json(
          {
            error: 'Free plan has a strict 50-attendee limit. Please upgrade to Pro to add additional attendees.',
            code: 'UPGRADE_REQUIRED',
          },
          { status: 403 }
        );
      }

      const ratePerAttendee = plan.extraAttendeePriceInPaise || 2000; // ₹20 = 2000 paise
      const totalAmountPaise = quantity * ratePerAttendee;

      const order = await createServerRazorpayOrder({
        amount: totalAmountPaise,
        currency: 'INR',
        receipt: `extra_${context.organization.id.substring(0, 8)}_${Date.now()}`,
        notes: {
          organizationId: context.organization.id,
          type: 'extra_attendees',
          quantity: String(quantity),
          initiatedBy: context.user.id,
        },
      });

      if (!order) {
        return NextResponse.json(
          { error: 'Failed to initiate payment order for extra attendees', code: 'ORDER_CREATION_FAILED' },
          { status: 502 }
        );
      }

      return NextResponse.json({
        status: 'ok',
        order,
        quantity,
        ratePerAttendee,
        totalAmountPaise,
        keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
      });
    }

    // Action 4: Verify Payment for Extra Attendees
    if (action === 'verify_extra_attendees_payment') {
      if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
        return NextResponse.json(
          { error: 'Incomplete payment verification credentials', code: 'INCOMPLETE_PAYMENT_DATA' },
          { status: 400 }
        );
      }

      const quantity = Number(body.quantity);
      if (!quantity || quantity <= 0) {
        return NextResponse.json(
          { error: 'Invalid attendee quantity in verification request', code: 'INVALID_QUANTITY' },
          { status: 400 }
        );
      }

      const isValid = verifyRazorpayPaymentSignature({
        orderId: razorpayOrderId,
        paymentId: razorpayPaymentId,
        signature: razorpaySignature,
      });

      if (!isValid) {
        return NextResponse.json(
          { error: 'Invalid payment signature verification failed', code: 'SIGNATURE_VERIFICATION_FAILED' },
          { status: 400 }
        );
      }

      // Atomically increment extra_attendees_quota in organizations
      const [updatedOrg] = await db
        .update(organizations)
        .set({
          extraAttendeesQuota: sql`${organizations.extraAttendeesQuota} + ${quantity}`,
          updatedAt: new Date(),
        })
        .where(eq(organizations.id, context.organization.id))
        .returning({
          extraAttendeesQuota: organizations.extraAttendeesQuota,
        });

      await recordAuditEvent({
        organizationId: context.organization.id,
        userId: context.user.id,
        action: 'subscription:extra_attendees_added',
        entityType: 'organizations',
        entityId: context.organization.id,
        details: {
          orderId: razorpayOrderId,
          paymentId: razorpayPaymentId,
          quantityAdded: quantity,
          newExtraQuota: updatedOrg?.extraAttendeesQuota || quantity,
        },
      });

      return NextResponse.json({
        status: 'ok',
        message: `Successfully added ${quantity} extra attendee capacity!`,
        extraAttendeesQuota: updatedOrg?.extraAttendeesQuota || quantity,
      });
    }

    return NextResponse.json(
      { error: 'Unsupported subscription action', code: 'INVALID_ACTION' },
      { status: 400 }
    );
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
