// GET /api/v1/retention/clients/:id/profile — detailed retention profile
// RBAC: OPS_MANAGER

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const profile = await prisma.clientRetentionProfile.findUnique({
      where: { clientId: params.id },
      include: {
        client: { select: { id: true, firstName: true, lastName: true, riskStatus: true, totalSpent: true, bookingCount: true } },
        retentionActions: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    });

    if (!profile) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Retention profile not found' } },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: { profile } });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 },
    );
  }
}
