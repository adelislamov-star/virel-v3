// GET /api/v1/retention/actions — list retention actions
// POST /api/v1/retention/actions — create action manually
// RBAC: OPERATOR (GET), OPS_MANAGER (POST)

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/client';
import { createRetentionAction } from '@/services/retentionService';
import { requireRole, isActor } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const actionType = searchParams.get('actionType');
    const clientId = searchParams.get('clientId');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));

    const where: any = {};
    if (status) where.status = status;
    if (actionType) where.actionType = actionType;
    if (clientId) where.clientId = clientId;

    const [actions, total] = await Promise.all([
      prisma.retentionAction.findMany({
        where,
        include: { client: { select: { id: true, firstName: true, lastName: true } } },
        orderBy: { scheduledAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.retentionAction.count({ where }),
    ]);

    return NextResponse.json({ success: true, data: { actions, total, page, limit } });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 },
    );
  }
}

const CreateActionSchema = z.object({
  clientId: z.string().min(1),
  retentionProfileId: z.string().optional(),
  ownerUserId: z.string().optional(),
  actionType: z.string().min(1),
  channel: z.string().min(1),
  scheduledAt: z.string().transform(s => new Date(s)),
  metadataJson: z.any().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole(request, ['OWNER', 'OPS_MANAGER', 'OPERATOR']);
    if (!isActor(auth)) return auth;
    const actorId = auth.userId;

    const body = await request.json();
    const data = CreateActionSchema.parse(body);

    const action = await createRetentionAction(data, actorId);

    return NextResponse.json({ success: true, data: { action } }, { status: 201 });
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
