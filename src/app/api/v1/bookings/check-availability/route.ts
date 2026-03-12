// POST /api/v1/bookings/check-availability
// Check if a model is available for a given time range

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkAvailability } from '@/services/availabilityService';

const CheckSchema = z.object({
  modelId: z.string(),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = CheckSchema.parse(body);

    const result = await checkAvailability(
      data.modelId,
      new Date(data.startAt),
      new Date(data.endAt)
    );

    const status = result.available ? 200 : 409;

    return NextResponse.json({
      success: true,
      data: {
        available: result.available,
        conflicts: result.conflicts,
        strategy: result.strategy,
      },
    }, { status });
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
