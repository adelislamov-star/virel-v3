// GET /api/v1/staff-score-rules — list all rules
// PATCH /api/v1/staff-score-rules — update rule weights
// RBAC: OPERATOR

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/client';

const DEFAULT_RULES = [
  { metricKey: 'conversionRate', label: 'Conversion Rate', weight: 30, description: 'Percentage of inquiries converted to bookings' },
  { metricKey: 'bookingsCompleted', label: 'Bookings Completed', weight: 25, description: 'Number of bookings completed in period' },
  { metricKey: 'lostRevenueAmount', label: 'Lost Revenue', weight: 20, description: 'Revenue lost from cancelled bookings (inverse)' },
  { metricKey: 'cancellationRate', label: 'Cancellation Rate', weight: 10, description: 'Percentage of bookings cancelled (inverse)' },
  { metricKey: 'complaintsCount', label: 'Complaints', weight: 10, description: 'Number of complaints received (inverse)' },
  { metricKey: 'retentionActionsCompleted', label: 'Retention Actions', weight: 5, description: 'Number of retention actions completed' },
];

export async function GET() {
  try {
    let rules = await prisma.staffScoreRule.findMany({
      orderBy: { weight: 'desc' },
    });

    // Auto-seed if empty
    if (rules.length === 0) {
      for (const rule of DEFAULT_RULES) {
        await prisma.staffScoreRule.upsert({
          where: { metricKey: rule.metricKey },
          update: {},
          create: rule,
        });
      }
      rules = await prisma.staffScoreRule.findMany({
        orderBy: { weight: 'desc' },
      });
    }

    return NextResponse.json({ success: true, data: { rules } });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 },
    );
  }
}

const UpdateRuleSchema = z.object({
  rules: z.array(z.object({
    metricKey: z.string(),
    weight: z.number().min(0).max(100),
    isActive: z.boolean().optional(),
  })),
});

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { rules } = UpdateRuleSchema.parse(body);

    const updated = [];
    for (const rule of rules) {
      const data: any = { weight: rule.weight };
      if (rule.isActive !== undefined) data.isActive = rule.isActive;

      const result = await prisma.staffScoreRule.update({
        where: { metricKey: rule.metricKey },
        data,
      });
      updated.push(result);
    }

    return NextResponse.json({ success: true, data: { rules: updated } });
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
