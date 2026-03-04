// REVIEW REPLY API
// POST /api/v1/reviews/[id]/reply — reply to a review

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { z } from 'zod';

const ReplySchema = z.object({
  replyType: z.enum(['model', 'manager']),
  text: z.string().min(1)
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const data = ReplySchema.parse(body);

    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Review not found' } },
        { status: 404 }
      );
    }

    const updateData = data.replyType === 'model'
      ? { replyByModel: data.text }
      : { replyByManager: data.text };

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.review.update({
        where: { id },
        data: updateData
      });

      await tx.auditLog.create({
        data: {
          actorType: 'user',
          action: 'UPDATE',
          entityType: 'review',
          entityId: id,
          before: { replyByModel: review.replyByModel, replyByManager: review.replyByManager },
          after: updateData
        }
      });

      return result;
    });

    return NextResponse.json({ data: { review: updated } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message } },
      { status: 500 }
    );
  }
}
