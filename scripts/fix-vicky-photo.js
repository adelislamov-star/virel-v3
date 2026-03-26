const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const vicky = await p.model.findFirst({ where: { slug: 'vicky' }, select: { id: true } });
  if (!vicky) return console.log('Vicky not found');

  // Get all her photos
  const photos = await p.modelMedia.findMany({
    where: { modelId: vicky.id, isPublic: true },
    orderBy: { sortOrder: 'asc' },
    select: { id: true, url: true, isPrimary: true, sortOrder: true },
  });
  console.log('Vicky photos:');
  photos.forEach((ph, i) => console.log(i + ': ' + (ph.isPrimary ? '*' : ' ') + ' ' + ph.url));

  // Revert: set first photo (sortOrder 0) back as primary
  await p.modelMedia.updateMany({ where: { modelId: vicky.id }, data: { isPrimary: false } });
  if (photos.length > 0) {
    // Try 3rd photo (index 2) instead of selfie (index 0) and broken (index 1)
    const targetIdx = photos.length > 2 ? 2 : 0;
    await p.modelMedia.update({ where: { id: photos[targetIdx].id }, data: { isPrimary: true } });
    console.log('\nSet primary to photo ' + targetIdx + ': ' + photos[targetIdx].url);
  }

  await p.$disconnect();
}
main();
