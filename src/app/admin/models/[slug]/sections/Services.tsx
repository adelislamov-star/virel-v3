'use client';

import { useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { AlertTriangle } from 'lucide-react';
import SectionCard from './SectionCard';

interface ServiceItem {
  id: string;
  title: string;
  name: string | null;
  publicName: string | null;
  category: string;
  isPublic: boolean;
  hasExtraPrice: boolean;
}

interface ServiceCategory {
  name: string;
  services: ServiceItem[];
}

interface ModelServiceState {
  [serviceId: string]: { enabled: boolean; isExtra: boolean; extraPrice: string; isDoublePrice: boolean; isPOA: boolean };
}

const GROUP_SERVICE_TITLES = ['mmf', 'group', 'duo'];

function isGroupService(svc: ServiceItem): boolean {
  return GROUP_SERVICE_TITLES.some((t) => svc.title.toLowerCase().includes(t));
}

export interface ServicesHandle {
  save: () => Promise<boolean>;
}

interface Props {
  modelId: string;
  onToast: (msg: string, type: 'success' | 'error') => void;
}

const Services = forwardRef<ServicesHandle, Props>(function Services({ modelId, onToast }, ref) {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [activeCategory, setActiveCategory] = useState('');
  const [state, setState] = useState<ModelServiceState>({});
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [svcRes, modelSvcRes] = await Promise.all([
          fetch('/api/v1/services').then((r) => r.json()),
          fetch(`/api/v1/models/${modelId}/services`).then((r) => r.json()),
        ]);

        if (svcRes.success) {
          // Group flat services array by category
          const allServices: ServiceItem[] = svcRes.services || [];
          const catMap = new Map<string, ServiceItem[]>();
          for (const s of allServices) {
            const cat = s.category || 'Other';
            if (!catMap.has(cat)) catMap.set(cat, []);
            catMap.get(cat)!.push(s);
          }
          const cats: ServiceCategory[] = Array.from(catMap.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([name, services]) => ({
              name,
              services: [...services].sort((a, b) => a.title.localeCompare(b.title)),
            }));
          setCategories(cats);
          if (cats.length > 0 && !activeCategory) setActiveCategory(cats[0].name);
        }

        if (modelSvcRes.success) {
          const ms: ModelServiceState = {};
          for (const s of modelSvcRes.data) {
            ms[s.serviceId] = {
              enabled: s.isEnabled !== false,
              isExtra: s.isExtra || false,
              extraPrice: s.extraPrice != null ? String(s.extraPrice) : '',
              isDoublePrice: s.isDoublePrice || false,
              isPOA: s.isPOA || false,
            };
          }
          setState(ms);
        }
      } catch {
        onToast('Failed to load services', 'error');
      } finally {
        setLoading(false);
      }
    })();
  }, [modelId, onToast, activeCategory]);

  const toggleService = (id: string) => {
    setState((prev) => ({
      ...prev,
      [id]: prev[id]
        ? { ...prev[id], enabled: !prev[id].enabled }
        : { enabled: true, isExtra: false, extraPrice: '', isDoublePrice: false, isPOA: false },
    }));
    setDirty(true);
  };

  const toggleExtra = (id: string) => {
    setState((prev) => ({
      ...prev,
      [id]: { ...prev[id], isExtra: !prev[id]?.isExtra },
    }));
    setDirty(true);
  };

  const setExtraPrice = (id: string, price: string) => {
    setState((prev) => ({
      ...prev,
      [id]: { ...prev[id], extraPrice: price },
    }));
    setDirty(true);
  };

  const toggleDoublePrice = (id: string) => {
    setState((prev) => ({
      ...prev,
      [id]: { ...prev[id], isDoublePrice: !prev[id]?.isDoublePrice, isPOA: false },
    }));
    setDirty(true);
  };

  const togglePOA = (id: string) => {
    setState((prev) => ({
      ...prev,
      [id]: { ...prev[id], isPOA: !prev[id]?.isPOA, isDoublePrice: false },
    }));
    setDirty(true);
  };

  const handleSave = useCallback(async (): Promise<boolean> => {
    setSaving(true);
    try {
      const serviceIds: string[] = [];
      const extras: { serviceId: string; extraPrice: number }[] = [];
      const doublePriceIds: string[] = [];
      const poaIds: string[] = [];

      for (const [serviceId, s] of Object.entries(state)) {
        if (s.enabled) {
          serviceIds.push(serviceId);
          if (s.isExtra && s.extraPrice && !isNaN(parseFloat(s.extraPrice))) {
            extras.push({ serviceId, extraPrice: parseFloat(s.extraPrice) });
          }
          if (s.isDoublePrice) doublePriceIds.push(serviceId);
          if (s.isPOA) poaIds.push(serviceId);
        }
      }

      const res = await fetch(`/api/v1/models/${modelId}/services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceIds, extras, doublePriceIds, poaIds }),
      });
      const json = await res.json();
      if (json.success) {
        setDirty(false);
        return true;
      } else {
        onToast(json.error?.message || 'Save failed', 'error');
        return false;
      }
    } catch {
      onToast('Something went wrong', 'error');
      return false;
    } finally {
      setSaving(false);
    }
  }, [modelId, state, onToast]);

  useImperativeHandle(ref, () => ({ save: handleSave }), [handleSave]);

  const currentCategory = categories.find((c) => c.name === activeCategory);
  const isIntimate = activeCategory.toLowerCase().includes('intimate');

  if (loading) return <SectionCard title="Services"><p className="text-zinc-500 text-sm">Loading...</p></SectionCard>;

  return (
    <SectionCard title="Services" isDirty={dirty}>
      <div className="space-y-4">
        {/* Category tabs */}
        <div className="flex flex-wrap gap-1 border-b border-zinc-800 pb-2">
          {categories.map((cat) => {
            const enabledCount = cat.services.filter((s) => state[s.id]?.enabled).length;
            return (
              <button
                key={cat.name}
                onClick={() => setActiveCategory(cat.name)}
                className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                  activeCategory === cat.name ? 'bg-amber-500/20 text-amber-400 font-medium' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                }`}
              >
                {cat.name}
                {enabledCount > 0 && <span className="ml-1 text-zinc-500">({enabledCount})</span>}
              </button>
            );
          })}
        </div>

        {/* Warning for intimate */}
        {isIntimate && (
          <div className="flex items-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-400 text-xs">
            <AlertTriangle size={14} />
            Intimate services are only visible to verified Members
          </div>
        )}

        {/* Service list */}
        <div className="grid grid-cols-2 gap-x-3 gap-y-0">
          {currentCategory?.services.map((svc) => {
            const s = state[svc.id];
            const isEnabled = s?.enabled || false;
            const isExtra = s?.isExtra || false;
            const isGroup = isGroupService(svc);
            return (
              <div key={svc.id} className={`rounded-lg transition-colors ${isEnabled ? 'bg-amber-500/5 border border-amber-500/20' : 'hover:bg-zinc-800/50 border border-transparent'}`}>
                <div className="flex items-center gap-3 px-3 py-2">
                  <input
                    type="checkbox"
                    checked={isEnabled}
                    onChange={() => toggleService(svc.id)}
                    className="accent-amber-500"
                  />
                  <span className={`text-sm font-medium ${isEnabled ? 'text-zinc-100' : 'text-zinc-500'}`}>
                    {svc.title}
                    {svc.publicName && <span className={`font-normal ${isEnabled ? 'text-zinc-400' : 'text-zinc-600'}`}> — {svc.publicName}</span>}
                  </span>
                  {isEnabled && <span className="ml-auto text-[10px] text-amber-500/70 font-medium uppercase tracking-wide">On</span>}
                </div>
                {isEnabled && isGroup && (
                  <div className="flex items-center gap-4 px-10 pb-2">
                    <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={s?.isDoublePrice || false}
                        onChange={() => toggleDoublePrice(svc.id)}
                        className="accent-amber-500"
                      />
                      Double Price
                    </label>
                    <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={s?.isPOA || false}
                        onChange={() => togglePOA(svc.id)}
                        className="accent-amber-500"
                      />
                      POA
                    </label>
                  </div>
                )}
                {isEnabled && !isGroup && (
                  <div className="flex items-center gap-4 px-10 pb-2">
                    <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isExtra}
                        onChange={() => toggleExtra(svc.id)}
                        className="accent-amber-500"
                      />
                      Extra service
                    </label>
                    {isExtra && (
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-zinc-400">Price: £</span>
                        <input
                          type="number"
                          value={s?.extraPrice || ''}
                          onChange={(e) => setExtraPrice(svc.id, e.target.value)}
                          className="w-20 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-200 focus:outline-none focus:border-zinc-500"
                          min={0}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </SectionCard>
  );
});

export default Services;
