// PATCH /api/v1/availability/conflicts/:id/resolve
// Resolve an availability conflict

import { NextRequest, NextResponse } from 'next/server';
import { resolveConflict } from '@/services/availabilityService';
import { requireRole, isActor } from '@/lib/auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireRole(request, ['OWNER', 'OPS_MANAGER', 'OPERATOR']);
    if (!isActor(auth)) return auth;
    const actorId = auth.userId;

    const conflict = await resolveConflict(params.id, actorId);

    return NextResponse.json({
      success: true,
      data: { conflict },
      message: 'Conflict resolved',
    });
  } catch (error: any) {
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
