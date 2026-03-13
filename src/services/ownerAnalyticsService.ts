// OWNER ANALYTICS SERVICE
// Aggregates all business metrics into snapshots for owner dashboard

import { prisma } from '@/lib/db/client';
import { Decimal } from '@prisma/client/runtime/library';

// ── buildSnapshot ─────────────────────────────────────────────
export async function buildSnapshot(
  periodStart: Date,
  periodEnd: Date,
  granularity: string = 'daily',
) {
  const periodFilter = { gte: periodStart, lte: periodEnd };

  // ── Revenue ─────────────────────────────────────────
  const revenueAgg = await prisma.payment.aggregate({
    where: { status: 'succeeded', createdAt: periodFilter },
    _sum: { amount: true },
  });
  const totalRevenue = Number(revenueAgg._sum.amount ?? 0);

  // ── Bookings ────────────────────────────────────────
  const totalBookings = await prisma.booking.count({
    where: { createdAt: periodFilter, deletedAt: null },
  });
  const completedBookings = await prisma.booking.count({
    where: { createdAt: periodFilter, status: 'completed', deletedAt: null },
  });
  const cancelledBookings = await prisma.booking.count({
    where: { createdAt: periodFilter, status: 'cancelled', deletedAt: null },
  });
  const conversionRate = totalBookings > 0
    ? (completedBookings / totalBookings) * 100
    : 0;

  // ── ARPU ────────────────────────────────────────────
  const uniqueClientsRaw = await prisma.booking.findMany({
    where: { createdAt: periodFilter, deletedAt: null },
    select: { clientId: true },
    distinct: ['clientId'],
  });
  const uniqueClientCount = uniqueClientsRaw.filter((b) => b.clientId).length;
  const arpu = uniqueClientCount > 0 ? totalRevenue / uniqueClientCount : 0;

  // ── MRR ─────────────────────────────────────────────
  const activeMemberships = await prisma.clientMembership.findMany({
    where: { status: 'active' },
    include: { plan: { select: { priceMonthly: true } } },
  });
  const mrr = activeMemberships.reduce((s, m) => s + Number(m.plan.priceMonthly), 0);

  // ── Net Margin (estimate: 20% commission model) ────
  const netMargin = totalRevenue > 0 ? 20 : 0;

  // ── Churn Rate ──────────────────────────────────────
  const lostClients = await prisma.clientRetentionProfile.count({
    where: { segment: 'lost', updatedAt: periodFilter },
  });
  const totalActiveClients = await prisma.clientRetentionProfile.count({
    where: { segment: { in: ['active', 'vip', 'whale', 'cooling'] } },
  });
  const churnRate = totalActiveClients > 0
    ? (lostClients / (totalActiveClients + lostClients)) * 100
    : 0;

  // ── Chargeback Rate ─────────────────────────────────
  const disputedPayments = await prisma.payment.count({
    where: { createdAt: periodFilter, status: 'disputed' },
  });
  const totalPayments = await prisma.payment.count({
    where: { createdAt: periodFilter },
  });
  const chargebackRate = totalPayments > 0
    ? (disputedPayments / totalPayments) * 100
    : 0;

  // ── Lost Revenue ────────────────────────────────────
  const lostRevenueAgg = await prisma.lostRevenueEntry.aggregate({
    where: { createdAt: periodFilter },
    _sum: { amount: true },
  });
  const lostRevenueAmount = Number(lostRevenueAgg._sum.amount ?? 0);

  const lostByType = await prisma.lostRevenueEntry.groupBy({
    by: ['type'],
    where: { createdAt: periodFilter },
    _sum: { amount: true },
    _count: { id: true },
  });
  const lostRevenueByRootCauseJson = lostByType.map((g) => ({
    type: g.type,
    amount: Number(g._sum.amount ?? 0),
    count: g._count.id,
  }));

  // ── Alternative Offer Acceptance ────────────────────
  const altShown = await prisma.alternativeOffer.count({
    where: { createdAt: periodFilter, status: { in: ['shown', 'accepted', 'rejected'] } },
  });
  const altAccepted = await prisma.alternativeOffer.count({
    where: { createdAt: periodFilter, status: 'accepted' },
  });
  const altOfferAcceptanceRate = altShown > 0
    ? (altAccepted / altShown) * 100
    : 0;

  // ── Retention Recovery Rate ─────────────────────────
  const completedRetActions = await prisma.retentionAction.count({
    where: { status: 'completed', completedAt: periodFilter },
  });
  const recoveredRetActions = await prisma.retentionAction.count({
    where: {
      status: 'completed',
      completedAt: periodFilter,
      convertedBookingId: { not: null },
    },
  });
  const retentionRecoveryRate = completedRetActions > 0
    ? (recoveredRetActions / completedRetActions) * 100
    : 0;

  // ── Client Duplicate Rate ───────────────────────────
  const mergeLogs = await prisma.clientMergeLog.count({
    where: { createdAt: periodFilter },
  });
  const totalClients = await prisma.client.count({ where: { deletedAt: null } });
  const clientDuplicateRate = totalClients > 0
    ? (mergeLogs / totalClients) * 100
    : 0;

  // ── Jobs Failed Rate ────────────────────────────────
  const totalJobs = await prisma.jobQueue.count({
    where: { createdAt: periodFilter },
  });
  const failedJobs = await prisma.jobQueue.count({
    where: { createdAt: periodFilter, status: { in: ['failed', 'dead_letter'] } },
  });
  const jobsFailedRate = totalJobs > 0
    ? (failedJobs / totalJobs) * 100
    : 0;

  // ── Notification Delivery Rate ──────────────────────
  const totalNotifs = await prisma.notification.count({
    where: { createdAt: periodFilter },
  });
  const sentNotifs = await prisma.notification.count({
    where: { createdAt: periodFilter, status: 'sent' },
  });
  const notificationDeliveryRate = totalNotifs > 0
    ? (sentNotifs / totalNotifs) * 100
    : 0;

  // ── Availability Conflicts ──────────────────────────
  const availabilityConflictCount = await prisma.availabilityConflict.count({
    where: { createdAt: periodFilter },
  });

  // ── Membership Benefit Cost ─────────────────────────
  const benefitAgg = await prisma.membershipBenefitUsage.aggregate({
    where: { createdAt: periodFilter, status: 'used' },
    _sum: { valueAmount: true },
  });
  const membershipBenefitCost = Number(benefitAgg._sum.valueAmount ?? 0);

  // ── Risk Escalations ───────────────────────────────
  const riskEscalationsCount = await prisma.clientRiskHistory.count({
    where: {
      createdAt: periodFilter,
      newStatus: { in: ['monitoring', 'restricted', 'blocked'] },
    },
  });

  // ── VIP Revenue Share ───────────────────────────────
  // VIP revenue: get VIP client IDs, then sum their bookings
  const vipClients = await prisma.client.findMany({
    where: { vipStatus: { not: null }, deletedAt: null },
    select: { id: true },
  });
  const vipClientIds = vipClients.map((c) => c.id);
  const vipRevenueAgg = vipClientIds.length > 0
    ? await prisma.booking.aggregate({
        where: {
          createdAt: periodFilter,
          status: 'completed',
          deletedAt: null,
          clientId: { in: vipClientIds },
        },
        _sum: { priceTotal: true },
      })
    : { _sum: { priceTotal: null } };
  const vipRevenue = Number(vipRevenueAgg._sum.priceTotal ?? 0);
  const vipRevenueShare = totalRevenue > 0
    ? (vipRevenue / totalRevenue) * 100
    : 0;

  // ── Win-back Conversion Rate ────────────────────────
  const winbackTotal = await prisma.retentionAction.count({
    where: { actionType: 'win_back_offer', createdAt: periodFilter },
  });
  const winbackCompleted = await prisma.retentionAction.count({
    where: { actionType: 'win_back_offer', status: 'completed', createdAt: periodFilter },
  });
  const winbackConversionRate = winbackTotal > 0
    ? (winbackCompleted / winbackTotal) * 100
    : 0;

  // ── Staff Rankings ──────────────────────────────────
  const staffConversionRanking = await prisma.staffPerformanceSnapshot.findMany({
    where: { periodStart: { gte: periodStart }, periodEnd: { lte: periodEnd } },
    orderBy: { conversionRate: 'desc' },
    take: 5,
    include: { user: { select: { id: true, name: true } } },
  });
  const staffConversionRankingJson = staffConversionRanking.map((s, i) => ({
    rank: i + 1,
    userId: s.userId,
    name: s.user.name,
    conversionRate: s.conversionRate,
  }));

  const staffLostRevenueRanking = await prisma.staffPerformanceSnapshot.findMany({
    where: { periodStart: { gte: periodStart }, periodEnd: { lte: periodEnd } },
    orderBy: { lostRevenueAmount: 'desc' },
    take: 5,
    include: { user: { select: { id: true, name: true } } },
  });
  const staffLostRevenueRankingJson = staffLostRevenueRanking.map((s, i) => ({
    rank: i + 1,
    userId: s.userId,
    name: s.user.name,
    lostRevenueAmount: Number(s.lostRevenueAmount),
  }));

  // ── Upsert Snapshot ─────────────────────────────────
  // Find existing by period + granularity
  const existing = await prisma.ownerAnalyticsSnapshot.findFirst({
    where: { periodStart, periodEnd, granularity },
  });

  const snapshotData = {
    periodStart,
    periodEnd,
    granularity,
    totalRevenue: new Decimal(totalRevenue),
    netMargin: new Decimal(netMargin),
    totalBookings,
    completedBookings,
    cancelledBookings,
    conversionRate: new Decimal(r2(conversionRate)),
    arpu: new Decimal(r2(arpu)),
    mrr: new Decimal(r2(mrr)),
    churnRate: new Decimal(r2(churnRate)),
    chargebackRate: new Decimal(r2(chargebackRate)),
    lostRevenueAmount: new Decimal(r2(lostRevenueAmount)),
    lostRevenueByRootCauseJson,
    altOfferAcceptanceRate: new Decimal(r2(altOfferAcceptanceRate)),
    retentionRecoveryRate: new Decimal(r2(retentionRecoveryRate)),
    clientDuplicateRate: new Decimal(r2(clientDuplicateRate)),
    jobsFailedRate: new Decimal(r2(jobsFailedRate)),
    notificationDeliveryRate: new Decimal(r2(notificationDeliveryRate)),
    availabilityConflictCount,
    membershipBenefitCost: new Decimal(r2(membershipBenefitCost)),
    riskEscalationsCount,
    vipRevenueShare: new Decimal(r2(vipRevenueShare)),
    winbackConversionRate: new Decimal(r2(winbackConversionRate)),
    staffConversionRankingJson,
    staffLostRevenueRankingJson,
  };

  if (existing) {
    return prisma.ownerAnalyticsSnapshot.update({
      where: { id: existing.id },
      data: snapshotData,
    });
  }

  return prisma.ownerAnalyticsSnapshot.create({
    data: snapshotData,
  });
}

// ── getSnapshot ───────────────────────────────────────────────
export async function getSnapshot(periodStart: Date, periodEnd: Date) {
  return prisma.ownerAnalyticsSnapshot.findFirst({
    where: { periodStart, periodEnd },
    orderBy: { createdAt: 'desc' },
  });
}

// ── getTimeSeries ─────────────────────────────────────────────
export async function getTimeSeries(
  metric: string,
  granularity: string,
  dateFrom: Date,
  dateTo: Date,
) {
  const snapshots = await prisma.ownerAnalyticsSnapshot.findMany({
    where: {
      granularity,
      periodStart: { gte: dateFrom },
      periodEnd: { lte: dateTo },
    },
    orderBy: { periodStart: 'asc' },
  });

  return snapshots.map((s) => ({
    periodStart: s.periodStart,
    value: Number((s as any)[metric] ?? 0),
  }));
}

// ── Helper ────────────────────────────────────────────────────
function r2(n: number): number {
  return Math.round(n * 100) / 100;
}
