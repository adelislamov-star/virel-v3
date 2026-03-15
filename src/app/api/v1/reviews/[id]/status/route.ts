// REVIEW STATUS API
// PATCH /api/v1/reviews/[id]/status — moderate review

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { z } from 'zod';
import { ReviewStateMachine, type ReviewStatus } from '@/lib/state-machines/review';

export const runtime = 'nodejs';

const StatusChangeSchema = z.object({
  newStatus: z.enum(['pending', 'approved', 'rejected', 'flagged', 'escalated']),
  reason: z.string().optional()
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const data = StatusChangeSchema.parse(body);

    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Review not found' } },
        { status: 404 }
      );
    }

    const currentStatus = review.status as ReviewStatus;
    const newStatus = data.newStatus as ReviewStatus;

    if (!ReviewStateMachine.canTransition(currentStatus, newStatus)) {
      return NextResponse.json(
        { error: { code: 'INVALID_TRANSITION', message: `Cannot transition from ${currentStatus} to ${newStatus}` } },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.review.update({
        where: { id },
        data: { status: newStatus }
      });

      await tx.auditLog.create({
        data: {
          actorType: 'user',
          action: 'STATUS_CHANGE',
          entityType: 'review',
          entityId: id,
          before: { status: currentStatus },
          after: { status: newStatus, reason: data.reason }
        }
      });

      return updated;
    });

    return NextResponse.json({ data: { review: result } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message } },
      { status: 500 }
    );
  }
}
