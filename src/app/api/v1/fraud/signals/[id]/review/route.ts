// PATCH /api/v1/fraud/signals/:id/review — review a fraud signal
// RBAC: OPS_MANAGER

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { reviewSignal } from '@/services/fraudService';

const ReviewSchema = z.object({
  status: z.enum(['confirmed', 'dismissed']),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const body = await request.json();
    const data = ReviewSchema.parse(body);

    const signal = await reviewSignal(params.id, data.status, 'system');

    return NextResponse.json({ success: true, data: { signal } });
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
