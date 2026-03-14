'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import SectionCard from './SectionCard';
import type { DistrictOption, TransportHubOption, ModelLocationEntry } from '@/types/model';

interface Props {
  modelId: string;
  onToast: (msg: string, type: 'success' | 'error') => void;
}

export default function Locations({ modelId, onToast }: Props) {
  const [districts, setDistricts] = useState<DistrictOption[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [primaryId, setPrimaryId] = useState<string>('');
  const [transportHubId, setTransportHubId] = useState<string>('');
  const [walkingMinutes, setWalkingMinutes] = useState<number>(5);
  const [hubs, setHubs] = useState<TransportHubOption[]>([]);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [loading, setLoading] = useState(true);
  const loaded = useRef(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Load districts + model locations
  useEffect(() => {
    (async () => {
      try {
        const [dRes, lRes] = await Promise.all([
          fetch('/api/v1/districts?isActive=true').then((r) => r.json()),
          fetch(`/api/v1/models/${modelId}/locations`).then((r) => r.json()),
        ]);
        if (dRes.success) setDistricts(dRes.data);
        if (lRes.success) {
          const locs: ModelLocationEntry[] = lRes.data;
          setSelectedIds(locs.map((l) => l.districtId));
          const primary = locs.find((l) => l.isPrimary);
          if (primary) {
            setPrimaryId(primary.districtId);
            setTransportHubId(primary.transportHubId || '');
            setWalkingMinutes(primary.walkingMinutes ?? 5);
          }
        }
      } catch {
        onToast('Failed to load locations', 'error');
      } finally {
        setLoading(false);
        // Mark loaded on next tick so dirty effect doesn't trigger from initial data
        setTimeout(() => { loaded.current = true; }, 0);
      }
    })();
  }, [modelId, onToast]);

  // Load transport hubs when primary district changes
  useEffect(() => {
    if (!primaryId) { setHubs([]); return; }
    fetch(`/api/v1/districts/${primaryId}/transport-hubs`)
      .then((r) => r.json())
      .then((json) => { if (json.success) setHubs(json.data); })
      .catch(() => {});
  }, [primaryId]);

  // Auto-set primary when single selection
  useEffect(() => {
    if (selectedIds.length === 1) setPrimaryId(selectedIds[0]);
    else if (selectedIds.length === 0) setPrimaryId('');
    else if (!selectedIds.includes(primaryId)) setPrimaryId(selectedIds[0]);
  }, [selectedIds, primaryId]);

  useEffect(() => { if (loaded.current) setDirty(true); }, [selectedIds, primaryId, transportHubId, walkingMinutes]);

  const toggleDistrict = (id: string) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
    setSearchOpen(false);
    setSearchTerm('');
  };

  const handleSave = useCallback(async () => {
    if (selectedIds.length === 0) { onToast('Select at least one district', 'error'); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/v1/models/${modelId}/locations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          districtIds: selectedIds,
          primaryDistrictId: primaryId || selectedIds[0],
          transportHubId: transportHubId || undefined,
          walkingMinutes: walkingMinutes || undefined,
        }),
      });
      const json = await res.json();
      if (json.success) {
        onToast('Locations saved', 'success');
        setDirty(false);
      } else {
        onToast(json.error?.message || 'Save failed', 'error');
      }
    } catch {
      onToast('Something went wrong', 'error');
    } finally {
      setSaving(false);
    }
  }, [modelId, selectedIds, primaryId, transportHubId, walkingMinutes, onToast]);

  const filteredDistricts = districts.filter((d) => !searchTerm || d.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const primaryDistrictName = districts.find((d) => d.id === primaryId)?.name || '';

  if (loading) return <SectionCard title="Locations"><p className="text-zinc-500 text-sm">Loading...</p></SectionCard>;

  return (
    <SectionCard title="Locations" isDirty={dirty} saving={saving} onSave={handleSave}>
      <div className="space-y-4">
        {/* Districts multi-select */}
        <div className="relative">
          <label className="block text-xs text-zinc-400 mb-1">Districts</label>
          <div
            onClick={() => setSearchOpen(!searchOpen)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm cursor-pointer min-h-[38px] flex flex-wrap gap-1 items-center"
          >
            {selectedIds.length === 0 ? (
              <span className="text-zinc-500">Select districts...</span>
            ) : (
              selectedIds.map((id) => {
                const d = districts.find((x) => x.id === id);
                return (
                  <span key={id} className="inline-flex items-center gap-1 bg-zinc-700 text-zinc-200 text-xs px-2 py-0.5 rounded">
                    {d?.name || id}
                    <button onClick={(e) => { e.stopPropagation(); toggleDistrict(id); }} className="text-zinc-400 hover:text-zinc-200 text-[10px]">x</button>
                  </span>
                );
              })
            )}
          </div>
          {searchOpen && (
            <div className="absolute z-20 mt-1 w-full bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl max-h-56 overflow-hidden">
              <div className="p-2 border-b border-zinc-700">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search districts..."
                  className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-sm text-zinc-200 focus:outline-none"
                  autoFocus
                />
              </div>
              <div className="max-h-40 overflow-y-auto">
                {filteredDistricts.map((d) => (
                  <label key={d.id} className="flex items-center gap-2 px-3 py-1.5 hover:bg-zinc-700 cursor-pointer text-sm text-zinc-200">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(d.id)}
                      onChange={() => toggleDistrict(d.id)}
                      className="accent-amber-500"
                    />
                    {d.name}
                    <span className="text-xs text-zinc-500 ml-auto">T{d.tier}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Primary Location */}
        {selectedIds.length >= 2 && (
          <div>
            <label className="block text-xs text-zinc-400 mb-2">Primary Location</label>
            <div className="flex flex-wrap gap-2">
              {selectedIds.map((id) => {
                const d = districts.find((x) => x.id === id);
                return (
                  <button
                    key={id}
                    onClick={() => setPrimaryId(id)}
                    className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                      primaryId === id ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 font-medium' : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                    }`}
                  >
                    {d?.name || id}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Nearest Station */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Nearest Station</label>
            <select
              value={transportHubId}
              onChange={(e) => setTransportHubId(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200"
            >
              <option value="">— None —</option>
              {hubs.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name} ({h.walkingMinutes} min walk from {primaryDistrictName})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Walking Minutes</label>
            <input
              type="number"
              value={walkingMinutes}
              onChange={(e) => setWalkingMinutes(parseInt(e.target.value) || 0)}
              min={0}
              className="w-32 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-zinc-500"
            />
          </div>
        </div>
      </div>
    </SectionCard>
  );
}
