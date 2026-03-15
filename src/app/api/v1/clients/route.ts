// GET /api/v1/clients — list clients with filters
// RBAC: OPERATOR

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { requireRole, isActor } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireRole(request, ['OWNER', 'OPS_MANAGER', 'OPERATOR']);
    if (!isActor(auth)) return auth;
    const url = request.nextUrl;
    const search = url.searchParams.get('search') ?? '';
    const riskStatus = url.searchParams.get('riskStatus') ?? '';
    const vipStatus = url.searchParams.get('vipStatus') ?? '';
    const segment = url.searchParams.get('segment') ?? '';
    const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') ?? '20', 10)));
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = { deletedAt: null, mergedIntoClientId: null };

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (riskStatus) {
      where.riskStatus = riskStatus;
    }

    if (vipStatus === 'true') {
      where.vipStatus = true;
    } else if (vipStatus === 'false') {
      where.vipStatus = false;
    }

    // Segment filter requires join to retentionProfile
    let retentionFilter: any = undefined;
    if (segment) {
      retentionFilter = { segment };
    }

    if (retentionFilter) {
      where.retentionProfile = retentionFilter;
    }

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          fullName: true,
          firstName: true,
          lastName: true,
          phone: true,
          email: true,
          riskStatus: true,
          vipStatus: true,
          totalSpent: true,
          retentionProfile: {
            select: {
              segment: true,
              lastBookingAt: true,
            },
          },
        },
      }),
      prisma.client.count({ where }),
    ]);

    const data = clients.map((c) => ({
      id: c.id,
      fullName: c.fullName || `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim() || 'Unknown',
      phone: c.phone,
      email: c.email,
      riskStatus: c.riskStatus,
      vipStatus: c.vipStatus ?? false,
      totalSpent: c.totalSpent ?? 0,
      lastBookingAt: c.retentionProfile?.lastBookingAt ?? null,
      segment: c.retentionProfile?.segment ?? null,
    }));

    return NextResponse.json({
      success: true,
      data: { clients: data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 },
    );
  }
}
