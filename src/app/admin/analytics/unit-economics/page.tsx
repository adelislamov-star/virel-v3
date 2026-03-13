'use client';

import { useEffect, useState, useCallback } from 'react';

type PeriodPreset = 'this_week' | 'this_month' | 'last_month' | 'custom';

type UnitData = {
  profitPerBooking: number;
  avgBookingValue: number;
  avgCommission: number;
  avgPayout: number;
  arpu: number;
  mrr: number;
  avgClientLtv: number;
  ltvEstimate: number;
  cacEstimate: number;
  ltvCacRatio: number;
  paybackPeriodMonths: number;
  bySource: { source: string; leads: number; bookings: number; revenue: number; cost: number; roi: number }[];
  byModel: { modelId: string; modelName: string; bookings: number; revenue: number; payout: number; profit: number }[];
  monthly: { month: string; revenue: number; bookings: number; arpu: number; newClients: number; churnedClients: number }[];
};

function getPeriodDates(preset: PeriodPreset): { start: string; end: string } {
  const now = new Date();
  const toISO = (d: Date) => d.toISOString().slice(0, 10);
  switch (preset) {
    case 'this_week': {
      const day = now.getDay();
      const diff = day === 0 ? 6 : day - 1;
      return { start: toISO(new Date(now.getFullYear(), now.getMonth(), now.getDate() - diff)), end: toISO(now) };
    }
    case 'last_month': {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      return { start: toISO(start), end: toISO(end) };
    }
    default:
      return { start: toISO(new Date(now.getFullYear(), now.getMonth(), 1)), end: toISO(now) };
  }
}

function fmt(v: number, type: 'money' | 'pct' | 'num' = 'num'): string {
  if (type === 'money') return `£${v.toLocaleString('en-GB', { maximumFractionDigits: 0 })}`;
  if (type === 'pct') return `${v.toFixed(1)}%`;
  return String(v);
}

