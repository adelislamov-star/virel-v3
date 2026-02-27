// BOOKING STATUS TRANSITION API
// POST /api/v1/bookings/[id]/status

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import BookingStateMachine, { BookingStatus } from '@/lib/state-machines/booking';

const prisma = new PrismaClient();

const StatusChangeSchema = z.object({
  newStatus: z.enum(['draft', 'pending', 'deposit_required', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show', 'expired']),
  reason: z.string().optional()
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const data = StatusChangeSchema.parse(body);
    
    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      include: { model: true, client: true }
    });
    
    if (!booking) {
      return NextResponse.json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Booking not found' }
      }, { status: 404 });
    }
    
    const currentStatus = booking.status as BookingStatus;
    const newStatus = data.newStatus as BookingStatus;
    
    if (!BookingStateMachine.canTransition(currentStatus, newStatus)) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'INVALID_TRANSITION',
          message: `Cannot transition from ${currentStatus} to ${newStatus}`,
          availableTransitions: BookingStateMachine.getAvailableTransitions(currentStatus)
        }
      }, { status: 400 });
    }
    
    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.booking.update({
        where: { id: params.id },
        data: { status: newStatus },
        include: { model: true, client: true, location: true }
      });
      
      await tx.bookingTimeline.create({
        data: {
          bookingId: params.id,
          eventType: 'status_changed',
          payload: { from: currentStatus, to: newStatus, reason: data.reason }
        }
      });
      
      await tx.auditLog.create({
        data: {
          actorType: 'user',
          action: 'STATUS_CHANGE',
          entityType: 'booking',
          entityId: params.id,
          before: { status: currentStatus },
          after: { status: newStatus }
        }
      });
      
      await tx.domainEvent.create({
        data: {
          eventType: 'booking.status_changed',
          entityType: 'booking',
          entityId: params.id,
          payload: { from: currentStatus, to: newStatus, booking: updated }
        }
      });
      
      // Business logic
      if (newStatus === 'confirmed') {
        // Close confirm task
        await tx.task.updateMany({
          where: { entityType: 'booking', entityId: params.id, type: 'confirm_booking', status: 'open' },
          data: { status: 'done' }
        });
      }
      
      return updated;
    });
    
    return NextResponse.json({
      success: true,
      data: {
        booking: result,
        transition: { from: currentStatus, to: newStatus, at: new Date().toISOString() }
      }
    });
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    }, { status: 500 });
  }
}
