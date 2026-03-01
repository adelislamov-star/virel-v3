import { MetadataRoute } from 'next'
import { prisma } from '@/lib/db/client'

const BASE = 'https://virel-v3.vercel.app'

const DISTRICTS = [
  'mayfair','kensington','knightsbridge','chelsea','belgravia','marylebone',
  'westminster','soho','canary-wharf','notting-hill','paddington','victoria',
  'south-kensington','marble-arch','gloucester-road',
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${BASE}/london-escorts`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE}/faq`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/join`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
  ]

  // Geo pages
  const geoPages: MetadataRoute.Sitemap = DISTRICTS.map(d => ({
    url: `${BASE}/escorts-in/${d}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  // Model profiles
  let modelPages: MetadataRoute.Sitemap = []
  try {
    const models = await prisma.model.findMany({
      where: { status: 'active', visibility: 'public' },
      select: { slug: true, updatedAt: true },
    })
    modelPages = models.map(m => ({
      url: `${BASE}/catalog/${m.slug}`,
      lastModified: m.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.85,
    }))
  } catch (e) {}

  return [...staticPages, ...geoPages, ...modelPages]
}
