// CRON: SLA CHECK — Runs daily via Vercel Cron
import { NextRequest, NextResponse } from 'next/server';
import { verifyCronRequest } from '@/lib/cronAuth';
import { prisma } from '@/lib/db/client';
import { checkBreaches } from '@/lib/sla/tracker';

export async function GET(req: NextRequest) {
  const authError = verifyCronRequest(req);
  if (authError) return authError;

  const start = Date.now();
  try {
    const breachedCount = await checkBreaches();
    const result = { breachedCount };

    const duration = Date.now() - start;
    await prisma.cronLog.create({
      data: {
        cronPath: '/api/cron/sla-check',
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
        cronPath: '/api/cron/sla-check',
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
