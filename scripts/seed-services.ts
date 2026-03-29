import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // 1. Чистим старые связи и услуги
  await prisma.modelService.deleteMany({})
  await prisma.bookingService.deleteMany({})
  await prisma.service.deleteMany({})
  console.log('✓ Cleared old services')

  // 2. Создаём новые
  const services = [
    // ALLURE
    { title: 'GFE', category: 'allure', sortOrder: 0 },
    { title: 'PSE', category: 'allure', sortOrder: 1 },
    { title: 'Roleplay', category: 'allure', sortOrder: 2 },
    { title: 'Party girl', category: 'allure', sortOrder: 3 },
    { title: 'Dirty talk', category: 'allure', sortOrder: 4 },
    { title: 'Open minded', category: 'allure', sortOrder: 5 },
    { title: 'DUO', category: 'allure', sortOrder: 6 },
    { title: 'Bi DUO', category: 'allure', sortOrder: 7 },
    { title: 'Couples', category: 'allure', sortOrder: 8 },
    { title: 'MMF', category: 'allure', sortOrder: 9 },
    { title: 'Group', category: 'allure', sortOrder: 10 },

    // INTIMACY
    { title: '69', category: 'intimacy', sortOrder: 0 },
    { title: 'FK', category: 'intimacy', sortOrder: 1 },
    { title: 'DFK', category: 'intimacy', sortOrder: 2 },
    { title: 'OWC', category: 'intimacy', sortOrder: 3 },
    { title: 'OWO', category: 'intimacy', sortOrder: 4 },
    { title: 'DT', category: 'intimacy', sortOrder: 5 },
    { title: 'Fingering', category: 'intimacy', sortOrder: 6 },
    { title: 'COB', category: 'intimacy', sortOrder: 7 },
    { title: 'CIF', category: 'intimacy', sortOrder: 8 },
    { title: 'CIM', category: 'intimacy', sortOrder: 9 },
    { title: 'Swallow', category: 'intimacy', sortOrder: 10 },
    { title: 'Snowballing', category: 'intimacy', sortOrder: 11 },

    // DESIRE
    { title: 'A-Level', category: 'desire', sortOrder: 0 },
    { title: 'DP', category: 'desire', sortOrder: 1 },
    { title: 'Face sitting', category: 'desire', sortOrder: 2 },
    { title: 'Rimming giving', category: 'desire', sortOrder: 3 },
    { title: 'Rimming receiving', category: 'desire', sortOrder: 4 },
    { title: 'WS giving', category: 'desire', sortOrder: 5 },
    { title: 'WS receiving', category: 'desire', sortOrder: 6 },
    { title: 'Foot fetish', category: 'desire', sortOrder: 7 },
    { title: 'Smoking fetish', category: 'desire', sortOrder: 8 },
    { title: "Lady's services", category: 'desire', sortOrder: 9 },

    // CONTROL
    { title: 'Domination', category: 'control', sortOrder: 0 },
    { title: 'Light domination', category: 'control', sortOrder: 1 },
    { title: 'Spanking giving', category: 'control', sortOrder: 2 },
    { title: 'Soft spanking receiving', category: 'control', sortOrder: 3 },
    { title: 'Fisting giving', category: 'control', sortOrder: 4 },
    { title: 'Tie and Tease', category: 'control', sortOrder: 5 },

    // INDULGENCE
    { title: 'Massage', category: 'indulgence', sortOrder: 0 },
    { title: 'Prostate massage', category: 'indulgence', sortOrder: 1 },
    { title: 'Professional massage', category: 'indulgence', sortOrder: 2 },
    { title: 'Body to body massage', category: 'indulgence', sortOrder: 3 },
    { title: 'Erotic massage', category: 'indulgence', sortOrder: 4 },
    { title: 'Lomilomi massage', category: 'indulgence', sortOrder: 5 },
    { title: 'Nuru massage', category: 'indulgence', sortOrder: 6 },
    { title: 'Sensual massage', category: 'indulgence', sortOrder: 7 },
    { title: 'Tantric massage', category: 'indulgence', sortOrder: 8 },
    { title: 'Striptease', category: 'indulgence', sortOrder: 9 },
    { title: 'Lapdancing', category: 'indulgence', sortOrder: 10 },
    { title: 'Belly-dance', category: 'indulgence', sortOrder: 11 },
    { title: 'Filming with mask', category: 'indulgence', sortOrder: 12 },
    { title: 'Filming without mask', category: 'indulgence', sortOrder: 13 },
    { title: 'Uniforms', category: 'indulgence', sortOrder: 14 },
    { title: 'Toys', category: 'indulgence', sortOrder: 15 },
    { title: 'Strap-on', category: 'indulgence', sortOrder: 16 },
    { title: 'Poppers', category: 'indulgence', sortOrder: 17 },
    { title: 'Handcuffs', category: 'indulgence', sortOrder: 18 },
  ].map((s) => ({
    ...s,
    slug: s.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    isPublic: true,
    isActive: true,
    isPopular: false,
    status: 'active',
    description: null,
    publicName: null,
    seoTitle: null,
    seoDescription: null,
    seoKeywords: null,
    introText: null,
    fullDescription: null,
    defaultExtraPrice: null,
  }))

  await prisma.service.createMany({ data: services })

  // 3. Итог
  const counts = await prisma.service.groupBy({
    by: ['category'],
    _count: { id: true },
    orderBy: { category: 'asc' },
  })

  console.log(`✓ Created ${services.length} services across 5 categories`)
  for (const c of counts) {
    console.log(`  ${c.category}: ${c._count.id}`)
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
