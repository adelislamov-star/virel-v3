// CRON: Telegram reminder to reception 30 minutes before booking — every 15 minutes
import { NextRequest, NextResponse } from 'next/server';
import { verifyCronRequest } from '@/lib/cronAuth';
import { prisma } from '@/lib/db/client';
import { notifyReception } from '@/lib/telegram';
import { bookingReminder30Message } from '@/lib/telegram-messages';

export async function GET(req: NextRequest) {
  const authError = verifyCronRequest(req);
  if (authError) return authError;

  const start = Date.now();
  try {
    const now = new Date();
    const from = new Date(now.getTime() + 25 * 60 * 1000); // now + 25m
    const to = new Date(now.getTime() + 35 * 60 * 1000);   // now + 35m

    const bookings = await prisma.bookingRequest.findMany({
      where: {
        status: 'confirmed',
        date: { gte: from, lte: to },
      },
    });

    let sent = 0;
    for (const booking of bookings) {
      const model = booking.modelId
        ? await prisma.model.findUnique({ where: { id: booking.modelId }, select: { name: true } })
        : null;

      const ok = await notifyReception(
        bookingReminder30Message({
          modelName: model?.name ?? null,
          clientName: booking.clientName,
          clientPhone: booking.clientPhone,
          callType: booking.callType,
          location: booking.hotelName ?? booking.address ?? null,
          durationLabel: `${booking.duration} min`,
          grandTotal: booking.grandTotal,
        }),
      );
      if (ok) sent++;
    }

    const duration = Date.now() - start;
    console.log(`[CRON] booking-reminder-30: ${sent}/${bookings.length} sent (${duration}ms)`);
    return NextResponse.json({ processed: bookings.length, sent, durationMs: duration });
  } catch (error) {
    console.error('[CRON] booking-reminder-30 error:', error);
    return NextResponse.json({ error: 'Cron job failed' }, { status: 500 });
  }
}
