// POST /api/v1/alternative-offers/generate — generate alternatives for a model
// RBAC: OPERATOR

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generateAlternatives } from '@/services/alternativeOfferService';

const GenerateSchema = z.object({
  requestedModelId: z.string().min(1),
  reason: z.string().min(1),
  inquiryId: z.string().optional(),
  bookingId: z.string().optional(),
  limit: z.number().min(1).max(20).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = GenerateSchema.parse(body);

    const result = await generateAlternatives(data);

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: error.errors } },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 },
    );
  }
}
