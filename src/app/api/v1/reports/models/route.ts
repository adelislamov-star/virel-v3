// MODELS REPORT API
// GET /api/v1/reports/models

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';

export async function GET() {
  try {
    const models = await prisma.model.findMany({
      where: { status: { not: 'archived' } },
      select: {
        id: true,
        name: true,
        status: true,
        dataCompletenessScore: true,
        modelRiskIndex: true,
        _count: { select: { bookings: true } }
      }
    });

    const result = await Promise.all(
      models.map(async (m) => {
        const avgRating = await prisma.review.aggregate({
          where: { modelId: m.id, status: 'approved' },
          _avg: { rating: true }
        });
        return {
          id: m.id,
          name: m.name,
          status: m.status,
          avgRating: avgRating._avg.rating || null,
          bookingCount: m._count.bookings,
          completenessScore: m.dataCompletenessScore,
          riskIndex: m.modelRiskIndex
        };
      })
    );

    return NextResponse.json({ data: { models: result } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message } },
      { status: 500 }
    );
  }
}
