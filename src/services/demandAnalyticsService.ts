// DEMAND ANALYTICS SERVICE
// Rebuild demand stats, heatmap data

import { prisma } from '@/lib/db/client';

// ── Rebuild Demand Stats ────────────────────────────────────
export async function rebuildDemandStats(periodStart: Date, periodEnd: Date) {
  // Get all inquiries in period grouped by location
  const inquiries = await prisma.inquiry.findMany({
    where: {
      createdAt: { gte: periodStart, lte: periodEnd },
    },
    select: {
      id: true,
      status: true,
      requestedLocation: { select: { id: true, title: true, city: true, area: true } },
      createdAt: true,
    },
  });

  // Get all bookings in period
  const bookings = await prisma.booking.findMany({
    where: {
      startAt: { gte: periodStart, lte: periodEnd },
    },
    select: {
      id: true,
      locationId: true,
      location: { select: { id: true, city: true, area: true } },
      priceTotal: true,
      startAt: true,
    },
  });

  // Aggregate by city + day slot
  const statsMap = new Map<string, {
    locationId: string | null;
    city: string;
    area: string | null;
    timeSlot: Date;
    requests: number;
    bookings: number;
    totalPrice: number;
  }>();

  for (const inq of inquiries) {
    const city = inq.requestedLocation?.city || 'Unknown';
    const area = inq.requestedLocation?.area || null;
    const locationId = inq.requestedLocation?.id || null;
    const daySlot = new Date(inq.createdAt);
    daySlot.setHours(0, 0, 0, 0);
    const key = `${city}|${daySlot.toISOString()}`;

    if (!statsMap.has(key)) {
      statsMap.set(key, { locationId, city, area, timeSlot: daySlot, requests: 0, bookings: 0, totalPrice: 0 });
    }
    statsMap.get(key)!.requests++;
  }

  for (const bk of bookings) {
    const city = bk.location?.city || 'Unknown';
    const area = bk.location?.area || null;
    const daySlot = new Date(bk.startAt);
    daySlot.setHours(0, 0, 0, 0);
    const key = `${city}|${daySlot.toISOString()}`;

    if (!statsMap.has(key)) {
      statsMap.set(key, { locationId: bk.locationId, city, area, timeSlot: daySlot, requests: 0, bookings: 0, totalPrice: 0 });
    }
    const entry = statsMap.get(key)!;
    entry.bookings++;
    entry.totalPrice += Number(bk.priceTotal || 0);
  }

  // Count available models per location
  const modelCounts = await prisma.model.groupBy({
    by: ['primaryLocationId'],
    where: { status: 'published', deletedAt: null },
    _count: true,
  });
  const modelCountMap = new Map<string, number>();
  for (const mc of modelCounts) {
    if (mc.primaryLocationId) modelCountMap.set(mc.primaryLocationId, mc._count);
  }

  // Upsert stats
  const results = [];
  for (const [, entry] of statsMap) {
    const conversionRate = entry.requests > 0
      ? Number(((entry.bookings / entry.requests) * 100).toFixed(2))
      : 0;
    const avgPrice = entry.bookings > 0
      ? Number((entry.totalPrice / entry.bookings).toFixed(2))
      : 0;
    const availableModelsCount = entry.locationId ? (modelCountMap.get(entry.locationId) || 0) : 0;

    // Demand score: weighted combination
    const demandScore = Math.min(100, Math.round(
      entry.requests * 3 +
      entry.bookings * 5 +
      (conversionRate > 50 ? 20 : 0) +
      (availableModelsCount < 3 ? 15 : 0) // scarcity bonus
    ));

    const stat = await prisma.demandStats.create({
      data: {
        locationId: entry.locationId,
        city: entry.city,
        area: entry.area,
        timeSlot: entry.timeSlot,
        requests: entry.requests,
        bookings: entry.bookings,
        conversionRate,
        avgPrice,
        availableModelsCount,
        demandScore,
      },
    });
    results.push(stat);
  }

  return { statsCreated: results.length };
}

// ── Get Demand Heatmap ──────────────────────────────────────
export async function getDemandHeatmap(filters: {
  city?: string;
  locationId?: string;
  dateFrom: Date;
  dateTo: Date;
}) {
  const where: any = {
    timeSlot: { gte: filters.dateFrom, lte: filters.dateTo },
  };
  if (filters.city) where.city = filters.city;
  if (filters.locationId) where.locationId = filters.locationId;

  const stats = await prisma.demandStats.findMany({
    where,
    orderBy: [{ city: 'asc' }, { timeSlot: 'asc' }],
  });

  return stats;
}
