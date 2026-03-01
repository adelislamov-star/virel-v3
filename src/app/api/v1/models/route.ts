import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const all = searchParams.get('all') === 'true';

    const where = all ? {} : { status: 'active', visibility: 'public' };

    const models = await prisma.model.findMany({
      where,
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
