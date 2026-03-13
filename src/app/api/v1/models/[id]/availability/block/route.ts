// POST /api/v1/models/:id/availability/block
// Create a manual block for a model

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createManualBlock } from '@/services/availabilityService';
import { requireRole, isActor } from '@/lib/auth';

const BlockSchema = z.object({
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  notes: z.string().optional(),
  city: z.string().optional(),
  area: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireRole(request, ['OWNER', 'OPS_MANAGER', 'OPERATOR']);
    if (!isActor(auth)) return auth;
    const actorId = auth.userId;

    const body = await request.json();
    const data = BlockSchema.parse(body);

    const slot = await createManualBlock(
      params.id,
      {
        startAt: new Date(data.startAt),
        endAt: new Date(data.endAt),
        notes: data.notes,
        city: data.city,
        area: data.area,
      },
      actorId
    );

    return NextResponse.json(
      { success: true, data: { slot }, message: 'Manual block created' },
      { status: 201 }
    );
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: error.errors } },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}
