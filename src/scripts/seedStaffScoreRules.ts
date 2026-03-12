// Seed default StaffScoreRule records
// Run: npx ts-node src/scripts/seedStaffScoreRules.ts

import { prisma } from '@/lib/db/client';

const DEFAULT_RULES = [
  { metricKey: 'conversionRate', label: 'Conversion Rate', weight: 30, description: 'Percentage of inquiries converted to bookings' },
  { metricKey: 'bookingsCompleted', label: 'Bookings Completed', weight: 25, description: 'Number of bookings completed in period' },
  { metricKey: 'lostRevenueAmount', label: 'Lost Revenue', weight: 20, description: 'Revenue lost from cancelled bookings (inverse)' },
  { metricKey: 'cancellationRate', label: 'Cancellation Rate', weight: 10, description: 'Percentage of bookings cancelled (inverse)' },
  { metricKey: 'complaintsCount', label: 'Complaints', weight: 10, description: 'Number of complaints received (inverse)' },
  { metricKey: 'retentionActionsCompleted', label: 'Retention Actions', weight: 5, description: 'Number of retention actions completed' },
];

async function seed() {
  for (const rule of DEFAULT_RULES) {
    await prisma.staffScoreRule.upsert({
      where: { metricKey: rule.metricKey },
      update: {},
      create: rule,
    });
  }
  console.log(`Seeded ${DEFAULT_RULES.length} staff score rules`);
}

seed()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
