// GET /api/v1/lost-revenue/summary
// Aggregate by type and responsibleRole for current month
// RBAC: OPERATOR

import { NextResponse } from 'next/server';
import { getSummary } from '@/services/lostRevenueService';

export async function GET() {
  try {
    const summary = await getSummary();
    return NextResponse.json({ success: true, data: summary });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}
