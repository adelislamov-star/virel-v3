// POST /api/v1/jobs/:id/cancel — cancel a queued job
// RBAC: OPS_MANAGER

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { cancelJob } from '@/services/jobService';

const CancelSchema = z.object({
  reasonCode: z.string().min(1, 'reasonCode is required'),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const data = CancelSchema.parse(body);

    // TODO: extract actorId from session/auth
    const actorId = 'system';

    const job = await cancelJob(params.id, actorId);

    return NextResponse.json({
      success: true,
      data: { job },
      message: 'Job cancelled',
    });
  } catch (error: any) {
    if (error.message?.includes('not found')) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: error.message } },
        { status: 404 }
      );
    }
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: error.errors } },
        { status: 400 }
      );
    }
    if (error.message?.includes('Cannot cancel')) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_STATUS', message: error.message } },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}
