import { MetadataRoute } from 'next'
import { siteConfig } from '@/../config/site'
import { blogPosts } from '@/../data/blog-posts'

const BASE = siteConfig.domain

export default function sitemap(): MetadataRoute.Sitemap {
  return blogPosts.map(p => ({
    url: `${BASE}/blog/${p.slug}`,
    lastModified: new Date(p.publishedAt),
    changeFrequency: 'monthly',
    priority: 0.6,
  }))
}
