// MODEL STATUS API
// PATCH /api/v1/models/[id]/status — change model profile status

import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db/client';
import { z } from 'zod';
import { ModelProfileStateMachine, type ModelProfileStatus } from '@/lib/state-machines/model-profile';
import { requireRole, isActor } from '@/lib/auth';

const StatusChangeSchema = z.object({
  newStatus: z.enum(['draft', 'active', 'vacation', 'archived']),
  reason: z.string().optional()
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRole(request, ['OWNER', 'OPS_MANAGER']);
    if (!isActor(auth)) return auth;
    const { id } = await params;
    const body = await request.json();
    const data = StatusChangeSchema.parse(body);

    const model = await prisma.model.findUnique({ where: { id } });
    if (!model) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Model not found' } },
        { status: 404 }
      );
    }

    const currentStatus = model.status as ModelProfileStatus;
    const newStatus = data.newStatus as ModelProfileStatus;

    if (!ModelProfileStateMachine.canTransition(currentStatus, newStatus)) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_TRANSITION',
            message: `Cannot transition from ${currentStatus} to ${newStatus}`,
            availableTransitions: ModelProfileStateMachine.getAvailableTransitions(currentStatus)
          }
        },
        { status: 400 }
      );
    }

    if (ModelProfileStateMachine.requiresReason(newStatus) && !data.reason) {
      return NextResponse.json(
        { error: { code: 'REASON_REQUIRED', message: `Reason is required for transition to ${newStatus}` } },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.model.update({
        where: { id },
        data: { status: newStatus }
      });

      await tx.auditLog.create({
        data: {
          actorType: 'user',
          action: 'STATUS_CHANGE',
          entityType: 'model',
          entityId: id,
          before: { status: currentStatus },
          after: { status: newStatus, reason: data.reason }
        }
      });

      return updated;
    });

    // Revalidate frontend caches — status change directly affects visibility
    revalidatePath('/companions');
    revalidatePath('/');
    if (result.slug) revalidatePath(`/companions/${result.slug}`);

    return NextResponse.json({ data: { model: result } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message } },
      { status: 500 }
    );
  }
}
