// AVAILABILITY CALENDAR COMPONENT
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type CalendarSlot = {
  id: string;
  modelId: string;
  startAt: string;
  endAt: string;
  status: 'available' | 'unavailable' | 'tentative';
  source: string;
  model?: { name: string };
};

export default function AvailabilityCalendar({ modelId }: { modelId?: string }) {
  const [slots, setSlots] = useState<CalendarSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week'>('week');
  
  useEffect(() => {
    loadSlots();
  }, [modelId, selectedDate, viewMode]);
  
  async function loadSlots() {
    try {
      const from = getViewStart();
      const to = getViewEnd();
      
      const params = new URLSearchParams();
      if (modelId) params.set('model_id', modelId);
      params.set('from', from.toISOString());
      params.set('to', to.toISOString());
      
      const res = await fetch(`/api/v1/availability/slots?${params}`);
      const data = await res.json();
      
      setSlots(data.data?.slots || []);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load slots:', error);
      setLoading(false);
    }
  }
  
  function getViewStart() {
    const date = new Date(selectedDate);
    if (viewMode === 'day') {
      date.setHours(0, 0, 0, 0);
    } else {
      // Start of week (Monday)
      const day = date.getDay();
      const diff = date.getDate() - day + (day === 0 ? -6 : 1);
      date.setDate(diff);
      date.setHours(0, 0, 0, 0);
    }
    return date;
  }
  
  function getViewEnd() {
    const date = new Date(getViewStart());
    if (viewMode === 'day') {
      date.setDate(date.getDate() + 1);
    } else {
      date.setDate(date.getDate() + 7);
    }
    return date;
  }
  
  function getHoursInView() {
    return Array.from({ length: 24 }, (_, i) => i);
  }
  
  function getDaysInView() {
    if (viewMode === 'day') {
      return [getViewStart()];
    }
    
    const days = [];
    const start = getViewStart();
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      days.push(day);
    }
    return days;
  }
  
  function getSlotPosition(slot: CalendarSlot) {
    const start = new Date(slot.startAt);
    const end = new Date(slot.endAt);
    const viewStart = getViewStart();
    
    const dayOffset = Math.floor((start.getTime() - viewStart.getTime()) / (1000 * 60 * 60 * 24));
    const hourStart = start.getHours() + start.getMinutes() / 60;
    const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    
    return { dayOffset, hourStart, duration };
  }
  
  function getStatusColor(status: string) {
    const colors: any = {
      available: 'bg-green-200 border-green-400',
      unavailable: 'bg-red-200 border-red-400',
      tentative: 'bg-yellow-200 border-yellow-400'
    };
    return colors[status] || 'bg-gray-200';
  }
  
  function previousPeriod() {
    const date = new Date(selectedDate);
    if (viewMode === 'day') {
      date.setDate(date.getDate() - 1);
    } else {
      date.setDate(date.getDate() - 7);
    }
    setSelectedDate(date);
  }
  
  function nextPeriod() {
    const date = new Date(selectedDate);
    if (viewMode === 'day') {
      date.setDate(date.getDate() + 1);
    } else {
      date.setDate(date.getDate() + 7);
    }
    setSelectedDate(date);
  }
  
  function today() {
    setSelectedDate(new Date());
  }
  
  if (loading) {
    return <div className="p-6">Loading calendar...</div>;
  }
  
  const days = getDaysInView();
  const hours = getHoursInView();
  
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={previousPeriod}>←</Button>
          <Button variant="outline" size="sm" onClick={today}>Today</Button>
          <Button variant="outline" size="sm" onClick={nextPeriod}>→</Button>
          
          <span className="ml-4 font-semibold">
            {viewMode === 'day' 
              ? selectedDate.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
              : `Week of ${getViewStart().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`
            }
          </span>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant={viewMode === 'day' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setViewMode('day')}
          >
            Day
          </Button>
          <Button 
            variant={viewMode === 'week' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setViewMode('week')}
          >
            Week
          </Button>
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex gap-4 mb-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-200 border border-green-400 rounded"></div>
          <span>Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-200 border border-red-400 rounded"></div>
          <span>Unavailable</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-200 border border-yellow-400 rounded"></div>
          <span>Tentative</span>
        </div>
      </div>
      
      {/* Calendar Grid */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full">
              {/* Day Headers */}
              <div className="flex border-b bg-muted">
                <div className="w-16 flex-shrink-0"></div>
                {days.map((day, i) => (
                  <div key={i} className="flex-1 min-w-[120px] p-2 text-center border-l">
                    <div className="font-semibold">
                      {day.toLocaleDateString('en-GB', { weekday: 'short' })}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {day.getDate()}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Time Grid */}
              <div className="relative">
                {hours.map((hour) => (
                  <div key={hour} className="flex border-b" style={{ height: '60px' }}>
                    <div className="w-16 flex-shrink-0 p-2 text-xs text-muted-foreground text-right">
                      {hour}:00
                    </div>
                    {days.map((day, dayIndex) => (
                      <div key={dayIndex} className="flex-1 min-w-[120px] border-l relative"></div>
                    ))}
                  </div>
                ))}
                
                {/* Slots */}
                {slots.map((slot) => {
                  const pos = getSlotPosition(slot);
                  if (pos.dayOffset < 0 || pos.dayOffset >= days.length) return null;
                  
                  return (
                    <div
                      key={slot.id}
                      className={`absolute border-2 rounded p-1 ${getStatusColor(slot.status)}`}
                      style={{
                        left: `${4 + pos.dayOffset * (100 / days.length)}%`,
                        top: `${pos.hourStart * 60}px`,
                        width: `${100 / days.length - 1}%`,
                        height: `${pos.duration * 60}px`,
                        zIndex: 10
                      }}
                    >
                      <div className="text-xs font-semibold">
                        {new Date(slot.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className="text-xs">
                        {slot.model?.name || slot.status}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Summary */}
      <div className="mt-4 text-sm text-muted-foreground">
        Showing {slots.length} slots
      </div>
    </div>
  );
}
