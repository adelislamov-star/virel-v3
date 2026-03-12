// POST /api/v1/retention/run-scan — trigger retention scan via JobService
// RBAC: OWNER

import { NextResponse } from 'next/server';
import { enqueue } from '@/services/jobService';

export async function POST() {
  try {
    const job = await enqueue('retention_scan', {}, { priority: 5 });

    return NextResponse.json({
      success: true,
      data: { job },
      message: 'Retention scan enqueued',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 },
    );
  }
}
