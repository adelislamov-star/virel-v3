// Seed owner user + all RBAC roles
// Run: npx tsx src/scripts/seedOwner.ts

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const ROLES = [
  { code: 'OWNER', name: 'Owner', description: 'Full access to all features' },
  { code: 'OPS_MANAGER', name: 'Operations Manager', description: 'Manages operations, bookings, staff' },
  { code: 'OPERATOR', name: 'Operator', description: 'Handles day-to-day bookings and clients' },
  { code: 'CONTENT_MANAGER', name: 'Content Manager', description: 'Manages models, content, SEO' },
  { code: 'FINANCE', name: 'Finance', description: 'Payments, reports, lost revenue' },
  { code: 'INTEGRATIONS_ADMIN', name: 'Integrations Admin', description: 'Jobs, notifications, integrations' },
  { code: 'READ_ONLY', name: 'Read Only', description: 'View-only access' },
];

async function seed() {
  console.log('Seeding roles...');

  // Upsert all roles
  for (const role of ROLES) {
    await prisma.role.upsert({
      where: { code: role.code },
      update: { name: role.name, description: role.description },
      create: role,
    });
    console.log(`  Role: ${role.code}`);
  }

  // Create owner user
  const ownerEmail = 'admin@virel.com';
  const ownerPassword = 'virel2024!';
  const passwordHash = await bcrypt.hash(ownerPassword, 12);

  const existingUser = await prisma.user.findUnique({ where: { email: ownerEmail } });

  if (existingUser) {
    console.log(`Owner user already exists: ${ownerEmail}`);
    // Ensure OWNER role is assigned
    const ownerRole = await prisma.role.findUnique({ where: { code: 'OWNER' } });
    if (ownerRole) {
      await prisma.userRole.upsert({
        where: { userId_roleId: { userId: existingUser.id, roleId: ownerRole.id } },
        update: {},
        create: { userId: existingUser.id, roleId: ownerRole.id },
      });
      console.log('  OWNER role assigned');
    }
  } else {
    const ownerRole = await prisma.role.findUnique({ where: { code: 'OWNER' } });
    if (!ownerRole) throw new Error('OWNER role not found after seeding');

    const user = await prisma.user.create({
      data: {
        email: ownerEmail,
        name: 'Admin',
        passwordHash,
        status: 'active',
        roles: {
          create: { roleId: ownerRole.id },
        },
      },
    });
    console.log(`Owner user created: ${user.email} (${user.id})`);
  }

  console.log('\nDone. Login with:');
  console.log(`  Email: ${ownerEmail}`);
  console.log(`  Password: ${ownerPassword}`);
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
