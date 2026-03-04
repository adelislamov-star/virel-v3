// ANALYTICS
'use client';

import { useEffect, useState } from 'react';

interface Stats {
  revenue: { total: number; thisMonth: number; lastMonth: number; growth: number };
  bookings: { total: number; completed: number; cancelled: number; inProgress: number; conversionRate: number };
  inquiries: { total: number; converted: number; conversionRate: number };
  models: { total: number; active: number };
  topModels: Array<{ name: string; bookings: number; revenue: number }>;
  recentActivity: Array<{ type: string; description: string; time: string }>;
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30d');

  useEffect(() => { loadStats(); }, [period]);

  async function loadStats() {
    try {
      const res = await fetch(`/api/v1/analytics?period=${period}`);
      const data = await res.json();
      if (data.success) setStats(data.data);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">Analytics</h1>
          <p className="text-sm text-zinc-500 mt-1">Loading...</p>
        </div>
        <div className="space-y-4 animate-pulse">
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-zinc-800/30 rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!stats) return <div className="p-8 max-w-7xl mx-auto text-red-400">Failed to load analytics</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">Analytics</h1>
          <p className="text-sm text-zinc-500 mt-1">Business performance overview</p>
        </div>
        <select
          value={period}
          onChange={e => setPeriod(e.target.value)}
          className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-zinc-200 focus:outline-none focus:border-zinc-600 transition-colors duration-150"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="all">All time</option>
        </select>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-5">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Total Revenue</p>
          <p className="text-2xl font-semibold text-zinc-100 mt-2">£{stats.revenue.total.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-5">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">This Month</p>
          <p className="text-2xl font-semibold text-zinc-100 mt-2">£{stats.revenue.thisMonth.toLocaleString()}</p>
          <p className={`text-xs mt-1 ${stats.revenue.growth >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {stats.revenue.growth >= 0 ? '↑' : '↓'} {Math.abs(stats.revenue.growth)}% vs last month
          </p>
        </div>
        <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-5">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Total Bookings</p>
          <p className="text-2xl font-semibold text-zinc-100 mt-2">{stats.bookings.total}</p>
          <p className="text-xs text-zinc-500 mt-1">{stats.bookings.completed} completed</p>
        </div>
        <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-5">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Inquiry Conversion</p>
          <p className="text-2xl font-semibold text-zinc-100 mt-2">{stats.inquiries.conversionRate}%</p>
          <p className="text-xs text-zinc-500 mt-1">{stats.inquiries.converted}/{stats.inquiries.total} converted</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-5">
          <h3 className="text-sm font-semibold text-zinc-300 mb-4">Booking Status</h3>
          <div className="space-y-3">
            {[
              { label: 'Completed', value: stats.bookings.completed, color: 'bg-emerald-500' },
              { label: 'In Progress', value: stats.bookings.inProgress, color: 'bg-blue-500' },
              { label: 'Cancelled', value: stats.bookings.cancelled, color: 'bg-red-500' },
            ].map(item => (
              <div key={item.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-zinc-400">{item.label}</span>
                  <span className="font-medium text-zinc-200">{item.value}</span>
                </div>
                <div className="w-full bg-zinc-800/50 rounded-full h-1.5">
                  <div className={`${item.color} h-1.5 rounded-full transition-all duration-300`} style={{ width: stats.bookings.total ? `${(item.value / stats.bookings.total) * 100}%` : '0%' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-5">
          <h3 className="text-sm font-semibold text-zinc-300 mb-4">Top Models</h3>
          {stats.topModels.length > 0 ? (
            <div className="space-y-3">
              {stats.topModels.map((model, i) => (
                <div key={model.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center text-xs font-bold text-amber-400">{i + 1}</span>
                    <span className="text-sm font-medium text-zinc-200">{model.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-zinc-100">£{model.revenue.toLocaleString()}</p>
                    <p className="text-xs text-zinc-500">{model.bookings} bookings</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-zinc-500 text-sm">No data yet</p>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-5">
        <h3 className="text-sm font-semibold text-zinc-300 mb-4">Models Overview</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 rounded-xl bg-zinc-800/30">
            <p className="text-2xl font-semibold text-zinc-100">{stats.models.total}</p>
            <p className="text-xs text-zinc-500 mt-1">Total Models</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-zinc-800/30">
            <p className="text-2xl font-semibold text-emerald-400">{stats.models.active}</p>
            <p className="text-xs text-zinc-500 mt-1">Active Models</p>
          </div>
        </div>
      </div>
    </div>
  );
}