import crypto from 'crypto';

/**
 * MS Backstage — Self-Hosted Cryptographic Visual CAPTCHA
 * 
 * Generates an SVG visual challenge and signs the solution with an HMAC token.
 * Enforces:
 * - Server-side verification
 * - Single-use (Replay protection)
 * - 5-minute expiration
 * - Tamper-proof signed payload
 * - Zero external API dependencies (no Cloudflare, no Google reCAPTCHA)
 */

const CAPTCHA_SECRET =
  process.env.AUTH_SECRET ||
  process.env.SESSION_SECRET ||
  'ms-backstage-self-hosted-captcha-secret-salt-key-2026';

// Replay protection store (in-memory with 5-minute TTL)
const consumedTokens = new Map<string, number>();

// Clean up expired consumed tokens
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [id, expiry] of consumedTokens.entries()) {
      if (now > expiry) {
        consumedTokens.delete(id);
      }
    }
  }, 60000);
}

export interface GeneratedCaptcha {
  token: string;
  svg: string;
  type: 'alphanumeric' | 'math';
}

const CHARACTERS = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // exclude ambiguous 0/O, 1/I

function randomString(length = 5): string {
  let str = '';
  for (let i = 0; i < length; i++) {
    const idx = crypto.randomInt(0, CHARACTERS.length);
    str += CHARACTERS[idx];
  }
  return str;
}

/**
 * Creates an SVG image with distorted text, noise lines, and background specks.
 */
function generateCaptchaSvg(text: string): string {
  const width = 180;
  const height = 52;

  // Generate random noise lines
  let lines = '';
  for (let i = 0; i < 4; i++) {
    const x1 = crypto.randomInt(0, width);
    const y1 = crypto.randomInt(0, height);
    const x2 = crypto.randomInt(0, width);
    const y2 = crypto.randomInt(0, height);
    const stroke = i % 2 === 0 ? '#3b82f6' : '#94a3b8';
    lines += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="1.5" stroke-opacity="0.4" />`;
  }

  // Generate random dots
  let dots = '';
  for (let i = 0; i < 20; i++) {
    const cx = crypto.randomInt(0, width);
    const cy = crypto.randomInt(0, height);
    const r = crypto.randomInt(1, 3);
    dots += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#64748b" opacity="0.3" />`;
  }

  // Render individual letters with rotation & offsets
  let textElements = '';
  const charSpacing = width / (text.length + 1);

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const x = charSpacing * (i + 0.8) + crypto.randomInt(-2, 3);
    const y = height / 2 + crypto.randomInt(4, 9);
    const rot = crypto.randomInt(-18, 18);
    const colors = ['#1e293b', '#2563eb', '#0f172a', '#1d4ed8'];
    const color = colors[i % colors.length];

    textElements += `
      <text
        x="${x}"
        y="${y}"
        font-family="system-ui, -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif"
        font-size="24"
        font-weight="700"
        fill="${color}"
        text-anchor="middle"
        transform="rotate(${rot}, ${x}, ${y})"
        letter-spacing="2"
      >${char}</text>
    `;
  }

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" class="select-none rounded-xl bg-slate-100 border border-slate-200">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#f8fafc" />
          <stop offset="100%" stop-color="#f1f5f9" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#bg)" rx="10" />
      ${dots}
      ${lines}
      ${textElements}
    </svg>
  `.trim();
}

/**
 * Generates a self-hosted visual CAPTCHA challenge.
 */
export function generateCaptcha(): GeneratedCaptcha {
  const challengeId = crypto.randomBytes(16).toString('hex');
  const answer = randomString(5);
  const expiresAt = Date.now() + 300000; // 5 minutes

  // HMAC answer
  const answerHash = crypto
    .createHmac('sha256', CAPTCHA_SECRET)
    .update(`${challengeId}:${answer.toUpperCase()}:${expiresAt}`)
    .digest('hex');

  // Token format: challengeId.expiresAt.answerHash
  const token = `${challengeId}.${expiresAt}.${answerHash}`;
  const svg = generateCaptchaSvg(answer);

  return {
    token,
    svg,
    type: 'alphanumeric',
  };
}

export interface VerificationResult {
  success: boolean;
  error?: string;
}

/**
 * Validates a client-supplied CAPTCHA token and answer.
 */
export function verifySelfHostedCaptcha(
  token: string | null | undefined,
  userAnswer: string | null | undefined
): VerificationResult {
  // Allow demo internal logins in local development if explicitly bypassed
  if (!token && !userAnswer) {
    return {
      success: false,
      error: 'Security verification code is required. Please solve the challenge shown.',
    };
  }

  if (!token || typeof token !== 'string') {
    return {
      success: false,
      error: 'Security verification challenge token is missing.',
    };
  }

  if (!userAnswer || typeof userAnswer !== 'string' || !userAnswer.trim()) {
    return {
      success: false,
      error: 'Please enter the code shown in the security image.',
    };
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    return {
      success: false,
      error: 'Malformed security verification challenge.',
    };
  }

  const [challengeId, expiresAtStr, expectedHash] = parts;
  const expiresAt = parseInt(expiresAtStr, 10);

  // Expiration check
  if (isNaN(expiresAt) || Date.now() > expiresAt) {
    return {
      success: false,
      error: 'Security challenge has expired. Please refresh and try again.',
    };
  }

  // Single-use / replay protection check
  if (consumedTokens.has(challengeId)) {
    return {
      success: false,
      error: 'Security challenge has already been consumed. Please refresh.',
    };
  }

  // Verify HMAC with user's answer
  const normalizedAnswer = userAnswer.trim().toUpperCase();
  const calculatedHash = crypto
    .createHmac('sha256', CAPTCHA_SECRET)
    .update(`${challengeId}:${normalizedAnswer}:${expiresAt}`)
    .digest('hex');
  try {
    const expectedBuffer = Buffer.from(expectedHash, 'hex');
    const calculatedBuffer = Buffer.from(calculatedHash, 'hex');

    if (expectedBuffer.length !== calculatedBuffer.length) {
      return {
        success: false,
        error: 'Incorrect security code. Please check the letters and try again.',
      };
    }

    const matches = crypto.timingSafeEqual(expectedBuffer, calculatedBuffer);
    if (!matches) {
      return {
        success: false,
        error: 'Incorrect security code. Please check the letters and try again.',
      };
    }
  } catch {
    return {
      success: false,
      error: 'Incorrect security code. Please check the letters and try again.',
    };
  }

  // Mark token as consumed
  consumedTokens.set(challengeId, expiresAt);

  return { success: true };
}
