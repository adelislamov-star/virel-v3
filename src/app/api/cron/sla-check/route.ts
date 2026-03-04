// CRON: SLA CHECK — Runs every 5 minutes via Vercel Cron
import { NextRequest, NextResponse } from 'next/server';
import { checkBreaches } from '@/lib/sla/tracker';

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const breachedCount = await checkBreaches();

    return NextResponse.json({
      ok: true,
      breachedCount,
      checkedAt: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
