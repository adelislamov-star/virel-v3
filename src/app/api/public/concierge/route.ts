import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const districtId = searchParams.get('districtId');

    const where: Record<string, unknown> = { isActive: true };
    if (type) where.type = type;
    if (districtId) where.districtId = districtId;

    const partners = await prisma.conciergePartner.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json({ success: true, data: partners });
  } catch (error) {
    console.error('[public/concierge GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
