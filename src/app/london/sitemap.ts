export const dynamic = 'force-dynamic'

import { MetadataRoute } from 'next'
import { prisma } from '@/lib/db/client'
import { siteConfig } from '@/../config/site'

const BASE = siteConfig.domain

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const districts = await prisma.district.findMany({
    where: { isActive: true },
    select: { slug: true, updatedAt: true },
  })
  return districts.map(d => ({
    url: `${BASE}/london/${d.slug}-escorts`,
    lastModified: d.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.7,
  }))
}
