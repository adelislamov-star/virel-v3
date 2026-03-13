// LOST REVENUE SERVICE
// Tracks revenue leakage from cancellations, no-shows, payment failures, etc.

import { prisma } from '@/lib/db/client';
import { recordClientEvent } from '@/services/clientEventService';

// ─── Types ───────────────────────────────────────────────

type CreateEntryParams = {
  type: string;
  amount: number;
  amountType?: string;
  currency?: string;
  bookingId?: string;
  clientId?: string;
  modelId?: string;
  receptionistId?: string;
  responsibleUserId?: string;
  rootCause: string;
  responsibleRole: string;
  detectionSource?: string;
  detectedByType?: string;
  notes?: string;
  operationsFeedItemId?: string;
};

// ─── createEntry ─────────────────────────────────────────

export async function createEntry(params: CreateEntryParams, actorId: string) {
  const entry = await prisma.lostRevenueEntry.create({
    data: {
      type: params.type,
      amount: params.amount,
      amountType: params.amountType ?? 'estimated',
      currency: params.currency ?? 'GBP',
      bookingId: params.bookingId ?? null,
      clientId: params.clientId ?? null,
      modelId: params.modelId ?? null,
      receptionistId: params.receptionistId ?? null,
      responsibleUserId: params.responsibleUserId ?? null,
      rootCause: params.rootCause,
      responsibleRole: params.responsibleRole,
      detectionSource: params.detectionSource ?? 'manual',
      detectedBy: actorId,
      detectedByType: params.detectedByType ?? 'user',
      notes: params.notes ?? null,
      operationsFeedItemId: params.operationsFeedItemId ?? null,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorType: 'user',
      actorUserId: actorId,
      action: 'lost_revenue.created',
      entityType: 'lost_revenue_entry',
      entityId: entry.id,
      after: {
        type: params.type,
        amount: params.amount,
        responsibleRole: params.responsibleRole,
        detectionSource: params.detectionSource ?? 'manual',
      },
    },
  });

  if (params.clientId && (params.type === 'booking_cancelled_after_hold' || params.type === 'no_show')) {
    await recordClientEvent(params.clientId, 'booking.cancelled', {
      entryId: entry.id,
      type: params.type,
      amount: params.amount,
      bookingId: params.bookingId,
    }, actorId);
  }

  return entry;
}

// ─── detectFromBooking ───────────────────────────────────

export async function detectFromBooking(bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { model: true, client: true },
  });
  if (!booking) throw new Error(`Booking ${bookingId} not found`);

  // Only process cancelled or no_show
  if (booking.status !== 'cancelled' && booking.status !== 'no_show') {
    return null;
  }

  // Avoid duplicate entries for the same booking
  const existing = await prisma.lostRevenueEntry.findFirst({
    where: { bookingId, detectionSource: 'booking_rule' },
  });
  if (existing) return existing;

  const type = booking.status === 'no_show' ? 'no_show' : 'booking_cancelled_after_hold';
  const responsibleRole = booking.status === 'no_show' ? 'client' : 'client';

  // Estimate amount from booking total or hourly rate
  const amount = (booking as any).totalAmount ?? (booking as any).total ?? 0;

  return createEntry(
    {
      type,
      amount,
      bookingId,
      clientId: booking.clientId ?? undefined,
      modelId: booking.modelId ?? undefined,
      rootCause: `Booking ${booking.status}`,
      responsibleRole,
      detectionSource: 'booking_rule',
    },
    'system'
  );
}

// ─── detectFromPayment ───────────────────────────────────

export async function detectFromPayment(paymentId: string) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { booking: true },
  });
  if (!payment) throw new Error(`Payment ${paymentId} not found`);

  // Avoid duplicate
  const existing = await prisma.lostRevenueEntry.findFirst({
    where: {
      type: 'payment_failed',
      detectionSource: 'payment_webhook',
      bookingId: payment.bookingId ?? undefined,
    },
  });
  if (existing) return existing;

  return createEntry(
    {
      type: 'payment_failed',
      amount: (payment as any).amount ?? 0,
      currency: (payment as any).currency ?? 'GBP',
      bookingId: payment.bookingId ?? undefined,
      clientId: payment.booking?.clientId ?? undefined,
      modelId: payment.booking?.modelId ?? undefined,
      rootCause: `Payment ${paymentId} failed`,
      responsibleRole: 'system',
      detectionSource: 'payment_webhook',
    },
    'system'
  );
}

