// POST /api/v1/analytics/owner/rebuild — rebuild snapshot for period
// RBAC: OWNER

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { buildSnapshot } from '@/services/ownerAnalyticsService';
import { requireRole, isActor } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole(request, ['OWNER']);
    if (!isActor(auth)) return auth;
    const actorId = auth.userId;

    const body = await request.json();
    const { periodStart, periodEnd, granularity } = body;

    if (!periodStart || !periodEnd) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'periodStart and periodEnd are required' } },
        { status: 400 },
      );
    }

    const start = new Date(periodStart);
    const end = new Date(periodEnd);
    const gran = granularity || 'daily';

    const snapshot = await buildSnapshot(start, end, gran);

    await prisma.auditLog.create({
      data: {
        actorType: 'user',
        actorUserId: actorId,
        action: 'analytics.owner.rebuilt',
        entityType: 'owner_analytics_snapshot',
        entityId: snapshot.id,
        after: { periodStart, periodEnd, granularity: gran },
      },
    });

    return NextResponse.json({ success: true, data: { snapshot } });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 },
    );
  }
}
