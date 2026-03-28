const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const models = await p.model.findMany({
    where: { status: 'active', deletedAt: null },
    orderBy: [{ isExclusive: 'desc' }, { isVerified: 'desc' }, { createdAt: 'desc' }],
    take: 8,
    select: {
      slug: true, name: true, primaryLocationId: true,
      primaryLocation: { select: { id: true, title: true, slug: true } },
    },
  });
  models.forEach(m => {
    console.log(m.slug + ' | ' + m.name + ' | primaryLocation: ' + (m.primaryLocation?.title || '(none)'));
  });
  await p.$disconnect();
}
main();
