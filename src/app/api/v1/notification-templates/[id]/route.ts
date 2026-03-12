// GET /api/v1/notification-templates/:id — template details
// PATCH /api/v1/notification-templates/:id — update (versioned)
// DELETE /api/v1/notification-templates/:id — soft delete
// RBAC: OPS_MANAGER (GET), OWNER (PATCH, DELETE)

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/client';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const template = await prisma.notificationTemplate.findUnique({
      where: { id: params.id },
    });
    if (!template || template.deletedAt) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Template not found' } },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: { template } });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}

const UpdateSchema = z.object({
  name: z.string().optional(),
  channel: z.string().optional(),
  eventType: z.string().optional(),
  subjectTemplate: z.string().nullable().optional(),
  bodyTemplate: z.string().optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const data = UpdateSchema.parse(body);

    const actorId = 'system'; // TODO: from auth

    const existing = await prisma.notificationTemplate.findUnique({
      where: { id: params.id },
    });
    if (!existing || existing.deletedAt) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Template not found' } },
        { status: 404 }
      );
    }

    const template = await prisma.notificationTemplate.update({
      where: { id: params.id },
      data: {
        ...data,
        version: { increment: 1 },
        previousVersionId: existing.id,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorType: 'user',
        actorUserId: actorId,
        action: 'notification.template.updated',
        entityType: 'notification_template',
        entityId: params.id,
        before: { version: existing.version },
        after: { version: template.version, ...data },
      },
    });

    return NextResponse.json({ success: true, data: { template } });
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const actorId = 'system'; // TODO: from auth

    const existing = await prisma.notificationTemplate.findUnique({
      where: { id: params.id },
    });
    if (!existing || existing.deletedAt) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Template not found' } },
        { status: 404 }
      );
    }

    await prisma.notificationTemplate.update({
      where: { id: params.id },
      data: { deletedAt: new Date(), deletedBy: actorId },
    });

    await prisma.auditLog.create({
      data: {
        actorType: 'user',
        actorUserId: actorId,
        action: 'notification.template.deleted',
        entityType: 'notification_template',
        entityId: params.id,
        before: { code: existing.code, isActive: existing.isActive },
        after: { deletedAt: new Date().toISOString() },
      },
    });

    return NextResponse.json({ success: true, data: { id: params.id }, message: 'Template deleted' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}
