// PATCH /api/v1/clients/:id/risk-status — change client risk status
// RBAC: OPS_MANAGER

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/client';
import { recordClientEvent } from '@/services/clientEventService';
import { requireRole, isActor } from '@/lib/auth';

const RiskStatusSchema = z.object({
  riskStatus: z.enum(['normal', 'monitoring', 'restricted', 'blocked']),
  reasonCode: z.string().min(1, 'reasonCode is required'),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const auth = await requireRole(request, ['OWNER', 'OPS_MANAGER']);
    if (!isActor(auth)) return auth;
    const actorId = auth.userId;

    const body = await request.json();
    const data = RiskStatusSchema.parse(body);

    const client = await prisma.client.findUnique({ where: { id: params.id } });
    if (!client || client.deletedAt) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Client not found' } },
        { status: 404 },
      );
    }

    const previousStatus = client.riskStatus;

    const updated = await prisma.client.update({
      where: { id: params.id },
      data: { riskStatus: data.riskStatus },
    });

    await prisma.clientRiskHistory.create({
      data: {
        clientId: params.id,
        previousStatus,
        newStatus: data.riskStatus,
        createdBy: actorId,
        reason: data.reasonCode,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorType: 'user',
        actorUserId: actorId,
        action: 'client.risk_status.changed',
        entityType: 'client',
        entityId: params.id,
        before: { riskStatus: previousStatus },
        after: { riskStatus: data.riskStatus, reasonCode: data.reasonCode },
      },
    });

    await recordClientEvent(params.id, 'risk_status.changed', {
      previousStatus,
      newStatus: data.riskStatus,
      reasonCode: data.reasonCode,
    }, actorId);

    return NextResponse.json({ success: true, data: { client: updated } });
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
