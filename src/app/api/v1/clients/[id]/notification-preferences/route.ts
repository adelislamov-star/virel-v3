// GET /api/v1/clients/:id/notification-preferences
// PATCH /api/v1/clients/:id/notification-preferences
// RBAC: OPERATOR (GET), OPS_MANAGER (PATCH)

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/client';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const preferences = await prisma.notificationPreference.findMany({
      where: { clientId: params.id },
      orderBy: [{ channel: 'asc' }, { eventType: 'asc' }],
    });

    return NextResponse.json({ success: true, data: { preferences } });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}

const PatchSchema = z.object({
  channel: z.string().min(1),
  eventType: z.string().min(1),
  isEnabled: z.boolean(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const data = PatchSchema.parse(body);

    // Upsert preference
    const existing = await prisma.notificationPreference.findFirst({
      where: { clientId: params.id, channel: data.channel, eventType: data.eventType },
    });

    let preference;
    if (existing) {
      preference = await prisma.notificationPreference.update({
        where: { id: existing.id },
        data: { isEnabled: data.isEnabled },
      });
    } else {
      preference = await prisma.notificationPreference.create({
        data: {
          clientId: params.id,
          channel: data.channel,
          eventType: data.eventType,
          isEnabled: data.isEnabled,
        },
      });
    }

    return NextResponse.json({ success: true, data: { preference } });
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
