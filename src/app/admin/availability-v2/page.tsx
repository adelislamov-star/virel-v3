// AVAILABILITY PAGE v2 - BEST PRACTICES DESIGN
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import ConflictsBanner from '@/components/availability/v2/ConflictsBanner';
import ModelSelector from '@/components/availability/v2/ModelSelector';
import TimelineView from '@/components/availability/v2/TimelineView';
import SlotsDataTable from '@/components/availability/v2/SlotsDataTable';
import AddSlotForm from '@/components/availability/forms/AddSlotForm';

export default function AvailabilityPageV2() {
  const [models, setModels] = useState<any[]>([]);
  const [selectedModelIds, setSelectedModelIds] = useState<string[]>([]);
  const [slots, setSlots] = useState<any[]>([]);
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [viewDate, setViewDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week'>('week');
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadData();
  }, []);
  
  useEffect(() => {
    if (selectedModelIds.length > 0) {
      loadSlots();
    }
  }, [selectedModelIds, viewDate, viewMode]);
  
  async function loadData() {
    try {
      const bookingsRes = await fetch('/api/v1/bookings?limit=10');
      const bookingsData = await bookingsRes.json();
      
      const uniqueModels = new Map();
      bookingsData.data?.bookings?.forEach((b: any) => {
        if (b.model && !uniqueModels.has(b.model.id)) {
          uniqueModels.set(b.model.id, {
            id: b.model.id,
            name: b.model.name,
            publicCode: b.model.publicCode
          });
        }
      });
      
      const modelsList = Array.from(uniqueModels.values());
      setModels(modelsList);
      
      if (modelsList.length > 0) {
        setSelectedModelIds([modelsList[0].id]);
      }
      
      const conflictsRes = await fetch('/api/v1/availability/mismatches');
      const conflictsData = await conflictsRes.json();
      setConflicts(conflictsData.data?.mismatches || []);
      
      setLoading(false);
    } catch (error) {
      console.error('Failed to load data:', error);
      setLoading(false);
    }
  }
  
  async function loadSlots() {
    try {
      const from = getViewStart();
      const to = getViewEnd();
      
      const promises = selectedModelIds.map(modelId => 
        fetch(`/api/v1/availability/slots?model_id=${modelId}&from=${from.toISOString()}&to=${to.toISOString()}`)
          .then(res => res.json())
      );
      
      const results = await Promise.all(promises);
      const allSlots = results.flatMap(r => r.data?.slots || []);
      setSlots(allSlots);
    } catch (error) {
      console.error('Failed to load slots:', error);
    }
  }
  
  function getViewStart() {
    const date = new Date(viewDate);
    if (viewMode === 'day') {
      date.setHours(0, 0, 0, 0);
    } else {
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
  
  function handleSlotCreated() {
    loadSlots();
    loadData();
    setShowAddForm(false);
  }
  
  const selectedModels = models.filter(m => selectedModelIds.includes(m.id));
  
  if (loading) {
    return <div className="p-6">Loading...</div>;
  }
  
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">📅 Availability Management</h1>
          <p className="text-muted-foreground">
            Manage model schedules, detect conflicts, optimize bookings
          </p>
        </div>
        
        <Button 
          onClick={() => setShowAddForm(!showAddForm)}
          size="lg"
        >
          ➕ Add Availability
        </Button>
      </div>
      
      <ConflictsBanner 
        conflicts={conflicts}
        onResolve={(bookingId) => {
          console.log('Resolve:', bookingId);
        }}
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <ModelSelector
            models={models}
            selectedIds={selectedModelIds}
            onChange={setSelectedModelIds}
          />
          
          {showAddForm && selectedModelIds.length === 1 && (
            <div className="mt-4">
              <AddSlotForm
                modelId={selectedModelIds[0]}
                onSuccess={handleSlotCreated}
              />
            </div>
          )}
        </div>
        
        <div className="lg:col-span-3">
          <TimelineView
            models={selectedModels}
            slots={slots}
            viewDate={viewDate}
            viewMode={viewMode}
            onDateChange={setViewDate}
            onViewModeChange={setViewMode}
            onSlotClick={(slot) => console.log('Slot:', slot)}
          />
        </div>
      </div>
      
      <SlotsDataTable
        slots={slots}
        onEdit={(id) => console.log('Edit:', id)}
        onDelete={(id) => confirm('Delete?') && console.log('Delete:', id)}
      />
    </div>
  );
}
