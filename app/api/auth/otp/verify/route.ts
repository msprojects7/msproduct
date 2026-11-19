import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { emailVerifications } from '@/db/schema';
import { eq, and, desc, gt } from 'drizzle-orm';
import { normalizeEmail, verifyOtpHash, generateVerificationGrant } from '@/lib/auth/otp';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req.headers);
    
    // IP rate limiting: max 20 verification attempts per 10 minutes
    const ipLimit = checkRateLimit(`otp_verify_ip_${ip}`, { maxRequests: 20, windowMs: 600000 });
    if (!ipLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many verification attempts. Please wait a few minutes.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(ipLimit.resetMs / 1000)) } }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || !body.email || !body.otp) {
      return NextResponse.json({ error: 'Email and 6-digit verification code are required.' }, { status: 400 });
    }

    const email = normalizeEmail(body.email);
    const otp = String(body.otp).trim();

    if (!/^\d{6}$/.test(otp)) {
      return NextResponse.json({ error: 'Verification code must be exactly 6 digits.' }, { status: 400 });
    }

    // Email rate limiting
    const emailLimit = checkRateLimit(`otp_verify_email_${email}`, { maxRequests: 10, windowMs: 600000 });
    if (!emailLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many verification attempts for this email. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(emailLimit.resetMs / 1000)) } }
      );
    }

    // Find the latest active verification record for this email
    const [record] = await db
      .select()
      .from(emailVerifications)
      .where(
        and(
          eq(emailVerifications.email, email),
          eq(emailVerifications.purpose, 'registration'),
          eq(emailVerifications.isConsumed, false)
        )
      )
      .orderBy(desc(emailVerifications.createdAt))
      .limit(1);

    if (!record) {
      return NextResponse.json(
        { error: 'No active verification code found for this email. Please request a new code.' },
        { status: 400 }
      );
    }

    // Reject already-verified OTP replay
    if (record.verifiedAt) {
      return NextResponse.json(
        { error: 'This verification code has already been verified and used.' },
        { status: 400 }
      );
    }

    // Check expiration (enforced on server)
    const now = new Date();
    if (new Date(record.expiresAt) <= now) {
      await db
        .update(emailVerifications)
        .set({ isConsumed: true, updatedAt: now })
        .where(eq(emailVerifications.id, record.id));

      return NextResponse.json(
        { error: 'Verification code has expired. Codes are valid for exactly 5 minutes. Please request a new code.' },
        { status: 400 }
      );
    }

    // Check attempts limit
    if (record.attempts >= record.maxAttempts) {
      await db
        .update(emailVerifications)
        .set({ isConsumed: true, updatedAt: now })
        .where(eq(emailVerifications.id, record.id));

      return NextResponse.json(
        { error: 'Maximum verification attempts exceeded for this code. Please request a new code.' },
        { status: 429 }
      );
    }

    // Verify OTP using constant-time hash comparison
    const isValid = verifyOtpHash(email, otp, record.otpHash);

    if (!isValid) {
      const nextAttempts = record.attempts + 1;
      const willInvalidate = nextAttempts >= record.maxAttempts;

      await db
        .update(emailVerifications)
        .set({
          attempts: nextAttempts,
          isConsumed: willInvalidate,
          updatedAt: now,
        })
        .where(eq(emailVerifications.id, record.id));

      const remaining = Math.max(0, record.maxAttempts - nextAttempts);

      if (willInvalidate) {
        return NextResponse.json(
          { error: 'Maximum attempts reached. This verification code has been invalidated. Please request a new code.' },
          { status: 429 }
        );
      }

      return NextResponse.json(
        { error: `Incorrect verification code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.` },
        { status: 400 }
      );
    }

    // OTP is valid! Issue a single-use verification grant token (valid for 5 minutes)
    const verificationGrant = generateVerificationGrant();
    const grantExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await db
      .update(emailVerifications)
      .set({
        verifiedAt: now,
        verificationGrant,
        grantExpiresAt,
        updatedAt: now,
      })
      .where(eq(emailVerifications.id, record.id));

    return NextResponse.json({
      success: true,
      message: 'Email address successfully verified. Please set your password to complete registration.',
      grantToken: verificationGrant,
      expiresInSeconds: 300,
    });
  } catch (error) {
    console.error('[OTP_VERIFY_ERROR]', error);
    return NextResponse.json(
      { error: 'Internal server error while verifying code.' },
      { status: 500 }
    );
  }
}
