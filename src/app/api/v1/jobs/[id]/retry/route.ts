// POST /api/v1/jobs/:id/retry — retry a failed/dead_letter job
// RBAC: OPS_MANAGER

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { retryJob } from '@/services/jobService';
import { requireRole, isActor } from '@/lib/auth';

const RetrySchema = z.object({
  reasonCode: z.string().min(1, 'reasonCode is required'),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireRole(request, ['OWNER', 'OPS_MANAGER', 'INTEGRATIONS_ADMIN']);
    if (!isActor(auth)) return auth;
    const actorId = auth.userId;

    const body = await request.json();
    const data = RetrySchema.parse(body);

    const job = await retryJob(params.id, actorId);

    return NextResponse.json({
      success: true,
      data: { job },
      message: 'Job queued for retry',
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: error.errors } },
        { status: 400 }
      );
    }
    if (error.message?.includes('not found')) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: error.message } },
        { status: 404 }
      );
    }
    if (error.message?.includes('Cannot retry')) {
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
