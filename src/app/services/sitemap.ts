import { MetadataRoute } from 'next'
import { prisma } from '@/lib/db/client'
import { siteConfig } from '@/../config/site'

const BASE = siteConfig.domain

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const services = await prisma.service.findMany({
    where: { isActive: true, isPublic: true },
    select: { slug: true, updatedAt: true },
  })
  return services.map(s => ({
    url: `${BASE}/services/${s.slug}`,
    lastModified: s.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.7,
  }))
}
