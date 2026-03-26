const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  // 1. Rename Comely → Sofia
  const r1 = await p.model.updateMany({ where: { slug: 'comely' }, data: { name: 'Sofia' } });
  console.log('Rename Comely → Sofia: ' + r1.count + ' updated');

  // 2. Swap Vicky's primary photo to 2nd photo
  const vicky = await p.model.findFirst({ where: { slug: 'vicky' }, select: { id: true } });
  if (vicky) {
    // Unset current primary
    await p.modelMedia.updateMany({ where: { modelId: vicky.id, isPrimary: true }, data: { isPrimary: false } });
    // Find 2nd photo (sortOrder 1) and set as primary
    const secondPhoto = await p.modelMedia.findFirst({ where: { modelId: vicky.id, isPublic: true }, orderBy: { sortOrder: 'asc' }, skip: 1 });
    if (secondPhoto) {
      await p.modelMedia.update({ where: { id: secondPhoto.id }, data: { isPrimary: true } });
      console.log('Vicky primary photo swapped to: ' + secondPhoto.url);
    } else {
      console.log('Vicky: no 2nd photo found');
    }
  }

  await p.$disconnect();
}
main().catch(e => { console.error(e); process.exit(1); });
