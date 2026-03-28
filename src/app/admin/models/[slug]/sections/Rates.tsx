'use client';

import { useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import SectionCard from './SectionCard';
import type { CallRateMaster, ModelRateEntry } from '@/types/model';

export interface RatesHandle {
  save: () => Promise<boolean>;
}

interface Props {
  modelId: string;
  onToast: (msg: string, type: 'success' | 'error') => void;
}

interface RateRow {
  callRateMasterId: string;
  label: string;
  durationMin: number;
  sortOrder: number;
  incall: string;
  outcall: string;
}

const Rates = forwardRef<RatesHandle, Props>(function Rates({ modelId, onToast }, ref) {
  const [rows, setRows] = useState<RateRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [loading, setLoading] = useState(true);
  const [copyOpen, setCopyOpen] = useState(false);
  const [allModels, setAllModels] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const [ratesRes, mastersRes] = await Promise.all([
          fetch(`/api/v1/models/${modelId}/rates`).then((r) => r.json()),
          fetch('/api/v1/call-rates').then((r) => r.json()),
        ]);

        const masters: CallRateMaster[] = mastersRes.success ? mastersRes.data.filter((m: CallRateMaster) => m.isActive) : [];
        const modelRates: ModelRateEntry[] = ratesRes.success ? ratesRes.data : [];

        const rateMap = new Map<string, ModelRateEntry>();
        for (const r of modelRates) rateMap.set(r.callRateMasterId, r);

        const rateRows: RateRow[] = masters.map((m) => {
          const existing = rateMap.get(m.id);
          return {
            callRateMasterId: m.id,
            label: m.label,
            durationMin: m.durationMin,
            sortOrder: m.sortOrder,
            incall: existing?.incallPrice != null ? String(existing.incallPrice) : '',
            outcall: existing?.outcallPrice != null ? String(existing.outcallPrice) : '',
          };
        });

        setRows(rateRows.sort((a, b) => a.sortOrder - b.sortOrder));
      } catch {
        onToast('Failed to load rates', 'error');
      } finally {
        setLoading(false);
      }
    })();
  }, [modelId, onToast]);

  const updateRow = (idx: number, field: 'incall' | 'outcall', value: string) => {
    setRows((prev) => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r));
    setDirty(true);
  };

  const handleSave = useCallback(async (): Promise<boolean> => {
    setSaving(true);
    try {
      const rates = rows
        .filter((r) => r.incall.trim() !== '' || r.outcall.trim() !== '')
        .map((r) => ({
          callRateMasterId: r.callRateMasterId,
          incallPrice: r.incall.trim() !== '' ? parseFloat(r.incall) : null,
          outcallPrice: r.outcall.trim() !== '' ? parseFloat(r.outcall) : null,
        }));

      const res = await fetch(`/api/v1/models/${modelId}/rates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rates }),
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
  }, [modelId, rows, onToast]);

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
        onToast('Rates copied. Review and save.', 'success');
        // Reload rates
        const ratesRes = await fetch(`/api/v1/models/${modelId}/rates`).then((r) => r.json());
        if (ratesRes.success) {
          const rateMap = new Map<string, ModelRateEntry>();
          for (const r of ratesRes.data) rateMap.set(r.callRateMasterId, r);
          setRows((prev) => prev.map((row) => {
            const existing = rateMap.get(row.callRateMasterId);
            return {
              ...row,
              incall: existing?.incallPrice != null ? String(existing.incallPrice) : '',
              outcall: existing?.outcallPrice != null ? String(existing.outcallPrice) : '',
            };
          }));
          setDirty(true);
        }
      } else {
        onToast(json.error?.message || 'Copy failed', 'error');
      }
    } catch {
      onToast('Something went wrong', 'error');
    }
  };

  const openCopy = () => {
    if (allModels.length === 0) {
      fetch('/api/v1/models?status=Active&limit=100')
        .then((r) => r.json())
        .then((json) => {
          if (json.success && json.data?.models) {
            setAllModels(json.data.models.filter((m: { id: string }) => m.id !== modelId));
          }
        })
        .catch(() => {});
    }
    setCopyOpen(!copyOpen);
  };

  if (loading) return <SectionCard title="Rates (GBP)"><p className="text-zinc-500 text-sm">Loading...</p></SectionCard>;

  return (
    <SectionCard
      title="Rates (GBP)"
      isDirty={dirty}
      headerRight={
        <div className="relative">
          <button onClick={openCopy} className="px-3 py-1.5 text-xs rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-700">
            Copy from Model
          </button>
          {copyOpen && (
            <div className="absolute right-0 mt-1 w-48 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl max-h-48 overflow-y-auto z-20">
              {allModels.map((m) => (
                <button
                  key={m.id}
                  onClick={() => handleCopy(m.id)}
                  className="w-full text-left px-3 py-1.5 text-sm text-zinc-200 hover:bg-zinc-700"
                >
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
              <th className="px-3 py-2 text-left font-medium w-36">Incall (£)</th>
              <th className="px-3 py-2 text-left font-medium w-36">Outcall (£)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={row.callRateMasterId} className="border-b border-zinc-800/50">
                <td className="px-3 py-2 text-zinc-200">{row.label}</td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    value={row.incall}
                    onChange={(e) => updateRow(idx, 'incall', e.target.value)}
                    placeholder="—"
                    className="w-28 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm text-zinc-200 focus:outline-none focus:border-zinc-500"
                    min={0}
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    value={row.outcall}
                    onChange={(e) => updateRow(idx, 'outcall', e.target.value)}
                    placeholder="—"
                    className="w-28 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm text-zinc-200 focus:outline-none focus:border-zinc-500"
                    min={0}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-zinc-500 mt-3">Leave blank to hide this duration from the profile</p>
      {/* Live Preview */}
      {(() => {
        const filledRows = rows.filter(r => r.incall || r.outcall);
        if (filledRows.length === 0) return null;
        const allPrices = [
          ...rows.map(r => r.incall ? parseFloat(r.incall) : null),
          ...rows.map(r => r.outcall ? parseFloat(r.outcall) : null),
        ].filter((v): v is number => v != null && !isNaN(v));
        const fromPrice = allPrices.length > 0 ? Math.min(...allPrices) : null;
        const overnight = rows.find(r => r.label.toLowerCase().includes('overnight'));
        return (
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
              {overnight?.incall && (
                <div className="text-xs text-zinc-400">
                  Overnight <span className="text-zinc-200 font-medium">£{parseFloat(overnight.incall).toLocaleString('en-GB')}</span>
                </div>
              )}
              <div className="text-xs text-zinc-500">
                {filledRows.length} duration{filledRows.length !== 1 ? 's' : ''} shown
              </div>
            </div>
          </div>
        );
      })()}
    </SectionCard>
  );
});

export default Rates;
