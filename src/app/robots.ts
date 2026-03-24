import { MetadataRoute } from 'next'
import { siteConfig } from '@/../config/site'
import { prisma } from '@/lib/db/client'

export const dynamic = 'force-dynamic'

const BASE = siteConfig.domain

export default async function robots(): Promise<MetadataRoute.Robots> {
  const blogCount = await prisma.blogPost.count({ where: { isPublished: true } })

  const sitemaps = [
    `${BASE}/sitemap.xml`,
    `${BASE}/companions/sitemap.xml`,
    `${BASE}/london/sitemap.xml`,
    `${BASE}/categories/sitemap.xml`,
    `${BASE}/services/sitemap.xml`,
  ]

  if (blogCount > 0) {
    sitemaps.push(`${BASE}/blog/sitemap.xml`)
  }

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
    sitemap: sitemaps,
  }
}
