'use client';

import { useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import SectionCard from './SectionCard';
import { durationLabel } from '@/lib/durationLabel';
import type { ModelRateEntry, DurationType } from '@/types/model';

export interface RatesHandle {
  save: () => Promise<boolean>;
}

interface Props {
  modelId: string;
  onToast: (msg: string, type: 'success' | 'error') => void;
}

const ALL_DURATIONS: DurationType[] = [
  '30min', '45min', '1hour', '90min',
  '2hours', '3hours', '4hours', '5hours',
  '6hours', '8hours', 'extra_hour', 'overnight',
];

interface RateState {
  incall: string;
  outcall: string;
  taxiFee: string;
}

type RatesState = Partial<Record<DurationType, RateState>>;

function buildState(rates: ModelRateEntry[]): RatesState {
  const state: RatesState = {};
  for (const r of rates) {
    const d = r.durationType as DurationType;
    if (!state[d]) state[d] = { incall: '', outcall: '', taxiFee: '' };
    if (r.callType === 'incall') state[d]!.incall = String(r.price);
    if (r.callType === 'outcall') {
      state[d]!.outcall = String(r.price);
      if (r.taxiFee != null) state[d]!.taxiFee = String(r.taxiFee);
    }
  }
  return state;
}

const Rates = forwardRef<RatesHandle, Props>(function Rates({ modelId, onToast }, ref) {
  const [rateState, setRateState] = useState<RatesState>({});
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [loading, setLoading] = useState(true);
  const [copyOpen, setCopyOpen] = useState(false);
  const [allModels, setAllModels] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    fetch(`/api/v1/models/${modelId}/rates`)
      .then(r => r.json())
      .then(json => {
        if (json.success) setRateState(buildState(json.data));
        else onToast('Failed to load rates', 'error');
      })
      .catch(() => onToast('Failed to load rates', 'error'))
      .finally(() => setLoading(false));
  }, [modelId, onToast]);

  const update = (d: DurationType, field: 'incall' | 'outcall' | 'taxiFee', value: string) => {
    setRateState(prev => ({
      ...prev,
      [d]: { incall: '', outcall: '', taxiFee: '', ...prev[d], [field]: value },
    }));
    setDirty(true);
  };

  const handleSave = useCallback(async (): Promise<boolean> => {
    setSaving(true);
    try {
      const rates: { durationType: string; callType: string; price: number; taxiFee?: number | null }[] = [];

      for (const d of ALL_DURATIONS) {
        const row = rateState[d];
        if (row?.incall && parseFloat(row.incall) > 0) {
          rates.push({ durationType: d, callType: 'incall', price: parseFloat(row.incall) });
        }
        if (row?.outcall && parseFloat(row.outcall) > 0) {
          rates.push({
            durationType: d,
            callType: 'outcall',
            price: parseFloat(row.outcall),
            taxiFee: row.taxiFee ? parseFloat(row.taxiFee) : null,
          });
        }
      }

      const res = await fetch(`/api/v1/models/${modelId}/rates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rates }),
      });
      const json = await res.json();

      if (json.success) {
        setDirty(false);
        onToast('Rates saved', 'success');
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
  }, [modelId, rateState, onToast]);

  useImperativeHandle(ref, () => ({ save: handleSave }), [handleSave]);

  const handleCopy = async (fromModelId: string) => {
    setCopyOpen(false);
    try {
      const res = await fetch(`/api/v1/models/${modelId}/copy-rates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromModelId }),
      });
      const json = await res.json();
      if (json.success) {
        const ratesRes = await fetch(`/api/v1/models/${modelId}/rates`).then(r => r.json());
        if (ratesRes.success) setRateState(buildState(ratesRes.data));
        setDirty(true);
        onToast('Rates copied. Review and save.', 'success');
      } else {
        onToast(json.error?.message || 'Copy failed', 'error');
      }
    } catch {
      onToast('Something went wrong', 'error');
    }
  };

  const allPrices = ALL_DURATIONS.flatMap(d => [
    rateState[d]?.incall ? parseFloat(rateState[d]!.incall) : null,
    rateState[d]?.outcall ? parseFloat(rateState[d]!.outcall) : null,
  ]).filter((v): v is number => v != null && !isNaN(v) && v > 0);
  const fromPrice = allPrices.length > 0 ? Math.min(...allPrices) : null;
  const overnightRow = rateState['overnight'];
  const filledCount = ALL_DURATIONS.filter(d => rateState[d]?.incall || rateState[d]?.outcall).length;

  if (loading) return <SectionCard title="Rates (GBP)"><p className="text-zinc-500 text-sm">Loading...</p></SectionCard>;

  return (
    <SectionCard
      title="Rates (GBP)"
      isDirty={dirty}
      headerRight={
        <div className="relative">
          <button
            onClick={() => {
              if (allModels.length === 0) {
                fetch('/api/v1/models?status=Active&limit=100')
                  .then(r => r.json())
                  .then(json => {
                    if (json.success && json.data?.models) {
                      setAllModels(json.data.models.filter((m: { id: string }) => m.id !== modelId));
                    }
                  });
              }
              setCopyOpen(!copyOpen);
            }}
            className="px-3 py-1.5 text-xs rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-700"
          >
            Copy from Model
          </button>
          {copyOpen && (
            <div className="absolute right-0 mt-1 w-48 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl max-h-48 overflow-y-auto z-20">
              {allModels.map(m => (
                <button key={m.id} onClick={() => handleCopy(m.id)}
                  className="w-full text-left px-3 py-1.5 text-sm text-zinc-200 hover:bg-zinc-700">
                  {m.name}
                </button>
              ))}
              {allModels.length === 0 && <p className="px-3 py-2 text-xs text-zinc-500">Loading...</p>}
            </div>
          )}
        </div>
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 text-zinc-400">
              <th className="px-3 py-2 text-left font-medium">Duration</th>
              <th className="px-3 py-2 text-left font-medium w-32">Incall (£)</th>
              <th className="px-3 py-2 text-left font-medium w-32">Outcall (£)</th>
              <th className="px-3 py-2 text-left font-medium w-28 text-zinc-500">Taxi fee (£)</th>
            </tr>
          </thead>
          <tbody>
            {ALL_DURATIONS.map(d => {
              const row = rateState[d] ?? { incall: '', outcall: '', taxiFee: '' };
              return (
                <tr key={d} className="border-b border-zinc-800/50">
                  <td className="px-3 py-2 text-zinc-200">{durationLabel(d)}</td>
                  <td className="px-3 py-2">
                    <input type="number" value={row.incall}
                      onChange={e => update(d, 'incall', e.target.value)}
                      placeholder="—" min={0}
                      className="w-28 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm text-zinc-200 focus:outline-none focus:border-zinc-500" />
                  </td>
                  <td className="px-3 py-2">
                    <input type="number" value={row.outcall}
                      onChange={e => update(d, 'outcall', e.target.value)}
                      placeholder="—" min={0}
                      className="w-28 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm text-zinc-200 focus:outline-none focus:border-zinc-500" />
                  </td>
                  <td className="px-3 py-2">
                    {row.outcall ? (
                      <input type="number" value={row.taxiFee}
                        onChange={e => update(d, 'taxiFee', e.target.value)}
                        placeholder="—" min={0}
                        className="w-24 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm text-zinc-200 focus:outline-none focus:border-zinc-500" />
                    ) : (
                      <span className="text-zinc-600 text-xs pl-2">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-zinc-500 mt-3">Leave blank to hide this duration from the profile</p>

      {filledCount > 0 && (
        <div className="mt-4 p-3 bg-zinc-800/50 rounded-xl border border-zinc-700/50">
          <div className="text-xs text-zinc-500 mb-2 uppercase tracking-wide">Client sees on site</div>
          <div className="flex flex-wrap items-center gap-4">
            {fromPrice && (
              <div>
                <span className="text-zinc-400 text-xs">From </span>
                <span className="text-white font-semibold text-lg">£{fromPrice.toLocaleString('en-GB')}</span>
                <span className="text-zinc-400 text-xs"> / hour</span>
              </div>
            )}
            {overnightRow?.incall && (
              <div className="text-xs text-zinc-400">
                Overnight <span className="text-zinc-200 font-medium">£{parseFloat(overnightRow.incall).toLocaleString('en-GB')}</span>
              </div>
            )}
            <div className="text-xs text-zinc-500">{filledCount} duration{filledCount !== 1 ? 's' : ''} shown</div>
          </div>
        </div>
      )}
    </SectionCard>
  );
});

export default Rates;
