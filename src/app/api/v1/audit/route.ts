import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { requirePermission } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const actorResult = await requirePermission(request, 'audit.read');
    if (actorResult instanceof NextResponse) return actorResult;

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const entityType = searchParams.get('entityType');
    const action = searchParams.get('action');
    const actorId = searchParams.get('actorId');
    const search = searchParams.get('search');
    const dateFrom = searchParams.get('dateFrom') || searchParams.get('from');
    const dateTo = searchParams.get('dateTo') || searchParams.get('to');

    const where: any = {};
    if (entityType) where.entityType = entityType;
    if (action) where.action = { contains: action, mode: 'insensitive' };
    if (actorId) where.actorUserId = actorId;
    if (search) {
      where.OR = [
        { action: { contains: search, mode: 'insensitive' } },
        { entityId: { contains: search } },
        { entityType: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo + 'T23:59:59.999Z');
    }

    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: { actor: { select: { name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit,
      }),
      prisma.auditLog.count({ where }),
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
