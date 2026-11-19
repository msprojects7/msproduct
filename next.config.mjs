/** @type {import('next').NextConfig} */
const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://checkout.razorpay.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  img-src 'self' data: blob: https://www.googletagmanager.com https://*.google-analytics.com https://images.unsplash.com https://*.unsplash.com;
  font-src 'self' data: https://fonts.gstatic.com;
  connect-src 'self' https://*.neon.tech https://*.neonauth.*.aws.neon.tech https://www.google-analytics.com https://*.google-analytics.com https://api.razorpay.com https://lumberjack.razorpay.com;
  frame-src 'self' https://api.razorpay.com;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
`.replace(/\s{2,}/g, ' ').trim();

const cspHeaderMicrosite = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://checkout.razorpay.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  img-src 'self' data: blob: https://www.googletagmanager.com https://*.google-analytics.com https://images.unsplash.com https://*.unsplash.com;
  font-src 'self' data: https://fonts.gstatic.com;
  connect-src 'self' https://*.neon.tech https://*.neonauth.*.aws.neon.tech https://www.google-analytics.com https://*.google-analytics.com https://api.razorpay.com https://lumberjack.razorpay.com;
  frame-src 'self' https://api.razorpay.com;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'self';
`.replace(/\s{2,}/g, ' ').trim();

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '**.unsplash.com',
      },
    ],
  },
  async headers() {
    return [
      {
        // Global security headers for all routes
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: cspHeader,
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(self), microphone=(), geolocation=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
      {
        // Public event microsite headers: permit same-origin iframe embedding for website builder live preview
        source: '/p/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: cspHeaderMicrosite,
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
        ],
      },
      {
        // Prevent token leakage on invitation links
        source: '/invitations/:path*',
        headers: [
          {
            key: 'Referrer-Policy',
            value: 'no-referrer',
          },
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate',
          },
        ],
      },
      {
        // Absolute non-caching for all API and data endpoints to prevent cross-tenant data leakage
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
      {
        // Caching for public static assets
        source: '/(favicon.ico|ms_logo_mark.png|msfav.png|fav.ico)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=604800',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
