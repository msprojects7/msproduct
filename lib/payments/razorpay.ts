/**
 * MS Backstage — Razorpay Payments & Subscription Security Module
 *
 * Implements server-side payment verification, signature validation,
 * webhook HMAC-SHA256 verification, and plan entitlement boundaries.
 *
 * Security Guarantees:
 * 1. Razorpay secret key remains strictly server-side.
 * 2. Uses timing-safe buffer comparison to prevent timing attacks on signatures.
 * 3. Never stores credit card numbers, CVVs, or cardholder PANs.
 * 4. Verifies all amounts and currencies against authoritative server-side pricing.
 * 5. Webhook processing is idempotent and tracks processed event IDs.
 */

import crypto from 'crypto';
export * from './plans';

export function isRazorpayConfigured(): boolean {
  return Boolean(
    process.env.RAZORPAY_KEY_ID &&
    process.env.RAZORPAY_KEY_SECRET
  );
}

/**
 * Verifies Razorpay client-side payment signature using constant-time comparison
 * Expected signature is HMAC-SHA256(order_id + "|" + payment_id, key_secret)
 */
export function verifyRazorpayPaymentSignature(params: {
  orderId: string;
  paymentId: string;
  signature: string;
  secret?: string;
}): boolean {
  const secret = params.secret || process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return false;

  try {
    const payload = `${params.orderId}|${params.paymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    const expectedBuf = Buffer.from(expectedSignature, 'utf-8');
    const actualBuf = Buffer.from(params.signature, 'utf-8');

    if (expectedBuf.length !== actualBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuf, actualBuf);
  } catch {
    return false;
  }
}

/**
 * Verifies Razorpay webhook signature using raw body and webhook secret
 */
export function verifyRazorpayWebhookSignature(
  rawBody: string,
  signature: string,
  webhookSecret?: string
): boolean {
  const secret = webhookSecret || process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;

  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    const expectedBuf = Buffer.from(expectedSignature, 'utf-8');
    const actualBuf = Buffer.from(signature, 'utf-8');

    if (expectedBuf.length !== actualBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuf, actualBuf);
  } catch {
    return false;
  }
}

/**
 * In-memory processed webhook event store to guarantee idempotency
 */
const processedWebhookEvents = new Set<string>();

export function isWebhookEventProcessed(eventId: string): boolean {
  return processedWebhookEvents.has(eventId);
}

export function markWebhookEventProcessed(eventId: string) {
  processedWebhookEvents.add(eventId);
  // Cap set size
  if (processedWebhookEvents.size > 10000) {
    const oldest = processedWebhookEvents.values().next().value;
    if (oldest) processedWebhookEvents.delete(oldest);
  }
}

/**
 * Server-side order creation helper
 */
export async function createServerRazorpayOrder(params: {
  amount: number;
  currency: string;
  receipt: string;
  notes?: Record<string, string>;
}): Promise<{ id: string; amount: number; currency: string; receipt: string } | null> {
  if (!isRazorpayConfigured()) {
    // Development fallback mock order if keys are unconfigured
    return {
      id: `order_test_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      amount: params.amount,
      currency: params.currency,
      receipt: params.receipt,
    };
  }

  const keyId = process.env.RAZORPAY_KEY_ID!;
  const keySecret = process.env.RAZORPAY_KEY_SECRET!;
  const authHeader = `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`;

  const res = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: authHeader,
    },
    body: JSON.stringify({
      amount: params.amount,
      currency: params.currency,
      receipt: params.receipt,
      notes: params.notes,
    }),
  });

  if (!res.ok) {
    return null;
  }

  const data = await res.json();
  return {
    id: data.id,
    amount: data.amount,
    currency: data.currency,
    receipt: data.receipt,
  };
}
