// SYSTEM HEALTH CHECK API
// GET /api/v1/system/health — public health check

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';

export const runtime = 'nodejs';

const startTime = Date.now();

export async function GET() {
  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const dbLatency = Date.now() - dbStart;

    return NextResponse.json({
      data: {
        status: 'healthy',
        uptime: Math.floor((Date.now() - startTime) / 1000),
        database: {
          status: 'connected',
          latencyMs: dbLatency
        },
        timestamp: new Date().toISOString()
      }
    });
  } catch {
    return NextResponse.json({
      data: {
        status: 'unhealthy',
        uptime: Math.floor((Date.now() - startTime) / 1000),
        database: { status: 'disconnected' },
        timestamp: new Date().toISOString()
      }
    }, { status: 503 });
  }
}
