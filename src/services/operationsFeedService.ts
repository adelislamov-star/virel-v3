// OPERATIONS FEED SERVICE
// Unified action center for ops tasks, alerts, and escalations

import { prisma } from '@/lib/db/client';

// ─── Types ───────────────────────────────────────────────

type PushItemParams = {
  type: string;
  sourceModule: string;
  priority?: string;
  entityType: string;
  entityId: string;
  dedupeKey?: string;
  title: string;
  description?: string;
  assignedUserId?: string;
  dueAt?: Date;
  metadataJson?: any;
};

// ─── pushItem ────────────────────────────────────────────

export async function pushItem(params: PushItemParams) {
  // Dedupe check: if dedupeKey provided and active item exists, return existing
  if (params.dedupeKey) {
    const existing = await prisma.operationsFeedItem.findFirst({
      where: {
        dedupeKey: params.dedupeKey,
        status: { notIn: ['resolved', 'dismissed'] },
      },
    });
    if (existing) return existing;
  }

  return prisma.operationsFeedItem.create({
    data: {
      type: params.type,
      sourceModule: params.sourceModule,
      priority: params.priority ?? 'medium',
      entityType: params.entityType,
      entityId: params.entityId,
      dedupeKey: params.dedupeKey ?? null,
      title: params.title,
      description: params.description ?? null,
      assignedUserId: params.assignedUserId ?? null,
      dueAt: params.dueAt ?? null,
      metadataJson: params.metadataJson ?? null,
    },
  });
}

// ─── assignItem ──────────────────────────────────────────

export async function assignItem(itemId: string, userId: string, actorId: string) {
  const item = await prisma.operationsFeedItem.findUnique({ where: { id: itemId } });
  if (!item) throw new Error(`OperationsFeedItem ${itemId} not found`);

  const updated = await prisma.operationsFeedItem.update({
    where: { id: itemId },
    data: { assignedUserId: userId },
  });

  await prisma.auditLog.create({
    data: {
      actorType: 'user',
      actorUserId: actorId,
      action: 'operations_feed.assigned',
      entityType: 'operations_feed_item',
      entityId: itemId,
      before: { assignedUserId: item.assignedUserId },
      after: { assignedUserId: userId },
    },
  });

  return updated;
}

// ─── acknowledgeItem ─────────────────────────────────────

export async function acknowledgeItem(itemId: string, actorId: string) {
  const item = await prisma.operationsFeedItem.findUnique({ where: { id: itemId } });
  if (!item) throw new Error(`OperationsFeedItem ${itemId} not found`);

  return prisma.operationsFeedItem.update({
    where: { id: itemId },
    data: { status: 'acknowledged' },
  });
}

// ─── resolveItem ─────────────────────────────────────────

export async function resolveItem(itemId: string, actorId: string, note?: string) {
  const item = await prisma.operationsFeedItem.findUnique({ where: { id: itemId } });
  if (!item) throw new Error(`OperationsFeedItem ${itemId} not found`);

  const updated = await prisma.operationsFeedItem.update({
    where: { id: itemId },
    data: {
      status: 'resolved',
      resolvedAt: new Date(),
      resolutionNote: note ?? null,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorType: 'user',
      actorUserId: actorId,
      action: 'operations_feed.resolved',
      entityType: 'operations_feed_item',
      entityId: itemId,
      before: { status: item.status },
      after: { status: 'resolved', resolutionNote: note },
    },
  });

  return updated;
}

// ─── dismissItem ─────────────────────────────────────────

export async function dismissItem(itemId: string, actorId: string, note?: string) {
  const item = await prisma.operationsFeedItem.findUnique({ where: { id: itemId } });
  if (!item) throw new Error(`OperationsFeedItem ${itemId} not found`);

  const updated = await prisma.operationsFeedItem.update({
    where: { id: itemId },
    data: {
      status: 'dismissed',
      resolvedAt: new Date(),
      resolutionNote: note ?? null,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorType: 'user',
      actorUserId: actorId,
      action: 'operations_feed.dismissed',
      entityType: 'operations_feed_item',
      entityId: itemId,
      before: { status: item.status },
      after: { status: 'dismissed', resolutionNote: note },
    },
  });

  return updated;
}

// ─── snoozeItem ──────────────────────────────────────────

export async function snoozeItem(itemId: string, until: Date, actorId: string) {
  const item = await prisma.operationsFeedItem.findUnique({ where: { id: itemId } });
  if (!item) throw new Error(`OperationsFeedItem ${itemId} not found`);

  return prisma.operationsFeedItem.update({
    where: { id: itemId },
    data: { snoozedUntil: until },
  });
}

// ─── autoCloseOldItems (cron entry point) ────────────────
// Auto-closes open items older than the given threshold
export async function autoCloseOldItems(olderThanHours = 72) {
  const threshold = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);

  const staleItems = await prisma.operationsFeedItem.findMany({
    where: {
      status: { in: ['open', 'acknowledged'] },
      createdAt: { lt: threshold },
    },
    select: { id: true },
  });

  if (staleItems.length > 0) {
    await prisma.operationsFeedItem.updateMany({
      where: { id: { in: staleItems.map((i) => i.id) } },
      data: {
        status: 'dismissed',
        resolvedAt: new Date(),
        resolutionNote: `Auto-closed by cron after ${olderThanHours}h`,
      },
    });
  }

  return { closedCount: staleItems.length };
}
