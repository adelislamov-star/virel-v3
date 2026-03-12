// GET /api/v1/search?q=... — global search
// RBAC: OPERATOR

import { NextRequest, NextResponse } from 'next/server';
import { globalSearch } from '@/services/searchService';

export async function GET(request: NextRequest) {
  try {
    const q = new URL(request.url).searchParams.get('q') || '';

    if (q.length < 2) {
      return NextResponse.json({
        success: true,
        data: { results: [], query: q },
      });
    }

    const results = await globalSearch(q, 'system');

    return NextResponse.json({
      success: true,
      data: { results, query: q, total: results.length },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 },
    );
  }
}
