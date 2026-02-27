// STRIPE WEBHOOK HANDLER (WITH NOTIFICATIONS)
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { constructWebhookEvent } from '@/lib/stripe/client';
import NotificationService from '@/lib/notifications/service';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');
    
    if (!signature) {
      return NextResponse.json({
        success: false,
        error: 'Missing signature'
      }, { status: 400 });
    }
    
    const event = constructWebhookEvent(body, signature);
    
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
      case 'payment_intent.canceled':
        await handlePaymentCanceled(event.data.object);
        break;
    }
    
    return NextResponse.json({ received: true });
    
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 400 });
  }
}

async function handlePaymentSucceeded(paymentIntent: any) {
  const payment = await prisma.payment.findFirst({
    where: { providerPaymentId: paymentIntent.id },
    include: { booking: true }
  });
  
  if (!payment) return;
  
  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: payment.id },
      data: { status: 'succeeded', raw: paymentIntent }
    });
    
    await tx.booking.update({
      where: { id: payment.bookingId },
      data: {
        depositStatus: 'paid',
        paymentStatus: 'partial',
        status: 'confirmed'
      }
    });
    
    await tx.bookingTimeline.create({
      data: {
        bookingId: payment.bookingId,
        eventType: 'payment_succeeded',
        payload: { payment, paymentIntent }
      }
    });
    
    await tx.domainEvent.create({
      data: {
        eventType: 'payment.succeeded',
        entityType: 'payment',
        entityId: payment.id,
        payload: { payment, booking: payment.booking }
      }
    });
  });
  
  // Send notifications
  await NotificationService.notifyPaymentReceived(payment.id);
  await NotificationService.notifyBookingConfirmed(payment.bookingId);
}

async function handlePaymentFailed(paymentIntent: any) {
  const payment = await prisma.payment.findFirst({
    where: { providerPaymentId: paymentIntent.id }
  });
  
  if (!payment) return;
  
  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: payment.id },
      data: { status: 'failed', raw: paymentIntent }
    });
    
    await tx.exception.create({
      data: {
        type: 'payment_failed',
        status: 'open',
        severity: 'high',
        entityType: 'payment',
        entityId: payment.id,
        summary: `Payment failed for booking`,
        details: { payment, paymentIntent }
      }
    });
  });
}

async function handlePaymentCanceled(paymentIntent: any) {
  const payment = await prisma.payment.findFirst({
    where: { providerPaymentId: paymentIntent.id }
  });
  
  if (!payment) return;
  
  await prisma.payment.update({
    where: { id: payment.id },
    data: { status: 'cancelled', raw: paymentIntent }
  });
}
