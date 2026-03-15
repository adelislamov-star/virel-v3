import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db/client'

export const runtime = 'nodejs';

// Validation schema
const bookingSchema = z.object({
  clientId: z.string(),
  clientEmail: z.string().email().optional(),
  // telegram/whatsapp contact stored on Client, not Booking — accept for routing only
  telegram: z.string().optional(),
  whatsapp: z.string().optional(),
  clientPhone: z.string().optional(),
  modelId: z.string(),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  locationId: z.string(),
  bookingType: z.enum(['incall', 'outcall']),
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
      const existing = await prisma.booking.findFirst({
        where: { shortId: idempotencyKey },
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
    const startAt = new Date(validatedData.startAt)
    const endAt = new Date(validatedData.endAt)
    const durationHours = (endAt.getTime() - startAt.getTime()) / (1000 * 60 * 60)
    const hourlyRate = validatedData.bookingType === 'incall'
      ? services.rates.incall
      : services.rates.outcall
    const priceTotal = hourlyRate * durationHours

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        clientId: validatedData.clientId,
        modelId: validatedData.modelId,
        locationId: validatedData.locationId,
        startAt,
        endAt,
        bookingType: validatedData.bookingType,
        priceTotal,
        currency: 'GBP',
        notesInternal: validatedData.notes,
        status: 'PENDING',
      },
      include: { client: true },
    })

    // Queue notification for DivaReceptionBot
    await prisma.notification.create({
      data: {
        eventType: 'booking_created',
        recipientType: 'system',
        recipientId: 'reception',
        recipientAddress: process.env.TELEGRAM_CHAT_ID_RECEPTION || '',
        channel: 'telegram',
        idempotencyKey: idempotencyKey ? `notification-${idempotencyKey}` : `notification-${booking.id}`,
        payloadJson: {
          bookingId: booking.id,
          clientName: booking.client.fullName ?? booking.client.phone ?? 'Client',
          clientContact: validatedData.telegram || validatedData.whatsapp || booking.client.phone,
          modelName: model.name,
          date: booking.startAt.toISOString(),
          duration: durationHours,
          locationId: booking.locationId,
          bookingType: booking.bookingType,
          priceTotal: booking.priceTotal,
        },
        renderedBody: '',
        status: 'queued',
      },
    })

    // Queue AppSheet sync — disabled, prisma.appSheetSync does not exist
    // try {
    //   await prisma.appSheetSync.create({
    //     data: {
    //       bookingId: booking.id,
    //       syncStatus: 'pending',
    //       syncType: 'create',
    //       requestData: booking,
    //     },
    //   })
    // } catch (syncError) {
    //   console.error('AppSheet sync queue error:', syncError)
    // }

    // Log audit
    await prisma.auditLog.create({
      data: {
        actorType: 'system',
        action: 'booking_created',
        entityType: 'Booking',
        entityId: booking.id,
        after: { created: booking.id, status: booking.status, priceTotal: String(booking.priceTotal) },
      },
    })

    return NextResponse.json({
      success: true,
      booking: {
        id: booking.id,
        status: booking.status,
        priceTotal: booking.priceTotal,
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
      where.startAt = {}
      if (dateFrom) where.startAt.gte = new Date(dateFrom)
      if (dateTo) where.startAt.lte = new Date(dateTo)
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          model: {
            select: {
              name: true,
              slug: true,
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
    if (adminNotes) updateData.notesInternal = adminNotes

    // Set timestamp based on status (stored in timeline / no dedicated cols on Booking)
    // Note: confirmedAt / completedAt / cancelledAt are not on the Booking schema;
    //       use BookingTimeline entries for timestamped events if needed.

    const updated = await prisma.booking.update({
      where: { id },
      data: updateData,
    })

    // Queue notification for status change
    if (status === 'CONFIRMED') {
      await prisma.notification.create({
        data: {
          eventType: 'booking_confirmed',
          recipientType: 'system',
          recipientId: 'reception',
          recipientAddress: process.env.TELEGRAM_CHAT_ID_RECEPTION || '',
          channel: 'telegram',
          idempotencyKey: `booking-confirmed-${id}`,
          payloadJson: {
            bookingId: id,
            status: 'confirmed',
            modelName: existing.model.name,
          },
          renderedBody: '',
          status: 'queued',
        },
      })
    }

    // Log audit
    await prisma.auditLog.create({
      data: {
        actorType: 'user',
        action: 'booking_status_changed',
        entityType: 'Booking',
        entityId: id,
        before: { status: existing.status },
        after: { status: updated.status },
      },
    })

    // AppSheet sync disabled — prisma.appSheetSync does not exist
    // await prisma.appSheetSync.create({ data: { bookingId: id, syncStatus: 'pending', syncType: 'update', requestData: updated } })

    return NextResponse.json({ booking: updated })

  } catch (error) {
    console.error('Booking status update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
