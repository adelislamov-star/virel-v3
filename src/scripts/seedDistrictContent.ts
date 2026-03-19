// Seed script — run: npx tsx src/scripts/seedDistrictContent.ts

import { PrismaClient } from '@prisma/client';
import { districtContent } from '../data/district-content';

const prisma = new PrismaClient();

async function main() {
  const slugs = Object.keys(districtContent);
  console.log(`Seeding district content for ${slugs.length} districts...`);

  for (const slug of slugs) {
    const data = districtContent[slug];

    const district = await prisma.district.findUnique({ where: { slug } });
    if (!district) {
      console.warn(`  ⚠ District not found: ${slug} — skipping`);
      continue;
    }

    const updateData: Record<string, unknown> = {};

    if (data.aboutParagraphs) updateData.aboutParagraphs = data.aboutParagraphs;
    if (data.standardTextParagraphs) updateData.standardTextParagraphs = data.standardTextParagraphs;
    if (data.nearbyText) updateData.nearbyText = data.nearbyText;
    if (data.faq) updateData.faq = data.faq;
    if (data.ctaText) updateData.ctaText = data.ctaText;

    // Only set seoDescription if the entry has metaDescription and the district doesn't already have one
    if (data.metaDescription && !district.seoDescription) {
      updateData.seoDescription = data.metaDescription;
    }

    // Only set hotels if entry has them and district doesn't already have them
    if (data.hotels && (!district.hotels || (district.hotels as string[]).length === 0)) {
      updateData.hotels = data.hotels;
    }

    // Only set restaurants if entry has them and district doesn't already have them
    if (data.restaurants && (!district.restaurants || (district.restaurants as string[]).length === 0)) {
      updateData.restaurants = data.restaurants;
    }

    await prisma.district.update({
      where: { id: district.id },
      data: updateData,
    });

    console.log(`  ✓ ${slug}`);
  }

  console.log('Done');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
