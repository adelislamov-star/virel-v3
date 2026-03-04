// FRAUD SIGNALS API
// GET /api/v1/fraud/signals — list fraud signals with filters

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('client_id');
    const signalType = searchParams.get('signal_type');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (clientId) where.clientId = clientId;
    if (signalType) where.signalType = signalType;

    const [signals, total] = await Promise.all([
      prisma.fraudSignal.findMany({
        where,
        include: {
          client: { select: { id: true, fullName: true, riskStatus: true } },
          booking: { select: { id: true, shortId: true } },
          model: { select: { id: true, name: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.fraudSignal.count({ where })
    ]);

    return NextResponse.json({
      data: {
        signals,
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
