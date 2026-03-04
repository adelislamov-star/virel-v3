// UNIT ECONOMICS
'use client';

import { useEffect, useState } from 'react';

type UnitData = {
  profitPerBooking: number;
  avgBookingValue: number;
  avgCommission: number;
  avgPayout: number;
  ltvEstimate: number;
  cacEstimate: number;
  ltvCacRatio: number;
  paybackPeriodMonths: number;
  bySource: { source: string; leads: number; bookings: number; revenue: number; cost: number; roi: number }[];
  byModel: { modelId: string; modelName: string; bookings: number; revenue: number; payout: number; profit: number }[];
};

export default function UnitEconomicsPage() {
  const [data, setData] = useState<UnitData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/analytics/unit-economics?period=month')
      .then(r => r.json())
      .then(d => { setData(d.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">Unit Economics</h1>
          <p className="text-sm text-zinc-500 mt-1">Loading...</p>
        </div>
        <div className="space-y-4 animate-pulse">
          <div className="grid grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => <div key={i} className="h-20 bg-zinc-800/30 rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!data) return <div className="p-8 max-w-7xl mx-auto"><h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">Unit Economics</h1><p className="text-zinc-500 mt-2">No data</p></div>;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">Unit Economics</h1>
        <p className="text-sm text-zinc-500 mt-1">Per-booking and per-client profitability</p>
      </div>

      <div className="grid grid-cols-3 md:grid-cols-6 gap-4 mb-8">
        <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-4">
          <p className="text-xs text-zinc-500">Profit/Booking</p>
          <p className="text-xl font-semibold text-emerald-400 mt-1">£{data.profitPerBooking.toFixed(0)}</p>
        </div>
        <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-4">
          <p className="text-xs text-zinc-500">Avg Booking Value</p>
          <p className="text-xl font-semibold text-zinc-100 mt-1">£{data.avgBookingValue.toFixed(0)}</p>
        </div>
        <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-4">
          <p className="text-xs text-zinc-500">LTV</p>
          <p className="text-xl font-semibold text-zinc-100 mt-1">£{data.ltvEstimate.toFixed(0)}</p>
        </div>
        <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-4">
          <p className="text-xs text-zinc-500">CAC</p>
          <p className="text-xl font-semibold text-zinc-100 mt-1">£{data.cacEstimate || '—'}</p>
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

      <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-5 mb-8">
        <h3 className="text-sm font-semibold text-zinc-300 mb-4">By Lead Source</h3>
        {data.bySource.length > 0 ? (
          <div className="rounded-xl border border-zinc-800/50 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800/50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Source</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Leads</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Bookings</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Revenue</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Cost</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">ROI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/30">
                {data.bySource.map(s => (
                  <tr key={s.source} className="hover:bg-zinc-800/20 transition-colors duration-100">
                    <td className="px-4 py-3 text-sm font-medium text-zinc-200">{s.source}</td>
                    <td className="px-4 py-3 text-sm text-zinc-300">{s.leads}</td>
                    <td className="px-4 py-3 text-sm text-zinc-300">{s.bookings}</td>
                    <td className="px-4 py-3 text-sm text-zinc-300">£{s.revenue.toFixed(0)}</td>
                    <td className="px-4 py-3 text-sm text-zinc-300">£{s.cost.toFixed(0)}</td>
                    <td className="px-4 py-3 text-sm text-zinc-300">{s.roi ? `${s.roi.toFixed(1)}%` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-zinc-500 text-sm">No lead source data yet.</p>
        )}
      </div>

      <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-5">
        <h3 className="text-sm font-semibold text-zinc-300 mb-4">Top Models by Profit</h3>
        {data.byModel.length > 0 ? (
          <div className="rounded-xl border border-zinc-800/50 overflow-hidden">
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
                  <tr key={m.modelId} className="hover:bg-zinc-800/20 transition-colors duration-100">
                    <td className="px-4 py-3 text-sm font-medium text-zinc-200">{m.modelName}</td>
                    <td className="px-4 py-3 text-sm text-zinc-300">{m.bookings}</td>
                    <td className="px-4 py-3 text-sm text-zinc-300">£{m.revenue.toFixed(0)}</td>
                    <td className="px-4 py-3 text-sm text-zinc-300">£{m.payout.toFixed(0)}</td>
                    <td className="px-4 py-3 text-sm font-medium text-emerald-400">£{m.profit.toFixed(0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-zinc-500 text-sm">No model data yet.</p>
        )}
      </div>
    </div>
  );
}