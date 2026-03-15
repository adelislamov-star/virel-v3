// GET /api/v1/staff-performance — leaderboard
// POST /api/v1/staff-performance — build snapshots for all staff
// RBAC: OPERATOR

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/client';
import {
  buildPerformanceSnapshot,
  buildScoreSnapshot,
  getLeaderboard,
} from '@/services/staffAnalyticsService';

export const runtime = 'nodejs';

const BuildSchema = z.object({
  periodStart: z.string().transform(s => new Date(s)),
  periodEnd: z.string().transform(s => new Date(s)),
});

// GET — leaderboard for a period
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const periodStart = url.searchParams.get('periodStart');
    const periodEnd = url.searchParams.get('periodEnd');
    const limit = parseInt(url.searchParams.get('limit') || '20');

    if (!periodStart || !periodEnd) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'periodStart and periodEnd required' } },
        { status: 400 },
      );
    }

    const leaderboard = await getLeaderboard(
      new Date(periodStart),
      new Date(periodEnd),
      limit,
    );

    return NextResponse.json({ success: true, data: { leaderboard } });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 },
    );
  }
}

// POST — build snapshots for all active staff
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { periodStart, periodEnd } = BuildSchema.parse(body);

    // Get all active users with operator/admin roles
    const users = await prisma.user.findMany({
      where: { status: 'active' },
      select: { id: true },
    });

    const results = [];
    for (const user of users) {
      const perf = await buildPerformanceSnapshot(user.id, periodStart, periodEnd);
      const score = await buildScoreSnapshot(user.id, periodStart, periodEnd);
      results.push({ userId: user.id, performanceId: perf.id, scoreId: score.id, totalScore: score.totalScore });
    }

    return NextResponse.json({
      success: true,
      data: { snapshotsBuilt: results.length, results },
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: error.errors } },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 },
    );
  }
}
