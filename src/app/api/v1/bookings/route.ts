// BOOKINGS API v1
// GET /api/v1/bookings - List bookings
// POST /api/v1/bookings - Create booking

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

const CreateBookingSchema = z.object({
  inquiryId: z.string().optional(),
  clientId: z.string().optional(),
  
  // Client info if no clientId
  clientName: z.string().optional(),
  clientEmail: z.string().email().optional(),
  clientPhone: z.string().optional(),
  
  modelId: z.string(),
  locationId: z.string(),
  
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  
  priceTotal: z.number(),
  currency: z.string().default('GBP'),
  depositRequired: z.number().optional(),
  
  notesInternal: z.string().optional()
});

// POST - Create booking
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = CreateBookingSchema.parse(body);
    
    // Create or find client
    let clientId = data.clientId;
    if (!clientId && (data.clientEmail || data.clientPhone)) {
      const client = await prisma.client.upsert({
        where: {
          email: data.clientEmail || `temp_${Date.now()}`
        },
        create: {
          fullName: data.clientName,
          email: data.clientEmail,
          phone: data.clientPhone
        },
        update: {}
      });
      clientId = client.id;
    }
    
    if (!clientId) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Client information required'
        }
      }, { status: 400 });
    }
    
    // Check model availability
    const model = await prisma.model.findUnique({
      where: { id: data.modelId }
    });
    
    if (!model || model.status !== 'active') {
      return NextResponse.json({
        success: false,
        error: {
          code: 'MODEL_NOT_AVAILABLE',
          message: 'Model is not available'
        }
      }, { status: 400 });
    }
    
    // Create booking
    const booking = await prisma.booking.create({
      data: {
        inquiryId: data.inquiryId,
        clientId,
        modelId: data.modelId,
        locationId: data.locationId,
        startAt: new Date(data.startAt),
        endAt: new Date(data.endAt),
        status: data.depositRequired ? 'deposit_required' : 'pending',
        priceTotal: data.priceTotal,
        currency: data.currency,
        depositRequired: data.depositRequired,
        notesInternal: data.notesInternal
      },
      include: {
        client: true,
        model: true,
        location: true
      }
    });
    
    // Create timeline entry
    await prisma.bookingTimeline.create({
      data: {
        bookingId: booking.id,
        eventType: 'created',
        payload: { booking }
      }
    });
    
    // Create domain event
    await prisma.domainEvent.create({
      data: {
        eventType: 'booking.created',
        entityType: 'booking',
        entityId: booking.id,
        payload: { booking }
      }
    });
    
    // Auto-create task
    await prisma.task.create({
      data: {
        type: 'confirm_booking',
        status: 'open',
        priority: 'high',
        subject: `Confirm booking for ${model.name}`,
        entityType: 'booking',
        entityId: booking.id,
        slaDeadlineAt: new Date(Date.now() + 60 * 60 * 1000) // 1 hour SLA
      }
    });
    
    // If linked to inquiry, update inquiry status
    if (data.inquiryId) {
      await prisma.inquiry.update({
        where: { id: data.inquiryId },
        data: { status: 'converted' }
      });
    }
    
    return NextResponse.json({
      success: true,
      data: { booking },
      message: 'Booking created successfully'
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
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message
      }
    }, { status: 500 });
  }
}

// GET - List bookings
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const status = searchParams.get('status');
    const modelId = searchParams.get('model_id');
    const clientId = searchParams.get('client_id');
    const startFrom = searchParams.get('start_from');
    const startTo = searchParams.get('start_to');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    const where: any = {};
    if (status) where.status = status;
    if (modelId) where.modelId = modelId;
    if (clientId) where.clientId = clientId;
    
    if (startFrom || startTo) {
      where.startAt = {};
      if (startFrom) where.startAt.gte = new Date(startFrom);
      if (startTo) where.startAt.lte = new Date(startTo);
    }
    
    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          client: true,
          model: {
            select: { id: true, name: true, slug: true }
          },
          location: {
            select: { id: true, title: true }
          }
        },
        orderBy: { startAt: 'desc' },
        take: limit,
        skip: offset
      }),
      prisma.booking.count({ where })
    ]);
    
    return NextResponse.json({
      success: true,
      data: {
        bookings,
        pagination: { total, limit, offset }
      }
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
