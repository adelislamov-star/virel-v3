// REVENUE REPORT API
// GET /api/v1/reports/revenue?from=2026-01-01&to=2026-03-01

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

    const paymentWhere: Record<string, unknown> = { status: 'succeeded' };
    if (from || to) paymentWhere.createdAt = dateFilter;

    const bookingWhere: Record<string, unknown> = { status: 'completed' };
    if (from || to) bookingWhere.createdAt = dateFilter;

    const [revenueAgg, bookingAgg, bookingCount] = await Promise.all([
      prisma.payment.aggregate({
        where: paymentWhere,
        _sum: { amount: true }
      }),
      prisma.booking.aggregate({
        where: bookingWhere,
        _avg: { priceTotal: true },
        _sum: { priceTotal: true }
      }),
      prisma.booking.count({ where: bookingWhere })
    ]);

    const totalRevenue = revenueAgg._sum.amount?.toNumber() ?? 0;
    const commission = totalRevenue * 0.3; // 30% commission
    const totalPayout = totalRevenue - commission;

    return NextResponse.json({
      data: {
        totalRevenue,
        totalCommission: commission,
        totalPayout,
        bookingCount,
        avgBookingValue: bookingAgg._avg.priceTotal?.toNumber() ?? 0
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
