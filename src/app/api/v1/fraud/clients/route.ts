// FRAUD CLIENTS API
// GET /api/v1/fraud/clients — list clients with risk status filter

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const riskStatus = searchParams.get('riskStatus');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (riskStatus) {
      const statuses = riskStatus.split(',');
      where.riskStatus = { in: statuses };
    } else {
      where.riskStatus = { not: 'normal' };
    }

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          riskStatus: true,
          totalSpent: true,
          bookingCount: true,
          chargebackCount: true,
          tags: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.client.count({ where })
    ]);

    return NextResponse.json({
      data: {
        clients,
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
