// CRON: Expire stale alternative offers — every hour
// Runs directly (not enqueued) — lightweight operation
import { NextRequest, NextResponse } from 'next/server';
import { verifyCronRequest } from '@/lib/cronAuth';
import { expireStaleOffers } from '@/services/alternativeOfferService';
import { prisma } from '@/lib/db/client';

export async function GET(req: NextRequest) {
  const authError = verifyCronRequest(req);
  if (authError) return authError;

  const start = Date.now();
  try {
    const expired = await expireStaleOffers();

    const duration = Date.now() - start;
    await prisma.cronLog.create({
      data: {
        cronPath: '/api/cron/expire-offers',
        status: 'success',
        durationMs: duration,
        resultJson: { expired },
      },
    }).catch(() => {});

    return NextResponse.json({ data: { expired } });
  } catch (error: any) {
    const duration = Date.now() - start;
    await prisma.cronLog.create({
      data: { cronPath: '/api/cron/expire-offers', status: 'error', durationMs: duration, errorText: error.message },
    }).catch(() => {});

    return NextResponse.json(
      { error: { code: 'CRON_ERROR', message: error.message } },
      { status: 500 },
    );
  }
}
