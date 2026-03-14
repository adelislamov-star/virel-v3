import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { requireRole, isActor } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { sendBookingConfirmed } from '@/lib/email';
import { notifyReception } from '@/lib/telegram';
import { bookingConfirmedMessage } from '@/lib/telegram-messages';
import { format } from 'date-fns';

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

    // Lookup model name
    const model = booking.modelId
      ? await prisma.model.findUnique({ where: { id: booking.modelId }, select: { name: true } })
      : null;

    const updated = await prisma.bookingRequest.update({
      where: { id },
      data: {
        status: 'confirmed',
        confirmedAt: new Date(),
        confirmedBy: auth.userId,
        internalNotes: body.internalNotes ?? booking.internalNotes,
      },
    });

    const formattedDate = format(new Date(booking.date), "EEEE, d MMMM yyyy 'at' HH:mm");
    const durationLabel = `${booking.duration} min`;
    const location = booking.hotelName ?? booking.address ?? null;

    // Lookup confirmer name
    const confirmer = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { name: true },
    });

    // Send notifications (graceful)
    Promise.all([
      sendBookingConfirmed({
        to: booking.clientEmail,
        clientName: booking.clientName,
        modelName: model?.name ?? null,
        formattedDate,
        durationLabel,
        callType: booking.callType,
        location,
        grandTotal: booking.grandTotal,
        currency: booking.currency,
        requestId: booking.id,
      }),
      notifyReception(
        bookingConfirmedMessage({
          clientName: booking.clientName,
          clientPhone: booking.clientPhone,
          modelName: model?.name ?? null,
          formattedDate: format(new Date(booking.date), 'd MMM yyyy HH:mm'),
          durationLabel,
          grandTotal: booking.grandTotal,
          confirmedByName: confirmer?.name ?? 'Reception',
          requestId: booking.id,
        }),
      ),
    ]).catch(err => console.error('[NOTIFICATIONS] Confirm failed:', err));

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
