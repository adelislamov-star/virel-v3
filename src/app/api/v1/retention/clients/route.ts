// GET /api/v1/retention/clients — list clients with retention profile
// RBAC: OPS_MANAGER

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const segment = searchParams.get('segment');
    const churnRiskMin = searchParams.get('churnRiskMin');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));

    const where: any = {};
    if (segment) where.segment = segment;
    if (churnRiskMin) where.churnRiskScore = { gte: parseInt(churnRiskMin) };

    const [profiles, total] = await Promise.all([
      prisma.clientRetentionProfile.findMany({
        where,
        include: { client: { select: { id: true, firstName: true, lastName: true, riskStatus: true } } },
        orderBy: { churnRiskScore: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.clientRetentionProfile.count({ where }),
    ]);

    return NextResponse.json({ success: true, data: { profiles, total, page, limit } });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 },
    );
  }
}
