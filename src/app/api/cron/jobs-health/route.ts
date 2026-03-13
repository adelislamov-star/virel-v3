// CRON: Jobs health — detect stalled jobs — every hour
// Runs directly (not enqueued) since it monitors the queue itself
import { NextRequest, NextResponse } from 'next/server';
import { verifyCronRequest } from '@/lib/cronAuth';
import { prisma } from '@/lib/db/client';

export async function GET(req: NextRequest) {
  const authError = verifyCronRequest(req);
  if (authError) return authError;

  const start = Date.now();
  try {
    const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000);

    // Find stalled jobs: running but no heartbeat for 30+ minutes
    const stalledJobs = await prisma.jobQueue.findMany({
      where: {
        status: 'running',
        lastHeartbeatAt: { lt: thirtyMinAgo },
      },
      select: { id: true },
    });

    // Mark them as failed
    if (stalledJobs.length > 0) {
      await prisma.jobQueue.updateMany({
        where: { id: { in: stalledJobs.map((j) => j.id) } },
        data: {
          status: 'failed',
          failedAt: new Date(),
          errorText: 'Heartbeat timeout — marked by jobs-health cron',
        },
      });
    }

    const duration = Date.now() - start;
    await prisma.cronLog.create({
      data: {
        cronPath: '/api/cron/jobs-health',
        status: 'success',
        durationMs: duration,
        resultJson: { stalledJobs: stalledJobs.length },
      },
    }).catch(() => {});

    return NextResponse.json({ data: { stalledJobs: stalledJobs.length } });
  } catch (error: any) {
    const duration = Date.now() - start;
    await prisma.cronLog.create({
      data: { cronPath: '/api/cron/jobs-health', status: 'error', durationMs: duration, errorText: error.message },
    }).catch(() => {});

    return NextResponse.json(
      { error: { code: 'CRON_ERROR', message: error.message } },
      { status: 500 },
    );
  }
}
