import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { requirePermission } from '@/lib/auth';

export const runtime = 'nodejs';

// GET /api/v1/payments — list with filters + pagination
export async function GET(request: NextRequest) {
  try {
    const actorResult = await requirePermission(request, 'payments.read');
    if (actorResult instanceof NextResponse) return actorResult;

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const clientId = searchParams.get('clientId');
    const modelId = searchParams.get('modelId');
    const method = searchParams.get('method');
    const status = searchParams.get('status');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const search = searchParams.get('search');

    const where: any = {};
    if (clientId) where.clientId = clientId;
    if (modelId) where.modelId = modelId;
    if (method) where.method = method;
    if (status) where.status = status;
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo + 'T23:59:59.999Z');
    }
    if (search) {
      where.OR = [
        { id: { contains: search } },
        { reference: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
        { bookingId: { contains: search } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          client: { select: { id: true, fullName: true, email: true } },
          model: { select: { id: true, name: true } },
          booking: { select: { id: true, shortId: true } },
          createdBy: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit,
      }),
      prisma.payment.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        items,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 },
    );
  }
}

// POST /api/v1/payments — create manual payment
export async function POST(request: NextRequest) {
  try {
    const actorResult = await requirePermission(request, 'payments.create');
    if (actorResult instanceof NextResponse) return actorResult;

    const body = await request.json();
    const { clientId, modelId, bookingId, amount, method, status, reference, notes, receivedAt } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Amount is required and must be positive' } },
        { status: 400 },
      );
    }
    if (!method) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Payment method is required' } },
        { status: 400 },
      );
    }

    const payment = await prisma.payment.create({
      data: {
        clientId: clientId || null,
        modelId: modelId || null,
        bookingId: bookingId || null,
        amount,
        currency: 'GBP',
        method,
        provider: 'custom',
        status: status || 'pending',
        reference: reference || null,
        notes: notes || null,
        receivedAt: receivedAt ? new Date(receivedAt) : null,
        createdById: actorResult.userId,
      },
      include: {
        client: { select: { id: true, fullName: true } },
        model: { select: { id: true, name: true } },
        booking: { select: { id: true, shortId: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ success: true, data: payment }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 },
    );
  }
}
