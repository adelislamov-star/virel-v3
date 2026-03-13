// CRON: Lost revenue auto-detection — every 15 minutes
import { NextRequest, NextResponse } from 'next/server';
import { verifyCronRequest } from '@/lib/cronAuth';
import { prisma } from '@/lib/db/client';
import { runAutoDetection } from '@/services/lostRevenueService';

export async function GET(req: NextRequest) {
  const authError = verifyCronRequest(req);
  if (authError) return authError;

  const start = Date.now();
  try {
    const result = await runAutoDetection(1);

    const duration = Date.now() - start;
    await prisma.cronLog.create({
      data: {
        cronPath: '/api/cron/lost-revenue-detect',
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
        cronPath: '/api/cron/lost-revenue-detect',
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
