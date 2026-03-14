import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { requireRole, isActor } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const districtId = searchParams.get('districtId');
    const isActive = searchParams.get('isActive');

    const where: Record<string, unknown> = {};
    if (type) where.type = type;
    if (districtId) where.districtId = districtId;
    if (isActive !== null) where.isActive = isActive !== 'false';

    const partners = await prisma.conciergePartner.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json({ success: true, data: partners });
  } catch (error) {
    console.error('[concierge GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole(request, ['OWNER', 'OPS_MANAGER']);
    if (!isActor(auth)) return auth;

    const body = await request.json();

    const partner = await prisma.conciergePartner.create({
      data: {
        type: body.type,
        name: body.name,
        districtId: body.districtId ?? null,
        address: body.address ?? null,
        website: body.website ?? null,
        phone: body.phone ?? null,
        description: body.description ?? null,
        priceRange: body.priceRange ?? null,
        imageUrl: body.imageUrl ?? null,
        isActive: body.isActive ?? true,
        sortOrder: body.sortOrder ?? 0,
      },
    });

    logAudit({
      actorUserId: auth.userId,
      action: 'CREATE',
      entityType: 'ConciergePartner',
      entityId: partner.id,
      req: request,
    });

    return NextResponse.json({ success: true, data: partner });
  } catch (error) {
    console.error('[concierge POST]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
