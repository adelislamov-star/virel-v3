// PATCH /api/v1/retention/actions/:id/complete — complete a retention action
// RBAC: OPERATOR

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { completeRetentionAction } from '@/services/retentionService';
import { requireRole, isActor } from '@/lib/auth';

export const runtime = 'nodejs';

const CompleteSchema = z.object({
  result: z.string().min(1, 'result is required'),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const auth = await requireRole(request, ['OWNER', 'OPS_MANAGER', 'OPERATOR']);
    if (!isActor(auth)) return auth;
    const actorId = auth.userId;

    const body = await request.json();
    const data = CompleteSchema.parse(body);

    const action = await completeRetentionAction(params.id, data.result, actorId);

    return NextResponse.json({ success: true, data: { action } });
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
