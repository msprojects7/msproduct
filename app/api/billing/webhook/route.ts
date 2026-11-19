import { NextRequest, NextResponse } from 'next/server';
import {
  verifyRazorpayWebhookSignature,
  isWebhookEventProcessed,
  markWebhookEventProcessed,
} from '@/lib/payments/razorpay';
import { recordAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

/**
 * POST /api/billing/webhook
 * Receives and processes Razorpay webhook notifications idempotently.
 * Authenticates requests using the raw request body and HMAC-SHA256 signature.
 */
export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('x-razorpay-signature');
    if (!signature) {
      return NextResponse.json(
        { error: 'Missing x-razorpay-signature header' },
        { status: 400 }
      );
    }

    const rawBody = await request.text();

    const isValid = verifyRazorpayWebhookSignature(rawBody, signature);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 400 }
      );
    }

    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Malformed JSON payload' }, { status: 400 });
    }

    const eventId = payload.event_id || payload.id || `evt_${Date.now()}`;

    // Idempotency check: Ignore duplicate delivery
    if (isWebhookEventProcessed(eventId)) {
      return NextResponse.json(
        { status: 'ignored_duplicate', eventId },
        { status: 200 }
      );
    }

    markWebhookEventProcessed(eventId);

    const eventType = payload.event;
    const payment = payload.payload?.payment?.entity;
    const orgId = payment?.notes?.organizationId;

    if (orgId) {
      await recordAuditEvent({
        organizationId: orgId,
        userId: 'system_webhook',
        action: `webhook:${eventType || 'payment.captured'}`,
        entityType: 'payments',
        entityId: payment?.id || eventId,
        details: {
          amount: payment?.amount,
          currency: payment?.currency,
          status: payment?.status,
        },
      });
    }

    return NextResponse.json({ status: 'ok', eventId, event: eventType }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