// ─── resolveEntry ────────────────────────────────────────

export async function resolveEntry(id: string, actorId: string, reasonCode: string) {
  const entry = await prisma.lostRevenueEntry.findUnique({ where: { id } });
  if (!entry) throw new Error(`LostRevenueEntry ${id} not found`);

  const updated = await prisma.lostRevenueEntry.update({
    where: { id },
    data: {
      status: 'resolved',
      resolvedAt: new Date(),
      resolvedBy: actorId,
      notes: entry.notes
        ? `${entry.notes}\n[Resolved] ${reasonCode}`
        : `[Resolved] ${reasonCode}`,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorType: 'user',
      actorUserId: actorId,
      action: 'lost_revenue.resolved',
      entityType: 'lost_revenue_entry',
      entityId: id,
      before: { status: 'open' },
      after: { status: 'resolved', reasonCode },
    },
  });

  return updated;
}

// ─── waiveEntry ──────────────────────────────────────────

export async function waiveEntry(id: string, actorId: string, reasonCode: string) {
  const entry = await prisma.lostRevenueEntry.findUnique({ where: { id } });
  if (!entry) throw new Error(`LostRevenueEntry ${id} not found`);

  const updated = await prisma.lostRevenueEntry.update({
    where: { id },
    data: {
      status: 'waived',
      resolvedAt: new Date(),
      resolvedBy: actorId,
      notes: entry.notes
        ? `${entry.notes}\n[Waived] ${reasonCode}`
        : `[Waived] ${reasonCode}`,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorType: 'user',
      actorUserId: actorId,
      action: 'lost_revenue.waived',
      entityType: 'lost_revenue_entry',
      entityId: id,
      before: { status: entry.status },
      after: { status: 'waived', reasonCode },
    },
  });

  return updated;
}

// ─── getSummary ──────────────────────────────────────────

export async function getSummary() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const entries = await prisma.lostRevenueEntry.findMany({
    where: {
      createdAt: { gte: startOfMonth },
    },
  });

  // Aggregate by type
  const byType: Record<string, { count: number; total: number }> = {};
  const byRole: Record<string, { count: number; total: number }> = {};
  let grandTotal = 0;

  for (const e of entries) {
    // By type
    if (!byType[e.type]) byType[e.type] = { count: 0, total: 0 };
    byType[e.type].count++;
    byType[e.type].total += e.amount;

    // By responsible role
    if (!byRole[e.responsibleRole]) byRole[e.responsibleRole] = { count: 0, total: 0 };
    byRole[e.responsibleRole].count++;
    byRole[e.responsibleRole].total += e.amount;

    grandTotal += e.amount;
  }

  return {
    period: { from: startOfMonth.toISOString(), to: now.toISOString() },
    totalEntries: entries.length,
    grandTotal,
    byType,
    byRole,
  };
}

// ─── runAutoDetection (cron entry point) ─────────────────
// Scans recent cancelled/no-show bookings and failed payments
export async function runAutoDetection(lookbackHours = 1) {
  const since = new Date(Date.now() - lookbackHours * 60 * 60 * 1000);

  // Detect from recent cancelled/no-show bookings
  const bookings = await prisma.booking.findMany({
    where: {
      status: { in: ['cancelled', 'no_show'] },
      updatedAt: { gte: since },
    },
    select: { id: true },
  });

  let bookingEntries = 0;
  for (const b of bookings) {
    const result = await detectFromBooking(b.id);
    if (result) bookingEntries++;
  }

  // Detect from recent failed payments
  const payments = await prisma.payment.findMany({
    where: {
      status: 'failed',
      updatedAt: { gte: since },
    },
    select: { id: true },
  });

  let paymentEntries = 0;
  for (const p of payments) {
    const result = await detectFromPayment(p.id);
    if (result) paymentEntries++;
  }

  return { bookingEntries, paymentEntries, totalDetected: bookingEntries + paymentEntries };
}
