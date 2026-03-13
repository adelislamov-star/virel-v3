// CRON: Jobs health — detect stalled jobs — every hour
// Watchdog: resets stuck running jobs back to queued
import { NextRequest, NextResponse } from 'next/server';
import { verifyCronRequest } from '@/lib/cronAuth';
import { prisma } from '@/lib/db/client';

export async function GET(req: NextRequest) {
  const authError = verifyCronRequest(req);
  if (authError) return authError;

  const start = Date.now();
  try {
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000);

    // Find stalled jobs: running but locked more than 10 minutes ago
    const stalledJobs = await prisma.jobQueue.findMany({
      where: {
        status: 'running',
        lockedAt: { lt: tenMinAgo },
      },
      select: { id: true },
    });

    // Reset them to queued so they can be retried
    if (stalledJobs.length > 0) {
      await prisma.jobQueue.updateMany({
        where: { id: { in: stalledJobs.map((j) => j.id) } },
        data: {
          status: 'queued',
          lockedAt: null,
          lockedBy: null,
        },
      });
    }

    const result = { resetCount: stalledJobs.length };
    const duration = Date.now() - start;
    await prisma.cronLog.create({
      data: {
        cronPath: '/api/cron/jobs-health',
        status: 'success',
        durationMs: duration,
        resultJson: result ?? {},
      },
    }).catch(() => {});

    return NextResponse.json({ data: { ok: true, result } });
  } catch (error: any) {
    const duration = Date.now() - start;
    await prisma.cronLog.create({
      data: {
        cronPath: '/api/cron/jobs-health',
        status: 'error',
        durationMs: duration,
        errorText: error.message,
      },
    }).catch(() => {});

    return NextResponse.json(
      { error: { code: 'CRON_ERROR', message: error.message } },
      { status: 500 },
    );
  }
}
