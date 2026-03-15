// GET /api/v1/jobs — list jobs with filters
// RBAC: OPS_MANAGER

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const status = sp.get('status');
    const type = sp.get('type');
    const priority = sp.get('priority');
    const page = Math.max(1, parseInt(sp.get('page') ?? '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(sp.get('limit') ?? '20', 10)));

    const where: any = {};
    if (status) where.status = status;
    if (type) where.type = type;
    if (priority) where.priority = priority;

    const [jobs, total] = await Promise.all([
      prisma.jobQueue.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.jobQueue.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: { jobs, total, page, limit },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}
