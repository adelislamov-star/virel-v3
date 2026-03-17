import { MetadataRoute } from 'next'
import { siteConfig } from '@/../config/site'

const BASE = siteConfig.domain

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/_next/',
          '/find-your-match/',
          '/book/',
          '/members/dashboard',
          '/members/bookings',
          '/members/profile',
        ],
      },
    ],
    sitemap: [
      `${BASE}/sitemap.xml`,
      `${BASE}/companions/sitemap.xml`,
      `${BASE}/london/sitemap.xml`,
      `${BASE}/categories/sitemap.xml`,
      `${BASE}/services/sitemap.xml`,
      `${BASE}/blog/sitemap.xml`,
    ],
  }
}
