// NOTIFICATION SERVICE
// Queue, render, dispatch, and preference-check for notifications

import { prisma } from '@/lib/db/client';
import { enqueue } from '@/services/jobService';
import { randomUUID } from 'crypto';

// ─── Types ───────────────────────────────────────────────

type QueueOptions = {
  templateId?: string;
  recipientAddress?: string;
  scheduledAt?: Date;
  idempotencyKey?: string;
};

// ─── queueNotification ──────────────────────────────────

export async function queueNotification(
  eventType: string,
  recipientType: string,
  recipientId: string,
  channel: string,
  payloadJson: any,
  options?: QueueOptions
) {
  const idempotencyKey = options?.idempotencyKey ?? `${eventType}:${recipientId}:${channel}:${randomUUID()}`;

  // Check for duplicate
  const existing = await prisma.notification.findUnique({
    where: { idempotencyKey },
  });
  if (existing) return existing;

  // Render template if provided
  let renderedSubject: string | null = null;
  let renderedBody = JSON.stringify(payloadJson);

  if (options?.templateId) {
    const rendered = await renderTemplate(options.templateId, payloadJson);
    renderedSubject = rendered.subject;
    renderedBody = rendered.body;
  }

  const notification = await prisma.notification.create({
    data: {
      templateId: options?.templateId ?? null,
      eventType,
      recipientType,
      recipientId,
      recipientAddress: options?.recipientAddress ?? null,
      channel,
      status: 'queued',
      idempotencyKey,
      payloadJson,
      renderedSubject,
      renderedBody,
      scheduledAt: options?.scheduledAt ?? null,
    },
  });

  // Enqueue a job for dispatch
  await enqueue('notification_dispatch', { notificationId: notification.id }, {
    dedupeKey: `notif:${notification.id}`,
    priority: 'normal',
  });

  return notification;
}

// ─── renderTemplate ─────────────────────────────────────

export async function renderTemplate(templateId: string, payloadJson: any) {
  const template = await prisma.notificationTemplate.findUnique({
    where: { id: templateId },
  });
  if (!template) throw new Error(`Template ${templateId} not found`);

  function interpolate(text: string, vars: Record<string, any>): string {
    return text.replace(/\{\{(\w+)\}\}/g, (_, key) => {
      return vars[key] !== undefined ? String(vars[key]) : `{{${key}}}`;
    });
  }

  return {
    subject: template.subjectTemplate ? interpolate(template.subjectTemplate, payloadJson) : null,
    body: interpolate(template.bodyTemplate, payloadJson),
  };
}

// ─── dispatchNotification ───────────────────────────────

export async function dispatchNotification(notificationId: string) {
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
  });
  if (!notification) throw new Error(`Notification ${notificationId} not found`);

  // Check preferences (only for client recipients)
  if (notification.recipientType === 'client') {
    const allowed = await checkPreference(
      notification.recipientId,
      notification.channel,
      notification.eventType
    );
    if (!allowed) {
      await prisma.notification.update({
        where: { id: notificationId },
        data: { status: 'skipped' },
      });
      return { skipped: true, reason: 'preference_disabled' };
    }
  }

  // Attempt dispatch via provider (stub — real providers added later)
  const attemptNumber = notification.retryCount + 1;
  const provider = notification.provider || `${notification.channel}_default`;

  try {
    // STUB: actual provider call goes here
    // For now, simulate success
    console.log(`[NotificationService] Dispatching ${notification.channel} notification ${notificationId}`);

    await prisma.notificationLog.create({
      data: {
        notificationId,
        attemptNumber,
        provider,
        status: 'sent',
        responseJson: { stub: true },
      },
    });

    await prisma.notification.update({
      where: { id: notificationId },
      data: {
        status: 'sent',
        sentAt: new Date(),
        provider,
      },
    });

    return { sent: true };
  } catch (err: any) {
    await prisma.notificationLog.create({
      data: {
        notificationId,
        attemptNumber,
        provider,
        status: 'failed',
        errorText: err.message,
      },
    });

    await prisma.notification.update({
      where: { id: notificationId },
      data: {
        status: 'failed',
        failedAt: new Date(),
        retryCount: { increment: 1 },
      },
    });

    return { sent: false, error: err.message };
  }
}

// ─── checkPreference ────────────────────────────────────

export async function checkPreference(
  clientId: string,
  channel: string,
  eventType: string
): Promise<boolean> {
  const pref = await prisma.notificationPreference.findFirst({
    where: { clientId, channel, eventType },
  });
  // If no preference record exists, default to enabled
  if (!pref) return true;
  return pref.isEnabled;
}

// ─── dispatchPendingNotifications (cron entry point) ─────
// Finds all queued notifications and dispatches them in batch
export async function dispatchPendingNotifications(batchSize = 50) {
  const pending = await prisma.notification.findMany({
    where: {
      status: 'queued',
      OR: [
        { scheduledAt: null },
        { scheduledAt: { lte: new Date() } },
      ],
    },
    orderBy: { createdAt: 'asc' },
    take: batchSize,
    select: { id: true },
  });

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const n of pending) {
    const result = await dispatchNotification(n.id);
    if ('sent' in result && result.sent) sent++;
    else if ('skipped' in result) skipped++;
    else failed++;
  }

  return { processed: pending.length, sent, skipped, failed };
}
