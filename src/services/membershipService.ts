// MEMBERSHIP SERVICE
// Benefit application, usage, reversal

import { prisma } from '@/lib/db/client';

// ── Apply Benefit ───────────────────────────────────────────
export async function applyBenefit(
  clientMembershipId: string,
  benefitType: string,
  valueAmount: number,
  actorId: string,
  bookingId?: string,
) {
  const membership = await prisma.clientMembership.findUnique({
    where: { id: clientMembershipId },
  });
  if (!membership) throw new Error('Membership not found');
  if (membership.status !== 'active') throw new Error('Membership is not active');

  const usage = await prisma.membershipBenefitUsage.create({
    data: {
      clientMembershipId,
      benefitType,
      valueAmount,
      bookingId,
      createdBy: actorId,
      status: 'reserved',
    },
  });

  await prisma.auditLog.create({
    data: {
      actorType: 'user',
      actorUserId: actorId,
      entityType: 'membership_benefit',
      entityId: usage.id,
      action: 'membership.benefit.applied',
      after: { benefitType, valueAmount, bookingId, membershipId: clientMembershipId },
    },
  });

  return usage;
}

// ── Use Benefit ─────────────────────────────────────────────
export async function useBenefit(usageId: string, actorId: string) {
  const usage = await prisma.membershipBenefitUsage.findUnique({
    where: { id: usageId },
  });
  if (!usage) throw new Error('Benefit usage not found');
  if (usage.status !== 'reserved') throw new Error(`Cannot use benefit with status: ${usage.status}`);

  const updated = await prisma.membershipBenefitUsage.update({
    where: { id: usageId },
    data: { status: 'used' },
  });

  await prisma.auditLog.create({
    data: {
      actorType: 'user',
      actorUserId: actorId,
      entityType: 'membership_benefit',
      entityId: usageId,
      action: 'membership.benefit.used',
      before: { status: 'reserved' },
      after: { status: 'used' },
    },
  });

  return updated;
}

// ── Reverse Benefit ─────────────────────────────────────────
export async function reverseBenefit(
  usageId: string,
  actorId: string,
  reasonCode: string,
) {
  const usage = await prisma.membershipBenefitUsage.findUnique({
    where: { id: usageId },
  });
  if (!usage) throw new Error('Benefit usage not found');
  if (usage.status === 'reversed') throw new Error('Benefit already reversed');

  const updated = await prisma.membershipBenefitUsage.update({
    where: { id: usageId },
    data: { status: 'reversed' },
  });

  await prisma.auditLog.create({
    data: {
      actorType: 'user',
      actorUserId: actorId,
      entityType: 'membership_benefit',
      entityId: usageId,
      action: 'membership.benefit.reversed',
      before: { status: usage.status },
      after: { status: 'reversed', reasonCode },
    },
  });

  return updated;
}
