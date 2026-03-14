// CRON: Reset viewsToday for all models — runs daily at midnight
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';

export async function GET(req: Request) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await prisma.model.updateMany({
      where: { viewsToday: { gt: 0 } },
      data: { viewsToday: 0 },
    });

    return NextResponse.json({
      success: true,
      modelsReset: result.count,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
