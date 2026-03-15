import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const districts = await prisma.district.findMany({
      where: { isActive: true },
      include: { _count: { select: { modelLocations: true } } },
      orderBy: [{ tier: 'asc' }, { sortOrder: 'asc' }],
    });

    const data = districts.map((d) => ({
      id: d.id,
      name: d.name,
      slug: d.slug,
      tier: d.tier,
      description: d.description,
      seoTitle: d.seoTitle,
      seoDescription: d.seoDescription,
      isPopular: d.isPopular,
      modelCount: d._count.modelLocations,
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('[public/districts GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
