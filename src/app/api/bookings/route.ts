import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { PrismaClient } from '@prisma/client'
import { divaBot, keshaBot } from '@/lib/telegram/bots'

const prisma = new PrismaClient()

// Validation schema
const bookingSchema = z.object({
  clientName: z.string().min(2),
  clientPhone: z.string().min(10),
  clientEmail: z.string().email().optional(),
  modelId: z.string(),
  date: z.string().datetime(),
  duration: z.number().min(1).max(24),
  location: z.string(),
  serviceType: z.enum(['incall', 'outcall']),
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
    const hourlyRate = validatedData.serviceType === 'incall' 
      ? services.rates.incall 
      : services.rates.outcall
    const totalAmount = hourlyRate * validatedData.duration
    
    // Create booking
    const booking = await prisma.booking.create({
      data: {
        clientName: validatedData.clientName,
        clientPhone: validatedData.clientPhone,
        clientEmail: validatedData.clientEmail,
        modelId: validatedData.modelId,
        date: new Date(validatedData.date),
        duration: validatedData.duration,
        location: validatedData.location,
        serviceType: validatedData.serviceType,
        rate: hourlyRate,
        totalAmount,
        notes: validatedData.notes,
        status: 'PENDING',
      },
    })
    
    // Send notification via DivaReceptionBot
    await divaBot.notifyNewBooking({
      id: booking.id,
      clientName: booking.clientName,
      clientPhone: booking.clientPhone,
      modelName: model.name,
      date: booking.date,
      duration: booking.duration,
      location: booking.location,
    })
    
    // Sync with AppSheet via KeshaZeroGapBot
    try {
      await keshaBot.syncWithAppSheet({
        bookingId: booking.id,
        clientName: booking.clientName,
        modelName: model.name,
        date: booking.date.toISOString(),
        duration: booking.duration,
        location: booking.location,
        status: booking.status,
      })
      
      // Log successful sync
      await prisma.appSheetSync.create({
        data: {
          bookingId: booking.id,
          syncStatus: 'success',
        },
      })
    } catch (syncError) {
      console.error('AppSheet sync failed:', syncError)
      
      // Log failed sync
      await prisma.appSheetSync.create({
        data: {
          bookingId: booking.id,
          syncStatus: 'error',
          errorMsg: String(syncError),
        },
      })
    }
    
    return NextResponse.json({
      success: true,
      booking: {
        id: booking.id,
        status: booking.status,
        totalAmount: booking.totalAmount,
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
