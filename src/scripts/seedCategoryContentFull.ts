// Seed script — run: npx tsx src/scripts/seedCategoryContentFull.ts
// Generates SEO content for ALL categories that don't have content yet

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function generateCategoryContent(name: string, slug: string) {
  const nameLower = name.toLowerCase();

  const aboutParagraphs = [
    `Our ${nameLower} companions in London represent the standard Vaurel applies across every category — personally met, carefully selected, and presented with genuine photographs. The ladies in this category have been chosen not only for their appearance but for their ability to hold a conversation, move comfortably through formal environments, and make the time feel natural.`,
    `Whether you are looking for a companion for dinner at a Mayfair restaurant, an evening at a private residence, or a longer arrangement involving travel, our ${nameLower} escorts in London are available for both incall and outcall appointments across all central London districts.`,
    `Each profile includes verified photographs, a personal description, and full rate information. If you are unsure which companion suits your preferences, our team responds within thirty minutes and can make a personal recommendation.`,
  ];

  const standardText = `Browse our selection of <a href="/categories/${slug}">${nameLower} companions</a> available across <a href="/london/mayfair-escorts/">Mayfair</a>, <a href="/london/knightsbridge-escorts/">Knightsbridge</a>, <a href="/london/chelsea-escorts/">Chelsea</a> and throughout London. Many of our ${nameLower} escorts offer <a href="/categories/gfe">girlfriend experience</a> bookings, <a href="/categories/dinner-date">dinner dates</a> and <a href="/categories/overnight">overnight arrangements</a>. All bookings are handled with complete discretion.`;

  // Pick related categories based on the slug
  const allSlugs = [
    'blonde', 'brunette', 'redhead', 'petite', 'slim', 'curvy', 'busty', 'tall', 'mature', 'young',
    'russian', 'ukrainian', 'polish', 'czech', 'french', 'italian', 'spanish', 'brazilian', 'latin', 'asian', 'eastern-european',
    'gfe', 'vip', 'elite', 'high-class', 'dinner-date', 'overnight', 'travel-companion', 'bisexual', 'party',
  ];
  const relatedCategories = allSlugs
    .filter(s => s !== slug)
    .sort(() => 0.5 - Math.random())
    .slice(0, 6);

  const faq = [
    {
      q: `How many ${nameLower} escorts do you have in London?`,
      a: `Our selection of ${nameLower} companions changes regularly as new ladies join and availability shifts. Browse the category page for current profiles, or contact our team for a personal recommendation.`,
    },
    {
      q: `What are the rates for ${nameLower} companions?`,
      a: `Rates for our ${nameLower} escorts typically start from £250 per hour. Prices vary by companion, duration, and booking type. Full rate details are on each companion's profile.`,
    },
    {
      q: `Can I book a ${nameLower} escort for outcall?`,
      a: `Yes. Many of our ${nameLower} companions offer outcall to hotels and private residences across central London. Outcall rates are listed on individual profiles.`,
    },
    {
      q: `Are ${nameLower} companions available for dinner dates?`,
      a: `Yes. Our ${nameLower} escorts are available for dinner dates, social events, overnight stays and travel arrangements. Contact our team to discuss your requirements.`,
    },
  ];

  return { aboutParagraphs, standardText, relatedCategories, faq };
}

async function main() {
  // Find categories WITHOUT content
  const categories = await prisma.category.findMany({
    include: { content: true },
    orderBy: { title: 'asc' },
  });

  const missing = categories.filter(c => !c.content);
  console.log(`Found ${missing.length} categories without SEO content (of ${categories.length} total)`);

  for (const cat of missing) {
    const data = generateCategoryContent(cat.title, cat.slug);

    await prisma.categoryContent.create({
      data: {
        categoryId: cat.id,
        aboutParagraphs: data.aboutParagraphs,
        standardText: data.standardText,
        relatedCategories: data.relatedCategories,
        faq: data.faq,
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
