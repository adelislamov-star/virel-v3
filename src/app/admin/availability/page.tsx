// AVAILABILITY PAGE
'use client';

import { useState, useEffect } from 'react';
import AvailabilityCalendar from '@/components/availability/AvailabilityCalendar';
import AddSlotForm from '@/components/availability/forms/AddSlotForm';

export default function AvailabilityPage() {
  const [models, setModels] = useState<any[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string>('');
  const [mismatches, setMismatches] = useState<any[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => { loadModels(); loadMismatches(); }, []);
  
  async function loadModels() {
    try {
      const res = await fetch('/api/v1/bookings?limit=1');
      const data = await res.json();
      if (data.data?.bookings?.[0]?.model) {
        const model = data.data.bookings[0].model;
        setModels([{ id: model.id, name: model.name, publicCode: model.publicCode }]);
        setSelectedModelId(model.id);
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
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">Availability Management</h1>
          <p className="text-sm text-zinc-500 mt-1">Loading...</p>
        </div>
        <div className="space-y-4 animate-pulse">
          <div className="h-12 bg-zinc-800/30 rounded-xl w-1/3" />
          <div className="h-64 bg-zinc-800/30 rounded-xl" />
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">Availability Management</h1>
            <p className="text-sm text-zinc-500 mt-1">Manage model availability and detect conflicts</p>
          </div>
          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className={showAddForm
              ? 'px-4 py-2 rounded-lg border border-zinc-700 hover:border-zinc-600 text-zinc-300 text-sm font-medium transition-colors duration-150'
              : 'px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-900 text-sm font-medium transition-colors duration-150'
            }
          >
            {showAddForm ? 'Hide Form' : '+ Add Slot'}
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-5">
            <h3 className="text-sm font-semibold text-zinc-300 mb-3">Select Model</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedModelId('')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-150 ${!selectedModelId ? 'bg-amber-500 text-zinc-900' : 'bg-zinc-800/50 text-zinc-400 hover:text-zinc-200'}`}
              >
                All Models
              </button>
              {models.map(model => (
                <button
                  key={model.id}
                  onClick={() => setSelectedModelId(model.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-150 ${selectedModelId === model.id ? 'bg-amber-500 text-zinc-900' : 'bg-zinc-800/50 text-zinc-400 hover:text-zinc-200'}`}
                >
                  {model.name}
                </button>
              ))}
            </div>
          </div>
          
          {mismatches.length > 0 && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5">
              <h3 className="text-sm font-semibold text-amber-400 mb-3">
                Availability Conflicts
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border bg-red-500/10 text-red-400 border-red-500/20">{mismatches.length}</span>
              </h3>
              <div className="space-y-2">
                {mismatches.slice(0, 3).map((mismatch, i) => (
                  <div key={i} className="text-sm bg-zinc-800/30 p-2 rounded-lg text-zinc-300">
                    <span className="font-medium">Booking {mismatch.bookingId.slice(0, 8)}...</span>
                    {' '}has {mismatch.type === 'unavailable_conflict' ? 'conflict with unavailable slot' : 'no matching availability'}
                  </div>
                ))}
                {mismatches.length > 3 && (
                  <p className="text-xs text-zinc-500">+{mismatches.length - 3} more conflicts</p>
                )}
              </div>
            </div>
          )}
        </div>
        
        <div className="lg:col-span-1">
          {showAddForm && selectedModelId && (
            <AddSlotForm modelId={selectedModelId} onSuccess={handleSlotCreated} />
          )}
          {showAddForm && !selectedModelId && (
            <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-5 text-center">
              <p className="text-sm text-zinc-500">Please select a model first</p>
            </div>
          )}
        </div>
      </div>
      
      <AvailabilityCalendar key={refreshKey} modelId={selectedModelId || undefined} />
    </div>
  );
}