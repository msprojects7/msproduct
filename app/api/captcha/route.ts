import { NextResponse } from 'next/server';
import { generateCaptcha } from '@/lib/captcha/selfHosted';

export const dynamic = 'force-dynamic';

/**
 * GET /api/captcha
 * Generates and returns a self-hosted visual CAPTCHA challenge with signed token.
 */
export async function GET() {
  try {
    const challenge = generateCaptcha();
    return NextResponse.json(challenge, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to generate CAPTCHA';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
