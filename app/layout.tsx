import type { Metadata, Viewport } from 'next';
import React from 'react';
import './globals.css';
import { GoogleAnalytics } from './components/analytics/GoogleAnalytics';
import { CookieConsentBanner } from './components/analytics/CookieConsentBanner';
import { ToastProvider } from './components/ui/Toast';
import { ThemeProvider } from './components/theme/ThemeProvider';
import CustomerServiceFloatingWidget from './components/navigation/CustomerServiceFloatingWidget';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#0f172a',
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'MS Backstage — Multi-Tenant Event Operations & Registration Platform',
    template: '%s | MS Backstage',
  },
  description:
    'Enterprise-grade multi-tenant SaaS platform for conference event operations, rapid spot registration desk, QR code check-in, custom thermal badge designer, and real-time attendance analytics.',
  keywords: [
    'event management',
    'conference operations',
    'spot registration desk',
    'QR badge check-in',
    'badge printing designer',
    'multi-tenant event SaaS',
    'attendance reports',
    'event staff management',
  ],
  authors: [{ name: 'MS Backstage Team' }],
  creator: 'MS Backstage',
  publisher: 'MS Backstage',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    siteName: 'MS Backstage',
    title: 'MS Backstage — Multi-Tenant Event Operations & Registration Platform',
    description:
      'Enterprise-grade multi-tenant SaaS platform for conference event operations, rapid spot registration desk, QR code check-in, custom thermal badge designer, and real-time attendance analytics.',
    images: [
      {
        url: '/ms_logo_mark.png',
        width: 1200,
        height: 630,
        alt: 'MS Backstage Event Operations Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MS Backstage — Multi-Tenant Event Operations & Registration Platform',
    description:
      'Enterprise-grade multi-tenant SaaS platform for conference event operations, rapid spot registration desk, QR code check-in, custom thermal badge designer, and real-time attendance analytics.',
    images: ['/ms_logo_mark.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/msfav.png', type: 'image/png' },
    ],
    apple: [
      { url: '/msfav.png', type: 'image/png' },
    ],
  },
  verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
    : undefined,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&family=Cinzel:wght@400;600;700;800&family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Dancing+Script:wght@500;700&family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&family=Montserrat:wght@400;500;600;700;800&family=Outfit:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,800;1,400&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Poppins:wght@300;400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem('ms_theme');
                  var theme = stored === 'light' ? 'light' : 'dark';
                  if (theme === 'light') {
                    document.documentElement.classList.add('light');
                    document.documentElement.classList.remove('dark');
                    document.documentElement.style.colorScheme = 'light';
                  } else {
                    document.documentElement.classList.add('dark');
                    document.documentElement.classList.remove('light');
                    document.documentElement.style.colorScheme = 'dark';
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-background text-foreground flex flex-col antialiased selection:bg-indigo-500 selection:text-white transition-colors duration-200">
        <GoogleAnalytics />
        <ThemeProvider>
          <ToastProvider>
            <div className="flex-1 flex flex-col">
              {children}
            </div>
            <CustomerServiceFloatingWidget />
          </ToastProvider>
        </ThemeProvider>
        <CookieConsentBanner />
      </body>
    </html>
  );
}
