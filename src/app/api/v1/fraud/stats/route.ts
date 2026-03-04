// FRAUD STATS API
// GET /api/v1/fraud/stats — aggregated fraud statistics

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';

export async function GET() {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [clientsMonitored, clientsBlocked, signalsThisWeek, chargebackAgg] = await Promise.all([
      prisma.client.count({ where: { riskStatus: { not: 'normal' } } }),
      prisma.client.count({ where: { riskStatus: 'blocked' } }),
      prisma.fraudSignal.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      prisma.client.aggregate({ _sum: { chargebackCount: true } })
    ]);

    return NextResponse.json({
      data: {
        clientsMonitored,
        clientsBlocked,
        signalsThisWeek,
        totalChargebacks: chargebackAgg._sum.chargebackCount || 0
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
