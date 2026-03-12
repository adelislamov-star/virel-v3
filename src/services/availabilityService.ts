// AVAILABILITY ENGINE SERVICE
// Sprint 2 — manages model availability, booking slots, manual blocks, conflicts

import { prisma } from '@/lib/db/client';
import type { Prisma } from '@prisma/client';

// ─── Types ───────────────────────────────────────────────

export type AvailabilityCheck = {
  available: boolean;
  conflicts: ConflictDetail[];
  strategy: string;
};

export type ConflictDetail = {
  type: string;
  slotId: string;
  description: string;
  startAt: Date;
  endAt: Date;
};

// ─── Policy helpers ──────────────────────────────────────

async function getPolicy() {
  const policy = await prisma.availabilityPolicy.findFirst({
    orderBy: { createdAt: 'desc' },
  });
  return policy ?? {
    defaultBufferMinutes: 30,
    sameLocationBufferMinutes: 15,
    differentLocationBufferMinutes: 60,
    travelBufferMinutes: 90,
    cooldownMinutes: 20,
    conflictStrategy: 'reject',
  };
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
}

// ─── Overlap query helper ────────────────────────────────

function overlapWhere(modelId: string, startAt: Date, endAt: Date) {
  return {
    modelId,
    status: { not: 'available' },
    OR: [
      { AND: [{ startAt: { lt: endAt } }, { endAt: { gt: startAt } }] },
    ],
  };
}

// ─── checkAvailability ───────────────────────────────────

export async function checkAvailability(
  modelId: string,
  startAt: Date,
  endAt: Date
): Promise<AvailabilityCheck> {
  const policy = await getPolicy();
  const bufferBefore = addMinutes(startAt, -policy.defaultBufferMinutes);
  const bufferAfter = addMinutes(endAt, policy.cooldownMinutes);

  // Find all overlapping ModelAvailability slots (including buffer zone)
  const overlapping = await prisma.modelAvailability.findMany({
    where: overlapWhere(modelId, bufferBefore, bufferAfter),
  });

  const conflicts: ConflictDetail[] = [];

  for (const slot of overlapping) {
    // Direct overlap with the requested window
    if (slot.startAt < endAt && slot.endAt > startAt) {
      conflicts.push({
        type: slot.status === 'booked' ? 'overlap' : 'manual_block_conflict',
        slotId: slot.id,
        description: `${slot.status} slot overlaps (${slot.source})`,
        startAt: slot.startAt,
        endAt: slot.endAt,
      });
    } else if (slot.endAt > bufferBefore && slot.endAt <= startAt) {
      // Cooldown / travel gap violation
      conflicts.push({
        type: 'cooldown_violation',
        slotId: slot.id,
        description: `Cooldown/buffer violation: previous slot ends ${slot.endAt.toISOString()}`,
        startAt: slot.startAt,
        endAt: slot.endAt,
      });
    } else if (slot.startAt >= endAt && slot.startAt < bufferAfter) {
      conflicts.push({
        type: 'travel_gap_too_short',
        slotId: slot.id,
        description: `Next slot starts too soon: ${slot.startAt.toISOString()}`,
        startAt: slot.startAt,
        endAt: slot.endAt,
      });
    }
  }

  // Also check confirmed bookings without ModelAvailability rows (legacy data)
  const bookingConflicts = await prisma.booking.findMany({
    where: {
      modelId,
      status: { in: ['confirmed', 'in_progress'] },
      startAt: { lt: endAt },
      endAt: { gt: startAt },
      deletedAt: null,
    },
  });

  // Only add booking conflicts that aren't already tracked via ModelAvailability
  const trackedBookingIds = new Set(overlapping.map(s => s.bookingId).filter(Boolean));
  for (const bk of bookingConflicts) {
    if (!trackedBookingIds.has(bk.id)) {
      conflicts.push({
        type: 'overlap',
        slotId: bk.id,
        description: `Booking ${bk.shortId ?? bk.id.slice(0, 8)} overlaps (legacy — no availability slot)`,
        startAt: bk.startAt,
        endAt: bk.endAt,
      });
    }
  }

  return {
    available: conflicts.length === 0,
    conflicts,
    strategy: policy.conflictStrategy,
  };
}

// ─── createBookingSlot ───────────────────────────────────

export async function createBookingSlot(bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { location: true },
  });
  if (!booking) throw new Error(`Booking ${bookingId} not found`);

  // Avoid duplicates
  const existing = await prisma.modelAvailability.findFirst({
    where: { bookingId, status: 'booked' },
  });
  if (existing) return existing;

  return prisma.modelAvailability.create({
    data: {
      modelId: booking.modelId,
      startAt: booking.startAt,
      endAt: booking.endAt,
      status: 'booked',
      source: 'booking',
      sourceRefType: 'booking',
      sourceRefId: bookingId,
      bookingId,
      locationId: booking.locationId,
      city: booking.location?.title ?? null,
    },
  });
}

// ─── removeBookingSlot ───────────────────────────────────

export async function removeBookingSlot(bookingId: string) {
  const deleted = await prisma.modelAvailability.deleteMany({
    where: { bookingId, source: 'booking' },
  });
  return { removed: deleted.count };
}

// ─── createManualBlock ───────────────────────────────────

export async function createManualBlock(
  modelId: string,
  params: { startAt: Date; endAt: Date; notes?: string; city?: string; area?: string },
  actorId: string
) {
  const slot = await prisma.modelAvailability.create({
    data: {
      modelId,
      startAt: params.startAt,
      endAt: params.endAt,
      status: 'blocked',
      source: 'manual',
      sourceRefType: 'manual_block',
      notes: params.notes ?? null,
      city: params.city ?? null,
      area: params.area ?? null,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorType: 'user',
      actorUserId: actorId,
      action: 'availability.block.created',
      entityType: 'model_availability',
      entityId: slot.id,
      after: { modelId, startAt: params.startAt, endAt: params.endAt, notes: params.notes },
    },
  });

  return slot;
}

// ─── removeManualBlock ───────────────────────────────────

export async function removeManualBlock(slotId: string, actorId: string) {
  const slot = await prisma.modelAvailability.findUnique({ where: { id: slotId } });
  if (!slot) throw new Error(`Slot ${slotId} not found`);

  await prisma.modelAvailability.delete({ where: { id: slotId } });

  await prisma.auditLog.create({
    data: {
      actorType: 'user',
      actorUserId: actorId,
      action: 'availability.block.removed',
      entityType: 'model_availability',
      entityId: slotId,
      before: { modelId: slot.modelId, startAt: slot.startAt, endAt: slot.endAt, status: slot.status },
    },
  });

  return { removed: true };
}

// ─── resolveConflict ─────────────────────────────────────

export async function resolveConflict(conflictId: string, actorId: string) {
  const conflict = await prisma.availabilityConflict.findUnique({ where: { id: conflictId } });
  if (!conflict) throw new Error(`Conflict ${conflictId} not found`);

  const updated = await prisma.availabilityConflict.update({
    where: { id: conflictId },
    data: {
      status: 'resolved',
      resolvedBy: actorId,
      resolvedAt: new Date(),
    },
  });

  await prisma.auditLog.create({
    data: {
      actorType: 'user',
      actorUserId: actorId,
      action: 'availability.conflict.resolved',
      entityType: 'availability_conflict',
      entityId: conflictId,
      before: { status: 'open' },
      after: { status: 'resolved' },
    },
  });

  return updated;
}
