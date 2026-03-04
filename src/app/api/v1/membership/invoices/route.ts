// MEMBERSHIP INVOICES — GET list
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const clientMembershipId = searchParams.get('clientMembershipId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = {};
    if (status) where.status = status;
    if (clientMembershipId) where.clientMembershipId = clientMembershipId;

    const [invoices, total] = await Promise.all([
      prisma.subscriptionInvoice.findMany({
        where,
        include: {
          membership: {
            include: {
              client: { select: { id: true, fullName: true } },
              plan: { select: { id: true, name: true } }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.subscriptionInvoice.count({ where })
    ]);

    return NextResponse.json({ data: { invoices, total, page, limit } });
  } catch (error: any) {
    return NextResponse.json({ error: { code: 'FETCH_FAILED', message: error.message } }, { status: 500 });
  }
}
