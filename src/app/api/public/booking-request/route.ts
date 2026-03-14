import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { sendEmail } from '@/lib/email';
import { sendTelegramNotification } from '@/lib/telegram';

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

    // Email to client (graceful)
    sendEmail({
      to: body.clientEmail,
      template: 'booking_confirmation',
      data: {
        clientName: body.clientName,
        date: new Date(body.date).toISOString().split('T')[0],
        duration: `${body.duration} min`,
        reference: booking.id,
      },
    }).catch(() => {});

    // Telegram notification (graceful)
    sendTelegramNotification(
      `🆕 New booking request\nClient: ${body.clientName}\nPhone: ${body.clientPhone}\nDate: ${new Date(body.date).toISOString().split('T')[0]}\nTotal: £${body.grandTotal}`,
    ).catch(() => {});

    return NextResponse.json({ success: true, requestId: booking.id });
  } catch (error) {
    console.error('[public/booking-request POST]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
