// AVAILABILITY SLOTS API
// GET  /api/v1/availability/slots - List slots
// POST /api/v1/availability/slots - Create slot

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

const CreateSlotSchema = z.object({
  modelId: z.string(),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  status: z.enum(['available', 'unavailable', 'tentative']).default('available'),
  source: z.enum(['manual', 'automation', 'sync']).default('manual')
});

// GET - List availability slots
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const modelId = searchParams.get('model_id');
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const status = searchParams.get('status');
    
    const where: any = {};
    if (modelId) where.modelId = modelId;
    if (status) where.status = status;
    
    if (from || to) {
      where.startAt = {};
      if (from) where.startAt.gte = new Date(from);
      if (to) where.startAt.lte = new Date(to);
    }
    
    const slots = await prisma.availabilitySlot.findMany({
      where,
      include: {
        model: {
          select: { id: true, name: true, publicCode: true }
        }
      },
      orderBy: { startAt: 'asc' },
      take: 100
    });
    
    return NextResponse.json({
      success: true,
      data: { slots }
    });
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    }, { status: 500 });
  }
}

// POST - Create availability slot
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = CreateSlotSchema.parse(body);
    
    // Check for overlapping slots
    const overlapping = await prisma.availabilitySlot.findFirst({
      where: {
        modelId: data.modelId,
        OR: [
          {
            AND: [
              { startAt: { lte: new Date(data.startAt) } },
              { endAt: { gt: new Date(data.startAt) } }
            ]
          },
          {
            AND: [
              { startAt: { lt: new Date(data.endAt) } },
              { endAt: { gte: new Date(data.endAt) } }
            ]
          }
        ]
      }
    });
    
    if (overlapping) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'SLOT_OVERLAP',
          message: 'Slot overlaps with existing availability',
          overlapping
        }
      }, { status: 400 });
    }
    
    // Create slot
    const slot = await prisma.availabilitySlot.create({
      data: {
        modelId: data.modelId,
        startAt: new Date(data.startAt),
        endAt: new Date(data.endAt),
        status: data.status,
        source: data.source,
        confidence: 1.0
      },
      include: {
        model: {
          select: { id: true, name: true, publicCode: true }
        }
      }
    });
    
    // Create domain event
    await prisma.domainEvent.create({
      data: {
        eventType: 'availability.slot_created',
        entityType: 'availability_slot',
        entityId: slot.id,
        payload: { slot }
      }
    });
    
    return NextResponse.json({
      success: true,
      data: { slot },
      message: 'Availability slot created'
    }, { status: 201 });
    
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input',
          details: error.errors
        }
      }, { status: 400 });
    }
    
    return NextResponse.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    }, { status: 500 });
  }
}
