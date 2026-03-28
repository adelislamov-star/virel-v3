const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const models = await p.model.findMany({
    where: { status: 'active', deletedAt: null },
    orderBy: [{ isExclusive: 'desc' }, { isVerified: 'desc' }, { createdAt: 'desc' }],
    take: 8,
    select: {
      slug: true, name: true,
      modelLocations: { take: 3, include: { district: { select: { name: true, slug: true } } } },
    },
  });
  models.forEach(m => {
    const locs = m.modelLocations.map(l => l.district?.name + ' (primary:' + l.isPrimary + ')').join(', ');
    console.log(m.slug + ' | ' + m.name + ' | locations: ' + (locs || '(none)'));
  });
  await p.$disconnect();
}
main();
