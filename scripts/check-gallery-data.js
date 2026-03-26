const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  // Check Comely's data
  const comely = await p.model.findFirst({ where: { slug: 'comely' }, select: { id: true, name: true, slug: true, tagline: true } });
  console.log('=== COMELY ===');
  console.log(comely);

  // Check Vicky's photos
  const vicky = await p.model.findFirst({ where: { slug: 'vicky' }, select: { id: true, name: true } });
  if (vicky) {
    const photos = await p.modelMedia.findMany({ where: { modelId: vicky.id, isPublic: true }, orderBy: { sortOrder: 'asc' }, take: 5, select: { id: true, url: true, isPrimary: true, sortOrder: true } });
    console.log('\n=== VICKY PHOTOS ===');
    photos.forEach(ph => console.log(ph.isPrimary ? '* ' + ph.url : '  ' + ph.url));
  }

  // Check Burana and Watari
  const extras = await p.model.findMany({ where: { slug: { in: ['burana', 'watari'] }, status: 'active', deletedAt: null }, select: { slug: true, name: true, tagline: true } });
  console.log('\n=== BURANA/WATARI ===');
  extras.forEach(m => console.log(m.slug + ' | ' + m.name + ' | ' + m.tagline));

  // Check districts for all featured models
  const featured = await p.model.findMany({
    where: { status: 'active', deletedAt: null },
    orderBy: [{ isExclusive: 'desc' }, { isVerified: 'desc' }, { createdAt: 'desc' }],
    take: 8,
    select: {
      slug: true, name: true,
      modelLocations: { where: { isPrimary: true }, take: 1, include: { district: { select: { name: true } } } },
    },
  });
  console.log('\n=== FEATURED MODELS + DISTRICTS ===');
  featured.forEach(m => console.log(m.slug + ' | ' + m.name + ' | district: ' + (m.modelLocations?.[0]?.district?.name || '(none)')));

  await p.$disconnect();
}
main();
