import dotenv from 'dotenv';
dotenv.config();

import crypto from 'crypto';
import { db, pool } from '../db/index';
import {
  organizations,
  organizationMembers,
  events,
  attendees,
  auditEvents,
} from '../db/schema/index';
import { eq, and } from 'drizzle-orm';
import {
  verifyRazorpayPaymentSignature,
  verifyRazorpayWebhookSignature,
  isWebhookEventProcessed,
  markWebhookEventProcessed,
  PLAN_TIERS,
} from '../lib/payments/razorpay';
import {
  invitationTemplate,
  passwordResetTemplate,
  attendeeConfirmationTemplate,
  paymentReceiptTemplate,
  securityAlertTemplate,
} from '../lib/email/templates';
import { isSmtpConfigured, sendEmail } from '../lib/email';
import { generatePdfReport } from '../lib/reports/pdf';

const APP_URL = process.env.APP_URL || 'http://localhost:3333';

async function runPhase10Tests() {
  console.log('================================================================');
  console.log('MS BACKSTAGE — PHASE 10 COMPREHENSIVE SECURITY, PAYMENTS, EMAIL & E2E');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message, category = 'VERIFY') {
    if (condition) {
      console.log(`✓ [${category}] PASS: ${message}`);
      passed++;
    } else {
      console.error(`✗ [${category}] FAIL: ${message}`);
      failed++;
    }
  }

  // 1. Health check server
  let serverOnline = false;
  try {
    const res = await fetch(`${APP_URL}/api/health`);
    if (res.ok) serverOnline = true;
  } catch {
    serverOnline = false;
  }

  if (!serverOnline) {
    console.error(`Server is not online at ${APP_URL}. Please start server on port 3333.`);
    process.exit(1);
  }

  const ts = Date.now();
  let orgAId = '';
  let orgBId = '';
  let eventAId = '';
  let ownerA = null;
  let ownerB = null;

  try {
    const signUp = async (email, name) => {
      const res = await fetch(`${APP_URL}/api/auth/sign-up/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Origin: APP_URL },
        body: JSON.stringify({ email, password: 'P10Password123!@#', name }),
      });
      const data = await res.json();
      const setCookies = res.headers.getSetCookie?.() || [res.headers.get('set-cookie') || ''];
      const cookies = setCookies.map((c) => c.split(';')[0]).join('; ');
      return { user: data.user, cookies };
    };

    ownerA = await signUp(`p10-owner-a-${ts}@example.com`, 'Owner Alpha 10');
    ownerB = await signUp(`p10-owner-b-${ts}@example.com`, 'Owner Beta 10');

    // Create Organizations
    const orgARes = await fetch(`${APP_URL}/api/organizations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: ownerA.cookies },
      body: JSON.stringify({ name: `Tenant Alpha 10 ${ts}`, slug: `p10-alpha-${ts}` }),
    });
    const orgAData = await orgARes.json();
    orgAId = orgAData.organization.id;

    const orgBRes = await fetch(`${APP_URL}/api/organizations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: ownerB.cookies },
      body: JSON.stringify({ name: `Tenant Beta 10 ${ts}`, slug: `p10-beta-${ts}` }),
    });
    const orgBData = await orgBRes.json();
    orgBId = orgBData.organization.id;

    // Create Event in Org A
    const eventARes = await fetch(`${APP_URL}/api/organizations/${orgAId}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: ownerA.cookies },
      body: JSON.stringify({ name: `Summit 10 Alpha ${ts}`, slug: `p10-event-a-${ts}` }),
    });
    const eventAData = await eventARes.json();
    eventAId = eventAData.event.id;

    // Seed 2 Attendees in Event A
    await db.insert(attendees).values([
      {
        eventId: eventAId,
        registrationNumber: 'P10-REG-001',
        name: 'Dr. Jane Smith',
        category: 'Faculty',
        phoneNumber: '+919876543201',
        email: 'jane.smith@example.org',
        foodPreference: 'Vegetarian',
        paymentStatus: 'Paid',
        registrationType: 'pre_registered',
        attendanceStatus: 'checked_in',
      },
      {
        eventId: eventAId,
        registrationNumber: 'P10-REG-002',
        name: 'Robert Davis',
        category: 'Delegate',
        phoneNumber: '+919876543202',
        email: 'robert.davis@example.org',
        foodPreference: 'Non-Vegetarian',
        paymentStatus: 'Paid',
        registrationType: 'spot',
        attendanceStatus: 'not_checked_in',
      },
    ]);

    // =========================================================================
    // SECTION 1: CONTENT SECURITY POLICY & ADVANCED SECURITY HEADERS
    // =========================================================================
    console.log('\n--- Section 1: Content Security Policy & Advanced Security Headers ---');

    const homeRes = await fetch(`${APP_URL}/`);
    const csp = homeRes.headers.get('content-security-policy');
    assert(Boolean(csp), 'Content-Security-Policy header present on responses', 'CSP');
    assert(csp.includes("default-src 'self'"), "CSP specifies default-src 'self'", 'CSP');
    assert(csp.includes('checkout.razorpay.com'), 'CSP permits Razorpay Checkout script origin', 'CSP');
    assert(csp.includes("frame-ancestors 'none'"), "CSP specifies frame-ancestors 'none' for clickjacking defense", 'CSP');
    assert(csp.includes("object-src 'none'"), "CSP specifies object-src 'none'", 'CSP');
    assert(homeRes.headers.get('x-content-type-options') === 'nosniff', 'X-Content-Type-Options: nosniff verified', 'HEADERS');
    assert(homeRes.headers.get('x-frame-options') === 'DENY', 'X-Frame-Options: DENY verified', 'HEADERS');

    // =========================================================================
    // SECTION 2: RATE LIMITING & BRUTE FORCE PROTECTION
    // =========================================================================
    console.log('\n--- Section 2: Rate Limiting & Abuse Prevention ---');

    // Spam invitation acceptance endpoint with 20 rapid requests
    let rateLimitTriggered = false;
    for (let i = 0; i < 20; i++) {
      const res = await fetch(`${APP_URL}/api/invitations/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': '198.51.100.42' },
        body: JSON.stringify({ token: `spam_token_${i}` }),
      });
      if (res.status === 429) {
        rateLimitTriggered = true;
        const retryAfter = res.headers.get('retry-after');
        assert(Boolean(retryAfter), `Rate limit exceeded returns 429 with Retry-After header (${retryAfter}s)`, 'RATE_LIMIT');
        break;
      }
    }
    assert(rateLimitTriggered, 'Rate limiter activates and rejects rapid brute-force attempts with 429', 'RATE_LIMIT');

    // =========================================================================
    // SECTION 3: RAZORPAY PAYMENT & WEBHOOK SECURITY
    // =========================================================================
    console.log('\n--- Section 3: Razorpay Payment Signature & Webhook Verification ---');

    // 3.1 Server-side HMAC-SHA256 signature verification test
    const testSecret = 'rzp_test_secret_key_12345';
    const testOrderId = 'order_test_987654321';
    const testPaymentId = 'pay_test_123456789';
    const validSignature = crypto
      .createHmac('sha256', testSecret)
      .update(`${testOrderId}|${testPaymentId}`)
      .digest('hex');

    const signatureValid = verifyRazorpayPaymentSignature({
      orderId: testOrderId,
      paymentId: testPaymentId,
      signature: validSignature,
      secret: testSecret,
    });
    assert(signatureValid, 'Valid HMAC-SHA256 payment signature verified successfully', 'PAYMENT_SIGNATURE');

    const signatureTampered = verifyRazorpayPaymentSignature({
      orderId: testOrderId,
      paymentId: testPaymentId,
      signature: 'tampered_invalid_signature_hex_value_00000',
      secret: testSecret,
    });
    assert(!signatureTampered, 'Tampered payment signature rejected cleanly', 'PAYMENT_SIGNATURE');

    // 3.2 Razorpay Webhook Verification
    const webhookSecret = 'rzp_whsec_secret_abcdef123';
    const webhookBody = JSON.stringify({
      event: 'payment.captured',
      event_id: `evt_test_${ts}`,
      payload: {
        payment: {
          entity: {
            id: 'pay_live_test_001',
            amount: 499900,
            currency: 'INR',
            status: 'captured',
            notes: { organizationId: orgAId },
          },
        },
      },
    });

    const validWebhookSig = crypto
      .createHmac('sha256', webhookSecret)
      .update(webhookBody)
      .digest('hex');

    // Missing signature -> 400
    const noSigRes = await fetch(`${APP_URL}/api/billing/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: webhookBody,
    });
    assert(noSigRes.status === 400, 'Webhook request missing signature header rejected with 400', 'WEBHOOK_SECURITY');

    // Verify webhook signature verification logic directly
    const webhookSigValid = verifyRazorpayWebhookSignature(webhookBody, validWebhookSig, webhookSecret);
    assert(webhookSigValid, 'Webhook signature verification accepts authentic payload', 'WEBHOOK_SECURITY');

    const webhookSigInvalid = verifyRazorpayWebhookSignature(webhookBody, 'invalid_sig', webhookSecret);
    assert(!webhookSigInvalid, 'Webhook signature verification rejects tampered payload', 'WEBHOOK_SECURITY');

    // 3.3 Idempotency testing
    const testEventId = `evt_idempotent_${ts}`;
    assert(!isWebhookEventProcessed(testEventId), 'New webhook event is marked unprocessed initially', 'IDEMPOTENCY');
    markWebhookEventProcessed(testEventId);
    assert(isWebhookEventProcessed(testEventId), 'Webhook event is recognized as processed after first delivery', 'IDEMPOTENCY');

    // =========================================================================
    // SECTION 4: SUBSCRIPTION & PLAN ENTITLEMENTS (SECTION 19)
    // =========================================================================
    console.log('\n--- Section 4: Subscription & Plan Entitlements (Section 19) ---');

    // 4.1 Query Subscription status
    const subRes = await fetch(`${APP_URL}/api/organizations/${orgAId}/subscription`, {
      headers: { Cookie: ownerA.cookies },
    });
    assert(subRes.status === 200, 'Owner queries organization subscription status (200 OK)', 'SUBSCRIPTION');
    const subData = await subRes.json();
    assert(subData.subscription.planId === 'free', 'Default initial plan is Starter (free)', 'SUBSCRIPTION');
    assert(subData.subscription.entitlements.maxAttendees === 250, 'Starter plan capacity enforced at 250 attendees', 'SUBSCRIPTION');
    assert(Array.isArray(subData.availablePlans) && subData.availablePlans.length === 3, 'Available plans return Starter, Pro, and Enterprise tiers', 'SUBSCRIPTION');

    // 4.2 Cross-tenant subscription isolation
    const crossSubRes = await fetch(`${APP_URL}/api/organizations/${orgAId}/subscription`, {
      headers: { Cookie: ownerB.cookies },
    });
    assert(crossSubRes.status === 403, 'Cross-tenant subscription query rejected with 403 Forbidden', 'TENANT_ISOLATION');

    // 4.3 Create order for Pro tier
    const orderRes = await fetch(`${APP_URL}/api/organizations/${orgAId}/subscription`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: ownerA.cookies },
      body: JSON.stringify({ action: 'create_order', targetPlanId: 'pro' }),
    });
    assert(orderRes.status === 200, 'Initiate Pro plan order returned 200 OK', 'SUBSCRIPTION');
    const orderData = await orderRes.json();
    assert(orderData.order && orderData.order.amount === PLAN_TIERS.pro.priceInPenceOrPaise, 'Order amount matches server-side plan pricing (499900 paise)', 'SUBSCRIPTION');

    // 4.4 Verify payment confirmation with invalid signature
    const verifyFailRes = await fetch(`${APP_URL}/api/organizations/${orgAId}/subscription`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: ownerA.cookies },
      body: JSON.stringify({
        action: 'verify_payment',
        razorpayOrderId: 'order_test_fake',
        razorpayPaymentId: 'pay_test_fake',
        razorpaySignature: 'fake_invalid_sig',
      }),
    });
    assert(verifyFailRes.status === 400, 'Payment verification with fake signature rejected with 400', 'SUBSCRIPTION');

    // =========================================================================
    // SECTION 5: SMTP & BRANDED EMAIL TEMPLATES
    // =========================================================================
    console.log('\n--- Section 5: SMTP Delivery & Branded Email Templates ---');

    // 5.1 Test Invitation Template
    const inviteMail = invitationTemplate({
      organizationName: 'Cardiology Conference 2026',
      role: 'admin',
      inviteUrl: 'https://backstage.example.com/invitations/accept?token=sample123',
      recipientEmail: 'doctor@hospital.org',
    });
    assert(inviteMail.subject.includes('Invitation to join Cardiology Conference 2026'), 'Invitation template generates clear subject', 'EMAIL');
    assert(inviteMail.html.includes('MS Backstage') && inviteMail.html.includes('Accept Invitation'), 'Invitation template generates branded HTML with CTA button', 'EMAIL');
    assert(inviteMail.text.includes('https://backstage.example.com/invitations/accept'), 'Invitation template includes plain-text alternative', 'EMAIL');

    // 5.2 Test Password Reset Template
    const resetMail = passwordResetTemplate({
      resetUrl: 'https://backstage.example.com/auth/reset-password?token=tok987',
      recipientEmail: 'user@example.org',
    });
    assert(resetMail.html.includes('Password Reset Request') && resetMail.html.includes('single-use'), 'Password reset template includes single-use expiration warning', 'EMAIL');

    // 5.3 Test Payment Receipt Template
    const receiptMail = paymentReceiptTemplate({
      eventName: 'Biomedical Summit',
      orderId: 'order_123',
      paymentId: 'pay_456',
      amount: 499900,
      currency: 'INR',
      attendeeName: 'Dr. Watson',
    });
    assert(receiptMail.html.includes('INR 4999.00') && receiptMail.html.includes('pay_456'), 'Payment receipt includes amount, currency, and payment reference', 'EMAIL');

    // 5.4 Test HTML injection escaping
    const attackMail = invitationTemplate({
      organizationName: '<script>alert("XSS")</script>',
      role: 'admin',
      inviteUrl: 'https://example.com',
      recipientEmail: 'test@example.com',
    });
    assert(!attackMail.html.includes('<script>'), 'Email template safely escapes HTML in user-controlled organization name', 'EMAIL_SECURITY');

    // 5.5 Test unconfigured SMTP graceful handling
    const smtpResult = await sendEmail({
      to: 'nonexistent@example.com',
      subject: 'Test Subject',
      html: '<p>Test</p>',
      text: 'Test',
    });
    assert(!smtpResult.success, 'sendEmail returns failure safely when SMTP is unconfigured', 'EMAIL_SAFETY');
    assert(!smtpResult.configured, 'sendEmail accurately reports unconfigured status without throwing', 'EMAIL_SAFETY');

    // =========================================================================
    // SECTION 6: PDF REPORT EXPORT
    // =========================================================================
    console.log('\n--- Section 6: PDF Report Export & Binary Validation ---');

    // 6.1 Direct PDF generator unit test
    const testPdfBuffer = generatePdfReport({
      eventName: 'National Surgical Conference',
      organizationName: 'Surgical Association',
      generatedAt: new Date().toUTCString(),
      filterSummary: 'Category: All | Status: All',
      headers: ['Reg No', 'Name', 'Category', 'Food', 'Payment', 'Type', 'Status', 'Date'],
      rows: [
        ['REG-001', 'Dr. Sarah Connor', 'Faculty', 'Veg', 'Paid', 'Spot', 'Checked In', '2026-10-13'],
        ['REG-002', 'Dr. John Connor', 'Delegate', 'Non-Veg', 'Paid', 'Pre-Reg', 'Not Checked In', '2026-10-13'],
      ],
    });

    assert(testPdfBuffer instanceof Buffer, 'generatePdfReport returns binary Buffer', 'PDF_EXPORT');
    const pdfHeaderStr = testPdfBuffer.subarray(0, 8).toString('utf-8');
    assert(pdfHeaderStr.startsWith('%PDF-1.4'), `PDF buffer begins with valid %PDF-1.4 header (got: ${pdfHeaderStr.trim()})`, 'PDF_EXPORT');
    const pdfFooterStr = testPdfBuffer.subarray(testPdfBuffer.length - 20).toString('utf-8');
    assert(pdfFooterStr.includes('%%EOF'), 'PDF buffer ends with valid %%EOF trailer', 'PDF_EXPORT');

    // 6.2 HTTP endpoint test: GET /reports/export?format=pdf
    const exportPdfRes = await fetch(`${APP_URL}/api/events/${eventAId}/reports/export?format=pdf`, {
      headers: { Cookie: ownerA.cookies },
    });
    assert(exportPdfRes.status === 200, 'Owner exports PDF report via HTTP (200 OK)', 'PDF_EXPORT');
    assert(exportPdfRes.headers.get('content-type') === 'application/pdf', 'PDF export Content-Type is application/pdf', 'PDF_EXPORT');
    const pdfBlob = await exportPdfRes.arrayBuffer();
    const pdfBytes = new Uint8Array(pdfBlob);
    const downloadedHeader = new TextDecoder('utf-8').decode(pdfBytes.subarray(0, 8));
    assert(downloadedHeader.startsWith('%PDF-1.4'), 'Downloaded HTTP PDF payload confirmed genuine %PDF-1.4 binary document', 'PDF_EXPORT');

    // 6.3 Low-privilege user denied PDF export
    const unauthedPdfRes = await fetch(`${APP_URL}/api/events/${eventAId}/reports/export?format=pdf`);
    assert(unauthedPdfRes.status === 401, 'Unauthenticated PDF export request rejected with 401', 'PDF_RBAC');

    // =========================================================================
    // SECTION 7: SOCIAL SIGN-IN UI VALIDATION
    // =========================================================================
    console.log('\n--- Section 7: Social Sign-In UI Validation ---');

    const signInRes = await fetch(`${APP_URL}/auth/sign-in`);
    assert(signInRes.status === 200, 'GET /auth/sign-in returns 200 OK', 'SOCIAL_UI');
    const signInHtml = await signInRes.text();
    assert(signInHtml.includes('Continue with Google'), 'Sign-in page contains "Continue with Google" button', 'SOCIAL_UI');
    assert(signInHtml.includes('Continue with Apple'), 'Sign-in page contains "Continue with Apple" button', 'SOCIAL_UI');
    assert(signInHtml.includes('Continue with Facebook'), 'Sign-in page contains "Continue with Facebook" button', 'SOCIAL_UI');
    assert(signInHtml.includes('Email address') && signInHtml.includes('Password'), 'Sign-in page preserves email and password inputs', 'SOCIAL_UI');

  } finally {
    console.log('\nCleaning up Phase 10 test fixtures...');
    try {
      if (eventAId) {
        await db.delete(auditEvents).where(eq(auditEvents.eventId, eventAId));
        await db.delete(attendees).where(eq(attendees.eventId, eventAId));
        await db.delete(events).where(eq(events.id, eventAId));
      }
      if (orgAId) {
        await db.delete(auditEvents).where(eq(auditEvents.organizationId, orgAId));
        await db.delete(organizationMembers).where(eq(organizationMembers.organizationId, orgAId));
        await db.delete(organizations).where(eq(organizations.id, orgAId));
      }
      if (orgBId) {
        await db.delete(auditEvents).where(eq(auditEvents.organizationId, orgBId));
        await db.delete(organizationMembers).where(eq(organizationMembers.organizationId, orgBId));
        await db.delete(organizations).where(eq(organizations.id, orgBId));
      }
    } catch (e) {
      console.error('Cleanup error:', e);
    }
    await pool.end();
  }

  console.log('\n================================================================');
  console.log(`PHASE 10 VERIFICATION TOTALS: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase10Tests().catch((err) => {
  console.error('Phase 10 verification failed:', err);
  process.exit(1);
});
