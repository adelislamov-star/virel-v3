// DEMAND ANALYTICS — Admin page
// Heatmap table, filters, summary cards, rebuild button
'use client';

import { useState, useEffect, useCallback } from 'react';

type DemandEntry = {
  id: string;
  locationId: string | null;
  city: string | null;
  area: string | null;
  timeSlot: string;
  requests: number;
  bookings: number;
  conversionRate: number;
  avgPrice: number;
  availableModelsCount: number;
  demandScore: number;
};

function getDefaultRange() {
  const now = new Date();
  const end = now.toISOString().split('T')[0];
  const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  return { start, end };
}

function scoreColor(score: number): string {
  if (score >= 80) return 'bg-red-500/30 text-red-300';
  if (score >= 60) return 'bg-orange-500/30 text-orange-300';
  if (score >= 40) return 'bg-amber-500/30 text-amber-300';
  if (score >= 20) return 'bg-emerald-500/30 text-emerald-300';
  return 'bg-zinc-800/50 text-zinc-500';
}

export default function DemandPage() {
  const [stats, setStats] = useState<DemandEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [building, setBuilding] = useState(false);
  const [error, setError] = useState('');

  const defaults = getDefaultRange();
  const [dateFrom, setDateFrom] = useState(defaults.start);
  const [dateTo, setDateTo] = useState(defaults.end);
  const [filterCity, setFilterCity] = useState('');

  const loadStats = useCallback(async () => {
    try {
      setError('');
      const params = new URLSearchParams();
      if (dateFrom) params.set('dateFrom', `${dateFrom}T00:00:00.000Z`);
      if (dateTo) params.set('dateTo', `${dateTo}T23:59:59.999Z`);
      if (filterCity) params.set('city', filterCity);

      const res = await fetch(`/api/v1/demand/stats?${params}`);
      const data = await res.json();
      if (data.success) setStats(data.data.stats);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [dateFrom, dateTo, filterCity]);

  useEffect(() => { setLoading(true); loadStats(); }, [loadStats]);

  async function handleRebuild() {
    setBuilding(true);
    try {
      const res = await fetch('/api/v1/demand/rebuild', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          periodStart: `${dateFrom}T00:00:00.000Z`,
          periodEnd: `${dateTo}T23:59:59.999Z`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setLoading(true);
        loadStats();
      }
    } catch {}
    finally { setBuilding(false); }
  }

  // Compute summary
  const cities = [...new Set(stats.map(s => s.city).filter(Boolean))];
  const topDemandCity = stats.length > 0
    ? stats.reduce((best, s) => (s.demandScore > (best?.demandScore || 0) ? s : best), stats[0])
    : null;
  const avgConversion = stats.length > 0
    ? (stats.reduce((sum, s) => sum + Number(s.conversionRate), 0) / stats.length).toFixed(1)
    : '0';
  const peakSlot = topDemandCity
    ? new Date(topDemandCity.timeSlot).toLocaleDateString()
    : '-';

  // Build heatmap: group by city, then by date
  const dateSet = new Set<string>();
  const cityMap = new Map<string, Map<string, DemandEntry>>();

  for (const s of stats) {
    const city = s.city || 'Unknown';
    const date = new Date(s.timeSlot).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
    dateSet.add(date);
    if (!cityMap.has(city)) cityMap.set(city, new Map());
    cityMap.get(city)!.set(date, s);
  }
  const dates = Array.from(dateSet).slice(0, 14); // max 14 columns

  if (loading && stats.length === 0) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight mb-2">Demand Analytics</h1>
        <div className="space-y-4 animate-pulse"><div className="h-64 bg-zinc-800/30 rounded-xl" /></div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">Demand Analytics</h1>
          <p className="text-sm text-zinc-500 mt-1">{stats.length} data points</p>
        </div>
        <button onClick={handleRebuild} disabled={building}
          className="px-4 py-2 rounded-lg bg-amber-500/20 text-amber-400 text-sm font-medium hover:bg-amber-500/30 border border-amber-500/30 disabled:opacity-50">
          {building ? 'Rebuilding...' : 'Rebuild Stats'}
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 text-red-400 text-sm mb-6">{error}</div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Top Demand City', value: topDemandCity?.city || '-', color: 'text-red-400' },
          { label: 'Peak Time Slot', value: peakSlot, color: 'text-amber-400' },
          { label: 'Avg Conversion Rate', value: `${avgConversion}%`, color: 'text-emerald-400' },
          { label: 'Cities Tracked', value: cities.length, color: 'text-blue-400' },
        ].map(card => (
          <div key={card.label} className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-5">
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">{card.label}</p>
            <p className={`text-2xl font-semibold ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <select value={filterCity} onChange={e => { setFilterCity(e.target.value); setLoading(true); }}
          className="rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-100 px-3 py-2 text-sm">
          <option value="">All Cities</option>
          {cities.map(c => <option key={c} value={c!}>{c}</option>)}
        </select>
        <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setLoading(true); }}
          className="rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-100 px-3 py-2 text-sm" />
        <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setLoading(true); }}
          className="rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-100 px-3 py-2 text-sm" />
      </div>

      {/* Heatmap Table */}
      <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 overflow-x-auto mb-8">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800/50">
              <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider sticky left-0 bg-zinc-900">City / Area</th>
              {dates.map(d => (
                <th key={d} className="text-center px-3 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">{d}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from(cityMap.entries()).map(([city, dateEntries]) => (
              <tr key={city} className="border-b border-zinc-800/30">
                <td className="px-4 py-3 text-zinc-200 font-medium sticky left-0 bg-zinc-900">{city}</td>
                {dates.map(d => {
                  const entry = dateEntries.get(d);
                  return (
                    <td key={d} className="px-3 py-3 text-center">
                      {entry ? (
                        <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg text-xs font-bold ${scoreColor(entry.demandScore)}`}
                          title={`Requests: ${entry.requests}, Bookings: ${entry.bookings}, Score: ${entry.demandScore}`}>
                          {entry.demandScore}
                        </div>
                      ) : (
                        <span className="text-zinc-700">-</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
            {cityMap.size === 0 && (
              <tr><td colSpan={dates.length + 1} className="px-4 py-12 text-center text-zinc-500">
                No demand data. Click &quot;Rebuild Stats&quot; to generate.
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Detail Table */}
      <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800/50">
              <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">City</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Date</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Requests</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Bookings</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Conv %</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Avg Price</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Models</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Score</th>
            </tr>
          </thead>
          <tbody>
            {stats.slice(0, 50).map(s => (
              <tr key={s.id} className="border-b border-zinc-800/30 hover:bg-zinc-800/20">
                <td className="px-4 py-3 text-zinc-200">{s.city || '-'}</td>
                <td className="px-4 py-3 text-zinc-400 text-xs">{new Date(s.timeSlot).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-center text-zinc-300">{s.requests}</td>
                <td className="px-4 py-3 text-center text-zinc-300">{s.bookings}</td>
                <td className="px-4 py-3 text-center text-zinc-400">{Number(s.conversionRate).toFixed(1)}%</td>
                <td className="px-4 py-3 text-center text-zinc-400">£{Number(s.avgPrice).toFixed(0)}</td>
                <td className="px-4 py-3 text-center text-zinc-400">{s.availableModelsCount}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold ${scoreColor(s.demandScore)}`}>
                    {s.demandScore}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
