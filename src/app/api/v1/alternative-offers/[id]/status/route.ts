// PATCH /api/v1/alternative-offers/:id/status — update offer status
// RBAC: OPERATOR

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { markOfferShown, markOfferAccepted, markOfferRejected } from '@/services/alternativeOfferService';

export const runtime = 'nodejs';

const StatusSchema = z.object({
  status: z.enum(['shown', 'accepted', 'rejected']),
  bookingId: z.string().optional(),
  presentedByType: z.string().optional(),
  presentedById: z.string().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const body = await request.json();
    const data = StatusSchema.parse(body);

    let offer;
    if (data.status === 'shown') {
      offer = await markOfferShown(params.id, data.presentedByType || 'system', data.presentedById || 'system');
    } else if (data.status === 'accepted') {
      offer = await markOfferAccepted(params.id, data.bookingId);
    } else {
      offer = await markOfferRejected(params.id);
    }

    return NextResponse.json({ success: true, data: { offer } });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: error.errors } },
        { status: 400 },
      );
    }
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
