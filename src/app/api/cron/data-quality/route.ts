// CRON: DATA QUALITY — Runs daily at 00:00 UTC via Vercel Cron
import { NextRequest, NextResponse } from 'next/server';
import { verifyCronRequest } from '@/lib/cronAuth';
import { runDataQualityChecks } from '@/lib/data-governance/checker';
import { prisma } from '@/lib/db/client';

export async function GET(req: NextRequest) {
  const authError = verifyCronRequest(req);
  if (authError) return authError;

  const start = Date.now();
  try {
    const result = await runDataQualityChecks();

    const duration = Date.now() - start;
    await prisma.cronLog.create({
      data: { cronPath: '/api/cron/data-quality', status: 'success', durationMs: duration, resultJson: { newChecks: result.newChecks, existing: result.existing } },
    }).catch(() => {});

    return NextResponse.json({ ok: true, newChecks: result.newChecks, existing: result.existing, ranAt: new Date().toISOString() });
  } catch (error: any) {
    const duration = Date.now() - start;
    await prisma.cronLog.create({
      data: { cronPath: '/api/cron/data-quality', status: 'error', durationMs: duration, errorText: error.message },
    }).catch(() => {});

    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
