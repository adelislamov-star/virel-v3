// DATA GOVERNANCE RUN — POST trigger quality checks
import { NextResponse } from 'next/server';
import { runDataQualityChecks } from '@/lib/data-governance/checker';

export async function POST() {
  try {
    const result = await runDataQualityChecks();

    return NextResponse.json({
      data: {
        newChecks: result.newChecks,
        existing: result.existing,
        ranAt: new Date().toISOString()
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: { code: 'RUN_FAILED', message: error.message } }, { status: 500 });
  }
}
