'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, X, Check } from 'lucide-react';
import SectionCard from './SectionCard';

interface Slot {
  id: string;
  startAt: string;
  endAt: string;
  status: string;
  source: string;
  notes?: string | null;
}

interface Props {
  modelId: string;
  onToast: (msg: string, type: 'success' | 'error') => void;
}

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

function formatTime(isoStr: string): string {
  const d = new Date(isoStr);
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
}

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const statusStyles: Record<string, string> = {
  available: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  booked: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  blocked: 'bg-red-500/10 text-red-400 border-red-500/20',
  busy: 'bg-red-500/10 text-red-400 border-red-500/20',
  travel: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  away: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  tentative: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  unavailable: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
};

export default function Availability({ modelId, onToast }: Props) {
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingDay, setAddingDay] = useState<string | null>(null);
  const [newSlot, setNewSlot] = useState({ type: 'available', from: '10:00', to: '22:00', notes: '' });
  const [rangeMode, setRangeMode] = useState(false);
  const [rangeSlot, setRangeSlot] = useState({ dateFrom: '', dateTo: '', type: 'available', from: '10:00', to: '22:00', notes: '' });
  const [rangeSaving, setRangeSaving] = useState(false);

  const loadSlots = useCallback(async () => {
    try {
      setLoading(true);
      const from = formatDate(weekStart);
      const to = formatDate(new Date(weekStart.getTime() + 7 * 86400000));
      const res = await fetch(`/api/v1/models/${modelId}/availability?dateFrom=${from}T00:00:00Z&dateTo=${to}T23:59:59Z`);
      const json = await res.json();
      if (json.success) {
        setSlots(json.data.slots || []);
      }
    } catch {
      onToast('Failed to load availability', 'error');
    } finally {
      setLoading(false);
    }
  }, [modelId, weekStart, onToast]);

  useEffect(() => { loadSlots(); }, [loadSlots]);

  const prevWeek = () => setWeekStart(new Date(weekStart.getTime() - 7 * 86400000));
  const nextWeek = () => setWeekStart(new Date(weekStart.getTime() + 7 * 86400000));

  const deleteSlot = async (slotId: string) => {
    try {
      const res = await fetch(`/api/v1/models/${modelId}/availability/${slotId}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setSlots((prev) => prev.filter((s) => s.id !== slotId));
        onToast('Slot removed', 'success');
      } else {
        onToast(json.error?.message || 'Failed to remove', 'error');
      }
    } catch {
      onToast('Something went wrong', 'error');
    }
  };

  const addSlot = async (dateStr: string) => {
    if (newSlot.from >= newSlot.to) {
      onToast('End time must be after start time', 'error');
      return;
    }
    try {
      const startAt = `${dateStr}T${newSlot.from}:00Z`;
      const endAt = `${dateStr}T${newSlot.to}:00Z`;

      const res = await fetch(`/api/v1/models/${modelId}/availability/block`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startAt, endAt, notes: newSlot.notes || undefined }),
      });
      const json = await res.json();
      if (json.success) {
        onToast('Slot added', 'success');
        setAddingDay(null);
        setNewSlot({ type: 'available', from: '10:00', to: '22:00', notes: '' });
        loadSlots();
      } else {
        onToast(json.error?.message || 'Failed to add', 'error');
      }
    } catch {
      onToast('Something went wrong', 'error');
    }
  };

  const addRangeSlots = async () => {
    if (!rangeSlot.dateFrom || !rangeSlot.dateTo) { onToast('Select date range', 'error'); return; }
    if (rangeSlot.dateFrom > rangeSlot.dateTo) { onToast('End date must be after start date', 'error'); return; }
    if (rangeSlot.from >= rangeSlot.to) { onToast('End time must be after start time', 'error'); return; }
    setRangeSaving(true);
    try {
      const start = new Date(rangeSlot.dateFrom);
      const end = new Date(rangeSlot.dateTo);
      const promises = [];
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        promises.push(fetch(`/api/v1/models/${modelId}/availability/block`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            startAt: `${dateStr}T${rangeSlot.from}:00Z`,
            endAt: `${dateStr}T${rangeSlot.to}:00Z`,
            notes: rangeSlot.notes || undefined,
          }),
        }));
      }
      await Promise.all(promises);
      onToast(`Added slots for ${promises.length} day(s)`, 'success');
      setRangeMode(false);
      setRangeSlot({ dateFrom: '', dateTo: '', type: 'available', from: '10:00', to: '22:00', notes: '' });
      loadSlots();
    } catch {
      onToast('Something went wrong', 'error');
    } finally {
      setRangeSaving(false);
    }
  };

  // Build days
  const days: { date: Date; dateStr: string; dayName: string; dayNum: number }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart.getTime() + i * 86400000);
    days.push({
      date: d,
      dateStr: formatDate(d),
      dayName: DAY_NAMES[i],
      dayNum: d.getDate(),
    });
  }

  const weekEnd = new Date(weekStart.getTime() + 6 * 86400000);
  const weekLabel = `Week of ${weekStart.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}-${weekEnd.toLocaleDateString('en-GB', { month: 'short', day: 'numeric', year: 'numeric' })}`;

  return (
    <SectionCard title="Availability">
      <div className="space-y-4">
        {/* Mode toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setRangeMode(false)}
            className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${!rangeMode ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'bg-zinc-800 text-zinc-400 border border-zinc-700'}`}
          >
            Week view
          </button>
          <button
            onClick={() => setRangeMode(true)}
            className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${rangeMode ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'bg-zinc-800 text-zinc-400 border border-zinc-700'}`}
          >
            + Add date range
          </button>
        </div>

        {/* Range form */}
        {rangeMode && (
          <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-4 space-y-3">
            <div className="text-xs text-zinc-400 font-medium">Add availability for a date range</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-zinc-500 mb-1">From date</label>
                <input type="date" value={rangeSlot.dateFrom} onChange={e => setRangeSlot({...rangeSlot, dateFrom: e.target.value})}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-zinc-200 focus:outline-none focus:border-zinc-500" />
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">To date</label>
                <input type="date" value={rangeSlot.dateTo} onChange={e => setRangeSlot({...rangeSlot, dateTo: e.target.value})}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-zinc-200 focus:outline-none focus:border-zinc-500" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-zinc-500 mb-1">From time</label>
                <input type="time" value={rangeSlot.from} onChange={e => setRangeSlot({...rangeSlot, from: e.target.value})}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-zinc-200 focus:outline-none focus:border-zinc-500" />
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">To time</label>
                <input type="time" value={rangeSlot.to} onChange={e => setRangeSlot({...rangeSlot, to: e.target.value})}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-zinc-200 focus:outline-none focus:border-zinc-500" />
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Note (optional)</label>
                <input type="text" value={rangeSlot.notes} onChange={e => setRangeSlot({...rangeSlot, notes: e.target.value})}
                  placeholder="e.g. Available all day"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-zinc-200 focus:outline-none focus:border-zinc-500" />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={addRangeSlots} disabled={rangeSaving}
                className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-zinc-900 text-sm font-medium rounded-lg transition-colors">
                {rangeSaving ? 'Adding...' : 'Add for all days in range'}
              </button>
              <button onClick={() => setRangeMode(false)} className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm rounded-lg transition-colors">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Week navigation */}
        <div className="flex items-center justify-center gap-4">
          <button onClick={prevWeek} className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200">
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm text-zinc-200 font-medium min-w-[200px] text-center">{weekLabel}</span>
          <button onClick={nextWeek} className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200">
            <ChevronRight size={18} />
          </button>
        </div>

        {loading ? (
          <p className="text-zinc-500 text-sm text-center py-4">Loading...</p>
        ) : (
          <div className="space-y-2">
            {days.map((day) => {
              const daySlots = slots.filter((s) => {
                const slotDate = new Date(s.startAt).toISOString().split('T')[0];
                return slotDate === day.dateStr;
              });

              return (
                <div key={day.dateStr} className="flex items-start gap-3 py-2 border-b border-zinc-800/50">
                  <div className="w-16 flex-shrink-0 pt-0.5">
                    <span className="text-sm text-zinc-300 font-medium">{day.dayName} {day.dayNum}</span>
                  </div>
                  <div className="flex-1 flex flex-wrap gap-1.5 items-center min-h-[28px]">
                    {daySlots.map((slot) => {
                      const timeFrom = formatTime(slot.startAt);
                      const timeTo = formatTime(slot.endAt);
                      const label = slot.status === 'away' ? 'Away' : `${slot.status} ${timeFrom}-${timeTo}`;
                      const style = statusStyles[slot.status] || statusStyles.unavailable;
                      return (
                        <span key={slot.id} className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded border ${style}`}>
                          {label}
                          {slot.notes && <span className="text-zinc-500" title={slot.notes}>*</span>}
                          <button onClick={() => deleteSlot(slot.id)} className="hover:text-red-400 ml-0.5">
                            <X size={10} />
                          </button>
                        </span>
                      );
                    })}

                    {addingDay === day.dateStr ? (
                      <div className="flex items-center gap-2 bg-zinc-800 rounded-lg px-2 py-1">
                        <select
                          value={newSlot.type}
                          onChange={(e) => setNewSlot({ ...newSlot, type: e.target.value })}
                          className="bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-200 px-1 py-0.5"
                        >
                          <option value="available">Available</option>
                          <option value="blocked">Busy</option>
                          <option value="away">Away</option>
                          <option value="tentative">Tentative</option>
                        </select>
                        <input type="time" value={newSlot.from} onChange={(e) => setNewSlot({ ...newSlot, from: e.target.value })} className="bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-200 px-1 py-0.5" />
                        <input type="time" value={newSlot.to} onChange={(e) => setNewSlot({ ...newSlot, to: e.target.value })} className="bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-200 px-1 py-0.5" />
                        <input type="text" value={newSlot.notes} onChange={(e) => setNewSlot({ ...newSlot, notes: e.target.value })} placeholder="Note..." className="bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-200 px-1 py-0.5 w-20" />
                        <button onClick={() => addSlot(day.dateStr)} className="text-emerald-400 hover:text-emerald-300"><Check size={14} /></button>
                        <button onClick={() => setAddingDay(null)} className="text-zinc-400 hover:text-zinc-200"><X size={14} /></button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setAddingDay(day.dateStr); setNewSlot({ type: 'available', from: '10:00', to: '22:00', notes: '' }); }}
                        className="text-xs text-zinc-500 hover:text-zinc-300 px-2 py-0.5 rounded border border-dashed border-zinc-700 hover:border-zinc-500"
                      >
                        + Add
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </SectionCard>
  );
}
