import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { requirePermission } from '@/lib/auth';

export const runtime = 'nodejs';

// GET /api/v1/payments/summary — totals by status
export async function GET(request: NextRequest) {
  try {
    const actorResult = await requirePermission(request, 'payments.read');
    if (actorResult instanceof NextResponse) return actorResult;

    const [received, pending, refunded] = await Promise.all([
      prisma.payment.aggregate({
        where: { status: { in: ['received', 'succeeded'] } },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.payment.aggregate({
        where: { status: 'pending' },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.payment.aggregate({
        where: { status: 'refunded' },
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        totalReceived: Number(received._sum.amount ?? 0),
        receivedCount: received._count,
        totalPending: Number(pending._sum.amount ?? 0),
        pendingCount: pending._count,
        totalRefunded: Number(refunded._sum.amount ?? 0),
        refundedCount: refunded._count,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 },
    );
  }
}
