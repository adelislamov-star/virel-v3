import { MetadataRoute } from 'next'

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
    sitemap: 'https://virel-v3.vercel.app/sitemap.xml',
  }
}
