// DELETE /api/v1/models/:id/availability/:slotId
// Remove a manual block slot

import { NextRequest, NextResponse } from 'next/server';
import { removeManualBlock } from '@/services/availabilityService';
import { requireRole, isActor } from '@/lib/auth';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; slotId: string } }
) {
  try {
    const auth = await requireRole(request, ['OWNER', 'OPS_MANAGER']);
    if (!isActor(auth)) return auth;
    const actorId = request.cookies.get('vaurel-token')?.value || 'system';

    const result = await removeManualBlock(params.slotId, actorId);

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Availability slot removed',
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
