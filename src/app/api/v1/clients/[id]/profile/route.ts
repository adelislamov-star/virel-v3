// GET /api/v1/clients/:id/profile — full client profile
// RBAC: OPERATOR

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const client = await prisma.client.findUnique({
      where: { id: params.id },
    });

    if (!client || client.deletedAt) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Client not found' } },
        { status: 404 },
      );
    }

    const [
      identities,
      retentionProfile,
      riskHistory,
      activeBookings,
      recentBookings,
      activeMembership,
      openIncidents,
      fraudSignals,
      bookingStats,
    ] = await Promise.all([
      prisma.clientIdentity.findMany({
        where: { clientId: params.id },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.clientRetentionProfile.findUnique({
        where: { clientId: params.id },
      }),
      prisma.clientRiskHistory.findMany({
        where: { clientId: params.id },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      prisma.booking.findMany({
        where: {
          clientId: params.id,
          status: { in: ['pending', 'confirmed'] },
          deletedAt: null,
        },
        orderBy: { startAt: 'asc' },
        include: { model: { select: { id: true, name: true } } },
      }),
      prisma.booking.findMany({
        where: {
          clientId: params.id,
          status: { in: ['completed', 'cancelled'] },
          deletedAt: null,
        },
        orderBy: { endAt: 'desc' },
        take: 5,
        include: { model: { select: { id: true, name: true } } },
      }),
      prisma.clientMembership.findFirst({
        where: {
          clientId: params.id,
          status: { in: ['active', 'past_due'] },
        },
        include: { plan: { select: { id: true, name: true } } },
      }),
      prisma.incident.findMany({
        where: {
          reporterClientId: params.id,
          status: { not: 'resolved' },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.fraudSignal.findMany({
        where: { clientId: params.id },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      prisma.booking.aggregate({
        where: { clientId: params.id, deletedAt: null },
        _count: { id: true },
      }),
    ]);

    // Compute stats
    const totalBookings = bookingStats._count.id;
    const completedCount = await prisma.booking.count({
      where: { clientId: params.id, status: 'completed', deletedAt: null },
    });
    const cancelledCount = await prisma.booking.count({
      where: { clientId: params.id, status: 'cancelled', deletedAt: null },
    });
    const cancellationRate = totalBookings > 0 ? cancelledCount / totalBookings : 0;

    const spentAgg = await prisma.booking.aggregate({
      where: { clientId: params.id, status: 'completed', deletedAt: null },
      _sum: { priceTotal: true },
      _max: { endAt: true },
    });

    const totalSpent = spentAgg._sum.priceTotal ?? 0;
    const avgBookingValue = completedCount > 0 ? Number(totalSpent) / completedCount : 0;

    // Preferred models — group confirmed bookings by model
    const confirmedBookings = await prisma.booking.findMany({
      where: { clientId: params.id, status: { in: ['completed', 'confirmed'] }, deletedAt: null },
      select: { modelId: true, model: { select: { id: true, name: true, slug: true } } },
    });
    const modelCountMap = new Map<string, { id: string; name: string; slug: string; count: number }>();
    for (const b of confirmedBookings) {
      const key = b.modelId;
      const existing = modelCountMap.get(key);
      if (existing) {
        existing.count++;
      } else {
        modelCountMap.set(key, { id: b.model.id, name: b.model.name, slug: b.model.slug, count: 1 });
      }
    }
    const preferredModels = Array.from(modelCountMap.values()).sort((a, b) => b.count - a.count).slice(0, 5);

    return NextResponse.json({
      success: true,
      data: {
        client,
        identities,
        retentionProfile,
        riskHistory,
        activeBookings,
        recentBookings,
        activeMembership,
        openIncidents,
        fraudSignals,
        preferredModels,
        stats: {
          totalBookings,
          completedBookings: completedCount,
          cancellationRate: Math.round(cancellationRate * 10000) / 100,
          totalSpent: Number(totalSpent),
          avgBookingValue: Math.round(avgBookingValue * 100) / 100,
          lastBookingAt: spentAgg._max.endAt ?? null,
        },
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 },
    );
  }
}
