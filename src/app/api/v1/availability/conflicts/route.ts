// GET /api/v1/availability/conflicts
// List availability conflicts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const modelId = searchParams.get('modelId');
    const status = searchParams.get('status');

    const where: any = {};
    if (modelId) where.modelId = modelId;
    if (status) where.status = status;

    const conflicts = await prisma.availabilityConflict.findMany({
      where,
      include: {
        model: { select: { id: true, name: true, publicCode: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({
      success: true,
      data: { conflicts, count: conflicts.length },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}
