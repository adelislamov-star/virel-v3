import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { PrismaClient } from '@prisma/client'
import { divaBot, keshaBot } from '@/lib/telegram/bots'

export const runtime = 'nodejs';

const prisma = new PrismaClient()

// Validation schema
const bookingSchema = z.object({
  clientId: z.string(),
  clientEmail: z.string().email().optional(),
  modelId: z.string(),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  locationId: z.string(),
  bookingType: z.enum(['incall', 'outcall']),
  notes: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate request data
    const validatedData = bookingSchema.parse(body)

    // Get model details
    const model = await prisma.model.findUnique({
      where: { id: validatedData.modelId },
      select: { name: true, services: true },
    })

    if (!model) {
      return NextResponse.json(
        { error: 'Model not found' },
        { status: 404 }
      )
    }

    // Calculate total amount (example logic)
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
        notesInternal: validatedData.notes,
        status: 'PENDING',
      },
      include: { client: true },
    })

    // Send notification via DivaReceptionBot
    await divaBot.notifyNewBooking({
      id: booking.id,
      clientName: booking.client.fullName ?? booking.client.phone ?? 'Client',
      clientPhone: booking.client.phone ?? '',
      modelName: model.name,
      date: booking.startAt,
      duration: durationHours,
      location: booking.locationId,
    })

    // Sync with AppSheet via KeshaZeroGapBot
    try {
      await keshaBot.syncWithAppSheet({
        bookingId: booking.id,
        clientName: booking.client.fullName ?? '',
        modelName: model.name,
        date: booking.startAt.toISOString(),
        duration: durationHours,
        location: booking.locationId,
        status: booking.status,
      })

      // AppSheet sync logging disabled — prisma.appSheetSync does not exist
      // await prisma.appSheetSync.create({ data: { bookingId: booking.id, syncStatus: 'success' } })
    } catch (syncError) {
      console.error('AppSheet sync failed:', syncError)

      // AppSheet sync logging disabled — prisma.appSheetSync does not exist
      // await prisma.appSheetSync.create({ data: { bookingId: booking.id, syncStatus: 'error', errorMsg: String(syncError) } })
    }

    return NextResponse.json({
      success: true,
      booking: {
        id: booking.id,
        status: booking.status,
        priceTotal: booking.priceTotal,
      },
    })

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

// GET - List all bookings (with filters)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const modelId = searchParams.get('modelId')

    const bookings = await prisma.booking.findMany({
      where: {
        ...(status && { status: status as any }),
        ...(modelId && { modelId }),
      },
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
      take: 50,
    })

    return NextResponse.json({ bookings })

  } catch (error) {
    console.error('Bookings fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
