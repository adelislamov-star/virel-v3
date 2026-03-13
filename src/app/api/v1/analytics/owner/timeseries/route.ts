// GET /api/v1/analytics/owner/timeseries — time series data for charts
// RBAC: OWNER

import { NextRequest, NextResponse } from 'next/server';
import { getTimeSeries } from '@/services/ownerAnalyticsService';

export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl;
    const metric = url.searchParams.get('metric') ?? 'totalRevenue';
    const granularity = url.searchParams.get('granularity') ?? 'daily';
    const dateFromStr = url.searchParams.get('dateFrom');
    const dateToStr = url.searchParams.get('dateTo');

    if (!dateFromStr || !dateToStr) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'dateFrom and dateTo are required' } },
        { status: 400 },
      );
    }

    const dateFrom = new Date(dateFromStr);
    const dateTo = new Date(dateToStr);

    const series = await getTimeSeries(metric, granularity, dateFrom, dateTo);

    return NextResponse.json({ success: true, data: { metric, granularity, series } });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 },
    );
  }
}
