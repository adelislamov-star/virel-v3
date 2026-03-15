// GET /api/v1/staff-performance/:userId — detail for one user
// RBAC: OPERATOR

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } },
) {
  try {
    const url = new URL(request.url);
    const periodStart = url.searchParams.get('periodStart');
    const periodEnd = url.searchParams.get('periodEnd');

    const where: any = { userId: params.userId };
    if (periodStart && periodEnd) {
      where.periodStart = new Date(periodStart);
      where.periodEnd = new Date(periodEnd);
    }

    const performance = await prisma.staffPerformanceSnapshot.findMany({
      where,
      orderBy: { periodStart: 'desc' },
      take: 12,
    });

    const scores = await prisma.staffScoreSnapshot.findMany({
      where,
      orderBy: { periodStart: 'desc' },
      take: 12,
    });

    const user = await prisma.user.findUnique({
      where: { id: params.userId },
      select: { id: true, name: true, email: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'User not found' } },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: { user, performance, scores },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 },
    );
  }
}
