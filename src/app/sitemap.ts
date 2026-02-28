import { MetadataRoute } from 'next'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const DISTRICTS = [
  'aldgate','baker-street','battersea','bayswater','belgravia','bermondsey','bloomsbury',
  'bond-street','brixton','camden','canary-wharf','chelsea','covent-garden','dalston',
  'earls-court','edgware-road','euston','fitzrovia','fulham','gatwick-airport',
  'gloucester-road','hackney','hammersmith','heathrow','holborn','holland-park-avenue',
  'hyde-park','islington','kensington','kings-cross','knightsbridge','lancaster-gate',
  'leicester-square','london-bridge','marble-arch','marylebone','mayfair','notting-hill',
  'oxford-street','paddington','park-lane','peckham','queensway','shepherds-bush',
  'shoreditch','sloane-square','soho','south-kensington','stratford','tottenham-court-road',
  'tower-hill','victoria','warren-street','waterloo','wembley','west-end','westminster','wimbledon',
]

const SERVICE_SLUGS = [
  'a-level','ball-busting','body-to-body-massage','bondage','caning','cif','cim','cob',
  'couples','cuckolding','deep-throat','dfk','double-penetration','filming-with-mask',
  'fingering','fisting-giving','fk','foot-fetish','gfe','humiliation','incall','latex',
  'nuru-massage','outcall','owo','party','poppers-play','prostate-massage',
  'rimming-receiving','roleplay','rope-bondage','sensual-wrestling','shower','slapping',
  'spanking','strap-on','swallow','trampling','watersports','30-minute','69',
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = 'https://virel-v3.vercel.app'
  const now = new Date()

  const staticPages: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${base}/london-escorts`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/services`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
  ]

  const districtPages: MetadataRoute.Sitemap = DISTRICTS.map(d => ({
    url: `${base}/escorts-in/${d}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  const servicePages: MetadataRoute.Sitemap = SERVICE_SLUGS.map(s => ({
    url: `${base}/services/${s}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.75,
  }))

  let modelPages: MetadataRoute.Sitemap = []
  try {
    const models = await prisma.model.findMany({
      where: { status: 'active', visibility: 'public' },
      select: { slug: true, updatedAt: true },
    })
    modelPages = models.map(m => ({
      url: `${base}/catalog/${m.slug}`,
      lastModified: m.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))
  } catch {}

  return [...staticPages, ...districtPages, ...servicePages, ...modelPages]
}
