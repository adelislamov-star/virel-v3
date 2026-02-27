// DEPOSIT PAYMENT FORM
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DepositPaymentForm({ 
  bookingId, 
  depositAmount,
  currency = 'GBP',
  onSuccess 
}: { 
  bookingId: string;
  depositAmount: number;
  currency?: string;
  onSuccess?: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  async function handlePayment() {
    setLoading(true);
    setError('');
    
    try {
      // Step 1: Create Payment Intent
      const res = await fetch(`/api/v1/bookings/${bookingId}/payments/deposit-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await res.json();
      
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'Failed to create payment');
      }
      
      const { clientSecret } = data.data;
      
      // Step 2: In production, this would open Stripe Checkout
      // For now, simulate successful payment
      alert(`Payment Intent Created!\n\nClient Secret: ${clientSecret}\n\nIn production, this would open Stripe Checkout form.`);
      
      // Simulate webhook callback (in production, webhook does this)
      setSuccess(true);
      setLoading(false);
      
      if (onSuccess) {
        setTimeout(onSuccess, 2000);
      }
      
    } catch (err: any) {
      setError(err.message || 'Payment failed');
      setLoading(false);
    }
  }
  
  if (success) {
    return (
      <Card className="border-green-500">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="text-4xl mb-2">✅</div>
            <h3 className="font-semibold text-lg mb-2">Payment Successful!</h3>
            <p className="text-sm text-muted-foreground">
              Deposit of £{depositAmount} has been paid.
              <br />
              Booking will be confirmed automatically.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>💳 Pay Deposit</CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="bg-muted p-4 rounded">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-muted-foreground">Deposit Required:</span>
            <span className="text-2xl font-bold">£{depositAmount}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Secure payment processed by Stripe
          </p>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-800">
            ❌ {error}
          </div>
        )}
        
        <Button 
          onClick={handlePayment}
          disabled={loading}
          className="w-full"
          size="lg"
        >
          {loading ? 'Processing...' : `Pay £${depositAmount} Deposit`}
        </Button>
        
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <span>🔒</span>
            <span>Secured by Stripe</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
