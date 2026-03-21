import { MetadataRoute } from 'next'
import { siteConfig } from '@/../config/site'
import { prisma } from '@/lib/db/client'

const BASE = siteConfig.domain

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await prisma.blogPost.findMany({
    where: { isPublished: true },
    orderBy: { publishedAt: 'desc' },
    select: { slug: true, updatedAt: true },
  })

  return posts.map(p => ({
    url: `${BASE}/blog/${p.slug}`,
    lastModified: p.updatedAt,
    changeFrequency: 'monthly',
    priority: 0.6,
  }))
}
