// STAFF ANALYTICS SERVICE
// Build performance & score snapshots, leaderboard, manual adjustments

import { prisma } from '@/lib/db/client';

// ── Build Performance Snapshot ──────────────────────────────
export async function buildPerformanceSnapshot(
  userId: string,
  periodStart: Date,
  periodEnd: Date,
) {
  // Check for existing snapshot (idempotent)
  const existing = await prisma.staffPerformanceSnapshot.findUnique({
    where: { userId_periodStart_periodEnd: { userId, periodStart, periodEnd } },
  });
  if (existing) return existing;

  // Count bookings completed
  const bookingsCompleted = await prisma.booking.count({
    where: {
      assignedToId: userId,
      status: 'completed',
      updatedAt: { gte: periodStart, lte: periodEnd },
    },
  });

  // Count bookings cancelled
  const bookingsCancelled = await prisma.booking.count({
    where: {
      assignedToId: userId,
      status: 'cancelled',
      updatedAt: { gte: periodStart, lte: periodEnd },
    },
  });

  // Count inquiries handled (assigned to user in period)
  const inquiriesHandled = await prisma.inquiry.count({
    where: {
      assignedToId: userId,
      createdAt: { gte: periodStart, lte: periodEnd },
    },
  });

  // Count inquiries converted
  const inquiriesConverted = await prisma.inquiry.count({
    where: {
      assignedToId: userId,
      status: 'converted',
      updatedAt: { gte: periodStart, lte: periodEnd },
    },
  });

  // Conversion rate
  const conversionRate = inquiriesHandled > 0
    ? Number(((inquiriesConverted / inquiriesHandled) * 100).toFixed(2))
    : 0;

  // Revenue generated (sum of completed bookings)
  const revenueAgg = await prisma.booking.aggregate({
    where: {
      assignedToId: userId,
      status: 'completed',
      updatedAt: { gte: periodStart, lte: periodEnd },
    },
    _sum: { priceTotal: true },
  });
  const revenueGenerated = revenueAgg._sum.priceTotal || 0;

  // Lost revenue (cancelled bookings)
  const lostAgg = await prisma.booking.aggregate({
    where: {
      assignedToId: userId,
      status: 'cancelled',
      updatedAt: { gte: periodStart, lte: periodEnd },
    },
    _sum: { priceTotal: true },
  });
  const lostRevenueAmount = lostAgg._sum.priceTotal || 0;

  // Cancellation rate
  const totalBookings = bookingsCompleted + bookingsCancelled;
  const cancellationRate = totalBookings > 0
    ? Number(((bookingsCancelled / totalBookings) * 100).toFixed(2))
    : 0;

  // Complaints count (from audit log or incidents)
  const complaintsCount = await prisma.auditLog.count({
    where: {
      entityType: 'complaint',
      performedBy: userId,
      createdAt: { gte: periodStart, lte: periodEnd },
    },
  });

  // Retention actions completed
  const retentionActionsCompleted = await prisma.retentionAction.count({
    where: {
      ownerUserId: userId,
      status: 'completed',
      completedAt: { gte: periodStart, lte: periodEnd },
    },
  });

  const snapshot = await prisma.staffPerformanceSnapshot.create({
    data: {
      userId,
      periodStart,
      periodEnd,
      bookingsCompleted,
      bookingsCancelled,
      inquiriesHandled,
      inquiriesConverted,
      conversionRate,
      revenueGenerated,
      lostRevenueAmount,
      cancellationRate,
      complaintsCount,
      retentionActionsCompleted,
    },
  });

  return snapshot;
}

// ── Build Score Snapshot ─────────────────────────────────────
export async function buildScoreSnapshot(
  userId: string,
  periodStart: Date,
  periodEnd: Date,
) {
  // Check for existing score snapshot
  const existing = await prisma.staffScoreSnapshot.findUnique({
    where: { userId_periodStart_periodEnd: { userId, periodStart, periodEnd } },
  });
  if (existing) return existing;

  // Get or build performance snapshot first
  let perf = await prisma.staffPerformanceSnapshot.findUnique({
    where: { userId_periodStart_periodEnd: { userId, periodStart, periodEnd } },
  });
  if (!perf) {
    perf = await buildPerformanceSnapshot(userId, periodStart, periodEnd);
  }

  // Get active score rules
  const rules = await prisma.staffScoreRule.findMany({
    where: { isActive: true },
  });

  // Build breakdown: normalize metrics to 0-100 scale, then apply weights
  const metricValues: Record<string, number> = {
    conversionRate: perf.conversionRate,
    bookingsCompleted: Math.min(perf.bookingsCompleted * 5, 100), // 20 bookings = 100
    lostRevenueAmount: Math.max(0, 100 - Number(perf.lostRevenueAmount) / 100), // inverse: less = better
    cancellationRate: Math.max(0, 100 - perf.cancellationRate), // inverse: less = better
    complaintsCount: Math.max(0, 100 - perf.complaintsCount * 20), // each complaint -20
    retentionActionsCompleted: Math.min(perf.retentionActionsCompleted * 10, 100), // 10 actions = 100
  };

  const breakdown: Record<string, { raw: number; weight: number; weighted: number }> = {};
  let totalScore = 0;

  for (const rule of rules) {
    const raw = metricValues[rule.metricKey] ?? 0;
    const weighted = Number(((raw * rule.weight) / 100).toFixed(2));
    breakdown[rule.metricKey] = { raw: Number(raw.toFixed(2)), weight: rule.weight, weighted };
    totalScore += weighted;
  }

  totalScore = Number(totalScore.toFixed(2));

  const scoreSnapshot = await prisma.staffScoreSnapshot.create({
    data: {
      userId,
      periodStart,
      periodEnd,
      totalScore,
      breakdown,
    },
  });

  return scoreSnapshot;
}

// ── Get Leaderboard ─────────────────────────────────────────
export async function getLeaderboard(
  periodStart: Date,
  periodEnd: Date,
  limit = 20,
) {
  const scores = await prisma.staffScoreSnapshot.findMany({
    where: { periodStart, periodEnd },
    orderBy: { totalScore: 'desc' },
    take: limit,
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });

  return scores.map((s, idx) => ({
    rank: idx + 1,
    userId: s.userId,
    userName: s.user.name,
    userEmail: s.user.email,
    totalScore: s.totalScore,
    breakdown: s.breakdown,
    manualAdjust: s.manualAdjust,
    adjustReason: s.adjustReason,
    snapshotId: s.id,
  }));
}

// ── Adjust Score ────────────────────────────────────────────
export async function adjustScore(
  snapshotId: string,
  adjustment: number,
  reason: string,
  adjustedBy: string,
) {
  const snapshot = await prisma.staffScoreSnapshot.findUnique({
    where: { id: snapshotId },
  });
  if (!snapshot) throw new Error('Score snapshot not found');

  const updated = await prisma.staffScoreSnapshot.update({
    where: { id: snapshotId },
    data: {
      manualAdjust: adjustment,
      adjustReason: reason,
      adjustedBy,
      totalScore: Number((snapshot.totalScore + adjustment - snapshot.manualAdjust).toFixed(2)),
    },
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      entityType: 'staff_score',
      entityId: snapshotId,
      action: 'staff_score.adjusted',
      performedBy: adjustedBy,
      newValue: { adjustment, reason, newTotal: updated.totalScore },
    },
  });

  return updated;
}
