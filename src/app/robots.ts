import { MetadataRoute } from 'next'
import { siteConfig } from '@/../config/site'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/members/dashboard',
          '/members/bookings',
          '/members/profile',
        ],
      },
    ],
    sitemap: `${siteConfig.domain}/sitemap.xml`,
  }
}
