const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  // Activate all services
  const r1 = await p.$executeRawUnsafe('UPDATE services SET "isActive" = true WHERE "isActive" = false');
  console.log('Activated services:', r1);

  // Make signature, wellness, fetish public
  const r2 = await p.$executeRawUnsafe("UPDATE services SET \"isPublic\" = true WHERE category IN ('signature', 'wellness', 'fetish') AND \"isPublic\" = false");
  console.log('Made public:', r2);

  // Count
  const counts = await p.$queryRawUnsafe('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE "isActive" = true) as active, COUNT(*) FILTER (WHERE "isPublic" = true) as public FROM services');
  console.log('Service counts:', counts);
}

main().catch(console.error).finally(() => p.$disconnect());
