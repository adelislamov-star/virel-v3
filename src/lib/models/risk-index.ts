// MODEL RISK INDEX CALCULATOR
// Calculates risk level for a model: green, yellow, red

import { prisma } from '@/lib/db/client';

export type RiskLevel = 'green' | 'yellow' | 'red';

export async function calculateModelRiskIndex(modelId: string): Promise<RiskLevel> {
  const [noShowCount, incidentCount, cancellationCount, avgRating] = await Promise.all([
    // Count no-show bookings
    prisma.booking.count({
      where: { modelId, status: 'no_show' }
    }),
    // Count incidents
    prisma.incident.count({
      where: { reporterModelId: modelId }
    }),
    // Count cancellations
    prisma.booking.count({
      where: { modelId, status: 'cancelled' }
    }),
    // Average rating
    prisma.review.aggregate({
      where: { modelId, status: 'approved' },
      _avg: { rating: true }
    })
  ]);

  const avg = avgRating._avg.rating;

  // RED: >= 3 no-shows OR >= 2 incidents OR avg rating < 3.0
  if (noShowCount >= 3 || incidentCount >= 2 || (avg !== null && avg < 3.0)) {
    return 'red';
  }

  // YELLOW: >= 1 no-show OR >= 1 incident OR >= 3 cancellations OR avg rating < 4.0
  if (noShowCount >= 1 || incidentCount >= 1 || cancellationCount >= 3 || (avg !== null && avg < 4.0)) {
    return 'yellow';
  }

  // GREEN: everything else
  return 'green';
}
