// AVAILABILITY PAGE (WITH PROPER MODEL ID)
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AvailabilityCalendar from '@/components/availability/AvailabilityCalendar';
import AddSlotForm from '@/components/availability/forms/AddSlotForm';

export default function AvailabilityPage() {
  const [models, setModels] = useState<any[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string>('');
  const [mismatches, setMismatches] = useState<any[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadModels();
    loadMismatches();
  }, []);
  
  async function loadModels() {
    try {
      // Get models from bookings (they have model info)
      const res = await fetch('/api/v1/bookings?limit=1');
      const data = await res.json();
      
      if (data.data?.bookings?.[0]?.model) {
        const model = data.data.bookings[0].model;
        setModels([{
          id: model.id,
          name: model.name,
          publicCode: model.publicCode
        }]);
        setSelectedModelId(model.id); // Auto-select Sophia
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Failed to load models:', error);
      setLoading(false);
    }
  }
  
  async function loadMismatches() {
    try {
      const res = await fetch('/api/v1/availability/mismatches');
      const data = await res.json();
      setMismatches(data.data?.mismatches || []);
    } catch (error) {
      console.error('Failed to load mismatches:', error);
    }
  }
  
  function handleSlotCreated() {
    setRefreshKey(prev => prev + 1);
    loadMismatches();
    setShowAddForm(false);
  }
  
  if (loading) {
    return <div className="p-6">Loading...</div>;
  }
  
  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">📅 Availability Management</h1>
            <p className="text-muted-foreground">
              Manage model availability and detect conflicts
            </p>
          </div>
          
          <Button 
            onClick={() => setShowAddForm(!showAddForm)}
            variant={showAddForm ? 'outline' : 'default'}
          >
            {showAddForm ? 'Hide Form' : '➕ Add Slot'}
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Main Content - Left */}
        <div className="lg:col-span-2 space-y-6">
          {/* Model Selector */}
          <Card>
            <CardHeader>
              <CardTitle>Select Model</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedModelId('')}
                  className={`px-4 py-2 rounded ${!selectedModelId ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
                >
                  All Models
                </button>
                {models.map(model => (
                  <button
                    key={model.id}
                    onClick={() => setSelectedModelId(model.id)}
                    className={`px-4 py-2 rounded ${selectedModelId === model.id ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
                  >
                    {model.name}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
          
          {/* Conflicts Alert */}
          {mismatches.length > 0 && (
            <Card className="border-orange-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  ⚠️ Availability Conflicts
                  <Badge variant="destructive">{mismatches.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {mismatches.slice(0, 3).map((mismatch, i) => (
                    <div key={i} className="text-sm bg-muted p-2 rounded">
                      <span className="font-semibold">Booking {mismatch.bookingId.slice(0, 8)}...</span>
                      {' '}has {mismatch.type === 'unavailable_conflict' ? 'conflict with unavailable slot' : 'no matching availability'}
                    </div>
                  ))}
                  {mismatches.length > 3 && (
                    <p className="text-sm text-muted-foreground">
                      +{mismatches.length - 3} more conflicts
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
        
        {/* Add Form - Right */}
        <div className="lg:col-span-1">
          {showAddForm && selectedModelId && (
            <AddSlotForm
              modelId={selectedModelId}
              onSuccess={handleSlotCreated}
            />
          )}
          
          {showAddForm && !selectedModelId && (
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground text-center">
                  Please select a model first
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      
      {/* Calendar */}
      <AvailabilityCalendar 
        key={refreshKey} 
        modelId={selectedModelId || undefined} 
      />
    </div>
  );
}
