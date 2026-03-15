// PRICING CALCULATOR — POST calculate dynamic price
import { NextRequest, NextResponse } from 'next/server';
import { calculateDynamicPrice } from '@/lib/pricing/engine';
import { prisma } from '@/lib/db/client';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { modelId, locationId, startAt, durationHours, basePrice, bookingId } = body;

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

    // Log the pricing decision
    try {
      await prisma.pricingDecisionLog.create({
        data: {
          bookingId: bookingId || null,
          modelId,
          basePrice: parseFloat(basePrice),
          finalPrice: result.finalPrice ?? parseFloat(basePrice),
          decisionSource: result.adjustments?.length > 0 ? 'rule_engine' : 'fallback',
          appliedRulesJson: result.adjustments || [],
          marginImpact: (result.finalPrice ?? parseFloat(basePrice)) - parseFloat(basePrice),
        },
      });
    } catch {
      // Non-critical: don't fail the request if logging fails
    }

    return NextResponse.json({ data: result });
  } catch (error: any) {
    return NextResponse.json({ error: { code: 'CALC_FAILED', message: error.message } }, { status: 500 });
  }
}
