import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
const prisma = new PrismaClient();
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret');
  if (secret !== 'virel-setup-2024') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const passwordHash = await bcrypt.hash('virel2024!', 12);
    const user = await prisma.user.findUnique({ where: { email: 'admin@virel.com' } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    await prisma.user.update({ where: { email: 'admin@virel.com' }, data: { passwordHash } });
    return NextResponse.json({ success: true, message: 'Password reset to virel2024!' });
  } finally { await prisma.$disconnect(); }
}
