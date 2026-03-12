// GET /api/v1/demand/heatmap — demand heatmap data
// RBAC: OPS_MANAGER

import { NextRequest, NextResponse } from 'next/server';
import { getDemandHeatmap } from '@/services/demandAnalyticsService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city') || undefined;
    const locationId = searchParams.get('locationId') || undefined;
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    if (!dateFrom || !dateTo) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'dateFrom and dateTo required' } },
        { status: 400 },
      );
    }

    const heatmap = await getDemandHeatmap({
      city,
      locationId,
      dateFrom: new Date(dateFrom),
      dateTo: new Date(dateTo),
    });

    return NextResponse.json({ success: true, data: { heatmap } });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 },
    );
  }
}
