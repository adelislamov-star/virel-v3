import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { requireRole, isActor } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireRole(request, ['OWNER', 'OPS_MANAGER', 'OPERATOR']);
    if (!isActor(auth)) return auth;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const date = searchParams.get('date');
    const modelId = searchParams.get('modelId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (modelId) where.modelId = modelId;
    if (date) {
      const d = new Date(date);
      where.date = { gte: d, lt: new Date(d.getTime() + 86400000) };
    }

    const [items, total] = await Promise.all([
      prisma.bookingRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.bookingRequest.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: items,
      meta: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('[booking-requests GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole(request, ['OWNER', 'OPS_MANAGER', 'OPERATOR']);
    if (!isActor(auth)) return auth;

    const body = await request.json();

    if (!body.clientName || !body.clientEmail || !body.clientPhone) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION', message: 'Client details are required' } },
        { status: 400 },
      );
    }
    if (new Date(body.date) < new Date()) {
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
        source: body.source ?? 'phone',
        status: 'pending',
      },
    });

    logAudit({
      actorUserId: auth.userId,
      action: 'CREATE',
      entityType: 'BookingRequest',
      entityId: booking.id,
      req: request,
    });

    return NextResponse.json({ success: true, data: booking });
  } catch (error) {
    console.error('[booking-requests POST]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
