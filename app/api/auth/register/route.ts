import { NextRequest, NextResponse } from 'next/server';
import { db, pool } from '@/db';
import { emailVerifications } from '@/db/schema';
import { eq, and, gt } from 'drizzle-orm';
import { normalizeEmail } from '@/lib/auth/otp';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req.headers);
    
    // Rate limit registration requests: max 10 per 10 minutes
    const ipLimit = checkRateLimit(`register_ip_${ip}`, { maxRequests: 10, windowMs: 600000 });
    if (!ipLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many registration attempts. Please wait a few minutes.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(ipLimit.resetMs / 1000)) } }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Missing request payload.' }, { status: 400 });
    }

    const { email: rawEmail, grantToken, password, confirmPassword, name } = body;

    if (!rawEmail || typeof rawEmail !== 'string') {
      return NextResponse.json({ error: 'Email address is required.' }, { status: 400 });
    }

    const email = normalizeEmail(rawEmail);

    if (!grantToken || typeof grantToken !== 'string') {
      return NextResponse.json(
        { error: 'Missing email verification grant. Direct registration without OTP verification is prohibited.' },
        { status: 403 }
      );
    }

    if (!password || typeof password !== 'string') {
      return NextResponse.json({ error: 'Password is required.' }, { status: 400 });
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ error: 'Passwords do not match.' }, { status: 400 });
    }

    // Password policy validation: min 8 chars, max 128 chars, requires letter and number/special
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters long.' }, { status: 400 });
    }
    if (password.length > 128) {
      return NextResponse.json({ error: 'Password cannot exceed 128 characters.' }, { status: 400 });
    }
    if (!/[A-Za-z]/.test(password) || !/[\d\W]/.test(password)) {
      return NextResponse.json(
        { error: 'Password must contain at least one letter and one number or special character.' },
        { status: 400 }
      );
    }

    const displayName = (name && typeof name === 'string' && name.trim()) ? name.trim() : email.split('@')[0];

    // Verify grant token in database
    const [record] = await db
      .select()
      .from(emailVerifications)
      .where(
        and(
          eq(emailVerifications.email, email),
          eq(emailVerifications.verificationGrant, grantToken),
          eq(emailVerifications.purpose, 'registration')
        )
      )
      .limit(1);

    if (!record) {
      return NextResponse.json(
        { error: 'Invalid verification grant. Please verify your email first.' },
        { status: 400 }
      );
    }

    // Check grant expiry (allow up to 10 minutes from verification)
    const now = new Date();
    const isWithinValidWindow =
      (record.grantExpiresAt && new Date(record.grantExpiresAt) > now) ||
      (record.verifiedAt && now.getTime() - new Date(record.verifiedAt).getTime() < 10 * 60 * 1000);

    if (!isWithinValidWindow) {
      await db
        .update(emailVerifications)
        .set({ isConsumed: true, updatedAt: now })
        .where(eq(emailVerifications.id, record.id));

      return NextResponse.json(
        { error: 'Verification grant has expired. Please verify your email again.' },
        { status: 400 }
      );
    }

    // Double-check if user exists in neon_auth.user (prevent concurrent duplicate creation)
    const existingUser = await pool.query(
      `SELECT id FROM neon_auth.user WHERE LOWER(email) = $1 LIMIT 1`,
      [email]
    );

    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        { error: 'An account with this email address already exists. Please sign in.' },
        { status: 409 }
      );
    }

    // Forward registration to Neon Auth sign-up handler
    const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || 'msproduct-seven.vercel.app';
    const proto = req.headers.get('x-forwarded-proto') || 'https';
    const origin = `${proto}://${host}`;

    const neonBase = process.env.NEON_AUTH_BASE_URL;
    const authSignUpUrl = neonBase ? `${neonBase}/sign-up/email` : `${origin}/api/auth/sign-up/email`;

    const trustedOrigin = origin.includes('vercel.app') ? origin : 'https://msproduct-seven.vercel.app';

    const authRes = await fetch(authSignUpUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: trustedOrigin,
        'User-Agent': req.headers.get('user-agent') || 'MS-Backstage-Registration',
      },
      body: JSON.stringify({
        email,
        password,
        name: displayName,
      }),
    });

    const authData = await authRes.json().catch(() => ({}));

    if (!authRes.ok) {
      return NextResponse.json(
        { error: authData.message || 'Failed to create account through identity provider.' },
        { status: authRes.status }
      );
    }

    // Mark grant as consumed ONLY after account creation succeeds
    await db
      .update(emailVerifications)
      .set({ isConsumed: true, updatedAt: new Date() })
      .where(eq(emailVerifications.id, record.id));

    // Account successfully created! Construct response and forward session cookies
    const response = NextResponse.json(
      {
        success: true,
        message: 'Account successfully registered and verified.',
        user: authData.user,
      },
      { status: 201 }
    );

    // Forward session cookie headers from Neon Auth
    const setCookies = authRes.headers.getSetCookie?.() || [];
    for (const cookieStr of setCookies) {
      response.headers.append('Set-Cookie', cookieStr);
    }

    return response;
  } catch (error) {
    console.error('[REGISTER_ERROR]', error);
    return NextResponse.json(
      { error: 'Internal server error while completing registration.' },
      { status: 500 }
    );
  }
}
