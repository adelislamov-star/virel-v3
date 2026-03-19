// Seed script — run: npx tsx src/scripts/seedDistrictContentFull.ts
// Generates SEO content for ALL districts that don't have aboutParagraphs yet

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function generateDistrictContent(name: string, slug: string) {
  const aboutParagraphs = [
    `${name} is among London's most desirable areas for those who value quality, privacy and convenience. The district combines excellent hotels, respected restaurants and a sense of place that makes an evening here feel considered rather than accidental.`,
    `Our companions in ${name} are available for both incall and outcall appointments. Whether you are staying at a hotel in the area or visiting for dinner, Vaurel can arrange a companion who knows the district and is comfortable in its best venues.`,
    `Every companion has been personally met by our team. The photographs on their profiles are genuine. We respond within thirty minutes.`,
  ];

  const standardTextParagraphs = [
    `We represent a carefully selected group of ladies available in ${name} — each personally verified, each meeting the standard we apply across every district. Our <a href="/categories/gfe">GFE companions</a> are available for unhurried evenings, <a href="/categories/dinner-date">dinner dates</a> at the area's best restaurants, and <a href="/categories/overnight">overnight arrangements</a>.`,
    `Bookings in ${name} are handled with the same discretion and professionalism as every other district we cover. <a href="/categories/vip">VIP</a> and <a href="/categories/elite">elite</a> companions are available on request. Contact our team via Telegram or email for availability.`,
  ];

  const faq = [
    {
      q: `Are companions available in ${name} tonight?`,
      a: `Yes. We maintain availability across ${name} seven days a week. Contact us and we will confirm within thirty minutes.`,
    },
    {
      q: `Do you offer outcall to ${name} hotels?`,
      a: `Yes — outcall is available to all hotels and private residences in ${name}. Rates are listed on individual companion profiles.`,
    },
    {
      q: `What is the minimum booking duration in ${name}?`,
      a: `Most companions accept bookings from one hour. For dinner dates or evening arrangements, two hours is recommended.`,
    },
  ];

  const ctaText = `Available tonight in ${name}. Thirty-minute response.`;

  return { aboutParagraphs, standardTextParagraphs, faq, ctaText };
}

async function main() {
  // Find districts that have empty aboutParagraphs
  const districts = await prisma.district.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  });

  const missing = districts.filter(d => !d.aboutParagraphs || d.aboutParagraphs.length === 0);
  console.log(`Found ${missing.length} districts without SEO content (of ${districts.length} total)`);

  for (const dist of missing) {
    const data = generateDistrictContent(dist.name, dist.slug);

    await prisma.district.update({
      where: { id: dist.id },
      data: {
        aboutParagraphs: data.aboutParagraphs,
        standardTextParagraphs: data.standardTextParagraphs,
        faq: data.faq,
        ctaText: data.ctaText,
      },
    });
    console.log(`  ✓ ${dist.slug}`);
  }

  console.log('Done');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
