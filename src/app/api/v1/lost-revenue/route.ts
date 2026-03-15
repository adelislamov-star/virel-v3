// GET  /api/v1/lost-revenue — list entries with filters
// POST /api/v1/lost-revenue — create entry manually
// RBAC: OPERATOR (GET), OPS_MANAGER (POST)

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/client';
import { createEntry } from '@/services/lostRevenueService';
import { requireRole, isActor } from '@/lib/auth';

export const runtime = 'nodejs';

// ─── GET ─────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const type = sp.get('type');
    const status = sp.get('status');
    const responsibleRole = sp.get('responsibleRole');
    const dateFrom = sp.get('dateFrom');
    const dateTo = sp.get('dateTo');
    const page = Math.max(1, parseInt(sp.get('page') ?? '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(sp.get('limit') ?? '20', 10)));

    const where: any = {};
    if (type) where.type = type;
    if (status) where.status = status;
    if (responsibleRole) where.responsibleRole = responsibleRole;
    if (dateFrom || dateTo) {
      where.detectedAt = {};
      if (dateFrom) where.detectedAt.gte = new Date(dateFrom);
      if (dateTo) where.detectedAt.lte = new Date(dateTo);
    }

    const [entries, total] = await Promise.all([
      prisma.lostRevenueEntry.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.lostRevenueEntry.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: { entries, total, page, limit },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}

// ─── POST ────────────────────────────────────────────────

const CreateSchema = z.object({
  type: z.string(),
  amount: z.number(),
  amountType: z.string().optional(),
  currency: z.string().optional(),
  bookingId: z.string().optional(),
  clientId: z.string().optional(),
  modelId: z.string().optional(),
  responsibleRole: z.string(),
  rootCause: z.string(),
  detectionSource: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole(request, ['OWNER', 'OPS_MANAGER', 'FINANCE']);
    if (!isActor(auth)) return auth;
    const actorId = auth.userId;

    const body = await request.json();
    const data = CreateSchema.parse(body);

    const entry = await createEntry(data, actorId);

    return NextResponse.json({ success: true, data: { entry } }, { status: 201 });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: error.errors } },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}
