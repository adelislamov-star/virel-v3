import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { requireRole, isActor } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { toSlug } from '@/lib/slug';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get('isActive');
    const tier = searchParams.get('tier');

    const where: Record<string, unknown> = {};
    if (isActive !== null) where.isActive = isActive === 'true';
    if (tier) where.tier = parseInt(tier);

    const districts = await prisma.district.findMany({
      where,
      include: { _count: { select: { modelLocations: true } } },
      orderBy: { sortOrder: 'asc' },
    });

    const data = districts.map((d) => ({
      ...d,
      modelCount: d._count.modelLocations,
      _count: undefined,
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('[districts GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole(request, ['OWNER', 'OPS_MANAGER']);
    if (!isActor(auth)) return auth;

    const body = await request.json();
    const { name, slug, tier, hotels, restaurants, landmarks, isPopular, sortOrder } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION', message: 'name is required' } },
        { status: 400 },
      );
    }

    const district = await prisma.district.create({
      data: {
        name,
        slug: slug || toSlug(name),
        tier: tier ?? 1,
        hotels: hotels ?? [],
        restaurants: restaurants ?? [],
        landmarks: landmarks ?? [],
        isPopular: isPopular ?? false,
        sortOrder: sortOrder ?? 0,
      },
    });

    logAudit({
      actorUserId: auth.userId,
      action: 'CREATE',
      entityType: 'District',
      entityId: district.id,
      req: request,
    });

    return NextResponse.json({ success: true, data: district });
  } catch (error) {
    console.error('[districts POST]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
