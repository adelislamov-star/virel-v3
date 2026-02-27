// AVAILABILITY RULES ENGINE
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export type TimeSlot = {
  startAt: Date;
  endAt: Date;
};

/**
 * Check if model is available for a time slot
 */
export async function checkAvailability(
  modelId: string,
  startAt: Date,
  endAt: Date
): Promise<{ available: boolean; conflicts: any[] }> {
  
  // Check for existing bookings
  const bookingConflicts = await prisma.booking.findMany({
    where: {
      modelId,
      status: { in: ['confirmed', 'in_progress'] },
      OR: [
        {
          AND: [
            { startAt: { lte: startAt } },
            { endAt: { gt: startAt } }
          ]
        },
        {
          AND: [
            { startAt: { lt: endAt } },
            { endAt: { gte: endAt } }
          ]
        }
      ]
    }
  });
  
  // Check for unavailable slots
  const unavailableSlots = await prisma.availabilitySlot.findMany({
    where: {
      modelId,
      status: 'unavailable',
      OR: [
        {
          AND: [
            { startAt: { lte: startAt } },
            { endAt: { gt: startAt } }
          ]
        },
        {
          AND: [
            { startAt: { lt: endAt } },
            { endAt: { gte: endAt } }
          ]
        }
      ]
    }
  });
  
  const conflicts = [
    ...bookingConflicts.map(b => ({ type: 'booking', data: b })),
    ...unavailableSlots.map(s => ({ type: 'unavailable', data: s }))
  ];
  
  return {
    available: conflicts.length === 0,
    conflicts
  };
}

/**
 * Detect mismatches between bookings and availability
 */
export async function detectMismatches(modelId?: string) {
  const where = modelId ? { modelId } : {};
  
  // Get all confirmed bookings
  const bookings = await prisma.booking.findMany({
    where: {
      ...where,
      status: { in: ['confirmed', 'in_progress'] }
    },
    include: {
      model: {
        select: { id: true, name: true }
      }
    }
  });
  
  const mismatches = [];
  
  for (const booking of bookings) {
    // Check if there's a matching availability slot
    const matchingSlot = await prisma.availabilitySlot.findFirst({
      where: {
        modelId: booking.modelId,
        status: 'available',
        startAt: { lte: booking.startAt },
        endAt: { gte: booking.endAt }
      }
    });
    
    if (!matchingSlot) {
      // Check if there's an unavailable slot
      const conflictingSlot = await prisma.availabilitySlot.findFirst({
        where: {
          modelId: booking.modelId,
          status: 'unavailable',
          OR: [
            {
              AND: [
                { startAt: { lte: booking.startAt } },
                { endAt: { gt: booking.startAt } }
              ]
            },
            {
              AND: [
                { startAt: { lt: booking.endAt } },
                { endAt: { gte: booking.endAt } }
              ]
            }
          ]
        }
      });
      
      mismatches.push({
        type: conflictingSlot ? 'unavailable_conflict' : 'no_slot',
        bookingId: booking.id,
        booking,
        conflictingSlot
      });
    }
  }
  
  return mismatches;
}

/**
 * Auto-create availability slots from bookings
 */
export async function syncBookingsToAvailability(modelId?: string) {
  const where = modelId ? { modelId } : {};
  
  const bookings = await prisma.booking.findMany({
    where: {
      ...where,
      status: { in: ['confirmed', 'in_progress'] }
    }
  });
  
  let created = 0;
  
  for (const booking of bookings) {
    // Check if slot already exists
    const existing = await prisma.availabilitySlot.findFirst({
      where: {
        modelId: booking.modelId,
        startAt: booking.startAt,
        endAt: booking.endAt,
        source: 'sync'
      }
    });
    
    if (!existing) {
      await prisma.availabilitySlot.create({
        data: {
          modelId: booking.modelId,
          startAt: booking.startAt,
          endAt: booking.endAt,
          status: 'unavailable',
          source: 'sync',
          syncedBookingId: booking.id,
          confidence: 1.0
        }
      });
      created++;
    }
  }
  
  return { created };
}

/**
 * Find available time slots for a model
 */
export async function findAvailableSlots(
  modelId: string,
  from: Date,
  to: Date,
  durationHours: number
): Promise<TimeSlot[]> {
  
  // Get all unavailable periods
  const [bookings, unavailableSlots] = await Promise.all([
    prisma.booking.findMany({
      where: {
        modelId,
        status: { in: ['confirmed', 'in_progress'] },
        startAt: { gte: from, lte: to }
      },
      select: { startAt: true, endAt: true }
    }),
    prisma.availabilitySlot.findMany({
      where: {
        modelId,
        status: 'unavailable',
        startAt: { gte: from, lte: to }
      },
      select: { startAt: true, endAt: true }
    })
  ]);
  
  // Combine all busy periods
  const busyPeriods = [
    ...bookings.map(b => ({ start: b.startAt, end: b.endAt })),
    ...unavailableSlots.map(s => ({ start: s.startAt, end: s.endAt }))
  ].sort((a, b) => a.start.getTime() - b.start.getTime());
  
  // Find gaps
  const availableSlots: TimeSlot[] = [];
  let currentTime = from;
  
  for (const busy of busyPeriods) {
    const gapHours = (busy.start.getTime() - currentTime.getTime()) / (1000 * 60 * 60);
    
    if (gapHours >= durationHours) {
      availableSlots.push({
        startAt: currentTime,
        endAt: busy.start
      });
    }
    
    currentTime = new Date(Math.max(currentTime.getTime(), busy.end.getTime()));
  }
  
  // Check final gap
  const finalGapHours = (to.getTime() - currentTime.getTime()) / (1000 * 60 * 60);
  if (finalGapHours >= durationHours) {
    availableSlots.push({
      startAt: currentTime,
      endAt: to
    });
  }
  
  return availableSlots;
}
