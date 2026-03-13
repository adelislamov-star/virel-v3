// CRON: SLA CHECK — Runs daily via Vercel Cron
import { NextRequest, NextResponse } from 'next/server';
import { verifyCronRequest } from '@/lib/cronAuth';
import { checkBreaches } from '@/lib/sla/tracker';
import { prisma } from '@/lib/db/client';

export async function GET(req: NextRequest) {
  const authError = verifyCronRequest(req);
  if (authError) return authError;

  const start = Date.now();
  try {
    const breachedCount = await checkBreaches();

    const duration = Date.now() - start;
    await prisma.cronLog.create({
      data: { cronPath: '/api/cron/sla-check', status: 'success', durationMs: duration, resultJson: { breachedCount } },
    }).catch(() => {});

    return NextResponse.json({ ok: true, breachedCount, checkedAt: new Date().toISOString() });
  } catch (error: any) {
    const duration = Date.now() - start;
    await prisma.cronLog.create({
      data: { cronPath: '/api/cron/sla-check', status: 'error', durationMs: duration, errorText: error.message },
    }).catch(() => {});

    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
