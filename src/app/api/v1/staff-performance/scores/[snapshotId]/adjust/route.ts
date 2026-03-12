// PATCH /api/v1/staff-performance/scores/:snapshotId/adjust — manual score adjustment
// RBAC: OPERATOR

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { adjustScore } from '@/services/staffAnalyticsService';

const AdjustSchema = z.object({
  adjustment: z.number(),
  reason: z.string().min(1),
  adjustedBy: z.string().min(1),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { snapshotId: string } },
) {
  try {
    const body = await request.json();
    const data = AdjustSchema.parse(body);

    const updated = await adjustScore(
      params.snapshotId,
      data.adjustment,
      data.reason,
      data.adjustedBy,
    );

    return NextResponse.json({ success: true, data: { score: updated } });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: error.errors } },
        { status: 400 },
      );
    }
    if (error.message?.includes('not found')) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: error.message } },
        { status: 404 },
      );
    }
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 },
    );
  }
}
