// PATCH /api/v1/retention/actions/:id/cancel — cancel a retention action
// RBAC: OPS_MANAGER

import { NextRequest, NextResponse } from 'next/server';
import { cancelRetentionAction } from '@/services/retentionService';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const actorId = 'system'; // TODO: from auth

    const action = await cancelRetentionAction(params.id, actorId);

    return NextResponse.json({ success: true, data: { action } });
  } catch (error: any) {
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
