/**
 * Free Layered Bot Protection & Proxy Heuristics
 * 
 * Provides:
 * 1. Safe Client IP Resolution (prioritizing trusted edge headers like CF-Connecting-IP, X-Real-IP)
 * 2. Honeypot Validation for public forms
 * 3. Free Header Anomaly & Proxy Indicators (detecting proxy signatures without paid subscriptions)
 * 4. Safe Abuse Logging (never logs passwords, secrets, or tokens)
 */

export interface ClientConnectionInfo {
  ip: string;
  isSuspectedProxy: boolean;
  proxySignals: string[];
}

// Regex to validate IPv4 and IPv6 format
const IPV4_REGEX = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
const IPV6_REGEX = /^[0-9a-fA-F:]+$/;

/**
 * Safely resolves the client IP address from request headers.
 * Never blindly trusts raw X-Forwarded-For if trusted edge headers are present.
 */
export function resolveClientIp(headers: Headers): string {
  // 1. Cloudflare edge header (highest confidence when deployed behind Cloudflare)
  const cfConnectingIp = headers.get('cf-connecting-ip');
  if (cfConnectingIp && isValidIp(cfConnectingIp.trim())) {
    return cfConnectingIp.trim();
  }

  // 2. Direct reverse proxy real IP (Nginx, Caddy, AWS ALB, Traefik)
  const xRealIp = headers.get('x-real-ip');
  if (xRealIp && isValidIp(xRealIp.trim())) {
    return xRealIp.trim();
  }

  // 3. True-Client-IP header (Akamai, Cloudflare Enterprise)
  const trueClientIp = headers.get('true-client-ip');
  if (trueClientIp && isValidIp(trueClientIp.trim())) {
    return trueClientIp.trim();
  }

  // 4. X-Forwarded-For: Take the first well-formed IP in the chain
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    const parts = forwarded.split(',').map((p) => p.trim());
    for (const part of parts) {
      if (isValidIp(part)) {
        return part;
      }
    }
  }

  return '127.0.0.1';
}

function isValidIp(ip: string): boolean {
  if (!ip || ip.length > 45) return false;
  // Disallow suspicious injection chars
  if (/[^\d.:a-fA-F]/.test(ip)) return false;
  return IPV4_REGEX.test(ip) || IPV6_REGEX.test(ip);
}

/**
 * Inspects incoming request headers for proxy or automated bot signatures
 * using entirely free, zero-cost heuristics.
 */
export function inspectConnectionHeaders(headers: Headers): ClientConnectionInfo {
  const ip = resolveClientIp(headers);
  const proxySignals: string[] = [];

  // Check for common proxy headers
  const viaHeader = headers.get('via');
  if (viaHeader) {
    proxySignals.push(`via:${viaHeader.slice(0, 50)}`);
  }

  const proxyConnection = headers.get('proxy-connection');
  if (proxyConnection) {
    proxySignals.push('proxy-connection');
  }

  const forwardedHeader = headers.get('forwarded');
  if (forwardedHeader && forwardedHeader.toLowerCase().includes('proto=')) {
    proxySignals.push('standard-forwarded');
  }

  // Check for automated bot user-agents
  const userAgent = headers.get('user-agent') || '';
  if (!userAgent || userAgent.length < 5) {
    proxySignals.push('empty-or-minimal-user-agent');
  } else if (/curl|python|wget|postman|insomnia|scrapy|headlesschrome|phantomjs/i.test(userAgent)) {
    proxySignals.push(`automated-client:${userAgent.slice(0, 30)}`);
  }

  return {
    ip,
    isSuspectedProxy: proxySignals.length > 0,
    proxySignals,
  };
}

export function validateHoneypot(
  body: any,
  headers?: Headers,
  honeypotFieldNames = ['website_hp', 'hp_token', 'company_fax']
): {
  isBot: boolean;
  matchedField?: string;
} {
  if (headers) {
    const hpHeader = headers.get('x-honeypot');
    if (hpHeader && hpHeader.trim().length > 0) {
      return { isBot: true, matchedField: 'x-honeypot-header' };
    }
  }

  if (!body || typeof body !== 'object') {
    return { isBot: false };
  }

  for (const field of honeypotFieldNames) {
    const val = body[field];
    if (val !== undefined && val !== null && String(val).trim().length > 0) {
      return { isBot: true, matchedField: field };
    }
  }

  return { isBot: false };
}

/**
 * Safely logs security abuse events without exposing passwords, tokens, or PII.
 */
export function logSecurityEvent(
  category: 'RATE_LIMIT' | 'CAPTCHA_FAILURE' | 'HONEYPOT_TRIGGER' | 'SUSPECTED_BOT' | 'AUTH_FAILURE',
  details: {
    ip?: string;
    endpoint?: string;
    identifier?: string;
    reason?: string;
    extra?: Record<string, any>;
  }
) {
  // Anonymize email/identifier: mask local-part
  let safeIdentifier: string | undefined = undefined;
  if (details.identifier && typeof details.identifier === 'string') {
    const [local, domain] = details.identifier.split('@');
    if (domain) {
      safeIdentifier = `${local.slice(0, 2)}***@${domain}`;
    } else {
      safeIdentifier = `${details.identifier.slice(0, 3)}***`;
    }
  }

  const eventPayload = {
    timestamp: new Date().toISOString(),
    category,
    ip: details.ip || 'unknown',
    endpoint: details.endpoint || 'unknown',
    identifier: safeIdentifier,
    reason: details.reason,
    signals: details.extra?.signals || undefined,
  };

  console.warn(`[SECURITY_ALERT] [${category}]`, JSON.stringify(eventPayload));
}
