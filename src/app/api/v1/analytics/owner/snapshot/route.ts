// GET /api/v1/analytics/owner/snapshot — get or build snapshot
// RBAC: OWNER

import { NextRequest, NextResponse } from 'next/server';
import { buildSnapshot, getSnapshot } from '@/services/ownerAnalyticsService';

export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl;
    const periodStartStr = url.searchParams.get('periodStart');
    const periodEndStr = url.searchParams.get('periodEnd');

    if (!periodStartStr || !periodEndStr) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'periodStart and periodEnd are required' } },
        { status: 400 },
      );
    }

    const periodStart = new Date(periodStartStr);
    const periodEnd = new Date(periodEndStr);

    if (isNaN(periodStart.getTime()) || isNaN(periodEnd.getTime())) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid date format' } },
        { status: 400 },
      );
    }

    // Try to find existing snapshot
    let snapshot = await getSnapshot(periodStart, periodEnd);

    // If not found, build it
    if (!snapshot) {
      snapshot = await buildSnapshot(periodStart, periodEnd, 'daily');
    }

    return NextResponse.json({ success: true, data: { snapshot } });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 },
    );
  }
}
