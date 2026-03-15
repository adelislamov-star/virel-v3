// GET /api/v1/models/:id/availability
// List model availability slots within date range

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { requireRole, isActor } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireRole(request, ['OWNER', 'OPS_MANAGER', 'OPERATOR']);
    if (!isActor(auth)) return auth;
    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const status = searchParams.get('status');

    const where: any = { modelId: params.id };

    if (dateFrom || dateTo) {
      if (dateFrom) where.startAt = { ...(where.startAt || {}), gte: new Date(dateFrom) };
      if (dateTo) where.endAt = { ...(where.endAt || {}), lte: new Date(dateTo) };
    }
    if (status) where.status = status;

    const slots = await prisma.modelAvailability.findMany({
      where,
      orderBy: { startAt: 'asc' },
      take: 200,
    });

    return NextResponse.json({ success: true, data: { slots, count: slots.length } });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}
