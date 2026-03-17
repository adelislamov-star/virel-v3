import { MetadataRoute } from 'next'
import { prisma } from '@/lib/db/client'
import { siteConfig } from '@/../config/site'

const BASE = siteConfig.domain

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const models = await prisma.model.findMany({
    where: { status: 'active', deletedAt: null },
    select: { slug: true, updatedAt: true },
  })
  return models.map(m => ({
    url: `${BASE}/companions/${m.slug}`,
    lastModified: m.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.8,
  }))
}
