// BOOKINGS LIST PAGE
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const statusStyles: Record<string, string> = {
  draft: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  deposit_required: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  confirmed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  in_progress: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  completed: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
  no_show: 'bg-red-500/10 text-red-400 border-red-500/20',
  expired: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
};

export default function BookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => { loadBookings(); }, []);
  
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
  
  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">Bookings</h1>
          <p className="text-sm text-zinc-500 mt-1">Loading...</p>
        </div>
        <div className="space-y-3 animate-pulse">
          {[...Array(5)].map((_, i) => <div key={i} className="h-24 bg-zinc-800/30 rounded-xl" />)}
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">Bookings</h1>
        <p className="text-sm text-zinc-500 mt-1">{bookings.length} total bookings</p>
      </div>
      
      <div className="space-y-3">
        {bookings.map(booking => (
          <div key={booking.id} className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-5 hover:bg-zinc-800/30 transition-colors duration-100">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${statusStyles[booking.status] || statusStyles.draft}`}>
                    {booking.status}
                  </span>
                  {booking.depositRequired && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border border-zinc-700/50 text-zinc-500">
                      Deposit: £{booking.depositRequired}
                    </span>
                  )}
                </div>
                
                <h3 className="text-sm font-medium text-zinc-200 mb-1">
                  {booking.model?.name} · {booking.location?.title}
                </h3>
                
                <div className="text-xs text-zinc-500 space-y-0.5">
                  <p>
                    {new Date(booking.startAt).toLocaleDateString()} at{' '}
                    {new Date(booking.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {' → '}
                    {new Date(booking.endAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <p>{booking.client?.fullName || 'Unknown client'}</p>
                  <p>Total: £{booking.priceTotal} {booking.currency}</p>
                </div>
              </div>
              
              <Link href={`/admin/bookings/${booking.id}`}>
                <button className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-900 text-xs font-medium transition-colors duration-150">
                  View
                </button>
              </Link>
            </div>
          </div>
        ))}
        
        {bookings.length === 0 && (
          <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-8 text-center">
            <p className="text-zinc-500">No bookings found</p>
          </div>
        )}
      </div>
    </div>
  );
}
