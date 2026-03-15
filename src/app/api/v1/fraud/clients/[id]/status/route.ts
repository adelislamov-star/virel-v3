// FRAUD CLIENT STATUS API
// GET /api/v1/fraud/clients/[id]/status — get risk status + recent signals
// PATCH /api/v1/fraud/clients/[id]/status — manually change risk status

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { z } from 'zod';
import { changeClientRiskStatus } from '@/services/fraudService';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const client = await prisma.client.findUnique({
      where: { id },
      select: {
        id: true,
        fullName: true,
        riskStatus: true,
        totalSpent: true,
        bookingCount: true,
        chargebackCount: true
      }
    });

    if (!client) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Client not found' } },
        { status: 404 }
      );
    }

    const recentSignals = await prisma.fraudSignal.findMany({
      where: { clientId: id },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    return NextResponse.json({
      data: { client, recentSignals }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message } },
      { status: 500 }
    );
  }
}

const RiskStatusSchema = z.object({
  riskStatus: z.enum(['normal', 'monitoring', 'restricted', 'blocked']),
  reasonCode: z.string().optional(),
  reason: z.string().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const data = RiskStatusSchema.parse(body);

    const result = await changeClientRiskStatus(
      id,
      data.riskStatus,
      'system',
      data.reasonCode || data.reason || 'manual_update',
    );

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: error.errors } },
        { status: 400 },
      );
    }
    if (error.message?.includes('not found')) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: error.message } },
        { status: 404 },
      );
    }
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 },
    );
  }
}
