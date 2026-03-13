// GET /api/v1/sla/health — system health dashboard data
// RBAC: OPS_MANAGER
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { requireRole, isActor } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const auth = await requireRole(request, ['OWNER', 'OPS_MANAGER']);
  if (!isActor(auth)) return auth;

  try {
    const now = new Date();
    const thirtyMinAgo = new Date(now.getTime() - 30 * 60 * 1000);
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // ── Cron Health: last execution per cronPath ──────────
    const allCronPaths = [
      '/api/cron/sla-check',
      '/api/cron/data-quality',
      '/api/cron/dispatch-notifications',
      '/api/cron/fraud-scan',
      '/api/cron/lost-revenue-detect',
      '/api/cron/operations-feed-cleanup',
      '/api/cron/demand-stats',
      '/api/cron/jobs-health',
      '/api/cron/retention-scan',
      '/api/cron/staff-snapshots',
      '/api/cron/analytics-rebuild',
      '/api/cron/expire-offers',
    ];

    const cronHealth = await Promise.all(
      allCronPaths.map(async (cronPath) => {
        const lastRun = await prisma.cronLog.findFirst({
          where: { cronPath },
          orderBy: { executedAt: 'desc' },
        });
        return {
          cronPath,
          lastExecutedAt: lastRun?.executedAt ?? null,
          lastStatus: lastRun?.status ?? 'never',
          lastDurationMs: lastRun?.durationMs ?? null,
        };
      }),
    );

    // ── Stalled Jobs ─────────────────────────────────────
    const stalledJobs = await prisma.jobQueue.findMany({
      where: {
        status: 'running',
        lastHeartbeatAt: { lt: thirtyMinAgo },
      },
      select: { id: true, type: true, startedAt: true, lastHeartbeatAt: true },
      orderBy: { startedAt: 'asc' },
      take: 50,
    });

    // ── Dead Letter Jobs (last 7 days, grouped by type) ──
    const deadLetterRaw = await prisma.jobQueue.groupBy({
      by: ['type'],
      where: {
        status: 'dead_letter',
        failedAt: { gte: sevenDaysAgo },
      },
      _count: { id: true },
    });
    const deadLetterByType = deadLetterRaw.map((d) => ({
      type: d.type,
      count: d._count.id,
    }));

    const deadLetterTotal = deadLetterByType.reduce((s, d) => s + d.count, 0);

    // ── Failed Notifications (last 24h) ──────────────────
    const failedNotifications = await prisma.notification.count({
      where: {
        status: 'failed',
        createdAt: { gte: twentyFourHoursAgo },
      },
    });

    // ── Queue Stats ──────────────────────────────────────
    const [queuedJobs, runningJobs, failedJobs24h] = await Promise.all([
      prisma.jobQueue.count({ where: { status: 'queued' } }),
      prisma.jobQueue.count({ where: { status: 'running' } }),
      prisma.jobQueue.count({ where: { status: 'failed', failedAt: { gte: twentyFourHoursAgo } } }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        cronHealth,
        stalledJobs,
        deadLetterByType,
        deadLetterTotal,
        failedNotifications,
        queueStats: {
          queued: queuedJobs,
          running: runningJobs,
          failed24h: failedJobs24h,
        },
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: 'HEALTH_CHECK_FAILED', message: error.message } },
      { status: 500 },
    );
  }
}
