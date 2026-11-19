import { NextRequest, NextResponse } from 'next/server';
import { db, pool } from '@/db';
import { emailVerifications } from '@/db/schema';
import { eq, and, desc, gt } from 'drizzle-orm';
import { normalizeEmail, generateSecureOtp, hashOtp } from '@/lib/auth/otp';
import { sendEmail } from '@/lib/email';
import { otpVerificationTemplate } from '@/lib/email/templates';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import { verifySelfHostedCaptcha } from '@/lib/captcha/selfHosted';
import {
  inspectConnectionHeaders,
  validateHoneypot,
  logSecurityEvent,
} from '@/lib/security/botProtection';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    const conn = inspectConnectionHeaders(req.headers);
    const ip = conn.ip;

    if (conn.isSuspectedProxy) {
      logSecurityEvent('SUSPECTED_BOT', {
        ip,
        endpoint: '/api/auth/otp/send',
        reason: 'Proxy or automated client signature detected',
        extra: { signals: conn.proxySignals },
      });
    }
    
    // IP-level rate limiting: max 10 OTP requests per 10 minutes
    const ipLimit = checkRateLimit(`otp_send_ip_${ip}`, { maxRequests: 10, windowMs: 600000 });
    if (!ipLimit.allowed) {
      logSecurityEvent('RATE_LIMIT', {
        ip,
        endpoint: '/api/auth/otp/send',
        reason: 'Rate limit exceeded for OTP send by IP',
      });
      return NextResponse.json(
        { error: 'Too many OTP requests from this address. Please wait a few minutes.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(ipLimit.resetMs / 1000)) } }
      );
    }

    // Payload size guard: reject oversized payloads (> 16KB)
    const contentLength = req.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > 16384) {
      return NextResponse.json({ error: 'Request payload exceeds maximum allowed size.' }, { status: 413 });
    }

    const body = await req.json().catch(() => null);

    // Honeypot check: reject bots
    const honeypot = validateHoneypot(body, req.headers);
    if (honeypot.isBot) {
      logSecurityEvent('HONEYPOT_TRIGGER', {
        ip,
        endpoint: '/api/auth/otp/send',
        reason: `Honeypot field triggered: ${honeypot.matchedField}`,
      });
      return NextResponse.json({ error: 'Request rejected due to security policy.' }, { status: 400 });
    }

    if (!body || !body.email || typeof body.email !== 'string') {
      return NextResponse.json({ error: 'Valid email address is required.' }, { status: 400 });
    }

    const email = normalizeEmail(body.email);
    if (!EMAIL_REGEX.test(email) || email.length > 255) {
      return NextResponse.json({ error: 'Invalid email address format.' }, { status: 400 });
    }

    // Server-side self-hosted visual CAPTCHA enforcement
    const captchaToken =
      body?.captchaToken || req.headers.get('x-captcha-token');
    const captchaAnswer =
      body?.captchaAnswer || req.headers.get('x-captcha-answer');

    const isDev = process.env.NODE_ENV !== 'production';
    const isDevTestBypass =
      isDev && !captchaToken && (email.endsWith('@msbackstage.internal') || email.endsWith('@apexevents.internal') || email.endsWith('@example.com'));

    if (!isDevTestBypass) {
      const verifyResult = verifySelfHostedCaptcha(captchaToken, captchaAnswer);
      if (!verifyResult.success) {
        logSecurityEvent('CAPTCHA_FAILURE', {
          ip,
          endpoint: '/api/auth/otp/send',
          identifier: email,
          reason: verifyResult.error,
        });
        return NextResponse.json(
          { error: verifyResult.error || 'CAPTCHA verification failed. Please complete the security challenge.' },
          { status: 403 }
        );
      }
    }

    // Step 1: Check if an account already exists with this email in neon_auth.user
    const existingUserCheck = await pool.query(
      `SELECT id FROM neon_auth.user WHERE LOWER(email) = $1 LIMIT 1`,
      [email]
    );

    if (existingUserCheck.rows.length > 0) {
      return NextResponse.json(
        { error: 'An account with this email address already exists. Please sign in instead.' },
        { status: 409 }
      );
    }

    // Email-level rate limiting: 60-second cooldown
    const emailCooldown = checkRateLimit(`otp_cooldown_${email}`, { maxRequests: 1, windowMs: 60000 });
    if (!emailCooldown.allowed) {
      return NextResponse.json(
        { error: 'Please wait 60 seconds before requesting a new verification code.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(emailCooldown.resetMs / 1000)) } }
      );
    }

    // Email-level abuse limiting: max 3 OTP requests in 10 minutes
    const emailLimit = checkRateLimit(`otp_send_email_${email}`, { maxRequests: 3, windowMs: 600000 });
    if (!emailLimit.allowed) {
      return NextResponse.json(
        { error: 'Maximum OTP requests exceeded for this email. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(emailLimit.resetMs / 1000)) } }
      );
    }

    // Invalidate any active previous unconsumed OTPs for this email
    await db
      .update(emailVerifications)
      .set({ isConsumed: true, updatedAt: new Date() })
      .where(
        and(
          eq(emailVerifications.email, email),
          eq(emailVerifications.purpose, 'registration'),
          eq(emailVerifications.isConsumed, false)
        )
      );

    // Step 2: Generate 6-digit secure OTP and compute HMAC hash
    const otp = generateSecureOtp();
    const otpHash = hashOtp(email, otp);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // Exactly 5 minutes

    await db.insert(emailVerifications).values({
      email,
      otpHash,
      purpose: 'registration',
      attempts: 0,
      maxAttempts: 5,
      expiresAt,
      isConsumed: false,
    });

    // Send email using branded MS Backstage template
    const emailContent = otpVerificationTemplate({
      otp,
      recipientEmail: email,
      expiresInMinutes: 5,
    });

    const emailResult = await sendEmail({
      to: email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    });

    if (!emailResult.success) {
      if (!emailResult.configured) {
        const host = req.headers.get('host') || '';
        const isUatOrDev =
          host.includes('vercel.app') ||
          host.includes('localhost') ||
          process.env.ENABLE_DEMO_ACCOUNTS === 'true' ||
          process.env.NEXT_PUBLIC_ENABLE_DEMO_ACCOUNTS === 'true' ||
          process.env.NODE_ENV !== 'production';

        if (isUatOrDev) {
          return NextResponse.json({
            success: true,
            message: `Verification code generated: ${otp} (SMTP not yet added in Vercel, test code provided)`,
            devCode: otp,
          });
        }

        return NextResponse.json(
          { error: 'Email service is unconfigured. Verification code cannot be delivered.' },
          { status: 503 }
        );
      }
      return NextResponse.json(
        { error: 'Failed to deliver verification code. Please check your email and try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'A 6-digit verification code has been sent to your email. It will expire in 5 minutes.',
        expiresInSeconds: 300,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[OTP_SEND_ERROR]', error);
    return NextResponse.json(
      { error: 'Internal server error while processing verification code request.' },
      { status: 500 }
    );
  }
}
