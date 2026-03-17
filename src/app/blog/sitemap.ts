import { MetadataRoute } from 'next'
import { prisma } from '@/lib/db/client'
import { siteConfig } from '@/../config/site'

const BASE = siteConfig.domain

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await prisma.blogPost.findMany({
    where: { isPublished: true },
    select: { slug: true, updatedAt: true },
  }).catch(() => [])
  return posts.map((p: any) => ({
    url: `${BASE}/blog/${p.slug}`,
    lastModified: p.updatedAt,
    changeFrequency: 'monthly',
    priority: 0.6,
  }))
}
