// BOOKING DETAIL PAGE WITH PAYMENTS + ALTERNATIVE OFFERS
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import DepositPaymentForm from '@/components/payments/DepositPaymentForm';

type AltOffer = { id: string; offeredModel: { id: string; name: string }; rank: number; status: string; similarityScore?: number };

export default function BookingDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [altOffers, setAltOffers] = useState<AltOffer[]>([]);
  const [altLoading, setAltLoading] = useState(false);
  
  useEffect(() => {
    loadBooking();
  }, [params.id]);
  
  async function loadBooking() {
    try {
      const res = await fetch(`/api/v1/bookings?limit=100`);
      const data = await res.json();
      const found = data.data?.bookings?.find((b: any) => b.id === params.id);
      setBooking(found);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load booking:', error);
      setLoading(false);
    }
  }
  
  async function handleStatusChange(newStatus: string) {
    if (!confirm(`Change status to ${newStatus}?`)) return;
    
    try {
      const res = await fetch(`/api/v1/bookings/${params.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newStatus, reason: 'Manual update' })
      });
      
      if (res.ok) {
        alert('Status updated successfully!');
        loadBooking();
      } else {
        const error = await res.json();
        alert(`Failed: ${error.error?.message || 'Unknown error'}`);
      }
    } catch (error) {
      alert('Failed to update status');
    }
  }
  
  async function handleFindAlternatives() {
    if (!booking?.model?.id) return;
    setAltLoading(true);
    try {
      const res = await fetch('/api/v1/alternative-offers/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestedModelId: booking.model.id, reason: 'requested_model_unavailable', bookingId: params.id }),
      });
      const data = await res.json();
      if (data.success) setAltOffers(data.data.offers);
    } catch {}
    finally { setAltLoading(false); }
  }

  async function handleAcceptOffer(offerId: string) {
    await fetch(`/api/v1/alternative-offers/${offerId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'accepted', bookingId: params.id }),
    });
    setAltOffers(prev => prev.map(o => o.id === offerId ? { ...o, status: 'accepted' } : o));
  }

  async function handleRejectOffer(offerId: string) {
    await fetch(`/api/v1/alternative-offers/${offerId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'rejected' }),
    });
    setAltOffers(prev => prev.map(o => o.id === offerId ? { ...o, status: 'rejected' } : o));
  }

  if (loading) return <div className="p-6">Loading...</div>;
  if (!booking) return <div className="p-6">Booking not found</div>;
  
  const availableTransitions: any = {
    draft: ['pending', 'cancelled'],
    pending: ['deposit_required', 'confirmed', 'cancelled'],
    deposit_required: ['confirmed', 'cancelled'],
    confirmed: ['in_progress', 'cancelled', 'no_show'],
    in_progress: ['completed', 'cancelled']
  };
  
  const nextStatuses = availableTransitions[booking.status] || [];
  
  // Show payment form if deposit required and not paid
  const showPaymentForm = booking.depositRequired && 
                         booking.depositRequired > 0 && 
                         booking.depositStatus === 'none';
  
  return (
    <div className="p-6 max-w-6xl">
      <Button 
        variant="outline" 
        onClick={() => router.back()}
        className="mb-4"
      >
        ← Back
      </Button>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info - Left Column */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Booking Details</CardTitle>
                <Badge variant={booking.status === 'confirmed' ? 'default' : 'secondary'}>
                  {booking.status}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Model & Location */}
              <div>
                <h3 className="font-semibold text-2xl mb-2">
                  {booking.model?.name}
                </h3>
                <p className="text-muted-foreground">
                  📍 {booking.location?.title}
                </p>
              </div>
              
              {/* Date & Time */}
              <div className="bg-muted p-4 rounded">
                <p className="text-sm text-muted-foreground mb-1">Date & Time</p>
                <p className="font-semibold">
                  {new Date(booking.startAt).toLocaleDateString('en-GB', { 
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
                <p className="text-lg font-bold mt-1">
                  {new Date(booking.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {' '} → {' '}
                  {new Date(booking.endAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Duration: {Math.round((new Date(booking.endAt).getTime() - new Date(booking.startAt).getTime()) / (1000 * 60 * 60))} hours
                </p>
              </div>
              
              {/* Client */}
              <div>
                <p className="text-sm text-muted-foreground mb-1">Client</p>
                <p className="font-semibold">{booking.client?.fullName || 'Unknown'}</p>
                {booking.client?.email && (
                  <p className="text-sm text-muted-foreground">{booking.client.email}</p>
                )}
                {booking.client?.phone && (
                  <p className="text-sm text-muted-foreground">{booking.client.phone}</p>
                )}
              </div>
              
              {/* Pricing */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="text-2xl font-bold">
                    £{booking.priceTotal} {booking.currency}
                  </p>
                </div>
                
                {booking.depositRequired && (
                  <div>
                    <p className="text-sm text-muted-foreground">Deposit Required</p>
                    <p className="text-xl font-semibold">
                      £{booking.depositRequired}
                    </p>
                    <Badge variant="outline" className="mt-1">
                      {booking.depositStatus}
                    </Badge>
                  </div>
                )}
              </div>
              
              {/* Payment Status */}
              <div>
                <p className="text-sm text-muted-foreground">Payment Status</p>
                <Badge variant={booking.paymentStatus === 'paid' ? 'default' : 'secondary'}>
                  {booking.paymentStatus}
                </Badge>
              </div>
              
              {/* Timestamps */}
              <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                <div>
                  <p>Created: {new Date(booking.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <p>Updated: {new Date(booking.updatedAt).toLocaleString()}</p>
                </div>
              </div>
              
              {/* Internal Notes */}
              {booking.notesInternal && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Internal Notes</p>
                  <div className="bg-muted p-3 rounded text-sm">
                    {booking.notesInternal}
                  </div>
                </div>
              )}
              
              {/* Status Transitions */}
              {nextStatuses.length > 0 && (
                <div className="pt-4 border-t">
                  <p className="text-sm font-semibold mb-3">Change Status:</p>
                  <div className="flex gap-2 flex-wrap">
                    {nextStatuses.map((status: string) => (
                      <Button
                        key={status}
                        variant={status.includes('cancel') || status === 'no_show' ? 'destructive' : 'default'}
                        onClick={() => handleStatusChange(status)}
                      >
                        {status.replace('_', ' ').toUpperCase()}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Payment Form - Right Column */}
        <div className="lg:col-span-1">
          {showPaymentForm && (
            <DepositPaymentForm
              bookingId={booking.id}
              depositAmount={booking.depositRequired}
              currency={booking.currency}
              onSuccess={() => {
                alert('Payment successful! Booking will be confirmed.');
                setTimeout(() => loadBooking(), 1000);
              }}
            />
          )}
          
          {booking.depositStatus === 'paid' && (
            <Card className="border-green-500">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-4xl mb-2">✅</div>
                  <h3 className="font-semibold text-lg mb-2">Deposit Paid</h3>
                  <p className="text-sm text-muted-foreground">
                    £{booking.depositRequired} received
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Alternative Offers Section */}
      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Alternative Offers</CardTitle>
            <Button onClick={handleFindAlternatives} disabled={altLoading} variant="outline" size="sm">
              {altLoading ? 'Searching...' : 'Find Alternatives'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {altOffers.length === 0 ? (
            <p className="text-sm text-muted-foreground">Click &quot;Find Alternatives&quot; to generate similar model suggestions.</p>
          ) : (
            <div className="space-y-2">
              {altOffers.map(offer => (
                <div key={offer.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">#{offer.rank}</span>
                    <span className="font-medium">{offer.offeredModel.name}</span>
                    {offer.similarityScore !== undefined && (
                      <span className="text-xs text-muted-foreground">Score: {(offer.similarityScore * 100).toFixed(0)}%</span>
                    )}
                    <Badge variant={offer.status === 'accepted' ? 'default' : offer.status === 'rejected' ? 'destructive' : 'secondary'}>
                      {offer.status}
                    </Badge>
                  </div>
                  {offer.status === 'generated' && (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleAcceptOffer(offer.id)}>Accept</Button>
                      <Button size="sm" variant="destructive" onClick={() => handleRejectOffer(offer.id)}>Reject</Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
