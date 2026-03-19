// Seed script — run: npx tsx src/scripts/seedCategories.ts
// Seeds all categories from data/categories.ts into the categories table

import { PrismaClient } from '@prisma/client';
import { categories } from '../../data/categories';

const prisma = new PrismaClient();

async function main() {
  console.log(`Seeding ${categories.length} categories...`);

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { title: cat.name },
      create: {
        title: cat.name,
        slug: cat.slug,
        h1: `${cat.name} Escorts London`,
        status: 'active',
      },
    });
    console.log(`  ✓ ${cat.slug}`);
  }

  console.log('Done');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
