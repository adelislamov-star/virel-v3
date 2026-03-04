// CRON: DATA QUALITY — Runs daily at 00:00 UTC via Vercel Cron
import { NextRequest, NextResponse } from 'next/server';
import { runDataQualityChecks } from '@/lib/data-governance/checker';

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const result = await runDataQualityChecks();

    return NextResponse.json({
      ok: true,
      newChecks: result.newChecks,
      existing: result.existing,
      ranAt: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
