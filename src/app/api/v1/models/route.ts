import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const models = await prisma.model.findMany({
      include: { stats: true, primaryLocation: true },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ success: true, data: { models } });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { message: error.message } },
      { status: 500 },
    );
  }
}
