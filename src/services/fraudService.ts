// FRAUD SERVICE
// Signal creation, risk recalculation, status management, review

import { prisma } from '@/lib/db/client';

// ── Create Signal ───────────────────────────────────────────
export async function createSignal(
  params: {
    clientId: string;
    signalType: string;
    riskScoreImpact: number;
    bookingId?: string;
    modelId?: string;
    sourceModule?: string;
    ipAddress?: string;
    deviceFingerprint?: string;
    geoCountry?: string;
    geoCity?: string;
    cardFingerprint?: string;
    velocity1h?: number;
    velocity24h?: number;
    cancellationRateSnapshot?: number;
    refundRateSnapshot?: number;
    metadata?: any;
  },
  actorId: string,
) {
  const signal = await prisma.fraudSignal.create({
    data: {
      clientId: params.clientId,
      signalType: params.signalType,
      riskScoreImpact: params.riskScoreImpact,
      bookingId: params.bookingId,
      modelId: params.modelId,
      sourceModule: params.sourceModule,
      ipAddress: params.ipAddress,
      deviceFingerprint: params.deviceFingerprint,
      geoCountry: params.geoCountry,
      geoCity: params.geoCity,
      cardFingerprint: params.cardFingerprint,
      velocity1h: params.velocity1h,
      velocity24h: params.velocity24h,
      cancellationRateSnapshot: params.cancellationRateSnapshot,
      refundRateSnapshot: params.refundRateSnapshot,
      metadata: params.metadata,
    },
  });

  await prisma.auditLog.create({
    data: {
      entityType: 'fraud_signal',
      entityId: signal.id,
      action: 'fraud.signal.created',
      performedBy: actorId,
      newValue: { signalType: params.signalType, riskScoreImpact: params.riskScoreImpact, clientId: params.clientId },
    },
  });

  // Recalculate risk after signal
  await recalculateClientRisk(params.clientId);

  return signal;
}

// ── Recalculate Client Risk ─────────────────────────────────
export async function recalculateClientRisk(clientId: string) {
  // Aggregate confirmed signals
  const agg = await prisma.fraudSignal.aggregate({
    where: { clientId, status: 'confirmed' },
    _sum: { riskScoreImpact: true },
    _count: true,
  });

  const totalRisk = agg._sum.riskScoreImpact || 0;
  const signalCount = agg._count;

  // Determine new risk status based on thresholds
  let newStatus = 'normal';
  if (totalRisk >= 100 || signalCount >= 10) {
    newStatus = 'blocked';
  } else if (totalRisk >= 50 || signalCount >= 5) {
    newStatus = 'restricted';
  } else if (totalRisk >= 20 || signalCount >= 2) {
    newStatus = 'monitoring';
  }

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { riskStatus: true },
  });

  if (client && client.riskStatus !== newStatus) {
    await prisma.client.update({
      where: { id: clientId },
      data: { riskStatus: newStatus },
    });
  }

  return { totalRisk, signalCount, newStatus };
}

// ── Change Client Risk Status (manual) ──────────────────────
export async function changeClientRiskStatus(
  clientId: string,
  nextStatus: string,
  actorId: string,
  reasonCode: string,
) {
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { riskStatus: true },
  });
  if (!client) throw new Error('Client not found');

  const previousStatus = client.riskStatus;

  await prisma.$transaction(async (tx) => {
    await tx.client.update({
      where: { id: clientId },
      data: { riskStatus: nextStatus },
    });

    await tx.clientRiskHistory.create({
      data: {
        clientId,
        previousStatus,
        newStatus: nextStatus,
        changedBy: actorId,
        reasonCode,
      },
    });

    await tx.auditLog.create({
      data: {
        entityType: 'client',
        entityId: clientId,
        action: 'fraud.risk_status.changed',
        performedBy: actorId,
        oldValue: { riskStatus: previousStatus },
        newValue: { riskStatus: nextStatus, reasonCode },
      },
    });
  });

  return { clientId, previousStatus, newStatus: nextStatus };
}

// ── Review Signal ───────────────────────────────────────────
export async function reviewSignal(
  signalId: string,
  status: 'confirmed' | 'dismissed',
  actorId: string,
) {
  const signal = await prisma.fraudSignal.findUnique({ where: { id: signalId } });
  if (!signal) throw new Error('Fraud signal not found');

  const updated = await prisma.fraudSignal.update({
    where: { id: signalId },
    data: {
      status,
      reviewedBy: actorId,
      reviewedAt: new Date(),
    },
  });

  await prisma.auditLog.create({
    data: {
      entityType: 'fraud_signal',
      entityId: signalId,
      action: 'fraud.signal.reviewed',
      performedBy: actorId,
      oldValue: { status: signal.status },
      newValue: { status, reviewedBy: actorId },
    },
  });

  // Recalculate risk after review
  if (status === 'confirmed') {
    await recalculateClientRisk(signal.clientId);
  }

  return updated;
}
