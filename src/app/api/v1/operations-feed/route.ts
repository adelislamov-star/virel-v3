// GET /api/v1/operations-feed — list feed items with filters
// RBAC: OPERATOR

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const priority = sp.get('priority');
    const status = sp.get('status');
    const sourceModule = sp.get('sourceModule');
    const assignedUserId = sp.get('assignedUserId');
    const page = Math.max(1, parseInt(sp.get('page') ?? '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(sp.get('limit') ?? '20', 10)));

    const where: any = {};
    if (priority) where.priority = priority;
    if (status) where.status = status;
    if (sourceModule) where.sourceModule = sourceModule;
    if (assignedUserId) where.assignedUserId = assignedUserId;

    const [items, total] = await Promise.all([
      prisma.operationsFeedItem.findMany({
        where,
        orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.operationsFeedItem.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: { items, total, page, limit },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}
