// DASHBOARD ANALYTICS API
// GET /api/v1/analytics/dashboard

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';

export async function GET() {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      revenueAgg,
      activeBookings,
      totalBookings,
      cancelledBookings,
      openIncidents,
      pendingReviews,
      publishedModels,
      avgCompleteness,
      greenModels,
      yellowModels,
      redModels,
      fraudAlerts
    ] = await Promise.all([
      prisma.payment.aggregate({
        where: { status: 'succeeded', createdAt: { gte: startOfMonth } },
        _sum: { amount: true }
      }),
      prisma.booking.count({
        where: { status: { in: ['confirmed', 'in_progress'] } }
      }),
      prisma.booking.count(),
      prisma.booking.count({ where: { status: 'cancelled' } }),
      prisma.incident.count({
        where: { status: { not: 'closed' } }
      }),
      prisma.review.count({ where: { status: 'pending' } }),
      prisma.model.count({ where: { status: 'published' } }),
      prisma.model.aggregate({
        where: { status: 'published' },
        _avg: { dataCompletenessScore: true }
      }),
      prisma.model.count({ where: { modelRiskIndex: 'green' } }),
      prisma.model.count({ where: { modelRiskIndex: 'yellow' } }),
      prisma.model.count({ where: { modelRiskIndex: 'red' } }),
      prisma.fraudSignal.count({
        where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }
      })
    ]);

    const totalRevenue = revenueAgg._sum.amount ? revenueAgg._sum.amount.toNumber() : 0;
    const commission = totalRevenue * 0.3;
    const cancellationRate = totalBookings > 0
      ? Math.round((cancelledBookings / totalBookings) * 100)
      : 0;
    const avgBookingValue = totalBookings > 0
      ? Math.round(totalRevenue / Math.max(1, totalBookings - cancelledBookings))
      : 0;

    return NextResponse.json({
      data: {
        revenue: {
          total: totalRevenue,
          commission,
          avgBookingValue,
          mrr: 0
        },
        operations: {
          activeBookings,
          cancellationRate,
          openIncidents,
          pendingReviews
        },
        models: {
          published: publishedModels,
          avgCompleteness: Math.round(avgCompleteness._avg.dataCompletenessScore ?? 0),
          riskDistribution: { green: greenModels, yellow: yellowModels, red: redModels }
        },
        quickLinks: {
          pendingReviews,
          openIncidents,
          fraudAlerts
        }
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
