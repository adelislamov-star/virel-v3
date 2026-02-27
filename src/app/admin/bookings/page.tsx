// BOOKINGS LIST PAGE
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function BookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadBookings();
  }, []);
  
  async function loadBookings() {
    try {
      const res = await fetch('/api/v1/bookings?limit=50');
      const data = await res.json();
      setBookings(data.data?.bookings || []);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load bookings:', error);
      setLoading(false);
    }
  }
  
  function getStatusColor(status: string) {
    const colors: any = {
      draft: 'secondary',
      pending: 'yellow',
      deposit_required: 'orange',
      confirmed: 'default',
      in_progress: 'default',
      completed: 'default',
      cancelled: 'destructive',
      no_show: 'destructive',
      expired: 'secondary'
    };
    return colors[status] || 'default';
  }
  
  if (loading) {
    return <div className="p-6">Loading bookings...</div>;
  }
  
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">📅 Bookings</h1>
        <p className="text-muted-foreground">
          {bookings.length} total bookings
        </p>
      </div>
      
      <div className="space-y-3">
        {bookings.map(booking => (
          <Card key={booking.id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={getStatusColor(booking.status)}>
                      {booking.status}
                    </Badge>
                    {booking.depositRequired && (
                      <Badge variant="outline">
                        Deposit: £{booking.depositRequired}
                      </Badge>
                    )}
                  </div>
                  
                  <h3 className="font-semibold text-lg mb-1">
                    {booking.model?.name} • {booking.location?.title}
                  </h3>
                  
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>
                      📅 {new Date(booking.startAt).toLocaleDateString()} at {' '}
                      {new Date(booking.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {' '} → {' '}
                      {new Date(booking.endAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p>👤 {booking.client?.fullName || 'Unknown client'}</p>
                    <p>💰 Total: £{booking.priceTotal} {booking.currency}</p>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Link href={`/admin/bookings/${booking.id}`}>
                    <Button size="sm">View Details</Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {bookings.length === 0 && (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              No bookings found
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
