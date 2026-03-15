// DASHBOARD ANALYTICS API
// GET /api/v1/analytics/dashboard

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';

export async function GET() {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfLastWeek = new Date(startOfWeek);
    startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);
    const in24h = new Date(Date.now() + 24 * 60 * 60 * 1000);

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
      fraudAlerts,
      // New widgets
      pendingBookingRequests,
      topViewedModels,
      confirmationsNeeded,
      weeklyRevenueAgg,
      lastWeekRevenueAgg,
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
      prisma.model.count({ where: { status: 'active' } }),
      prisma.model.aggregate({
        where: { status: 'active' },
        _avg: { dataCompletenessScore: true }
      }),
      prisma.model.count({ where: { modelRiskIndex: 'green' } }),
      prisma.model.count({ where: { modelRiskIndex: 'yellow' } }),
      prisma.model.count({ where: { modelRiskIndex: 'red' } }),
      prisma.fraudSignal.count({
        where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }
      }),
      // Widget 1: Pending Booking Requests (last 5)
      prisma.bookingRequest.findMany({
        where: { status: 'pending' },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, clientName: true, date: true, grandTotal: true, createdAt: true },
      }),
      // Widget 2: Top Viewed Models Today
      prisma.model.findMany({
        where: { status: 'active', viewsToday: { gt: 0 } },
        orderBy: { viewsToday: 'desc' },
        take: 5,
        select: { id: true, name: true, slug: true, viewsToday: true, viewsTotal: true },
      }),
      // Widget 3: Confirmations Needed (bookings starting within 24h that are not confirmed)
      prisma.booking.findMany({
        where: {
          status: { in: ['pending', 'deposit_required'] },
          startAt: { lte: in24h, gte: now },
        },
        orderBy: { startAt: 'asc' },
        take: 10,
        select: { id: true, shortId: true, startAt: true, status: true, client: { select: { firstName: true, lastName: true } }, model: { select: { name: true } } },
      }),
      // Widget 4a: This week revenue
      prisma.payment.aggregate({
        where: { status: 'succeeded', createdAt: { gte: startOfWeek } },
        _sum: { amount: true },
      }),
      // Widget 4b: Last week revenue
      prisma.payment.aggregate({
        where: { status: 'succeeded', createdAt: { gte: startOfLastWeek, lt: startOfWeek } },
        _sum: { amount: true },
      }),
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
        },
        // New reception widgets
        pendingBookingRequests,
        topViewedModels,
        confirmationsNeeded: confirmationsNeeded.map(b => ({
          id: b.id,
          shortId: b.shortId,
          startAt: b.startAt,
          status: b.status,
          clientName: [b.client?.firstName, b.client?.lastName].filter(Boolean).join(' ') || 'Unknown',
          modelName: b.model?.name || '—',
        })),
        weeklyRevenue: {
          thisWeek: weeklyRevenueAgg._sum.amount ? weeklyRevenueAgg._sum.amount.toNumber() : 0,
          lastWeek: lastWeekRevenueAgg._sum.amount ? lastWeekRevenueAgg._sum.amount.toNumber() : 0,
        },
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
