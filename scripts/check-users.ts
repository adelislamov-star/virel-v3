// Quick diagnostic: check user statuses in the database
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, status: true, roles: { include: { role: true } } },
  });
  console.log('\n=== Users in DB ===');
  for (const u of users) {
    const roles = u.roles.map(r => r.role.code).join(', ');
    console.log(`  ${u.email} | status: "${u.status}" | roles: [${roles}] | id: ${u.id}`);
  }
  if (users.length === 0) console.log('  (no users found)');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
