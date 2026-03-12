// GET /api/v1/alternative-offers — list alternative offers
// RBAC: OPERATOR

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const requestedModelId = searchParams.get('requestedModelId');
    const inquiryId = searchParams.get('inquiryId');
    const bookingId = searchParams.get('bookingId');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));

    const where: any = {};
    if (status) where.status = status;
    if (requestedModelId) where.requestedModelId = requestedModelId;
    if (inquiryId) where.inquiryId = inquiryId;
    if (bookingId) where.bookingId = bookingId;

    const [offers, total] = await Promise.all([
      prisma.alternativeOffer.findMany({
        where,
        include: {
          requestedModel: { select: { id: true, name: true } },
          offeredModel: { select: { id: true, name: true } },
          conversion: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.alternativeOffer.count({ where }),
    ]);

    return NextResponse.json({ success: true, data: { offers, total, page, limit } });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 },
    );
  }
}
