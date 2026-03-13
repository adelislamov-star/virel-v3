// CRON: Dispatch pending notifications — every 5 minutes
import { NextRequest, NextResponse } from 'next/server';
import { verifyCronRequest } from '@/lib/cronAuth';
import { enqueue } from '@/services/jobService';
import { prisma } from '@/lib/db/client';

export async function GET(req: NextRequest) {
  const authError = verifyCronRequest(req);
  if (authError) return authError;

  const start = Date.now();
  try {
    await enqueue('notification_dispatch', { trigger: 'cron', batchSize: 50 }, {
      priority: 'normal',
      dedupeKey: 'cron:notification_dispatch',
    });

    const duration = Date.now() - start;
    await prisma.cronLog.create({
      data: { cronPath: '/api/cron/dispatch-notifications', status: 'success', durationMs: duration, resultJson: { queued: true } },
    }).catch(() => {});

    return NextResponse.json({ data: { queued: true } });
  } catch (error: any) {
    const duration = Date.now() - start;
    await prisma.cronLog.create({
      data: { cronPath: '/api/cron/dispatch-notifications', status: 'error', durationMs: duration, errorText: error.message },
    }).catch(() => {});

    return NextResponse.json(
      { error: { code: 'CRON_ERROR', message: error.message } },
      { status: 500 },
    );
  }
}
