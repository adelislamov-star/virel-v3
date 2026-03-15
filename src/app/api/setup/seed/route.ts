// GET /api/setup/seed?secret=virel-setup-2024
// One-time seed: creates RBAC roles + owner user
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const SETUP_SECRET = 'virel-setup-2024';

const ROLES = [
  { code: 'OWNER', name: 'Owner', description: 'Full access to all features' },
  { code: 'OPS_MANAGER', name: 'Operations Manager', description: 'Manages operations, bookings, staff' },
  { code: 'OPERATOR', name: 'Operator', description: 'Handles day-to-day bookings and clients' },
  { code: 'CONTENT_MANAGER', name: 'Content Manager', description: 'Manages models, content, SEO' },
  { code: 'FINANCE', name: 'Finance', description: 'Payments, reports, lost revenue' },
  { code: 'INTEGRATIONS_ADMIN', name: 'Integrations Admin', description: 'Jobs, notifications, integrations' },
  { code: 'READ_ONLY', name: 'Read Only', description: 'View-only access' },
];

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret');
  if (secret !== SETUP_SECRET) {
    return NextResponse.json(
      { success: false, error: { code: 'FORBIDDEN', message: 'Invalid secret' } },
      { status: 403 },
    );
  }

  try {
    const log: string[] = [];

    // Upsert all roles
    for (const role of ROLES) {
      await prisma.role.upsert({
        where: { code: role.code },
        update: { name: role.name, description: role.description },
        create: role,
      });
      log.push(`Role: ${role.code}`);
    }

    // Create or update owner user
    const ownerEmail = 'admin@virel.com';
    const ownerPassword = 'virel2024!';
    const passwordHash = await bcrypt.hash(ownerPassword, 12);

    const existingUser = await prisma.user.findUnique({ where: { email: ownerEmail } });
    const ownerRole = await prisma.role.findUnique({ where: { code: 'OWNER' } });

    if (!ownerRole) {
      return NextResponse.json(
        { success: false, error: { code: 'SEED_ERROR', message: 'OWNER role not found after seeding' } },
        { status: 500 },
      );
    }

    if (existingUser) {
      // Ensure status is active and password is up to date
      await prisma.user.update({
        where: { id: existingUser.id },
        data: { status: 'active', passwordHash },
      });
      await prisma.userRole.upsert({
        where: { userId_roleId: { userId: existingUser.id, roleId: ownerRole.id } },
        update: {},
        create: { userId: existingUser.id, roleId: ownerRole.id },
      });
      log.push(`Owner exists: ${ownerEmail} — status=active, password reset, OWNER role ensured`);
    } else {
      const user = await prisma.user.create({
        data: {
          email: ownerEmail,
          name: 'Admin',
          passwordHash,
          status: 'active',
          roles: { create: { roleId: ownerRole.id } },
        },
      });
      log.push(`Owner created: ${user.email} (${user.id})`);
    }

    return NextResponse.json({ success: true, data: { log } });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: 'SEED_ERROR', message: error.message } },
      { status: 500 },
    );
  }
}
