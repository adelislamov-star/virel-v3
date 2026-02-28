import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
export const runtime = 'nodejs';

// Called by Vercel Cron every 30 minutes
export async function GET(request: NextRequest) {
  // Verify cron secret
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret') || request.headers.get('authorization')?.replace('Bearer ', '').trim();
  if (secret !== (process.env.CRON_SECRET || '').trim()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();
    const in30min = new Date(now.getTime() + 30 * 60 * 1000);
    const in60min = new Date(now.getTime() + 60 * 60 * 1000);
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const in25h = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    // Bookings starting in ~30 min (between 25-35 min from now)
    const upcoming30 = await prisma.booking.findMany({
      where: {
        status: 'confirmed',
        startAt: {
          gte: new Date(now.getTime() + 25 * 60 * 1000),
          lte: new Date(now.getTime() + 35 * 60 * 1000),
        },
      },
      include: { model: true, client: true, location: true },
    });

    // Bookings starting in ~24h
    const upcoming24h = await prisma.booking.findMany({
      where: {
        status: 'confirmed',
        startAt: { gte: in24h, lte: in25h },
      },
      include: { model: true, client: true },
    });

    // New unassigned inquiries older than 10 min
    const staleInquiries = await prisma.inquiry.findMany({
      where: {
        status: 'new',
        assignedTo: null,
        createdAt: { lte: new Date(now.getTime() - 10 * 60 * 1000) },
      },
    });

    const results = {
      reminders30min: upcoming30.length,
      reminders24h: upcoming24h.length,
      staleInquiries: staleInquiries.length,
      timestamp: now.toISOString(),
    };

    // Log to DB (audit)
    await prisma.auditLog.create({
      data: {
        action: 'worker.reminders',
        entityType: 'system',
        entityId: 'cron',
        newValues: results as any,
      },
    });

    return NextResponse.json({ success: true, ...results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
