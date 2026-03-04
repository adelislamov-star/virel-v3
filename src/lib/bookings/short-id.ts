// SHORT ID GENERATOR FOR BOOKINGS
// Generates human-readable IDs like BK-10001, BK-10002, ...

import { prisma } from '@/lib/db/client';

export async function generateBookingShortId(): Promise<string> {
  const count = await prisma.booking.count();
  const id = count + 10001;
  return `BK-${id}`;
}
