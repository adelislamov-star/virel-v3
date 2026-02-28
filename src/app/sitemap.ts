import { MetadataRoute } from 'next'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://virel-v3.vercel.app'

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/london-escorts`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/services`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
  ]

  // District pages
  const districts = [
    'aldgate','baker-street','battersea','bayswater','belgravia','bermondsey','bloomsbury',
    'bond-street','brixton','camden','canary-wharf','chelsea','covent-garden','dalston',
    'earls-court','edgware-road','euston','fitzrovia','fulham','gatwick-airport',
    'gloucester-road','hackney','hammersmith','heathrow','holborn','holland-park-avenue',
    'hyde-park','islington','kensington','kings-cross','knightsbridge','lancaster-gate',
    'leicester-square','london-bridge','marble-arch','marylebone','mayfair','notting-hill',
    'oxford-street','paddington','park-lane','peckham','queensway','shepherds-bush',
    'shoreditch','sloane-square','soho','south-kensington','stratford','tottenham-court-road',
    'tower-hill','victoria','warren-street','waterloo','wembley','west-end','westminster','wimbledon'
  ]
  const districtPages: MetadataRoute.Sitemap = districts.map(d => ({
    url: `${baseUrl}/escorts-in-${d}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  // Service pages
  const services = ['gfe', 'dinner-date', 'travel-companion', 'vip', 'overnight']
  const servicePages: MetadataRoute.Sitemap = services.map(s => ({
    url: `${baseUrl}/services/${s}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  // Model pages
  let modelPages: MetadataRoute.Sitemap = []
  try {
    const models = await prisma.model.findMany({
      where: { status: 'active', visibility: 'public' },
      select: { slug: true, updatedAt: true },
    })
    modelPages = models.map(m => ({
      url: `${baseUrl}/catalog/${m.slug}`,
      lastModified: m.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))
  } catch (e) {}

  return [...staticPages, ...districtPages, ...servicePages, ...modelPages]
}
