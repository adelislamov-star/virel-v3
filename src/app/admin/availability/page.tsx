// AVAILABILITY ENGINE — Sprint 2
// Calendar view (day/week), Filters, Manual Block form, Conflicts panel
'use client';

import { useState, useEffect, useCallback } from 'react';

// ─── Types ───────────────────────────────────────────────

type Model = { id: string; name: string; publicCode: string };
type Slot = {
  id: string;
  modelId: string;
  startAt: string;
  endAt: string;
  status: string;
  source: string;
  bookingId?: string | null;
  notes?: string | null;
  city?: string | null;
};
type Conflict = {
  id: string;
  modelId: string;
  conflictType: string;
  status: string;
  bookingId?: string | null;
  conflictingSlotId: string;
  createdAt: string;
  model?: { name: string; publicCode: string };
};

// ─── Helpers ─────────────────────────────────────────────

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day + (day === 0 ? -6 : 1));
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function fmtDate(d: Date) {
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function statusColor(status: string): string {
  const map: Record<string, string> = {
    booked: 'bg-blue-500/80',
    blocked: 'bg-red-500/80',
    travel: 'bg-purple-500/80',
    cooldown: 'bg-orange-500/80',
    available: 'bg-emerald-500/80',
    unavailable: 'bg-zinc-600/80',
  };
  return map[status] || 'bg-zinc-600/80';
}

function conflictTypeLabel(t: string): string {
  const map: Record<string, string> = {
    overlap: 'Overlap',
    travel_gap_too_short: 'Travel gap too short',
    cooldown_violation: 'Cooldown violation',
    manual_block_conflict: 'Manual block conflict',
  };
  return map[t] || t;
}

// ─── Main Component ──────────────────────────────────────

export default function AvailabilityPage() {
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string>('');
  const [cityFilter, setCityFilter] = useState<string>('');
  const [slots, setSlots] = useState<Slot[]>([]);
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [viewDate, setViewDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week'>('week');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Block form state
  const [showBlockForm, setShowBlockForm] = useState(false);
  const [blockStart, setBlockStart] = useState('');
  const [blockEnd, setBlockEnd] = useState('');
  const [blockNotes, setBlockNotes] = useState('');
  const [blockSubmitting, setBlockSubmitting] = useState(false);

  // ─── Data loading ────────────────────────────────────

  const loadModels = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/models?limit=50');
      const data = await res.json();
      const list: Model[] = (data.data?.models || []).map((m: any) => ({
        id: m.id,
        name: m.name,
        publicCode: m.publicCode,
      }));
      setModels(list);
      if (list.length > 0 && !selectedModelId) setSelectedModelId(list[0].id);
    } catch {
      // fallback: try from bookings
      try {
        const res = await fetch('/api/v1/bookings?limit=20');
        const data = await res.json();
        const map = new Map<string, Model>();
        (data.data?.bookings || []).forEach((b: any) => {
          if (b.model && !map.has(b.model.id)) {
            map.set(b.model.id, { id: b.model.id, name: b.model.name, publicCode: b.model.publicCode });
          }
        });
        const list = Array.from(map.values());
        setModels(list);
        if (list.length > 0 && !selectedModelId) setSelectedModelId(list[0].id);
      } catch (err) {
        console.error('Failed to load models:', err);
      }
    }
  }, []);

  const loadSlots = useCallback(async () => {
    if (!selectedModelId) { setSlots([]); return; }
    try {
      const start = viewMode === 'day'
        ? new Date(new Date(viewDate).setHours(0, 0, 0, 0))
        : getWeekStart(viewDate);
      const end = viewMode === 'day' ? addDays(start, 1) : addDays(start, 7);
      const params = new URLSearchParams({
        dateFrom: start.toISOString(),
        dateTo: end.toISOString(),
      });
      const res = await fetch(`/api/v1/models/${selectedModelId}/availability?${params}`);
      const data = await res.json();
      setSlots(data.data?.slots || []);
    } catch (err) {
      console.error('Failed to load slots:', err);
    }
  }, [selectedModelId, viewDate, viewMode]);

  const loadConflicts = useCallback(async () => {
    try {
      const params = new URLSearchParams({ status: 'open' });
      if (selectedModelId) params.set('modelId', selectedModelId);
      const res = await fetch(`/api/v1/availability/conflicts?${params}`);
      const data = await res.json();
      setConflicts(data.data?.conflicts || []);
    } catch (err) {
      console.error('Failed to load conflicts:', err);
    }
  }, [selectedModelId]);

  useEffect(() => {
    loadModels().then(() => setLoading(false));
  }, [loadModels]);

  useEffect(() => {
    loadSlots();
    loadConflicts();
  }, [loadSlots, loadConflicts]);

  // ─── Actions ─────────────────────────────────────────

  async function handleCreateBlock(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedModelId || !blockStart || !blockEnd) return;
    setBlockSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/models/${selectedModelId}/availability/block`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startAt: new Date(blockStart).toISOString(),
          endAt: new Date(blockEnd).toISOString(),
          notes: blockNotes || undefined,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error?.message || 'Failed to create block');
      setBlockStart('');
      setBlockEnd('');
      setBlockNotes('');
      setShowBlockForm(false);
      loadSlots();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBlockSubmitting(false);
    }
  }

  async function handleDeleteSlot(slotId: string) {
    if (!selectedModelId) return;
    try {
      const res = await fetch(`/api/v1/models/${selectedModelId}/availability/${slotId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error?.message || 'Failed to delete');
      loadSlots();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleResolveConflict(conflictId: string) {
    try {
      const res = await fetch(`/api/v1/availability/conflicts/${conflictId}/resolve`, {
        method: 'PATCH',
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error?.message || 'Failed to resolve');
      loadConflicts();
    } catch (err: any) {
      setError(err.message);
    }
  }

  // ─── Calendar helpers ────────────────────────────────

  const viewStart = viewMode === 'day'
    ? (() => { const d = new Date(viewDate); d.setHours(0, 0, 0, 0); return d; })()
    : getWeekStart(viewDate);
  const days = viewMode === 'day'
    ? [viewStart]
    : Array.from({ length: 7 }, (_, i) => addDays(viewStart, i));
  const hours = Array.from({ length: 24 }, (_, i) => i);

  function getSlotPos(slot: Slot, dayStart: Date) {
    const s = new Date(slot.startAt);
    const e = new Date(slot.endAt);
    const dayEnd = addDays(dayStart, 1);
    if (s >= dayEnd || e <= dayStart) return null;
    const hStart = s.getHours() + s.getMinutes() / 60;
    const dur = (e.getTime() - s.getTime()) / 3_600_000;
    return { top: hStart * 48, height: Math.max(dur * 48, 16) };
  }

  // Filter slots by city
  const filteredSlots = cityFilter
    ? slots.filter(s => s.city?.toLowerCase().includes(cityFilter.toLowerCase()))
    : slots;

  // ─── Render ──────────────────────────────────────────

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">Availability Engine</h1>
        <p className="text-sm text-zinc-500 mt-1">Loading...</p>
        <div className="mt-6 space-y-4 animate-pulse">
          <div className="h-12 bg-zinc-800/30 rounded-xl" />
          <div className="h-64 bg-zinc-800/30 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">Availability Engine</h1>
          <p className="text-sm text-zinc-500 mt-1">Calendar, manual blocks, conflict resolution</p>
        </div>
        <button
          onClick={() => setShowBlockForm(!showBlockForm)}
          className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-900 text-sm font-medium transition-colors"
        >
          {showBlockForm ? 'Cancel' : '+ Block Time'}
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-400 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300 ml-4">Dismiss</button>
        </div>
      )}

      {/* Conflicts panel */}
      {conflicts.length > 0 && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5">
          <h3 className="text-sm font-semibold text-amber-400 mb-3 flex items-center gap-2">
            Open Conflicts
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
              {conflicts.length}
            </span>
          </h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {conflicts.map(c => (
              <div key={c.id} className="flex items-center justify-between bg-zinc-800/30 p-3 rounded-lg text-sm">
                <div className="text-zinc-300">
                  <span className="font-medium">{c.model?.name || 'Model'}</span>
                  {' \u2014 '}
                  <span className="text-zinc-400">{conflictTypeLabel(c.conflictType)}</span>
                  <span className="text-zinc-500 ml-2 text-xs">{new Date(c.createdAt).toLocaleDateString('en-GB')}</span>
                </div>
                <button
                  onClick={() => handleResolveConflict(c.id)}
                  className="px-3 py-1 rounded-md bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-xs font-medium transition-colors"
                >
                  Resolve
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Model filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-zinc-500 uppercase tracking-wider">Model</span>
          {models.length === 0 && <span className="text-sm text-zinc-500">No models found</span>}
          {models.map(m => (
            <button
              key={m.id}
              onClick={() => setSelectedModelId(m.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                selectedModelId === m.id
                  ? 'bg-amber-500 text-zinc-900'
                  : 'bg-zinc-800/50 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {m.name}
            </button>
          ))}
        </div>

        {/* City filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500 uppercase tracking-wider">City</span>
          <input
            type="text"
            placeholder="Filter by city..."
            value={cityFilter}
            onChange={e => setCityFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-zinc-800/50 border border-zinc-700/50 text-zinc-300 text-sm placeholder-zinc-500 focus:outline-none focus:border-amber-500/50 w-40"
          />
        </div>

        {/* Date nav */}
        <div className="flex items-center gap-2 ml-auto">
          <button onClick={() => setViewDate(d => addDays(d, viewMode === 'day' ? -1 : -7))} className="px-2 py-1.5 rounded-lg bg-zinc-800/50 text-zinc-400 hover:text-zinc-200 text-sm">&larr;</button>
          <button onClick={() => setViewDate(new Date())} className="px-3 py-1.5 rounded-lg bg-zinc-800/50 text-zinc-400 hover:text-zinc-200 text-sm">Today</button>
          <button onClick={() => setViewDate(d => addDays(d, viewMode === 'day' ? 1 : 7))} className="px-2 py-1.5 rounded-lg bg-zinc-800/50 text-zinc-400 hover:text-zinc-200 text-sm">&rarr;</button>

          <span className="text-sm text-zinc-300 ml-2 min-w-[160px]">
            {viewMode === 'day'
              ? viewStart.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
              : `Week of ${fmtDate(viewStart)}`}
          </span>

          <div className="flex rounded-lg overflow-hidden border border-zinc-700/50 ml-2">
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${viewMode === 'day' ? 'bg-amber-500 text-zinc-900' : 'bg-zinc-800/50 text-zinc-400 hover:text-zinc-200'}`}
            >
              Day
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${viewMode === 'week' ? 'bg-amber-500 text-zinc-900' : 'bg-zinc-800/50 text-zinc-400 hover:text-zinc-200'}`}
            >
              Week
            </button>
          </div>
        </div>
      </div>

      {/* Manual block form */}
      {showBlockForm && (
        <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-5">
          <h3 className="text-sm font-semibold text-zinc-300 mb-4">Create Manual Block</h3>
          {!selectedModelId ? (
            <p className="text-sm text-zinc-500">Select a model first</p>
          ) : (
            <form onSubmit={handleCreateBlock} className="flex flex-wrap items-end gap-4">
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Start</label>
                <input
                  type="datetime-local"
                  value={blockStart}
                  onChange={e => setBlockStart(e.target.value)}
                  required
                  className="px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm focus:outline-none focus:border-amber-500/50"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">End</label>
                <input
                  type="datetime-local"
                  value={blockEnd}
                  onChange={e => setBlockEnd(e.target.value)}
                  required
                  className="px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm focus:outline-none focus:border-amber-500/50"
                />
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs text-zinc-500 mb-1">Notes (optional)</label>
                <input
                  type="text"
                  value={blockNotes}
                  onChange={e => setBlockNotes(e.target.value)}
                  placeholder="Reason for block..."
                  className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm placeholder-zinc-500 focus:outline-none focus:border-amber-500/50"
                />
              </div>
              <button
                type="submit"
                disabled={blockSubmitting}
                className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-400 text-white text-sm font-medium transition-colors disabled:opacity-50"
              >
                {blockSubmitting ? 'Creating...' : 'Create Block'}
              </button>
            </form>
          )}
        </div>
      )}

      {/* Calendar grid */}
      <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[600px]">
            {/* Day headers */}
            <div className="flex border-b border-zinc-800/50 bg-zinc-900/80">
              <div className="w-14 flex-shrink-0" />
              {days.map((day, i) => (
                <div key={i} className="flex-1 p-2 text-center border-l border-zinc-800/30">
                  <div className="text-xs font-semibold text-zinc-300">
                    {day.toLocaleDateString('en-GB', { weekday: 'short' })}
                  </div>
                  <div className="text-xs text-zinc-500">{day.getDate()}</div>
                </div>
              ))}
            </div>

            {/* Hour rows */}
            <div className="relative">
              {hours.map(hour => (
                <div key={hour} className="flex border-b border-zinc-800/20" style={{ height: 48 }}>
                  <div className="w-14 flex-shrink-0 pr-2 pt-0.5 text-right text-[10px] text-zinc-600">
                    {hour.toString().padStart(2, '0')}:00
                  </div>
                  {days.map((_, di) => (
                    <div key={di} className="flex-1 border-l border-zinc-800/20" />
                  ))}
                </div>
              ))}

              {/* Slots overlay */}
              {days.map((day, dayIndex) => {
                const daySlots = filteredSlots.filter(s => {
                  const ss = new Date(s.startAt);
                  return ss.toDateString() === day.toDateString();
                });
                return daySlots.map(slot => {
                  const pos = getSlotPos(slot, day);
                  if (!pos) return null;
                  const colWidth = 100 / days.length;
                  const left = 3.6 + dayIndex * colWidth; // 3.6rem ~ w-14 offset approximated
                  return (
                    <div
                      key={slot.id}
                      className={`absolute rounded-md ${statusColor(slot.status)} border border-white/10 px-1.5 py-0.5 overflow-hidden group cursor-default`}
                      style={{
                        top: pos.top,
                        height: pos.height,
                        left: `calc(3.5rem + ${dayIndex * colWidth}%)`,
                        width: `calc(${colWidth}% - 4px)`,
                        zIndex: 10,
                      }}
                      title={`${slot.status} (${slot.source})${slot.notes ? ` — ${slot.notes}` : ''}`}
                    >
                      <div className="text-[10px] text-white font-medium truncate leading-tight">
                        {fmtTime(slot.startAt)}–{fmtTime(slot.endAt)}
                      </div>
                      <div className="text-[9px] text-white/70 truncate">{slot.status}</div>
                      {slot.source === 'manual' && slot.status === 'blocked' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteSlot(slot.id); }}
                          className="absolute top-0.5 right-0.5 hidden group-hover:block text-white/50 hover:text-white text-[10px]"
                          title="Remove block"
                        >
                          &times;
                        </button>
                      )}
                    </div>
                  );
                });
              })}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex gap-4 p-3 border-t border-zinc-800/50 text-[11px] text-zinc-400">
          {['booked', 'blocked', 'travel', 'cooldown', 'available'].map(s => (
            <div key={s} className="flex items-center gap-1.5">
              <div className={`w-3 h-3 rounded ${statusColor(s)}`} />
              <span className="capitalize">{s}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Empty state */}
      {filteredSlots.length === 0 && !loading && (
        <div className="text-center py-12 text-zinc-500 text-sm">
          No availability slots for this period.
          {selectedModelId && ' Try a different date range or add a manual block.'}
        </div>
      )}

      {/* Summary */}
      <div className="text-xs text-zinc-600">
        {filteredSlots.length} slot{filteredSlots.length !== 1 ? 's' : ''} shown
        {cityFilter && ` (filtered by "${cityFilter}")`}
      </div>
    </div>
  );
}
