// Stub — real Stripe integration pending
export function constructWebhookEvent(_body: string | Buffer, _sig: string, _secret: string) {
  throw new Error('Stripe webhook not configured');
}
