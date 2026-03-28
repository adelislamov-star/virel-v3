const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.model.findMany({
  where: { status: 'active', deletedAt: null },
  select: { slug: true, name: true, tagline: true },
  orderBy: { createdAt: 'desc' },
  take: 10,
}).then(r => {
  r.forEach(m => console.log(m.slug + ' | ' + m.name + ' | ' + (m.tagline || '(null)')));
  p.$disconnect();
});
