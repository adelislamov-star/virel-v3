import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { requireRole, isActor } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { sendEmail } from '@/lib/email';
import { sendTelegramNotification } from '@/lib/telegram';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireRole(request, ['OWNER', 'OPS_MANAGER', 'OPERATOR']);
    if (!isActor(auth)) return auth;

    const { id } = await params;
    const booking = await prisma.bookingRequest.findUnique({ where: { id } });
    if (!booking) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Booking not found' } },
        { status: 404 },
      );
    }

    if (booking.status !== 'pending') {
      return NextResponse.json(
        { success: false, error: { code: 'CONFLICT', message: 'Booking is not pending' } },
        { status: 409 },
      );
    }

    const body = await request.json().catch(() => ({}));

    const updated = await prisma.bookingRequest.update({
      where: { id },
      data: {
        status: 'confirmed',
        confirmedAt: new Date(),
        confirmedBy: auth.userId,
        internalNotes: body.internalNotes ?? booking.internalNotes,
      },
    });

    // Send email (graceful — won't throw)
    sendEmail({
      to: booking.clientEmail,
      template: 'booking_confirmation',
      data: {
        clientName: booking.clientName,
        date: booking.date.toISOString().split('T')[0],
        duration: `${booking.duration} min`,
        reference: booking.id,
      },
    }).catch(() => {});

    // Telegram notification (graceful)
    sendTelegramNotification(
      `✅ Booking confirmed\nClient: ${booking.clientName}\nDate: ${booking.date.toISOString().split('T')[0]}\nTotal: £${booking.grandTotal}`,
    ).catch(() => {});

    logAudit({
      actorUserId: auth.userId,
      action: 'CONFIRM',
      entityType: 'BookingRequest',
      entityId: id,
      req: request,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('[booking-requests/[id]/confirm]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
