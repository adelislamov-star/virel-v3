// DATA GOVERNANCE CHECKS — GET list with filters
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const checkType = searchParams.get('checkType');
    const severity = searchParams.get('severity');
    const entityType = searchParams.get('entityType');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: any = {};
    if (status) where.status = status;
    if (checkType) where.checkType = checkType;
    if (severity) where.severity = severity;
    if (entityType) where.entityType = entityType;

    const [checks, total] = await Promise.all([
      prisma.dataQualityCheck.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.dataQualityCheck.count({ where })
    ]);

    // Summary counts
    const [openCount, errorCount, warningCount] = await Promise.all([
      prisma.dataQualityCheck.count({ where: { status: 'open' } }),
      prisma.dataQualityCheck.count({ where: { status: 'open', severity: 'error' } }),
      prisma.dataQualityCheck.count({ where: { status: 'open', severity: 'warning' } })
    ]);

    // Avg completeness
    const completenessAgg = await prisma.model.aggregate({
      _avg: { dataCompletenessScore: true },
      where: { status: 'active' }
    });

    return NextResponse.json({
      data: {
        checks,
        total,
        page,
        limit,
        summary: {
          open: openCount,
          errors: errorCount,
          warnings: warningCount,
          avgCompleteness: Math.round(completenessAgg._avg.dataCompletenessScore || 0)
        }
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: { code: 'FETCH_FAILED', message: error.message } }, { status: 500 });
  }
}
