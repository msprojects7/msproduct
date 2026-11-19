import crypto from 'crypto';

const OTP_SECRET = process.env.NEON_AUTH_COOKIE_SECRET || 'ms-backstage-otp-secret-salt-default';

/**
 * Normalizes email by trimming and converting to lowercase
 */
export function normalizeEmail(email: string): string {
  if (!email || typeof email !== 'string') return '';
  return email.trim().toLowerCase();
}

/**
 * Generates a cryptographically secure 6-digit OTP string
 */
export function generateSecureOtp(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

/**
 * Computes HMAC-SHA256 hash of OTP bound to normalized email
 */
export function hashOtp(normalizedEmail: string, otp: string): string {
  return crypto
    .createHmac('sha256', OTP_SECRET)
    .update(`${normalizedEmail}:${otp}:registration`)
    .digest('hex');
}

/**
 * Constant-time comparison of OTP hashes
 */
export function verifyOtpHash(normalizedEmail: string, candidateOtp: string, expectedHash: string): boolean {
  const candidateHash = hashOtp(normalizedEmail, candidateOtp);
  if (candidateHash.length !== expectedHash.length) return false;
  return crypto.timingSafeEqual(Buffer.from(candidateHash, 'hex'), Buffer.from(expectedHash, 'hex'));
}

/**
 * Generates a random cryptographic grant token
 */
export function generateVerificationGrant(): string {
  return crypto.randomBytes(32).toString('hex');
}
