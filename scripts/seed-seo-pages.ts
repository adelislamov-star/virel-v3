// SEED SEO PAGES
// Creates SEOPage records for published models, active locations, and services
// Run: npx tsx scripts/seed-seo-pages.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding SEO pages...\n');

  let created = 0;
  let skipped = 0;

  // 1. Model profile pages: /companions/{slug}
  const models = await prisma.model.findMany({
    where: { status: 'published' },
    select: { id: true, name: true, slug: true }
  });

  for (const model of models) {
    const path = `/companions/${model.slug}`;
    const exists = await prisma.sEOPage.findUnique({ where: { path } });
    if (exists) {
      console.log(`  SKIP: ${path} (already exists)`);
      skipped++;
      continue;
    }
    await prisma.sEOPage.create({
      data: {
        pageType: 'model_profile',
        path,
        title: `${model.name} — London Escort | Virel`,
        metaDescription: `Book ${model.name}, a premium London escort. View photos, services, and availability.`,
        indexStatus: 'indexed'
      }
    });
    console.log(`  OK: ${path}`);
    created++;
  }

  // 2. Geo pages: /escorts-in/{slug}
  const locations = await prisma.location.findMany({
    where: { status: 'active' },
    select: { id: true, title: true, slug: true }
  });

  for (const location of locations) {
    const path = `/escorts-in/${location.slug}`;
    const exists = await prisma.sEOPage.findUnique({ where: { path } });
    if (exists) {
      console.log(`  SKIP: ${path} (already exists)`);
      skipped++;
      continue;
    }
    await prisma.sEOPage.create({
      data: {
        pageType: 'geo_page',
        path,
        title: `Escorts in ${location.title} | Virel`,
        metaDescription: `Find premium escorts in ${location.title}. Browse profiles, check availability, and book online.`,
        indexStatus: 'indexed'
      }
    });
    console.log(`  OK: ${path}`);
    created++;
  }

  // 3. Service pages: /services/{slug}
  const services = await prisma.service.findMany({
    where: { status: 'active' },
    select: { id: true, title: true, slug: true }
  });

  for (const service of services) {
    const path = `/services/${service.slug}`;
    const exists = await prisma.sEOPage.findUnique({ where: { path } });
    if (exists) {
      console.log(`  SKIP: ${path} (already exists)`);
      skipped++;
      continue;
    }
    await prisma.sEOPage.create({
      data: {
        pageType: 'service_page',
        path,
        title: `${service.title} — London Escorts | Virel`,
        metaDescription: `Explore ${service.title} with premium London escorts. Book online at Virel.`,
        indexStatus: 'indexed'
      }
    });
    console.log(`  OK: ${path}`);
    created++;
  }

  console.log(`\nSeed complete: ${created} created, ${skipped} skipped.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
