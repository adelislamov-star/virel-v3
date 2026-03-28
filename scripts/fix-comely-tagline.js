const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.model.updateMany({ where: { slug: 'comely' }, data: { tagline: 'Graceful. Warm. Effortless.' } })
  .then(r => { console.log('comely: ' + r.count + ' updated'); return prisma.$disconnect(); });
