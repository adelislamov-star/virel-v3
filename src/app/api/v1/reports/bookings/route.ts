// BOOKINGS REPORT API
// GET /api/v1/reports/bookings?from=...&to=...

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    const dateFilter: Record<string, unknown> = {};
    if (from) dateFilter.gte = new Date(from);
    if (to) dateFilter.lte = new Date(to);

    const where: Record<string, unknown> = {};
    if (from || to) where.createdAt = dateFilter;

    const bookings = await prisma.booking.findMany({
      where,
      select: { status: true, modelId: true, model: { select: { name: true } } }
    });

    const byStatus: Record<string, number> = {};
    const byModel: Record<string, { name: string; count: number }> = {};

    for (const b of bookings) {
      byStatus[b.status] = (byStatus[b.status] || 0) + 1;
      if (!byModel[b.modelId]) {
        byModel[b.modelId] = { name: b.model.name, count: 0 };
      }
      byModel[b.modelId].count++;
    }

    return NextResponse.json({
      data: {
        byStatus,
        byModel: Object.entries(byModel).map(([id, data]) => ({ id, ...data })),
        total: bookings.length
      }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message } },
      { status: 500 }
    );
  }
}
