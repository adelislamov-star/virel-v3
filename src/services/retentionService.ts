// RetentionService — retention profile management, actions, scans
import { prisma } from '@/lib/db/client';
import { enqueue } from '@/services/jobService';
import { recordClientEvent } from '@/services/clientEventService';
import { Decimal } from '@prisma/client/runtime/library';

// ── Segment calculation rules ───────────────────────────────
function computeSegment(
  totalBookings: number,
  totalSpent: Decimal,
  daysSinceLastBooking: number,
): { segment: string; segmentReason: string } {
  const spent = Number(totalSpent);

  if (spent > 15000) {
    return { segment: 'whale', segmentReason: `totalSpent=${spent} > 15000` };
  }
  if (spent > 5000 && daysSinceLastBooking < 30) {
    return { segment: 'vip', segmentReason: `totalSpent=${spent} > 5000 and active (${daysSinceLastBooking}d)` };
  }
  if (totalBookings === 0) {
    return { segment: 'new', segmentReason: 'No bookings' };
  }
  if (daysSinceLastBooking < 30) {
    return { segment: 'active', segmentReason: `lastBooking ${daysSinceLastBooking}d ago (<30)` };
  }
  if (daysSinceLastBooking < 60) {
    return { segment: 'cooling', segmentReason: `lastBooking ${daysSinceLastBooking}d ago (30-60)` };
  }
  if (daysSinceLastBooking < 90) {
    return { segment: 'at_risk', segmentReason: `lastBooking ${daysSinceLastBooking}d ago (60-90)` };
  }
  return { segment: 'lost', segmentReason: `lastBooking ${daysSinceLastBooking}d ago (>90)` };
}

function computeNextBestAction(segment: string): string | null {
  switch (segment) {
    case 'cooling': return 'follow_up';
    case 'at_risk': return 'win_back_offer';
    case 'lost': return 'win_back_offer';
    case 'vip': return 'vip_checkin';
    case 'whale': return 'vip_checkin';
    default: return null;
  }
}

function computeChurnRisk(segment: string, daysSinceLastBooking: number, totalBookings: number): { score: number; factors: string[] } {
  const factors: string[] = [];
  let score = 0;

  if (daysSinceLastBooking > 90) { score += 40; factors.push('inactive >90 days'); }
  else if (daysSinceLastBooking > 60) { score += 25; factors.push('inactive 60-90 days'); }
  else if (daysSinceLastBooking > 30) { score += 10; factors.push('inactive 30-60 days'); }

  if (totalBookings <= 1) { score += 20; factors.push('single booking only'); }
  if (totalBookings >= 5 && daysSinceLastBooking > 30) { score += 15; factors.push('repeat client going cold'); }

  return { score: Math.min(score, 100), factors };
}

// ── rebuildRetentionProfile ─────────────────────────────────
export async function rebuildRetentionProfile(clientId: string) {
  // Aggregate bookings
  const bookingAgg = await prisma.booking.aggregate({
    where: { clientId, deletedAt: null, status: { in: ['completed', 'confirmed', 'in_progress'] } },
    _count: { id: true },
    _sum: { priceTotal: true },
    _max: { endAt: true },
  });

  const totalBookings = bookingAgg._count.id;
  const totalSpent = bookingAgg._sum.priceTotal ?? new Decimal(0);
  const lastBookingAt = bookingAgg._max.endAt;
  const daysSinceLastBooking = lastBookingAt
    ? Math.floor((Date.now() - new Date(lastBookingAt).getTime()) / (1000 * 60 * 60 * 24))
    : 9999;
  const avgBookingValue = totalBookings > 0
    ? new Decimal(Number(totalSpent) / totalBookings)
    : new Decimal(0);

  const { segment, segmentReason } = computeSegment(totalBookings, totalSpent, daysSinceLastBooking);
  const nextBestActionType = computeNextBestAction(segment);
  const { score: churnRiskScore, factors } = computeChurnRisk(segment, daysSinceLastBooking, totalBookings);

  const profile = await prisma.clientRetentionProfile.upsert({
    where: { clientId },
    create: {
      clientId,
      lastBookingAt,
      daysSinceLastBooking: daysSinceLastBooking === 9999 ? 0 : daysSinceLastBooking,
      totalBookings,
      totalSpent,
      avgBookingValue,
      segment,
      segmentReason,
      churnRiskScore,
      churnRiskFactorsJson: factors,
      nextBestActionType,
    },
    update: {
      lastBookingAt,
      daysSinceLastBooking: daysSinceLastBooking === 9999 ? 0 : daysSinceLastBooking,
      totalBookings,
      totalSpent,
      avgBookingValue,
      segment,
      segmentReason,
      churnRiskScore,
      churnRiskFactorsJson: factors,
      nextBestActionType,
    },
  });

  return profile;
}

