// GET /api/v1/memberships/:id/benefits — list benefit usages
// POST /api/v1/memberships/:id/benefits — apply a benefit
// RBAC: OPERATOR (GET), OPS_MANAGER (POST)

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/client';
import { applyBenefit } from '@/services/membershipService';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const usages = await prisma.membershipBenefitUsage.findMany({
      where: { clientMembershipId: params.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: { benefits: usages } });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 },
    );
  }
}

const ApplySchema = z.object({
  benefitType: z.enum(['discount', 'priority_support', 'vip_access', 'early_access', 'fee_waiver', 'free_upgrade']),
  valueAmount: z.number().positive(),
  bookingId: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const body = await request.json();
    const data = ApplySchema.parse(body);

    const usage = await applyBenefit(
      params.id,
      data.benefitType,
      data.valueAmount,
      'system',
      data.bookingId,
    );

    return NextResponse.json({ success: true, data: { benefit: usage } }, { status: 201 });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: error.errors } },
        { status: 400 },
      );
    }
    if (error.message?.includes('not found') || error.message?.includes('not active')) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: error.message } },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 },
    );
  }
}
