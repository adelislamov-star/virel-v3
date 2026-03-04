// SLA RECORDS — GET list with filters
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const breached = searchParams.get('breached');
    const entityType = searchParams.get('entityType');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: any = {};
    if (breached === 'true') where.breached = true;
    if (breached === 'false') where.breached = false;
    if (entityType) where.entityType = entityType;

    const [records, total] = await Promise.all([
      prisma.sLARecord.findMany({
        where,
        include: { policy: { select: { name: true, deadlineMinutes: true } } },
        orderBy: { startedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.sLARecord.count({ where })
    ]);

    return NextResponse.json({ data: { records, total, page, limit } });
  } catch (error: any) {
    return NextResponse.json({ error: { code: 'FETCH_FAILED', message: error.message } }, { status: 500 });
  }
}