// ── runDailyRetentionScan ───────────────────────────────────
export async function runDailyRetentionScan() {
  // Get all clients with at_risk or lost profiles
  const atRiskProfiles = await prisma.clientRetentionProfile.findMany({
    where: { segment: { in: ['at_risk', 'lost'] } },
  });

  let actionsCreated = 0;

  for (const profile of atRiskProfiles) {
    const actionType = profile.segment === 'at_risk' ? 'inactivity_alert' : 'win_back_offer';

    // Check if there's already an active action of same type
    const existing = await prisma.retentionAction.findFirst({
      where: {
        clientId: profile.clientId,
        actionType,
        status: { in: ['planned', 'sent'] },
      },
    });

    if (!existing) {
      await prisma.retentionAction.create({
        data: {
          clientId: profile.clientId,
          retentionProfileId: profile.id,
          actionType,
          channel: 'email',
          scheduledAt: new Date(),
        },
      });
      actionsCreated++;
    }
  }

  return { profilesScanned: atRiskProfiles.length, actionsCreated };
}

// ── createRetentionAction ───────────────────────────────────
export async function createRetentionAction(
  params: {
    clientId: string;
    retentionProfileId?: string;
    ownerUserId?: string;
    actionType: string;
    channel: string;
    scheduledAt: Date;
    metadataJson?: any;
  },
  actorId: string,
) {
  const action = await prisma.retentionAction.create({
    data: {
      clientId: params.clientId,
      retentionProfileId: params.retentionProfileId ?? null,
      ownerUserId: params.ownerUserId ?? null,
      actionType: params.actionType,
      channel: params.channel,
      scheduledAt: params.scheduledAt,
      metadataJson: params.metadataJson ?? null,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorType: 'user',
      actorUserId: actorId,
      action: 'retention.action.created',
      entityType: 'retention_action',
      entityId: action.id,
      after: { actionType: params.actionType, channel: params.channel, clientId: params.clientId },
    },
  });

  await recordClientEvent(params.clientId, 'retention.action.created', {
    actionId: action.id,
    actionType: params.actionType,
    channel: params.channel,
  }, actorId);

  return action;
}

// ── completeRetentionAction ─────────────────────────────────
export async function completeRetentionAction(id: string, result: string, actorId: string) {
  const existing = await prisma.retentionAction.findUnique({ where: { id } });
  if (!existing) throw new Error('RetentionAction not found');

  const action = await prisma.retentionAction.update({
    where: { id },
    data: { status: 'completed', result, completedAt: new Date() },
  });

  await prisma.auditLog.create({
    data: {
      actorType: 'user',
      actorUserId: actorId,
      action: 'retention.action.completed',
      entityType: 'retention_action',
      entityId: id,
      before: { status: existing.status },
      after: { status: 'completed', result },
    },
  });

  return action;
}

// ── cancelRetentionAction ───────────────────────────────────
export async function cancelRetentionAction(id: string, actorId: string) {
  const existing = await prisma.retentionAction.findUnique({ where: { id } });
  if (!existing) throw new Error('RetentionAction not found');

  const action = await prisma.retentionAction.update({
    where: { id },
    data: { status: 'cancelled' },
  });

  await prisma.auditLog.create({
    data: {
      actorType: 'user',
      actorUserId: actorId,
      action: 'retention.action.cancelled',
      entityType: 'retention_action',
      entityId: id,
      before: { status: existing.status },
      after: { status: 'cancelled' },
    },
  });

  return action;
}
