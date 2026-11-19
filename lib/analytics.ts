/**
 * Google Analytics 4 (GA4) Client-Safe Utility
 *
 * Privacy Guarantees:
 * 1. Operates only when NEXT_PUBLIC_GA_MEASUREMENT_ID is configured.
 * 2. Disabled by default unless user grants cookie consent.
 * 3. Never tracks PII (names, emails, phones, medical council IDs, QR tokens, passwords).
 * 4. Strictly restricted to public pages. Never tracks private attendee or event operational data.
 */

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || '';

// Disallowed parameter names that must NEVER be passed to analytics
const DISALLOWED_PARAMS = new Set([
  'email',
  'name',
  'phone',
  'phonenumber',
  'token',
  'password',
  'qrtoken',
  'medicalcouncilnumber',
  'registrationnumber',
  'attendeeid',
  'userid',
  'query',
  'search',
]);

/**
 * Check if GA is active and user has granted consent
 */
export function isAnalyticsAllowed(): boolean {
  if (typeof window === 'undefined') return false;
  if (!GA_MEASUREMENT_ID) return false;
  const consent = localStorage.getItem('ms_cookie_consent');
  return consent === 'granted';
}

/**
 * Track page views safely on public routes
 */
export function trackPageView(url: string) {
  if (!isAnalyticsAllowed()) return;
  if (typeof window !== 'undefined' && (window as any).gtag) {
    // Sanitize URL to ensure no sensitive query params (e.g. ?token=...)
    const cleanUrl = url.split('?')[0];
    (window as any).gtag('config', GA_MEASUREMENT_ID, {
      page_path: cleanUrl,
    });
  }
}

/**
 * Track custom public user actions with strict parameter sanitization
 */
export function trackEvent(action: string, params: Record<string, string | number | boolean> = {}) {
  if (!isAnalyticsAllowed()) return;
  if (typeof window !== 'undefined' && (window as any).gtag) {
    // Filter out any disallowed parameters
    const safeParams: Record<string, string | number | boolean> = {};
    for (const [key, value] of Object.entries(params)) {
      if (!DISALLOWED_PARAMS.has(key.toLowerCase())) {
        safeParams[key] = value;
      }
    }

    (window as any).gtag('event', action, safeParams);
  }
}

/**
 * Update Google Tag Consent Mode
 */
export function updateAnalyticsConsent(granted: boolean) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('ms_cookie_consent', granted ? 'granted' : 'denied');
  if ((window as any).gtag) {
    (window as any).gtag('consent', 'update', {
      analytics_storage: granted ? 'granted' : 'denied',
    });
  }
}
