export const dynamic = 'force-dynamic'

import { MetadataRoute } from 'next'
import { DISTRICTS } from '@/data/districts'
import { siteConfig } from '@/../config/site'

export default function sitemap(): MetadataRoute.Sitemap {
  return DISTRICTS.map(d => ({
    url: `${siteConfig.domain}/london/${d.slug}-escorts`,
    changeFrequency: 'weekly' as const,
    priority: d.tier === 1 ? 0.8 : d.tier === 2 ? 0.7 : 0.6,
    lastModified: new Date(),
  }))
}
