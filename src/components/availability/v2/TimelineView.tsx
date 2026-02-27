// TIMELINE VIEW - Multi-model compact timeline
'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type TimelineSlot = {
  id: string;
  modelId: string;
  startAt: string;
  endAt: string;
  status: 'available' | 'unavailable' | 'tentative';
  booking?: {
    id: string;
    client?: { fullName: string };
  };
};

type Model = {
  id: string;
  name: string;
};

export default function TimelineView({ 
  models,
  slots,
  viewDate,
  viewMode,
  onDateChange,
  onViewModeChange,
  onSlotClick
}: { 
  models: Model[];
  slots: TimelineSlot[];
  viewDate: Date;
  viewMode: 'day' | 'week';
  onDateChange: (date: Date) => void;
  onViewModeChange: (mode: 'day' | 'week') => void;
  onSlotClick?: (slot: TimelineSlot) => void;
}) {
  
  // Get days to display
  function getDays(): Date[] {
    if (viewMode === 'day') {
      return [viewDate];
    }
    
    const days: Date[] = [];
    const start = new Date(viewDate);
    start.setDate(start.getDate() - start.getDay() + 1); // Monday
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      days.push(day);
    }
    return days;
  }
  
  function previousPeriod() {
    const date = new Date(viewDate);
    date.setDate(date.getDate() - (viewMode === 'day' ? 1 : 7));
    onDateChange(date);
  }
  
  function nextPeriod() {
    const date = new Date(viewDate);
    date.setDate(date.getDate() + (viewMode === 'day' ? 1 : 7));
    onDateChange(date);
  }
  
  function today() {
    onDateChange(new Date());
  }
  
  function getSlotPosition(slot: TimelineSlot, dayStart: Date): { left: string; width: string } | null {
    const slotStart = new Date(slot.startAt);
    const slotEnd = new Date(slot.endAt);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);
    
    // Check if slot is on this day
    if (slotStart >= dayEnd || slotEnd <= dayStart) return null;
    
    // Calculate position (0-24 hours)
    const startHour = slotStart.getHours() + slotStart.getMinutes() / 60;
    const durationHours = (slotEnd.getTime() - slotStart.getTime()) / (1000 * 60 * 60);
    
    return {
      left: `${(startHour / 24) * 100}%`,
      width: `${(durationHours / 24) * 100}%`
    };
  }
  
  function getStatusColor(status: string, hasBooking: boolean) {
    if (hasBooking) return 'bg-red-500 border-red-600';
    if (status === 'available') return 'bg-green-500 border-green-600';
    if (status === 'unavailable') return 'bg-red-500 border-red-600';
    return 'bg-yellow-500 border-yellow-600';
  }
  
  const days = getDays();
  const hours = Array.from({ length: 24 }, (_, i) => i);
  
  return (
    <Card>
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={previousPeriod}>←</Button>
            <Button variant="outline" size="sm" onClick={today}>Today</Button>
            <Button variant="outline" size="sm" onClick={nextPeriod}>→</Button>
            
            <span className="ml-4 font-semibold">
              {viewMode === 'day' 
                ? viewDate.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
                : `Week of ${days[0].toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`
              }
            </span>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant={viewMode === 'day' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => onViewModeChange('day')}
            >
              Day
            </Button>
            <Button 
              variant={viewMode === 'week' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => onViewModeChange('week')}
            >
              Week
            </Button>
          </div>
        </div>
        
        {/* Timeline */}
        <div className="space-y-3">
          {days.map((day, dayIndex) => (
            <div key={dayIndex}>
              {/* Day Header */}
              <div className="text-xs font-semibold mb-1 text-muted-foreground">
                {day.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
              </div>
              
              {/* Models Timeline */}
              {models.map(model => {
                const modelSlots = slots.filter(s => s.modelId === model.id);
                
                return (
                  <div key={model.id} className="mb-2">
                    {/* Model Name */}
                    <div className="text-xs text-muted-foreground mb-1">{model.name}</div>
                    
                    {/* Timeline Bar */}
                    <div className="relative h-8 bg-muted rounded">
                      {/* Hour Markers (subtle) */}
                      {hours.map(hour => (
                        <div
                          key={hour}
                          className="absolute top-0 bottom-0 border-l border-border/30"
                          style={{ left: `${(hour / 24) * 100}%` }}
                        />
                      ))}
                      
                      {/* Slots */}
                      {modelSlots.map(slot => {
                        const pos = getSlotPosition(slot, day);
                        if (!pos) return null;
                        
                        return (
                          <div
                            key={slot.id}
                            className={`absolute top-1 bottom-1 rounded border-2 ${getStatusColor(slot.status, !!slot.booking)} cursor-pointer hover:opacity-80 transition-opacity`}
                            style={pos}
                            onClick={() => onSlotClick?.(slot)}
                            title={slot.booking?.client?.fullName || slot.status}
                          >
                            <div className="px-2 py-1 text-xs text-white truncate">
                              {slot.booking?.client?.fullName || 
                               new Date(slot.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              
              {models.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Select models to view timeline
                </p>
              )}
            </div>
          ))}
        </div>
        
        {/* Legend */}
        <div className="flex gap-4 mt-4 pt-4 border-t text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span>Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span>Booked</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-500 rounded"></div>
            <span>Tentative</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
