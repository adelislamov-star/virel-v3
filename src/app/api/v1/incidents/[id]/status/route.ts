// INCIDENT STATUS API
// PATCH /api/v1/incidents/[id]/status — change incident status

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { z } from 'zod';
import { IncidentStateMachine, type IncidentStatus } from '@/lib/state-machines/incident';

export const runtime = 'nodejs';

const StatusChangeSchema = z.object({
  newStatus: z.enum(['reported', 'investigating', 'resolved', 'closed']),
  resolutionDetails: z.string().optional(),
  compensationAmount: z.number().optional()
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const data = StatusChangeSchema.parse(body);

    const incident = await prisma.incident.findUnique({ where: { id } });
    if (!incident) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Incident not found' } },
        { status: 404 }
      );
    }

    const currentStatus = incident.status as IncidentStatus;
    const newStatus = data.newStatus as IncidentStatus;

    if (!IncidentStateMachine.canTransition(currentStatus, newStatus)) {
      return NextResponse.json(
        { error: { code: 'INVALID_TRANSITION', message: `Cannot transition from ${currentStatus} to ${newStatus}` } },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = { status: newStatus };
    if (data.resolutionDetails) updateData.resolutionDetails = data.resolutionDetails;
    if (data.compensationAmount !== undefined) updateData.compensationAmount = data.compensationAmount;

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.incident.update({
        where: { id },
        data: updateData
      });

      await tx.auditLog.create({
        data: {
          actorType: 'user',
          action: 'STATUS_CHANGE',
          entityType: 'incident',
          entityId: id,
          before: { status: currentStatus },
          after: { status: newStatus, resolutionDetails: data.resolutionDetails }
        }
      });

      return updated;
    });

    return NextResponse.json({ data: { incident: result } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message } },
      { status: 500 }
    );
  }
}
