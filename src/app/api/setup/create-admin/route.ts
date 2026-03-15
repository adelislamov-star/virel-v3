import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import bcrypt from 'bcryptjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const email = 'admin@virel.com';
    const password = 'virel2024!';
    const passwordHash = await bcrypt.hash(password, 12);

    // Ensure OWNER role exists
    const role = await prisma.role.upsert({
      where: { code: 'OWNER' },
      update: {},
      create: { code: 'OWNER', name: 'Owner', description: 'Full access' },
    });

    // Create or update user
    const user = await prisma.user.upsert({
      where: { email },
      update: { status: 'active', passwordHash },
      create: {
        email,
        name: 'Admin',
        passwordHash,
        status: 'active',
      },
    });

    // Ensure OWNER role assigned
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId: role.id } },
      update: {},
      create: { userId: user.id, roleId: role.id },
    });

    return NextResponse.json({
      success: true,
      data: { userId: user.id, email: user.email, status: user.status, role: 'OWNER' },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
