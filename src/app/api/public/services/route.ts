import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    const where: Record<string, unknown> = { isActive: true, isPublic: true };
    if (category) where.category = category;

    const services = await prisma.service.findMany({
      where,
      select: {
        id: true,
        title: true,
        slug: true,
        name: true,
        publicName: true,
        category: true,
        description: true,
        introText: true,
        seoTitle: true,
        seoDescription: true,
        sortOrder: true,
        isPopular: true,
      },
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json({ success: true, data: services });
  } catch (error) {
    console.error('[public/services GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
