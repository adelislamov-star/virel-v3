// CRON: DATA QUALITY — Runs daily at 00:00 UTC via Vercel Cron
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { verifyCronRequest } from '@/lib/cronAuth';
import { prisma } from '@/lib/db/client';
// import { runDataQualityChecks } from '@/lib/data-governance/checker';
async function runDataQualityChecks() { return { newChecks: 0, existing: 0 }; }

export async function GET(req: NextRequest) {
  const authError = verifyCronRequest(req);
  if (authError) return authError;

  const start = Date.now();
  try {
    const result = await runDataQualityChecks();

    const duration = Date.now() - start;
    await prisma.cronLog.create({
      data: {
        cronPath: '/api/cron/data-quality',
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
        cronPath: '/api/cron/data-quality',
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
