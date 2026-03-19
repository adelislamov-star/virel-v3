// Seed script — run: npx tsx src/scripts/seedCategoryContent.ts

import { PrismaClient } from '@prisma/client';
import { categoryContent } from '../data/category-content';

const prisma = new PrismaClient();

async function main() {
  const slugs = Object.keys(categoryContent);
  console.log(`Seeding category content for ${slugs.length} categories...`);

  for (const slug of slugs) {
    const data = categoryContent[slug];

    const category = await prisma.category.findUnique({ where: { slug } });
    if (!category) {
      console.warn(`  ⚠ Category not found: ${slug} — skipping`);
      continue;
    }

    await prisma.categoryContent.upsert({
      where: { categoryId: category.id },
      create: {
        categoryId: category.id,
        aboutParagraphs: data.aboutParagraphs,
        standardText: data.standardText,
        relatedCategories: data.relatedCategories,
        faq: data.faq,
      },
      update: {
        aboutParagraphs: data.aboutParagraphs,
        standardText: data.standardText,
        relatedCategories: data.relatedCategories,
        faq: data.faq,
      },
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
