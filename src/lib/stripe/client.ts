// STRIPE CLIENT
import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';

export const stripe = stripeSecretKey 
  ? new Stripe(stripeSecretKey, {
      apiVersion: '2024-11-20.acacia'
    })
  : null;

/**
 * Create Payment Intent for deposit
 */
export async function createDepositIntent(bookingId: string, amount: number) {
  if (!stripe) {
    throw new Error('Stripe not configured');
  }
  
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // Convert to cents
    currency: 'gbp',
    metadata: {
      bookingId,
      type: 'deposit'
    },
    automatic_payment_methods: {
      enabled: true
    }
  });
  
  return paymentIntent;
}

/**
 * Retrieve Payment Intent
 */
export async function getPaymentIntent(paymentIntentId: string) {
  if (!stripe) {
    throw new Error('Stripe not configured');
  }
  
  return await stripe.paymentIntents.retrieve(paymentIntentId);
}

/**
 * Create refund
 */
export async function createRefund(paymentIntentId: string, amount?: number) {
  if (!stripe) {
    throw new Error('Stripe not configured');
  }
  
  return await stripe.refunds.create({
    payment_intent: paymentIntentId,
    amount: amount ? Math.round(amount * 100) : undefined
  });
}

/**
 * Verify webhook signature
 */
export function constructWebhookEvent(payload: string, signature: string) {
  if (!stripe) {
    throw new Error('Stripe not configured');
  }
  
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
  
  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}
