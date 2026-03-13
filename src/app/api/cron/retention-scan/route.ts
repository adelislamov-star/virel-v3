// CRON: Retention scan — daily at 2am
import { NextRequest, NextResponse } from 'next/server';
import { verifyCronRequest } from '@/lib/cronAuth';
import { prisma } from '@/lib/db/client';
import { runDailyRetentionScan } from '@/services/retentionService';

export async function GET(req: NextRequest) {
  const authError = verifyCronRequest(req);
  if (authError) return authError;

  const start = Date.now();
  try {
    const result = await runDailyRetentionScan();

    const duration = Date.now() - start;
    await prisma.cronLog.create({
      data: {
        cronPath: '/api/cron/retention-scan',
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
        cronPath: '/api/cron/retention-scan',
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
