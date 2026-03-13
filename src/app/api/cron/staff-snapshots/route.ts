// CRON: Staff snapshots — daily at 3am
import { NextRequest, NextResponse } from 'next/server';
import { verifyCronRequest } from '@/lib/cronAuth';
import { enqueue } from '@/services/jobService';
import { prisma } from '@/lib/db/client';

export async function GET(req: NextRequest) {
  const authError = verifyCronRequest(req);
  if (authError) return authError;

  const start = Date.now();
  try {
    await enqueue('staff_snapshot_build', { periodType: 'yesterday' }, {
      priority: 'low',
      dedupeKey: 'cron:staff_snapshot_build',
    });

    const duration = Date.now() - start;
    await prisma.cronLog.create({
      data: { cronPath: '/api/cron/staff-snapshots', status: 'success', durationMs: duration, resultJson: { queued: true } },
    }).catch(() => {});

    return NextResponse.json({ data: { queued: true } });
  } catch (error: any) {
    const duration = Date.now() - start;
    await prisma.cronLog.create({
      data: { cronPath: '/api/cron/staff-snapshots', status: 'error', durationMs: duration, errorText: error.message },
    }).catch(() => {});

    return NextResponse.json(
      { error: { code: 'CRON_ERROR', message: error.message } },
      { status: 500 },
    );
  }
}
