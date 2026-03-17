import { MetadataRoute } from 'next'
import { siteConfig } from '@/../config/site'
import { categories } from '@/../data/categories'

const BASE = siteConfig.domain

export default function sitemap(): MetadataRoute.Sitemap {
  return categories.map(c => ({
    url: `${BASE}/categories/${c.slug}`,
    changeFrequency: 'weekly',
    priority: 0.6,
  }))
}
