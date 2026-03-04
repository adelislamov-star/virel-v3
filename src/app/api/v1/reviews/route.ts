// REVIEWS API
// GET /api/v1/reviews — list reviews with filters

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const modelId = searchParams.get('model_id');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (modelId) where.modelId = modelId;

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        include: {
          booking: { select: { id: true, shortId: true, startAt: true } },
          client: { select: { id: true, fullName: true } },
          model: { select: { id: true, name: true, slug: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.review.count({ where })
    ]);

    return NextResponse.json({
      data: {
        reviews,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
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
