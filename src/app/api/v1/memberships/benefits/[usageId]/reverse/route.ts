// PATCH /api/v1/memberships/benefits/:usageId/reverse — reverse a benefit
// RBAC: OPS_MANAGER

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { reverseBenefit } from '@/services/membershipService';

const ReverseSchema = z.object({
  reasonCode: z.string().min(1),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { usageId: string } },
) {
  try {
    const body = await request.json();
    const data = ReverseSchema.parse(body);

    const usage = await reverseBenefit(params.usageId, 'system', data.reasonCode);

    return NextResponse.json({ success: true, data: { benefit: usage } });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: error.errors } },
        { status: 400 },
      );
    }
    if (error.message?.includes('not found') || error.message?.includes('already reversed')) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: error.message } },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 },
    );
  }
}
