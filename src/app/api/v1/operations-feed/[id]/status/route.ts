// PATCH /api/v1/operations-feed/:id/status
// Change feed item status (acknowledge / resolve / dismiss)
// RBAC: OPS_MANAGER

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  acknowledgeItem,
  resolveItem,
  dismissItem,
  snoozeItem,
} from '@/services/operationsFeedService';
import { requireRole, isActor } from '@/lib/auth';

const StatusSchema = z.object({
  status: z.enum(['acknowledged', 'in_progress', 'resolved', 'dismissed']),
  note: z.string().optional(),
  snoozedUntil: z.string().datetime().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireRole(request, ['OWNER', 'OPS_MANAGER', 'OPERATOR']);
    if (!isActor(auth)) return auth;
    const actorId = auth.userId;

    const body = await request.json();
    const data = StatusSchema.parse(body);

    let item;

    switch (data.status) {
      case 'acknowledged':
        item = await acknowledgeItem(params.id, actorId);
        break;
      case 'resolved':
        item = await resolveItem(params.id, actorId, data.note);
        break;
      case 'dismissed':
        item = await dismissItem(params.id, actorId, data.note);
        break;
      case 'in_progress':
        // Simple status update
        const { prisma } = await import('@/lib/db/client');
        item = await prisma.operationsFeedItem.update({
          where: { id: params.id },
          data: { status: 'in_progress' },
        });
        break;
    }

    // Handle snooze if provided
    if (data.snoozedUntil) {
      item = await snoozeItem(params.id, new Date(data.snoozedUntil), actorId);
    }

    return NextResponse.json({ success: true, data: { item } });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: error.errors } },
        { status: 400 }
      );
    }
    if (error.message?.includes('not found')) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: error.message } },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}
