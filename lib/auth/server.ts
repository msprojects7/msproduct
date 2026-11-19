import { createNeonAuth } from '@neondatabase/auth/next/server';

if (!process.env.NEON_AUTH_BASE_URL) {
  throw new Error('NEON_AUTH_BASE_URL is not set in environment variables');
}

if (!process.env.NEON_AUTH_COOKIE_SECRET) {
  throw new Error('NEON_AUTH_COOKIE_SECRET is not set in environment variables');
}

export const auth = createNeonAuth({
  baseUrl: process.env.NEON_AUTH_BASE_URL,
  cookies: {
    secret: process.env.NEON_AUTH_COOKIE_SECRET,
    sessionDataTtl: 300, // 5 minutes cache
    sameSite: 'lax',
  },
});

export type AuthInstance = typeof auth;
