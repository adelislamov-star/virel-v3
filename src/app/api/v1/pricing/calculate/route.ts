// PRICING CALCULATOR — POST calculate dynamic price
import { NextRequest, NextResponse } from 'next/server';
import { calculateDynamicPrice } from '@/lib/pricing/engine';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { modelId, locationId, startAt, durationHours, basePrice } = body;

    if (!modelId || !startAt || !durationHours || !basePrice) {
      return NextResponse.json(
        { error: { code: 'VALIDATION', message: 'Missing required fields: modelId, startAt, durationHours, basePrice' } },
        { status: 400 }
      );
    }

    const result = await calculateDynamicPrice({
      modelId,
      locationId: locationId || undefined,
      startAt: new Date(startAt),
      durationHours: parseFloat(durationHours),
      basePrice: parseFloat(basePrice)
    });

    return NextResponse.json({ data: result });
  } catch (error: any) {
    return NextResponse.json({ error: { code: 'CALC_FAILED', message: error.message } }, { status: 500 });
  }
}
