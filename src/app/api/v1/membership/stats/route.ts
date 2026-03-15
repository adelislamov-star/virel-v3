// MEMBERSHIP STATS — GET aggregated metrics
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Active memberships with plan data
    const activeMemberships = await prisma.clientMembership.findMany({
      where: { status: 'active' },
      include: { plan: true }
    });

    // MRR = sum of plan.priceMonthly for active memberships
    const mrr = activeMemberships.reduce((sum, m) => sum + m.plan.priceMonthly.toNumber(), 0);
    const activeCount = activeMemberships.length;
    const arpu = activeCount > 0 ? mrr / activeCount : 0;

    // Churn rate = cancelled this month / active at month start
    const cancelledThisMonth = await prisma.clientMembership.count({
      where: {
        status: 'cancelled',
        updatedAt: { gte: monthStart }
      }
    });

    // Approximate active at month start = current active + cancelled this month
    const activeAtStart = activeCount + cancelledThisMonth;
    const churnRate = activeAtStart > 0 ? (cancelledThisMonth / activeAtStart) * 100 : 0;

    return NextResponse.json({
      data: {
        mrr: Math.round(mrr * 100) / 100,
        activeSubscribers: activeCount,
        churnRate: Math.round(churnRate * 100) / 100,
        arpu: Math.round(arpu * 100) / 100
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: { code: 'FETCH_FAILED', message: error.message } }, { status: 500 });
  }
}
