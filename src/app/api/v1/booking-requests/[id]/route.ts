import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { requireRole, isActor } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function GET(
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
    return NextResponse.json({ success: true, data: booking });
  } catch (error) {
    console.error('[booking-requests/[id] GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireRole(request, ['OWNER', 'OPS_MANAGER', 'OPERATOR']);
    if (!isActor(auth)) return auth;

    const { id } = await params;
    const before = await prisma.bookingRequest.findUnique({ where: { id } });
    if (!before) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Booking not found' } },
        { status: 404 },
      );
    }

    const body = await request.json();
    const allowedFields: Record<string, unknown> = {};
    if (body.status !== undefined) allowedFields.status = body.status;
    if (body.internalNotes !== undefined) allowedFields.internalNotes = body.internalNotes;
    if (body.confirmedAt !== undefined) allowedFields.confirmedAt = new Date(body.confirmedAt);
    if (body.confirmedBy !== undefined) allowedFields.confirmedBy = body.confirmedBy;

    const booking = await prisma.bookingRequest.update({ where: { id }, data: allowedFields });

    logAudit({
      actorUserId: auth.userId,
      action: 'UPDATE',
      entityType: 'BookingRequest',
      entityId: id,
      before,
      after: booking,
      req: request,
    });

    return NextResponse.json({ success: true, data: booking });
  } catch (error) {
    console.error('[booking-requests/[id] PUT]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
