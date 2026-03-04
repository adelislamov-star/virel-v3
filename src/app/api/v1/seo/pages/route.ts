// SEO PAGES API
// GET /api/v1/seo/pages — list SEO pages with filters

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pageType = searchParams.get('page_type');
    const indexStatus = searchParams.get('index_status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (pageType) where.pageType = pageType;
    if (indexStatus) where.indexStatus = indexStatus;

    const [pages, total] = await Promise.all([
      prisma.sEOPage.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.sEOPage.count({ where })
    ]);

    return NextResponse.json({
      data: {
        pages,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
      }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message } },
      { status: 500 }
    );
  }
}
