// CREATE PAYMENT INTENT FOR DEPOSIT
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { createDepositIntent } from '@/lib/stripe/client';

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: params.id }
    });
    
    if (!booking) {
      return NextResponse.json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Booking not found' }
      }, { status: 404 });
    }
    
    if (!booking.depositRequired || booking.depositRequired <= 0) {
      return NextResponse.json({
        success: false,
        error: { code: 'NO_DEPOSIT_REQUIRED', message: 'No deposit required' }
      }, { status: 400 });
    }
    
    const paymentIntent = await createDepositIntent(
      booking.id,
      booking.depositRequired
    );
    
    const payment = await prisma.payment.create({
      data: {
        bookingId: booking.id,
        provider: 'stripe',
        providerPaymentId: paymentIntent.id,
        type: 'deposit',
        status: 'pending',
        amount: booking.depositRequired,
        currency: booking.currency,
        raw: paymentIntent as any
      }
    });
    
    await prisma.domainEvent.create({
      data: {
        eventType: 'payment.created',
        entityType: 'payment',
        entityId: payment.id,
        payload: { payment, booking }
      }
    });
    
    return NextResponse.json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: booking.depositRequired,
        currency: booking.currency
      }
    });
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: { code: 'PAYMENT_ERROR', message: error.message }
    }, { status: 500 });
  }
}
