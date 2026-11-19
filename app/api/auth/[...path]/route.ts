import { auth } from '@/lib/auth/server';
import { NextRequest, NextResponse } from 'next/server';
import { verifySelfHostedCaptcha } from '@/lib/captcha/selfHosted';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import {
  inspectConnectionHeaders,
  validateHoneypot,
  logSecurityEvent,
} from '@/lib/security/botProtection';

const handlers = auth.handler();

export const { GET, PUT, DELETE, PATCH } = handlers;

export async function POST(req: NextRequest, ctx: any) {
  const pathname = req.nextUrl.pathname;

  // Intercept email sign-in and sign-up requests to enforce self-hosted CAPTCHA, rate limiting, and bot protection
  if (pathname.endsWith('/sign-in/email') || pathname.endsWith('/sign-up/email')) {
    const conn = inspectConnectionHeaders(req.headers);
    const ip = conn.ip;

    if (conn.isSuspectedProxy) {
      logSecurityEvent('SUSPECTED_BOT', {
        ip,
        endpoint: pathname,
        reason: 'Proxy or automated client header signature detected',
        extra: { signals: conn.proxySignals },
      });
    }

    // Rate limit attempts: max 20 per 5 minutes per IP (relaxed on localhost in dev to permit test suites)
    const isDev = process.env.NODE_ENV !== 'production';
    const isLocalhost = ip === '127.0.0.1' || ip === '::1' || ip === 'localhost';
    const ipLimit = checkRateLimit(`auth_ip_${ip}`, {
      maxRequests: isDev && isLocalhost ? 300 : 20,
      windowMs: 300000,
    });
    if (!ipLimit.allowed) {
      logSecurityEvent('RATE_LIMIT', {
        ip,
        endpoint: pathname,
        reason: 'Rate limit exceeded for authentication attempts',
      });
      return NextResponse.json(
        { error: 'Too many authentication attempts. Please wait a few minutes before trying again.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(ipLimit.resetMs / 1000)) } }
      );
    }

    // Payload size guard: reject oversized payloads (> 32KB)
    const contentLength = req.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > 32768) {
      return NextResponse.json({ error: 'Request payload exceeds maximum allowed size.' }, { status: 413 });
    }

    // Inspect request body
    let body: any = null;
    try {
      body = await req.clone().json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON request payload.' }, { status: 400 });
    }

    // Honeypot check: reject automated bots filling invisible fields
    const honeypot = validateHoneypot(body, req.headers);
    if (honeypot.isBot) {
      logSecurityEvent('HONEYPOT_TRIGGER', {
        ip,
        endpoint: pathname,
        reason: `Honeypot field triggered: ${honeypot.matchedField}`,
      });
      return NextResponse.json(
        { error: 'Submission rejected due to security policy.' },
        { status: 400 }
      );
    }

    const email = body?.email ? String(body.email).toLowerCase().trim() : '';

    const captchaToken =
      body?.captchaToken || req.headers.get('x-captcha-token');
    const captchaAnswer =
      body?.captchaAnswer || req.headers.get('x-captcha-answer');

    // Development demo accounts boundary:
    // Strictly in local development, allow verified demo accounts to test without challenge when token is omitted.
    const isDevDemoBypass =
      isDev &&
      !captchaToken &&
      (email.endsWith('@msbackstage.internal') ||
        email.endsWith('@apexevents.internal') ||
        email.startsWith('http-') ||
        email.endsWith('@example.com'));

    if (!isDevDemoBypass) {
      const verifyResult = verifySelfHostedCaptcha(captchaToken, captchaAnswer);
      if (!verifyResult.success) {
        logSecurityEvent('CAPTCHA_FAILURE', {
          ip,
          endpoint: pathname,
          identifier: email,
          reason: verifyResult.error,
        });
        return NextResponse.json(
          { error: verifyResult.error || 'CAPTCHA verification failed. Please complete the security challenge.' },
          { status: 403 }
        );
      }
    }
  }

  return handlers.POST(req, ctx);
}
