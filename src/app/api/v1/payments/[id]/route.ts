import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { requirePermission } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export const runtime = 'nodejs';

// GET /api/v1/payments/:id — get single payment
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const actorResult = await requirePermission(request, 'payments.read');
    if (actorResult instanceof NextResponse) return actorResult;

    const payment = await prisma.payment.findUnique({
      where: { id: params.id },
      include: {
        client: { select: { id: true, fullName: true, email: true } },
        model: { select: { id: true, name: true } },
        booking: { select: { id: true, shortId: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });

    if (!payment) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Payment not found' } },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: payment });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 },
    );
  }
}

// PUT /api/v1/payments/:id — update payment
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const actorResult = await requirePermission(request, 'payments.create');
    if (actorResult instanceof NextResponse) return actorResult;

    const existing = await prisma.payment.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Payment not found' } },
        { status: 404 },
      );
    }

    const body = await request.json();
    const updateData: any = {};

    if (body.clientId !== undefined) updateData.clientId = body.clientId || null;
    if (body.modelId !== undefined) updateData.modelId = body.modelId || null;
    if (body.bookingId !== undefined) updateData.bookingId = body.bookingId || null;
    if (body.amount !== undefined) updateData.amount = body.amount;
    if (body.method !== undefined) updateData.method = body.method;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.reference !== undefined) updateData.reference = body.reference || null;
    if (body.notes !== undefined) updateData.notes = body.notes || null;
    if (body.receivedAt !== undefined) updateData.receivedAt = body.receivedAt ? new Date(body.receivedAt) : null;

    const payment = await prisma.payment.update({
      where: { id: params.id },
      data: updateData,
      include: {
        client: { select: { id: true, fullName: true, email: true } },
        model: { select: { id: true, name: true } },
        booking: { select: { id: true, shortId: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });

    logAudit({
      actorUserId: actorResult.userId,
      action: 'payment.updated',
      entityType: 'payment',
      entityId: params.id,
      before: { status: existing.status, amount: existing.amount },
      after: updateData,
      req: request,
    });

    return NextResponse.json({ success: true, data: payment });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 },
    );
  }
}

// DELETE /api/v1/payments/:id — delete payment
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const actorResult = await requirePermission(request, 'payments.create');
    if (actorResult instanceof NextResponse) return actorResult;

    const existing = await prisma.payment.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Payment not found' } },
        { status: 404 },
      );
    }

    await prisma.payment.delete({ where: { id: params.id } });

    logAudit({
      actorUserId: actorResult.userId,
      action: 'payment.deleted',
      entityType: 'payment',
      entityId: params.id,
      before: { amount: existing.amount, status: existing.status, method: existing.method },
      req: request,
    });

    return NextResponse.json({ success: true, data: { deleted: true } });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 },
    );
  }
}
