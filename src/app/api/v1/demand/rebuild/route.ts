// POST /api/v1/demand/rebuild — rebuild demand stats
// RBAC: OWNER

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { rebuildDemandStats } from '@/services/demandAnalyticsService';

const RebuildSchema = z.object({
  periodStart: z.string().transform(s => new Date(s)),
  periodEnd: z.string().transform(s => new Date(s)),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = RebuildSchema.parse(body);

    const result = await rebuildDemandStats(data.periodStart, data.periodEnd);

    return NextResponse.json({ success: true, data: result });
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
