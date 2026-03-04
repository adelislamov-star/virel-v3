// SLA STATS — GET aggregated SLA metrics
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month';

    const now = new Date();
    let periodStart: Date;
    switch (period) {
      case 'week':
        periodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'quarter':
        periodStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        break;
      default:
        periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const totalRecords = await prisma.sLARecord.count({
      where: { startedAt: { gte: periodStart } }
    });

    const breachedRecords = await prisma.sLARecord.count({
      where: { startedAt: { gte: periodStart }, breached: true }
    });

    const breachRate = totalRecords > 0 ? (breachedRecords / totalRecords) * 100 : 0;

    // Average response time for completed records
    const completedRecords = await prisma.sLARecord.findMany({
      where: {
        startedAt: { gte: periodStart },
        completedAt: { not: null }
      },
      select: { startedAt: true, completedAt: true }
    });

    let avgResponseMinutes = 0;
    if (completedRecords.length > 0) {
      const totalMinutes = completedRecords.reduce((sum, r) => {
        const diff = (r.completedAt!.getTime() - r.startedAt.getTime()) / (1000 * 60);
        return sum + diff;
      }, 0);
      avgResponseMinutes = totalMinutes / completedRecords.length;
    }

    // Active (open) SLA tracking
    const activeTracking = await prisma.sLARecord.count({
      where: { completedAt: null, breached: false }
    });

    // Breached today
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const breachedToday = await prisma.sLARecord.count({
      where: {
        breached: true,
        deadlineAt: { gte: todayStart, lt: now }
      }
    });

    // By type breakdown
    const byTypeRaw = await prisma.sLARecord.groupBy({
      by: ['entityType'],
      where: { startedAt: { gte: periodStart } },
      _count: true
    });

    const byType = byTypeRaw.map(t => ({
      type: t.entityType,
      count: t._count
    }));

    return NextResponse.json({
      data: {
        totalRecords,
        breachedRecords,
        breachRate: Math.round(breachRate * 100) / 100,
        avgResponseMinutes: Math.round(avgResponseMinutes),
        activeTracking,
        breachedToday,
        byType
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: { code: 'FETCH_FAILED', message: error.message } }, { status: 500 });
  }
}
