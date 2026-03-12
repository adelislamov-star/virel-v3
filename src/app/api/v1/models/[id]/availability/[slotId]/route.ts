// DELETE /api/v1/models/:id/availability/:slotId
// Remove a manual block slot

import { NextRequest, NextResponse } from 'next/server';
import { removeManualBlock } from '@/services/availabilityService';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; slotId: string } }
) {
  try {
    // TODO: extract actorId from session/auth
    const actorId = 'system';

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
