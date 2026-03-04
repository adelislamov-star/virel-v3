// SLA CHECK BREACHES — POST trigger breach check
import { NextResponse } from 'next/server';
import { checkBreaches } from '@/lib/sla/tracker';

export async function POST() {
  try {
    const breachedCount = await checkBreaches();

    return NextResponse.json({
      data: {
        breachedCount,
        checkedAt: new Date().toISOString()
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: { code: 'CHECK_FAILED', message: error.message } }, { status: 500 });
  }
}
