/**
 * In-Memory Sliding Window Rate Limiter
 * 
 * Provides protection against brute force and credential stuffing attacks
 * on sensitive endpoints (e.g. login, password reset, token acceptance).
 */

interface RateLimitRecord {
  timestamps: number[];
}

const store = new Map<string, RateLimitRecord>();

// Clean up stale entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of store.entries()) {
      record.timestamps = record.timestamps.filter((ts) => now - ts < 300000);
      if (record.timestamps.length === 0) {
        store.delete(key);
      }
    }
  }, 300000);
}

export interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests allowed per window
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetMs: number;
}

export function checkRateLimit(key: string, options: RateLimitOptions = { windowMs: 60000, maxRequests: 20 }): RateLimitResult {
  const now = Date.now();
  let record = store.get(key);

  if (!record) {
    record = { timestamps: [] };
    store.set(key, record);
  }

  // Filter timestamps within current window
  record.timestamps = record.timestamps.filter((ts) => now - ts < options.windowMs);

  if (record.timestamps.length >= options.maxRequests) {
    const oldest = record.timestamps[0];
    const resetMs = options.windowMs - (now - oldest);
    return {
      allowed: false,
      remaining: 0,
      resetMs: Math.max(0, resetMs),
    };
  }

  record.timestamps.push(now);
  return {
    allowed: true,
    remaining: options.maxRequests - record.timestamps.length,
    resetMs: options.windowMs,
  };
}

import { resolveClientIp } from '@/lib/security/botProtection';

/**
 * Extracts a client identifier using sanitized reverse-proxy priority
 */
export function getClientIp(headers: Headers): string {
  return resolveClientIp(headers);
}

