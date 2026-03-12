// AlternativeOfferService — generate, track, convert alternative model offers
import { prisma } from '@/lib/db/client';
import { randomUUID } from 'crypto';

// ── generateAlternatives ────────────────────────────────────
export async function generateAlternatives(context: {
  inquiryId?: string;
  bookingId?: string;
  requestedModelId: string;
  reason: string;
  limit?: number;
}) {
  const maxOffers = context.limit ?? 5;
  const offerSetId = randomUUID();

  // Find similar models sorted by score DESC
  const similarities = await prisma.modelSimilarity.findMany({
    where: {
      OR: [
        { modelAId: context.requestedModelId },
        { modelBId: context.requestedModelId },
      ],
    },
    orderBy: { similarityScore: 'desc' },
    take: maxOffers,
    include: {
      modelA: { select: { id: true, name: true, deletedAt: true } },
      modelB: { select: { id: true, name: true, deletedAt: true } },
    },
  });

  const offers = [];
  let rank = 1;

  for (const sim of similarities) {
    // Determine which model is the alternative (the one that isn't requested)
    const offeredModelId = sim.modelAId === context.requestedModelId
      ? sim.modelBId
      : sim.modelAId;

    const offeredModel = sim.modelAId === context.requestedModelId ? sim.modelB : sim.modelA;

    // Skip deleted models
    if (offeredModel.deletedAt) continue;

    const offer = await prisma.alternativeOffer.create({
      data: {
        offerSetId,
        inquiryId: context.inquiryId ?? null,
        bookingId: context.bookingId ?? null,
        requestedModelId: context.requestedModelId,
        offeredModelId,
        generationReason: context.reason,
        rank,
        status: 'generated',
      },
      include: {
        offeredModel: { select: { id: true, name: true } },
      },
    });

    offers.push({ ...offer, similarityScore: sim.similarityScore });
    rank++;
  }

  return { offerSetId, offers };
}

// ── markOfferShown ──────────────────────────────────────────
export async function markOfferShown(
  offerId: string,
  presentedByType: string,
  presentedById: string,
) {
  const offer = await prisma.alternativeOffer.findUnique({ where: { id: offerId } });
  if (!offer) throw new Error('AlternativeOffer not found');

  return prisma.alternativeOffer.update({
    where: { id: offerId },
    data: {
      status: 'shown',
      shownAt: new Date(),
      presentedByType,
      presentedById,
    },
  });
}

// ── markOfferAccepted ───────────────────────────────────────
export async function markOfferAccepted(offerId: string, bookingId?: string) {
  const offer = await prisma.alternativeOffer.findUnique({ where: { id: offerId } });
  if (!offer) throw new Error('AlternativeOffer not found');

  const updated = await prisma.alternativeOffer.update({
    where: { id: offerId },
    data: {
      status: 'accepted',
      acceptedAt: new Date(),
    },
  });

  // Create conversion record
  await prisma.offerConversion.create({
    data: {
      alternativeOfferId: offerId,
      convertedBookingId: bookingId ?? null,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorType: 'system',
      actorUserId: 'system',
      action: 'alternative_offer.accepted',
      entityType: 'alternative_offer',
      entityId: offerId,
      after: {
        offeredModelId: offer.offeredModelId,
        requestedModelId: offer.requestedModelId,
        bookingId: bookingId ?? null,
      },
    },
  });

  return updated;
}

// ── markOfferRejected ───────────────────────────────────────
export async function markOfferRejected(offerId: string) {
  const offer = await prisma.alternativeOffer.findUnique({ where: { id: offerId } });
  if (!offer) throw new Error('AlternativeOffer not found');

  const updated = await prisma.alternativeOffer.update({
    where: { id: offerId },
    data: {
      status: 'rejected',
      rejectedAt: new Date(),
    },
  });

  await prisma.auditLog.create({
    data: {
      actorType: 'system',
      actorUserId: 'system',
      action: 'alternative_offer.rejected',
      entityType: 'alternative_offer',
      entityId: offerId,
      after: {
        offeredModelId: offer.offeredModelId,
        requestedModelId: offer.requestedModelId,
      },
    },
  });

  return updated;
}

// ── expireStaleOffers ───────────────────────────────────────
export async function expireStaleOffers() {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const result = await prisma.alternativeOffer.updateMany({
    where: {
      status: { in: ['generated', 'shown'] },
      createdAt: { lt: cutoff },
    },
    data: { status: 'expired' },
  });

  return { expiredCount: result.count };
}
