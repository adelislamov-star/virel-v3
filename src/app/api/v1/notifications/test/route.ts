// POST /api/v1/notifications/test — send test notification directly
// RBAC: OWNER

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { renderTemplate, dispatchNotification } from '@/services/notificationService';
import { prisma } from '@/lib/db/client';
import { randomUUID } from 'crypto';

const TestSchema = z.object({
  templateId: z.string(),
  recipientAddress: z.string(),
  payloadJson: z.record(z.any()),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = TestSchema.parse(body);

    const template = await prisma.notificationTemplate.findUnique({
      where: { id: data.templateId },
    });
    if (!template) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Template not found' } },
        { status: 404 }
      );
    }

    const rendered = await renderTemplate(data.templateId, data.payloadJson);

    // Create notification directly (bypass queue)
    const notification = await prisma.notification.create({
      data: {
        templateId: data.templateId,
        eventType: template.eventType,
        recipientType: 'test',
        recipientId: 'test',
        recipientAddress: data.recipientAddress,
        channel: template.channel,
        status: 'queued',
        idempotencyKey: `test:${randomUUID()}`,
        payloadJson: data.payloadJson,
        renderedSubject: rendered.subject,
        renderedBody: rendered.body,
      },
    });

    const result = await dispatchNotification(notification.id);

    return NextResponse.json({ success: true, data: { notification: { ...notification, ...result }, rendered } });
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
