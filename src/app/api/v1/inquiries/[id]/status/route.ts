// INQUIRY STATUS TRANSITION API
// POST /api/v1/inquiries/[id]/status

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import InquiryStateMachine, { InquiryStatus } from '@/lib/state-machines/inquiry';

const prisma = new PrismaClient();

const StatusChangeSchema = z.object({
  newStatus: z.enum(['new', 'qualified', 'awaiting_client', 'awaiting_deposit', 'converted', 'lost', 'spam']),
  reason: z.string().optional(),
  metadata: z.any().optional()
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const data = StatusChangeSchema.parse(body);
    
    // Get current inquiry
    const inquiry = await prisma.inquiry.findUnique({
      where: { id: params.id }
    });
    
    if (!inquiry) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Inquiry not found'
        }
      }, { status: 404 });
    }
    
    // Check if transition is valid
    const currentStatus = inquiry.status as InquiryStatus;
    const newStatus = data.newStatus as InquiryStatus;
    
    if (!InquiryStateMachine.canTransition(currentStatus, newStatus)) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'INVALID_TRANSITION',
          message: `Cannot transition from ${currentStatus} to ${newStatus}`,
          availableTransitions: InquiryStateMachine.getAvailableTransitions(currentStatus)
        }
      }, { status: 400 });
    }
    
    // Execute transition in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update inquiry
      const updated = await tx.inquiry.update({
        where: { id: params.id },
        data: { 
          status: newStatus,
          updatedAt: new Date()
        },
        include: {
          client: true,
          requestedLocation: true
        }
      });
      
      // Create audit log
      await tx.auditLog.create({
        data: {
          actorType: 'user',
          action: 'STATUS_CHANGE',
          entityType: 'inquiry',
          entityId: params.id,
          before: { status: currentStatus },
          after: { status: newStatus }
        }
      });
      
      // Create domain event
      await tx.domainEvent.create({
        data: {
          eventType: 'inquiry.status_changed',
          entityType: 'inquiry',
          entityId: params.id,
          payload: {
            from: currentStatus,
            to: newStatus,
            reason: data.reason,
            inquiry: updated
          }
        }
      });
      
      return updated;
    });
    
    return NextResponse.json({
      success: true,
      data: {
        inquiry: result,
        transition: {
          from: currentStatus,
          to: newStatus,
          at: new Date().toISOString()
        }
      },
      message: 'Status updated successfully'
    });
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message
      }
    }, { status: 500 });
  }
}
