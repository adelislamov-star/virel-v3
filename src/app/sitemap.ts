import { MetadataRoute } from 'next'
import { prisma } from '@/lib/db/client'
import { siteConfig } from '@/../config/site'
import { categories } from '@/../data/categories'

const BASE = siteConfig.domain

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [models, services, districts, posts] = await Promise.all([
    prisma.model.findMany({ where: { status: 'active', deletedAt: null }, select: { slug: true, updatedAt: true } }),
    prisma.service.findMany({ where: { isActive: true, isPublic: true }, select: { slug: true, updatedAt: true } }),
    prisma.district.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } }),
    prisma.blogPost.findMany({ where: { isPublished: true }, select: { slug: true, updatedAt: true } }).catch(() => []),
  ])

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE, changeFrequency: 'daily', priority: 1.0 },
    { url: `${BASE}/companions`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE}/services`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE}/find-your-match`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/book`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/blog`, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${BASE}/about`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/contact`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/faq`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/categories`, changeFrequency: 'weekly', priority: 0.7 },
  ]

  return [
    ...staticPages,
    ...models.map(m => ({ url: `${BASE}/companions/${m.slug}`, lastModified: m.updatedAt, priority: 0.8 as const })),
    ...services.map(s => ({ url: `${BASE}/services/${s.slug}`, lastModified: s.updatedAt, priority: 0.7 as const })),
    ...districts.map(d => ({ url: `${BASE}/london/${d.slug}-escorts/`, lastModified: d.updatedAt, priority: 0.7 as const })),
    ...categories.map(c => ({ url: `${BASE}/categories/${c.slug}`, priority: 0.6 as const })),
    ...posts.map(p => ({ url: `${BASE}/blog/${(p as any).slug}`, lastModified: (p as any).updatedAt, priority: 0.6 as const })),
  ]
}
