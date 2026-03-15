// GET /api/v1/notification-templates — list active templates
// POST /api/v1/notification-templates — create template
// RBAC: OPS_MANAGER (GET), OWNER (POST)

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/client';
import { requireRole, isActor } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const templates = await prisma.notificationTemplate.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ success: true, data: { templates } });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}

const CreateSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  channel: z.string().min(1),
  eventType: z.string().min(1),
  subjectTemplate: z.string().optional(),
  bodyTemplate: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole(request, ['OWNER', 'OPS_MANAGER', 'CONTENT_MANAGER']);
    if (!isActor(auth)) return auth;
    const actorId = auth.userId;

    const body = await request.json();
    const data = CreateSchema.parse(body);

    const template = await prisma.notificationTemplate.create({
      data: {
        code: data.code,
        name: data.name,
        channel: data.channel,
        eventType: data.eventType,
        subjectTemplate: data.subjectTemplate ?? null,
        bodyTemplate: data.bodyTemplate,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorType: 'user',
        actorUserId: actorId,
        action: 'notification.template.created',
        entityType: 'notification_template',
        entityId: template.id,
        after: { code: data.code, channel: data.channel, eventType: data.eventType },
      },
    });

    return NextResponse.json({ success: true, data: { template } }, { status: 201 });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: error.errors } },
        { status: 400 }
      );
    }
    if (error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: { code: 'DUPLICATE', message: 'Template code already exists' } },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}
