import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/auth/sign-in', '/auth/forgot-password'],
        disallow: [
          '/api/',
          '/dashboard/',
          '/organizations/',
          '/events/',
          '/admin/',
          '/invitations/',
          '/auth/reset-password',
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
