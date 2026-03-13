// CRON: Lost revenue auto-detection — every 15 minutes
import { NextRequest, NextResponse } from 'next/server';
import { verifyCronRequest } from '@/lib/cronAuth';
import { enqueue } from '@/services/jobService';
import { prisma } from '@/lib/db/client';

export async function GET(req: NextRequest) {
  const authError = verifyCronRequest(req);
  if (authError) return authError;

  const start = Date.now();
  try {
    await enqueue('lost_revenue_auto_detection', { lookbackHours: 1 }, {
      priority: 'normal',
      dedupeKey: 'cron:lost_revenue_auto_detection',
    });

    const duration = Date.now() - start;
    await prisma.cronLog.create({
      data: { cronPath: '/api/cron/lost-revenue-detect', status: 'success', durationMs: duration, resultJson: { queued: true } },
    }).catch(() => {});

    return NextResponse.json({ data: { queued: true } });
  } catch (error: any) {
    const duration = Date.now() - start;
    await prisma.cronLog.create({
      data: { cronPath: '/api/cron/lost-revenue-detect', status: 'error', durationMs: duration, errorText: error.message },
    }).catch(() => {});

    return NextResponse.json(
      { error: { code: 'CRON_ERROR', message: error.message } },
      { status: 500 },
    );
  }
}
