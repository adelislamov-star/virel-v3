import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { sendBookingReceived } from '@/lib/email';
import { notifyReception } from '@/lib/telegram';
import { newBookingRequestMessage } from '@/lib/telegram-messages';
import { format } from 'date-fns';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validation
    if (!body.clientName || !body.clientEmail || !body.clientPhone) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION', message: 'Name, email, and phone are required' } },
        { status: 400 },
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.clientEmail)) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION', message: 'Invalid email address' } },
        { status: 400 },
      );
    }

    if (new Date(body.date) <= new Date()) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION', message: 'Date must be in the future' } },
        { status: 400 },
      );
    }

    // Lookup model name if modelId provided
    const model = body.modelId
      ? await prisma.model.findUnique({ where: { id: body.modelId }, select: { name: true } })
      : null;

    // Lookup district name if districtId provided
    const district = body.districtId
      ? await prisma.district.findUnique({ where: { id: body.districtId }, select: { name: true } })
      : null;

    const booking = await prisma.bookingRequest.create({
      data: {
        clientName: body.clientName,
        clientEmail: body.clientEmail,
        clientPhone: body.clientPhone,
        clientTelegramId: body.clientTelegramId ?? null,
        preferredContact: body.preferredContact ?? 'phone',
        modelId: body.modelId ?? null,
        model2Id: body.model2Id ?? null,
        districtId: body.districtId ?? null,
        callType: body.callType ?? 'incall',
        date: new Date(body.date),
        duration: body.duration,
        address: body.address ?? null,
        hotelName: body.hotelName ?? null,
        roomNumber: body.roomNumber ?? null,
        basePrice: body.basePrice ?? 0,
        extrasTotal: body.extrasTotal ?? 0,
        grandTotal: body.grandTotal ?? 0,
        currency: body.currency ?? 'GBP',
        selectedExtras: body.selectedExtras ?? [],
        specialRequests: body.specialRequests ?? null,
        occasion: body.occasion ?? null,
        restaurantNeeded: body.restaurantNeeded ?? false,
        transportNeeded: body.transportNeeded ?? false,
        source: 'website',
        status: 'pending',
      },
    });

    const formattedDate = format(new Date(body.date), "EEEE, d MMMM yyyy 'at' HH:mm");
    const durationLabel = `${body.duration} min`;

    // Send notifications (graceful — don't block client response)
    Promise.all([
      sendBookingReceived({
        to: body.clientEmail,
        clientName: body.clientName,
        modelName: model?.name ?? null,
        formattedDate,
        durationLabel,
        callType: body.callType ?? 'incall',
        grandTotal: body.grandTotal ?? 0,
        currency: body.currency ?? 'GBP',
        preferredContact: body.preferredContact ?? 'phone',
        requestId: booking.id,
      }),
      notifyReception(
        newBookingRequestMessage({
          clientName: body.clientName,
          clientPhone: body.clientPhone,
          preferredContact: body.preferredContact ?? 'phone',
          clientTelegramId: body.clientTelegramId ?? null,
          modelName: model?.name ?? null,
          formattedDate: format(new Date(body.date), 'd MMM yyyy HH:mm'),
          durationLabel,
          callType: body.callType ?? 'incall',
          hotelName: body.hotelName ?? null,
          roomNumber: body.roomNumber ?? null,
          districtName: district?.name ?? null,
          grandTotal: body.grandTotal ?? 0,
          selectedExtras: body.selectedExtras ?? [],
          specialRequests: body.specialRequests ?? null,
          restaurantNeeded: body.restaurantNeeded ?? false,
          transportNeeded: body.transportNeeded ?? false,
          requestId: booking.id,
        }),
      ),
    ]).catch(err => console.error('[NOTIFICATIONS] Failed:', err));

    return NextResponse.json({ success: true, requestId: booking.id });
  } catch (error) {
    console.error('[public/booking-request POST]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
