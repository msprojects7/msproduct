'use client';

import React, { useEffect, Suspense } from 'react';
import Script from 'next/script';
import { usePathname, useSearchParams } from 'next/navigation';
import { GA_MEASUREMENT_ID, trackPageView } from '@/lib/analytics';

function AnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!GA_MEASUREMENT_ID || !pathname) return;

    // Strict privacy boundary: Only track public routes (marketing homepage, sign in, auth)
    // Never track private tenant routes (/events, /dashboard, /organizations, /admin, etc.)
    const isPublicRoute =
      pathname === '/' ||
      pathname.startsWith('/auth') ||
      pathname === '/privacy' ||
      pathname === '/terms';

    if (isPublicRoute) {
      trackPageView(pathname);
    }
  }, [pathname, searchParams]);

  return null;
}

export function GoogleAnalytics() {
  if (!GA_MEASUREMENT_ID) {
    return null;
  }

  return (
    <>
      <Script
        id="google-tag-consent"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            
            // Default to denied for GDPR / privacy compliance
            var consentState = 'denied';
            try {
              if (localStorage.getItem('ms_cookie_consent') === 'granted') {
                consentState = 'granted';
              }
            } catch (e) {}

            gtag('consent', 'default', {
              'analytics_storage': consentState,
              'ad_storage': 'denied',
              'ad_user_data': 'denied',
              'ad_personalization': 'denied'
            });
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}', {
              send_page_view: false // Managed manually for App Router navigation
            });
          `,
        }}
      />
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
      />
      <Suspense fallback={null}>
        <AnalyticsTracker />
      </Suspense>
    </>
  );
}
