// PATCH /api/v1/operations-feed/:id/assign
// Assign a feed item to a user
// RBAC: OPS_MANAGER

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { assignItem } from '@/services/operationsFeedService';
import { requireRole, isActor } from '@/lib/auth';

export const runtime = 'nodejs';

const AssignSchema = z.object({
  userId: z.string().min(1),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireRole(request, ['OWNER', 'OPS_MANAGER', 'OPERATOR']);
    if (!isActor(auth)) return auth;
    const actorId = auth.userId;

    const body = await request.json();
    const data = AssignSchema.parse(body);

    const item = await assignItem(params.id, data.userId, actorId);

    return NextResponse.json({ success: true, data: { item } });
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
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}
