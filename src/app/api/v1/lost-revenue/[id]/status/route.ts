// PATCH /api/v1/lost-revenue/:id/status
// Resolve or waive a lost revenue entry
// RBAC: OPS_MANAGER

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { resolveEntry, waiveEntry } from '@/services/lostRevenueService';

const StatusSchema = z.object({
  status: z.enum(['resolved', 'waived']),
  reasonCode: z.string().min(1, 'reasonCode is required'),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const data = StatusSchema.parse(body);

    // TODO: extract actorId from session/auth
    const actorId = 'system';

    const entry =
      data.status === 'resolved'
        ? await resolveEntry(params.id, actorId, data.reasonCode)
        : await waiveEntry(params.id, actorId, data.reasonCode);

    return NextResponse.json({
      success: true,
      data: { entry },
      message: `Entry ${data.status}`,
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
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}
