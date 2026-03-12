// GET /api/v1/demand/stats — demand statistics
// RBAC: OPS_MANAGER

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city');
    const locationId = searchParams.get('locationId');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    const where: any = {};
    if (city) where.city = city;
    if (locationId) where.locationId = locationId;
    if (dateFrom || dateTo) {
      where.timeSlot = {};
      if (dateFrom) where.timeSlot.gte = new Date(dateFrom);
      if (dateTo) where.timeSlot.lte = new Date(dateTo);
    }

    const stats = await prisma.demandStats.findMany({
      where,
      orderBy: [{ demandScore: 'desc' }, { timeSlot: 'desc' }],
      take: 200,
    });

    return NextResponse.json({ success: true, data: { stats } });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 },
    );
  }
}
