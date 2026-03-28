'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import SectionCard from './SectionCard';
import type { DistrictOption, TransportHubOption, ModelLocationEntry } from '@/types/model';

const WARDROBE_OPTIONS = [
  'Schoolgirl','Secretary','Nurse','Bikini','Catsuit',
  'PVC','Lingerie','Corset','Latex','Stilettos','Bunny',
  'Stockings','Police','French Maid','Teacher','Stewardess','Housekeeper',
];

interface Props {
  model: Record<string, unknown>;
  modelId: string;
  onToast: (msg: string, type: 'success' | 'error') => void;
}

export default function WardrobeAndLocations({ model, modelId, onToast }: Props) {
  // Wardrobe state
  const [wardrobe, setWardrobe] = useState<string[]>(() => {
    const w = model.wardrobe;
    return Array.isArray(w) ? w : [];
  });
  const [wardrobeDirty, setWardrobeDirty] = useState(false);
  const [wardrobeSaving, setWardrobeSaving] = useState(false);

  // Locations state
  const [districts, setDistricts] = useState<DistrictOption[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [primaryId, setPrimaryId] = useState<string>('');
  const [transportHubId, setTransportHubId] = useState<string>('');
  const [walkingMinutes, setWalkingMinutes] = useState<number>(5);
  const [hubs, setHubs] = useState<TransportHubOption[]>([]);
  const [locationsDirty, setLocationsDirty] = useState(false);
  const [locationsSaving, setLocationsSaving] = useState(false);
  const [locationsLoading, setLocationsLoading] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const loaded = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const [dRes, lRes] = await Promise.all([
          fetch('/api/v1/districts?isActive=true').then(r => r.json()),
          fetch(`/api/v1/models/${modelId}/locations`).then(r => r.json()),
        ]);
        if (dRes.success) setDistricts(dRes.data);
        if (lRes.success) {
          const locs: ModelLocationEntry[] = lRes.data;
          setSelectedIds(locs.map(l => l.districtId));
          const primary = locs.find(l => l.isPrimary);
          if (primary) {
            setPrimaryId(primary.districtId);
            setTransportHubId(primary.transportHubId || '');
            setWalkingMinutes(primary.walkingMinutes ?? 5);
          }
        }
      } catch { onToast('Failed to load locations', 'error'); }
      finally {
        setLocationsLoading(false);
        setTimeout(() => { loaded.current = true; }, 0);
      }
    })();
  }, [modelId, onToast]);

  useEffect(() => {
    if (!primaryId) { setHubs([]); return; }
    fetch(`/api/v1/districts/${primaryId}/transport-hubs`)
      .then(r => r.json())
      .then(json => { if (json.success) setHubs(json.data); })
      .catch(() => {});
  }, [primaryId]);

  useEffect(() => {
    if (selectedIds.length === 1) setPrimaryId(selectedIds[0]);
    else if (selectedIds.length === 0) setPrimaryId('');
    else if (!selectedIds.includes(primaryId)) setPrimaryId(selectedIds[0]);
  }, [selectedIds, primaryId]);

  useEffect(() => { if (loaded.current) setLocationsDirty(true); }, [selectedIds, primaryId, transportHubId, walkingMinutes]);

  const toggleDistrict = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    setSearchOpen(false); setSearchTerm('');
  };

  const saveWardrobe = useCallback(async () => {
    setWardrobeSaving(true);
    try {
      const res = await fetch(`/api/v1/models/${modelId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: { wardrobe } }),
      });
      const json = await res.json();
      if (json.success) { onToast('Wardrobe saved', 'success'); setWardrobeDirty(false); }
      else onToast(json.error?.message || 'Save failed', 'error');
    } catch { onToast('Something went wrong', 'error'); }
    finally { setWardrobeSaving(false); }
  }, [modelId, wardrobe, onToast]);

  const saveLocations = useCallback(async () => {
    if (selectedIds.length === 0) { onToast('Select at least one district', 'error'); return; }
    setLocationsSaving(true);
    try {
      const res = await fetch(`/api/v1/models/${modelId}/locations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ districtIds: selectedIds, primaryDistrictId: primaryId || selectedIds[0], transportHubId: transportHubId || undefined, walkingMinutes: walkingMinutes || undefined }),
      });
      const json = await res.json();
      if (json.success) { onToast('Locations saved', 'success'); setLocationsDirty(false); }
      else onToast(json.error?.message || 'Save failed', 'error');
    } catch { onToast('Something went wrong', 'error'); }
    finally { setLocationsSaving(false); }
  }, [modelId, selectedIds, primaryId, transportHubId, walkingMinutes, onToast]);

  const inp = 'w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-zinc-200 focus:outline-none focus:border-zinc-500';
  const filteredDistricts = districts.filter(d => !searchTerm || d.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <SectionCard title="Wardrobe & Location" isDirty={wardrobeDirty || locationsDirty}>
      <div className="grid grid-cols-2 gap-6">
        {/* LEFT — Wardrobe */}
        <div className="space-y-2">
          <div className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Wardrobe</div>
          <div className="flex flex-wrap gap-1.5">
            {WARDROBE_OPTIONS.map(item => (
              <button key={item} onClick={() => { setWardrobe(prev => prev.includes(item) ? prev.filter(s => s !== item) : [...prev, item]); setWardrobeDirty(true); }}
                className={`px-2.5 py-1 text-xs rounded-lg border transition-colors ${wardrobe.includes(item) ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 font-medium' : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-600'}`}>
                {item}
              </button>
            ))}
          </div>
          <button onClick={saveWardrobe} disabled={wardrobeSaving || !wardrobeDirty}
            className="mt-2 w-full px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-black text-sm font-medium rounded-lg disabled:opacity-40 transition-colors">
            {wardrobeSaving ? 'Saving...' : 'Save Wardrobe'}
          </button>
        </div>

        {/* RIGHT — Locations */}
        <div className="space-y-3">
          <div className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Location</div>
          {locationsLoading ? <p className="text-zinc-500 text-sm">Loading...</p> : (
            <>
              <div className="relative">
                <label className="block text-xs text-zinc-400 mb-1">Districts</label>
                <div onClick={() => setSearchOpen(!searchOpen)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm cursor-pointer min-h-[34px] flex flex-wrap gap-1 items-center">
                  {selectedIds.length === 0 ? <span className="text-zinc-500">Select districts...</span> :
                    selectedIds.map(id => {
                      const d = districts.find(x => x.id === id);
                      return <span key={id} className="inline-flex items-center gap-1 bg-zinc-700 text-zinc-200 text-xs px-2 py-0.5 rounded">
                        {d?.name || id}
                        <button onClick={e => { e.stopPropagation(); toggleDistrict(id); }} className="text-zinc-400 hover:text-zinc-200 text-[10px]">x</button>
                      </span>;
                    })}
                </div>
                {searchOpen && (
                  <div className="absolute z-20 mt-1 w-full bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl max-h-48 overflow-hidden">
                    <div className="p-2 border-b border-zinc-700">
                      <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                        placeholder="Search districts..." className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-sm text-zinc-200 focus:outline-none" autoFocus />
                    </div>
                    <div className="max-h-36 overflow-y-auto">
                      {filteredDistricts.map(d => (
                        <label key={d.id} className="flex items-center gap-2 px-3 py-1.5 hover:bg-zinc-700 cursor-pointer text-sm text-zinc-200">
                          <input type="checkbox" checked={selectedIds.includes(d.id)} onChange={() => toggleDistrict(d.id)} className="accent-amber-500" />
                          {d.name} <span className="text-xs text-zinc-500 ml-auto">T{d.tier}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Nearest Station</label>
                  <select value={transportHubId} onChange={e => setTransportHubId(e.target.value)} className={inp}>
                    <option value="">— None —</option>
                    {hubs.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Walk (min)</label>
                  <input type="number" value={walkingMinutes} onChange={e => setWalkingMinutes(parseInt(e.target.value) || 0)} min={0} className={inp} />
                </div>
              </div>
              <button onClick={saveLocations} disabled={locationsSaving || !locationsDirty}
                className="w-full px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-black text-sm font-medium rounded-lg disabled:opacity-40 transition-colors">
                {locationsSaving ? 'Saving...' : 'Save Location'}
              </button>
            </>
          )}
        </div>
      </div>
    </SectionCard>
  );
}
