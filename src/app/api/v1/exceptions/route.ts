// EXCEPTIONS API v1
// GET /api/v1/exceptions - List exceptions

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const status = searchParams.get('status');
    const severity = searchParams.get('severity');
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    const where: any = {};
    if (status) where.status = status;
    if (severity) where.severity = severity;
    if (type) where.type = type;
    
    const [exceptions, total] = await Promise.all([
      prisma.exception.findMany({
        where,
        orderBy: [
          { severity: 'desc' },
          { createdAt: 'desc' }
        ],
        take: limit,
        skip: offset
      }),
      prisma.exception.count({ where })
    ]);
    
    return NextResponse.json({
      success: true,
      data: {
        exceptions,
        pagination: { total, limit, offset }
      }
    });
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    }, { status: 500 });
  }
}
