// AVAILABILITY MISMATCHES API
// GET /api/v1/availability/mismatches - Detect conflicts

import { NextRequest, NextResponse } from 'next/server';
import { detectMismatches } from '@/lib/availability/rules';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const modelId = searchParams.get('model_id') || undefined;
    
    const mismatches = await detectMismatches(modelId);
    
    return NextResponse.json({
      success: true,
      data: {
        mismatches,
        count: mismatches.length
      }
    });
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    }, { status: 500 });
  }
}