export default function UnitEconomicsPage() {
  const [data, setData] = useState<UnitData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [preset, setPreset] = useState<PeriodPreset>('this_month');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      let dateFrom: string, dateTo: string;
      if (preset === 'custom' && customFrom && customTo) {
        dateFrom = customFrom;
        dateTo = customTo;
      } else {
        const dates = getPeriodDates(preset);
        dateFrom = dates.start;
        dateTo = dates.end;
      }
      const params = new URLSearchParams({ dateFrom, dateTo, granularity: 'monthly' });
      const res = await fetch(`/api/v1/analytics/unit-economics?${params}`);
      const json = await res.json();
      if (json.success !== false) {
        setData(json.data);
      } else {
        setError(json.error?.message || 'Failed to load');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [preset, customFrom, customTo]);

  useEffect(() => {
    if (preset !== 'custom' || (customFrom && customTo)) {
      loadData();
    }
  }, [loadData]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header + Period Picker */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">Unit Economics</h1>
          <p className="text-sm text-zinc-500 mt-1">Per-booking and per-client profitability</p>
        </div>
        <div className="flex gap-2">
          {(['this_week', 'this_month', 'last_month', 'custom'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPreset(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                preset === p ? 'bg-amber-500 text-zinc-900' : 'border border-zinc-700 hover:border-zinc-600 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {p === 'this_week' ? 'This Week' : p === 'this_month' ? 'This Month' : p === 'last_month' ? 'Last Month' : 'Custom'}
            </button>
          ))}
        </div>
      </div>

      {preset === 'custom' && (
        <div className="flex gap-3 items-end">
          <div>
            <label className="text-xs text-zinc-500">From</label>
            <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
              className="block bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200" />
          </div>
          <div>
            <label className="text-xs text-zinc-500">To</label>
            <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
              className="block bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200" />
          </div>
          <button onClick={loadData}
            className="px-4 py-2 rounded-lg text-sm bg-amber-500 text-zinc-900 font-medium hover:bg-amber-400">Apply</button>
        </div>
      )}

      {error && <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400 text-sm">{error}</div>}

      {loading ? (
        <div className="space-y-4 animate-pulse">
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-zinc-800/30 rounded-xl" />)}
          </div>
        </div>
      ) : data ? (
        <>
          {/* ── Summary Cards ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-4">
              <p className="text-xs text-zinc-500">ARPU</p>
              <p className="text-xl font-semibold text-zinc-100 mt-1">{fmt(data.arpu, 'money')}</p>
            </div>
            <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-4">
              <p className="text-xs text-zinc-500">MRR</p>
              <p className="text-xl font-semibold text-zinc-100 mt-1">{fmt(data.mrr, 'money')}</p>
            </div>
            <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-4">
              <p className="text-xs text-zinc-500">Avg Booking Value</p>
              <p className="text-xl font-semibold text-zinc-100 mt-1">{fmt(data.avgBookingValue, 'money')}</p>
            </div>
            <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-4">
              <p className="text-xs text-zinc-500">Avg Client LTV</p>
              <p className="text-xl font-semibold text-emerald-400 mt-1">{fmt(data.avgClientLtv, 'money')}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
            <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-4">
              <p className="text-xs text-zinc-500">Profit/Booking</p>
              <p className="text-xl font-semibold text-emerald-400 mt-1">{fmt(data.profitPerBooking, 'money')}</p>
            </div>
            <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-4">
              <p className="text-xs text-zinc-500">Commission</p>
              <p className="text-xl font-semibold text-zinc-100 mt-1">{fmt(data.avgCommission, 'money')}</p>
            </div>
            <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-4">
              <p className="text-xs text-zinc-500">Payout</p>
              <p className="text-xl font-semibold text-zinc-100 mt-1">{fmt(data.avgPayout, 'money')}</p>
            </div>
            <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-4">
              <p className="text-xs text-zinc-500">LTV Estimate</p>
              <p className="text-xl font-semibold text-zinc-100 mt-1">{fmt(data.ltvEstimate, 'money')}</p>
            </div>
            <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-4">
              <p className="text-xs text-zinc-500">LTV/CAC</p>
              <p className="text-xl font-semibold text-zinc-100 mt-1">{data.ltvCacRatio || '—'}</p>
            </div>
            <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-4">
              <p className="text-xs text-zinc-500">Payback</p>
              <p className="text-xl font-semibold text-zinc-100 mt-1">{data.paybackPeriodMonths ? `${data.paybackPeriodMonths} mo` : '—'}</p>
            </div>
          </div>

          {/* ── Monthly Table ── */}
          <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-5">
            <h3 className="text-sm font-semibold text-zinc-300 mb-4">Monthly Breakdown</h3>
            {data.monthly && data.monthly.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-zinc-800/50">
                      <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Month</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Revenue</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Bookings</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">ARPU</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">New Clients</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Churned</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/30">
                    {data.monthly.map(m => (
                      <tr key={m.month} className="hover:bg-zinc-800/20 transition-colors">
                        <td className="px-4 py-3 text-sm font-medium text-zinc-200">{m.month}</td>
                        <td className="px-4 py-3 text-sm text-zinc-300">{fmt(m.revenue, 'money')}</td>
                        <td className="px-4 py-3 text-sm text-zinc-300">{m.bookings}</td>
                        <td className="px-4 py-3 text-sm text-zinc-300">{fmt(m.arpu, 'money')}</td>
                        <td className="px-4 py-3 text-sm text-emerald-400">{m.newClients}</td>
                        <td className="px-4 py-3 text-sm text-red-400">{m.churnedClients}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-zinc-500 text-sm">No monthly data available</p>
            )}
          </div>

          {/* ── By Lead Source ── */}
          <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-5">
            <h3 className="text-sm font-semibold text-zinc-300 mb-4">By Lead Source</h3>
            {data.bySource.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-zinc-800/50">
                      <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Source</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Leads</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Bookings</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Revenue</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">ROI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/30">
                    {data.bySource.map(s => (
                      <tr key={s.source} className="hover:bg-zinc-800/20 transition-colors">
                        <td className="px-4 py-3 text-sm font-medium text-zinc-200">{s.source}</td>
                        <td className="px-4 py-3 text-sm text-zinc-300">{s.leads}</td>
                        <td className="px-4 py-3 text-sm text-zinc-300">{s.bookings}</td>
                        <td className="px-4 py-3 text-sm text-zinc-300">{fmt(s.revenue, 'money')}</td>
                        <td className="px-4 py-3 text-sm text-zinc-300">{s.roi ? `${s.roi.toFixed(1)}%` : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-zinc-500 text-sm">No lead source data yet</p>
            )}
          </div>

          {/* ── By Model ── */}
          <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-5">
            <h3 className="text-sm font-semibold text-zinc-300 mb-4">Top Models by Profit</h3>
            {data.byModel.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-zinc-800/50">
                      <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Model</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Bookings</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Revenue</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Payout</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Profit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/30">
                    {data.byModel.map(m => (
                      <tr key={m.modelId} className="hover:bg-zinc-800/20 transition-colors">
                        <td className="px-4 py-3 text-sm font-medium text-zinc-200">{m.modelName}</td>
                        <td className="px-4 py-3 text-sm text-zinc-300">{m.bookings}</td>
                        <td className="px-4 py-3 text-sm text-zinc-300">{fmt(m.revenue, 'money')}</td>
                        <td className="px-4 py-3 text-sm text-zinc-300">{fmt(m.payout, 'money')}</td>
                        <td className="px-4 py-3 text-sm font-medium text-emerald-400">{fmt(m.profit, 'money')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-zinc-500 text-sm">No model data yet</p>
            )}
          </div>
        </>
      ) : (
        <div className="text-zinc-500 text-center py-12">No data available</div>
      )}
    </div>
  );
}
