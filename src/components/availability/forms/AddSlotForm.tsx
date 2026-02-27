// ADD AVAILABILITY SLOT FORM
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function AddSlotForm({ 
  modelId,
  onSuccess 
}: { 
  modelId: string;
  onSuccess?: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Default to today at 9 AM
  const now = new Date();
  const defaultStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0);
  const defaultEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 17, 0);
  
  const [date, setDate] = useState(defaultStart.toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [status, setStatus] = useState<'available' | 'unavailable' | 'tentative'>('available');
  
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const startAt = new Date(`${date}T${startTime}:00`);
      const endAt = new Date(`${date}T${endTime}:00`);
      
      if (endAt <= startAt) {
        throw new Error('End time must be after start time');
      }
      
      const res = await fetch('/api/v1/availability/slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelId,
          startAt: startAt.toISOString(),
          endAt: endAt.toISOString(),
          status,
          source: 'manual'
        })
      });
      
      const data = await res.json();
      
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'Failed to create slot');
      }
      
      alert('Availability slot created!');
      
      // Reset form
      setDate(defaultStart.toISOString().split('T')[0]);
      setStartTime('09:00');
      setEndTime('17:00');
      setStatus('available');
      
      if (onSuccess) onSuccess();
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>➕ Add Availability Slot</CardTitle>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Date */}
          <div>
            <label className="block text-sm font-medium mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 border rounded-md bg-background"
              required
            />
          </div>
          
          {/* Time Range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Start Time</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-background"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">End Time</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-background"
                required
              />
            </div>
          </div>
          
          {/* Status */}
          <div>
            <label className="block text-sm font-medium mb-2">Status</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStatus('available')}
                className={`px-4 py-2 rounded text-sm ${
                  status === 'available' 
                    ? 'bg-green-500 text-white' 
                    : 'bg-muted'
                }`}
              >
                Available
              </button>
              
              <button
                type="button"
                onClick={() => setStatus('unavailable')}
                className={`px-4 py-2 rounded text-sm ${
                  status === 'unavailable' 
                    ? 'bg-red-500 text-white' 
                    : 'bg-muted'
                }`}
              >
                Unavailable
              </button>
              
              <button
                type="button"
                onClick={() => setStatus('tentative')}
                className={`px-4 py-2 rounded text-sm ${
                  status === 'tentative' 
                    ? 'bg-yellow-500 text-white' 
                    : 'bg-muted'
                }`}
              >
                Tentative
              </button>
            </div>
          </div>
          
          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-800">
              ❌ {error}
            </div>
          )}
          
          {/* Submit */}
          <Button 
            type="submit" 
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Creating...' : 'Create Slot'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
