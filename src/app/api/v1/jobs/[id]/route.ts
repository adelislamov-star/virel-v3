// GET /api/v1/jobs/:id — job details + last 50 logs
// RBAC: OPS_MANAGER

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const job = await prisma.jobQueue.findUnique({
      where: { id: params.id },
    });

    if (!job) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Job not found' } },
        { status: 404 }
      );
    }

    const logs = await prisma.jobLog.findMany({
      where: { jobId: params.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({
      success: true,
      data: { job, logs },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}
