import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db/client'

// Validation schema
const bookingSchema = z.object({
  clientName: z.string().optional(),
  clientPhone: z.string().optional(),
  clientEmail: z.string().email().optional(),
  telegram: z.string().optional(),
  whatsapp: z.string().optional(),
  modelId: z.string(),
  date: z.string().datetime(),
  duration: z.number().int().min(1).max(24),
  location: z.string(),
  serviceType: z.enum(['incall', 'outcall']),
  notes: z.string().optional(),
}).refine(
  data => data.telegram || data.whatsapp || data.clientPhone,
  {
    message: 'At least one contact method (Telegram, WhatsApp, or Phone) is required',
  }
)

// POST - Create booking with idempotency
export async function POST(request: NextRequest) {
  try {
    // Get idempotency key from header
    const idempotencyKey = request.headers.get('idempotency-key') || 
                          request.headers.get('x-idempotency-key')
    
    // Check for existing booking with same idempotency key
    if (idempotencyKey) {
      const existing = await prisma.booking.findUnique({
        where: { requestId: idempotencyKey },
      })
      
      if (existing) {
        return NextResponse.json({
          success: true,
          booking: existing,
          idempotent: true,
        })
      }
    }
    
    const body = await request.json()
    const validatedData = bookingSchema.parse(body)
    
    // Get model details
    const model = await prisma.model.findUnique({
      where: { id: validatedData.modelId },
      select: { 
        name: true, 
        services: true,
        status: true,
      },
    })
    
    if (!model) {
      return NextResponse.json(
        { error: 'Model not found' },
        { status: 404 }
      )
    }
    
    if (model.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Model is not available' },
        { status: 400 }
      )
    }
    
    // Calculate pricing
    const services = model.services as any
    const hourlyRate = validatedData.serviceType === 'incall' 
      ? services.rates.incall 
      : services.rates.outcall
    const totalAmount = hourlyRate * validatedData.duration
    
    // Create booking
    const booking = await prisma.booking.create({
      data: {
        ...validatedData,
        date: new Date(validatedData.date),
        rate: hourlyRate,
        totalAmount,
        currency: 'GBP',
        status: 'PENDING',
        requestId: idempotencyKey || undefined,
      },
    })
    
    // Queue notification for DivaReceptionBot
    await prisma.notificationQueue.create({
      data: {
        type: 'TELEGRAM_DIVA',
        recipient: process.env.TELEGRAM_CHAT_ID_RECEPTION || '',
        payload: {
          bookingId: booking.id,
          clientName: booking.clientName || 'Client',
          clientContact: booking.telegram || booking.whatsapp || booking.clientPhone,
          modelName: model.name,
          date: booking.date.toISOString(),
          duration: booking.duration,
          location: booking.location,
          serviceType: booking.serviceType,
          totalAmount: booking.totalAmount,
        },
        status: 'PENDING',
        requestId: idempotencyKey ? `notification-${idempotencyKey}` : undefined,
      },
    })
    
    // Queue AppSheet sync
    try {
      // This will be processed by background worker
      await prisma.appSheetSync.create({
        data: {
          bookingId: booking.id,
          syncStatus: 'pending',
          syncType: 'create',
          requestData: booking,
        },
      })
    } catch (syncError) {
      console.error('AppSheet sync queue error:', syncError)
      // Don't fail booking if sync queue fails
    }
    
    // Log audit
    await prisma.auditLog.create({
      data: {
        action: 'booking_created',
        entityType: 'Booking',
        entityId: booking.id,
        changes: { created: booking },
      },
    })
    
    return NextResponse.json({
      success: true,
      booking: {
        id: booking.id,
        status: booking.status,
        totalAmount: booking.totalAmount,
        currency: booking.currency,
      },
    }, { status: 201 })
    
  } catch (error) {
    console.error('Booking creation error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET - List bookings with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const status = searchParams.get('status')
    const modelId = searchParams.get('model_id')
    const dateFrom = searchParams.get('date_from')
    const dateTo = searchParams.get('date_to')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    
    const where: any = {}
    
    if (status) where.status = status
    if (modelId) where.modelId = modelId
    if (dateFrom || dateTo) {
      where.date = {}
      if (dateFrom) where.date.gte = new Date(dateFrom)
      if (dateTo) where.date.lte = new Date(dateTo)
    }
    
    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          model: {
            select: {
              name: true,
              slug: true,
              coverPhoto: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
        skip: offset,
      }),
      prisma.booking.count({ where }),
    ])
    
    return NextResponse.json({
      bookings,
      total,
      limit,
      offset,
    })
    
  } catch (error) {
    console.error('Bookings fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH - Update booking status
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, status, assignedTo, adminNotes } = body
    
    if (!id || !status) {
      return NextResponse.json(
        { error: 'ID and status are required' },
        { status: 400 }
      )
    }
    
    const existing = await prisma.booking.findUnique({
      where: { id },
      include: { model: true },
    })
    
    if (!existing) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }
    
    const updateData: any = { status }
    
    if (assignedTo) updateData.assignedTo = assignedTo
    if (adminNotes) updateData.adminNotes = adminNotes
    
    // Set timestamp based on status
    if (status === 'CONFIRMED') updateData.confirmedAt = new Date()
    if (status === 'COMPLETED') updateData.completedAt = new Date()
    if (status === 'CANCELLED') updateData.cancelledAt = new Date()
    
    const updated = await prisma.booking.update({
      where: { id },
      data: updateData,
    })
    
    // Queue notification for status change
    if (status === 'CONFIRMED') {
      await prisma.notificationQueue.create({
        data: {
          type: 'TELEGRAM_DIVA',
          recipient: process.env.TELEGRAM_CHAT_ID_RECEPTION || '',
          payload: {
            bookingId: id,
            status: 'confirmed',
            modelName: existing.model.name,
          },
          status: 'PENDING',
        },
      })
    }
    
    // Log audit
    await prisma.auditLog.create({
      data: {
        action: 'booking_status_changed',
        entityType: 'Booking',
        entityId: id,
        changes: {
          before: { status: existing.status },
          after: { status: updated.status },
        },
      },
    })
    
    // Sync to AppSheet
    await prisma.appSheetSync.create({
      data: {
        bookingId: id,
        syncStatus: 'pending',
        syncType: 'update',
        requestData: updated,
      },
    })
    
    return NextResponse.json({ booking: updated })
    
  } catch (error) {
    console.error('Booking status update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
