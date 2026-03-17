import { MetadataRoute } from 'next'
import { siteConfig } from '@/../config/site'

const BASE = siteConfig.domain

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: BASE, changeFrequency: 'daily', priority: 1.0 },
    { url: `${BASE}/companions`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE}/services`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE}/blog`, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${BASE}/about`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/contact`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/faq`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/categories`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE}/london-escorts`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE}/how-it-works`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/discretion`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/verification`, changeFrequency: 'monthly', priority: 0.6 },
  ]
}
