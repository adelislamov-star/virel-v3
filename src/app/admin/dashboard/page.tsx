// DASHBOARD
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type PendingRequest = {
  id: string;
  clientName: string;
  date: string;
  grandTotal: number;
  createdAt: string;
};

type TopModel = {
  id: string;
  name: string;
  slug: string;
  viewsToday: number;
  viewsTotal: number;
};

type ConfirmationNeeded = {
  id: string;
  shortId: string | null;
  startAt: string;
  status: string;
  clientName: string;
  modelName: string;
};

type AttentionModel = {
  id: string;
  name: string;
  reason: string;
};

type DashboardData = {
  revenue: { total: number; commission: number; avgBookingValue: number; mrr: number };
  operations: { activeBookings: number; cancellationRate: number; openIncidents: number; pendingReviews: number };
  models: { published: number; avgCompleteness: number; riskDistribution: { green: number; yellow: number; red: number } };
  quickLinks: { pendingReviews: number; openIncidents: number; fraudAlerts: number };
  pendingBookingRequests: PendingRequest[];
  topViewedModels: TopModel[];
  confirmationsNeeded: ConfirmationNeeded[];
  weeklyRevenue: { thisWeek: number; lastWeek: number };
  modelsNeedingAttention?: AttentionModel[];
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

function formatTime(d: string) {
  return new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [attentionModels, setAttentionModels] = useState<AttentionModel[]>([]);

  useEffect(() => { loadDashboard(); loadAttentionModels(); }, []);

  async function loadDashboard() {
    try {
      const res = await fetch('/api/v1/analytics/dashboard');
      const json = await res.json();
      setData(json.data || null);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadAttentionModels() {
    try {
      const res = await fetch('/api/v1/models?all=true');
      const json = await res.json();
      const models = json.data?.models || [];
      const attention: AttentionModel[] = [];
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

      for (const m of models) {
        if (m.status === 'draft' && new Date(m.createdAt).getTime() < sevenDaysAgo) {
          attention.push({ id: m.id, name: m.name, reason: 'Draft > 7 days' });
        } else if (!m._count?.media && m._count?.media !== undefined && m._count.media === 0) {
          attention.push({ id: m.id, name: m.name, reason: 'No photos' });
        } else if (m.dataCompletenessScore !== undefined && m.dataCompletenessScore < 50) {
          attention.push({ id: m.id, name: m.name, reason: 'Low completeness' });
        }
      }
      setAttentionModels(attention.slice(0, 10));
    } catch {}
  }

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">Dashboard</h1>
          <p className="text-sm text-zinc-500 mt-1">Operations overview</p>
        </div>
        <div className="space-y-4 animate-pulse">
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-zinc-800/30 rounded-xl" />)}
          </div>
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-zinc-800/30 rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  const d = data || {
    revenue: { total: 0, commission: 0, avgBookingValue: 0, mrr: 0 },
    operations: { activeBookings: 0, cancellationRate: 0, openIncidents: 0, pendingReviews: 0 },
    models: { published: 0, avgCompleteness: 0, riskDistribution: { green: 0, yellow: 0, red: 0 } },
    quickLinks: { pendingReviews: 0, openIncidents: 0, fraudAlerts: 0 },
    pendingBookingRequests: [],
    topViewedModels: [],
    confirmationsNeeded: [],
    weeklyRevenue: { thisWeek: 0, lastWeek: 0 },
  };

  const weeklyDelta = d.weeklyRevenue.lastWeek > 0
    ? Math.round(((d.weeklyRevenue.thisWeek - d.weeklyRevenue.lastWeek) / d.weeklyRevenue.lastWeek) * 100)
    : d.weeklyRevenue.thisWeek > 0 ? 100 : 0;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">Dashboard</h1>
        <p className="text-sm text-zinc-500 mt-1">Operations overview</p>
      </div>

      {/* ═══ RECEPTION OVERVIEW ═══ */}
      <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">Reception</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Widget 1: Pending Booking Requests */}
        <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Pending Requests</p>
            <span className={`text-lg font-semibold ${d.pendingBookingRequests.length > 0 ? 'text-amber-400' : 'text-zinc-400'}`}>
              {d.pendingBookingRequests.length}
            </span>
          </div>
          <div className="space-y-2">
            {d.pendingBookingRequests.length === 0 && (
              <p className="text-xs text-zinc-600">No pending requests</p>
            )}
            {d.pendingBookingRequests.map((r) => (
              <Link key={r.id} href={`/admin/booking-requests/${r.id}`}>
                <div className="flex items-center justify-between text-xs hover:bg-zinc-800/50 rounded px-2 py-1.5 transition-colors">
                  <span className="text-zinc-300 truncate">{r.clientName}</span>
                  <span className="text-zinc-500 flex-shrink-0 ml-2">{timeAgo(r.createdAt)}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Widget 2: Top Viewed Models Today */}
        <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-5">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">Top Viewed Today</p>
          <div className="space-y-2">
            {d.topViewedModels.length === 0 && (
              <p className="text-xs text-zinc-600">No views yet today</p>
            )}
            {d.topViewedModels.map((m, i) => (
              <div key={m.id} className="flex items-center justify-between text-xs">
                <span className="text-zinc-300">
                  <span className="text-zinc-600 mr-1.5">{i + 1}.</span>
                  {m.name}
                </span>
                <span className="text-emerald-400 font-medium">{m.viewsToday}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Widget 3: Confirmations Needed */}
        <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Confirm (24h)</p>
            <span className={`text-lg font-semibold ${d.confirmationsNeeded.length > 0 ? 'text-red-400' : 'text-zinc-400'}`}>
              {d.confirmationsNeeded.length}
            </span>
          </div>
          <div className="space-y-2">
            {d.confirmationsNeeded.length === 0 && (
              <p className="text-xs text-zinc-600">All confirmed</p>
            )}
            {d.confirmationsNeeded.slice(0, 5).map((b) => (
              <Link key={b.id} href={`/admin/bookings/${b.id}`}>
                <div className="flex items-center justify-between text-xs hover:bg-zinc-800/50 rounded px-2 py-1.5 transition-colors">
                  <span className="text-zinc-300 truncate">{b.shortId || b.modelName}</span>
                  <span className="text-red-400 flex-shrink-0 ml-2">{formatTime(b.startAt)}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Widget 4: Weekly Revenue Comparison */}
        <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-5">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">Weekly Revenue</p>
          <p className="text-2xl font-semibold text-zinc-100">£{d.weeklyRevenue.thisWeek.toFixed(0)}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className={`text-xs font-medium ${weeklyDelta >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {weeklyDelta >= 0 ? '+' : ''}{weeklyDelta}%
            </span>
            <span className="text-xs text-zinc-600">vs last week (£{d.weeklyRevenue.lastWeek.toFixed(0)})</span>
          </div>
        </div>
      </div>

      {/* ═══ REVENUE ═══ */}
      <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">Revenue</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-5">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Revenue (this month)</p>
          <p className="text-2xl font-semibold text-zinc-100 mt-2">£{d.revenue.total.toFixed(0)}</p>
        </div>
        <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-5">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Commission</p>
          <p className="text-2xl font-semibold text-zinc-100 mt-2">£{d.revenue.commission.toFixed(0)}</p>
        </div>
        <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-5">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Avg Booking Value</p>
          <p className="text-2xl font-semibold text-zinc-100 mt-2">£{d.revenue.avgBookingValue.toFixed(0)}</p>
        </div>
        <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-5">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">MRR</p>
          <p className="text-2xl font-semibold text-zinc-400 mt-2">£{d.revenue.mrr}</p>
        </div>
      </div>

      {/* ═══ OPERATIONS ═══ */}
      <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">Operations</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-5">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Active Bookings</p>
          <p className="text-2xl font-semibold text-emerald-400 mt-2">{d.operations.activeBookings}</p>
        </div>
        <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-5">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Cancellation Rate</p>
          <p className={`text-2xl font-semibold mt-2 ${d.operations.cancellationRate > 20 ? 'text-red-400' : d.operations.cancellationRate > 10 ? 'text-yellow-400' : 'text-emerald-400'}`}>
            {d.operations.cancellationRate}%
          </p>
        </div>
        <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-5">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Open Incidents</p>
          <p className={`text-2xl font-semibold mt-2 ${d.operations.openIncidents > 0 ? 'text-amber-400' : 'text-zinc-100'}`}>
            {d.operations.openIncidents}
          </p>
        </div>
        <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-5">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Pending Reviews</p>
          <p className={`text-2xl font-semibold mt-2 ${d.operations.pendingReviews > 0 ? 'text-yellow-400' : 'text-zinc-100'}`}>
            {d.operations.pendingReviews}
          </p>
        </div>
      </div>

      {/* ═══ MODELS ═══ */}
      <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">Models</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-5">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Published Models</p>
          <p className="text-2xl font-semibold text-zinc-100 mt-2">{d.models.published}</p>
        </div>
        <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-5">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Avg Completeness</p>
          <p className={`text-2xl font-semibold mt-2 ${d.models.avgCompleteness >= 80 ? 'text-emerald-400' : d.models.avgCompleteness >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
            {d.models.avgCompleteness}%
          </p>
        </div>
        <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-5">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Risk Distribution</p>
          <div className="flex items-center gap-4 mt-2">
            <span className="text-lg font-semibold text-emerald-400">{d.models.riskDistribution.green}</span>
            <span className="text-lg font-semibold text-yellow-400">{d.models.riskDistribution.yellow}</span>
            <span className="text-lg font-semibold text-red-400">{d.models.riskDistribution.red}</span>
          </div>
        </div>
      </div>

      {/* ═══ MODELS NEEDING ATTENTION ═══ */}
      {attentionModels.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">Models Needing Attention</h2>
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5">
            <div className="space-y-2">
              {attentionModels.map((m) => (
                <Link key={m.id} href={`/admin/models/${m.id}`}>
                  <div className="flex items-center justify-between text-sm hover:bg-zinc-800/30 rounded-lg px-3 py-2 transition-colors">
                    <span className="text-zinc-200">{m.name}</span>
                    <span className="text-xs text-amber-400 font-medium">{m.reason}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ BOTTOM PANELS ═══ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-5">
          <h3 className="text-sm font-semibold text-zinc-300 mb-4">Quick Actions</h3>
          <div className="space-y-2">
            {[
              { href: '/admin/reviews', label: 'Review Queue', count: d.quickLinks.pendingReviews },
              { href: '/admin/incidents', label: 'Open Incidents', count: d.quickLinks.openIncidents },
              { href: '/admin/fraud', label: 'Fraud Alerts', count: d.quickLinks.fraudAlerts },
              { href: '/admin/action-center', label: 'Action Center' },
              { href: '/admin/bookings', label: 'All Bookings' },
              { href: '/admin/reports', label: 'Reports' },
            ].map(link => (
              <Link key={link.href} href={link.href}>
                <div className="px-3 py-2 rounded-lg hover:bg-zinc-800/50 text-sm text-zinc-400 hover:text-zinc-200 transition-colors duration-150 flex justify-between items-center">
                  <span>{link.label}</span>
                  {link.count !== undefined && (
                    <span className="text-xs font-medium text-zinc-500">{link.count}</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-5">
          <h3 className="text-sm font-semibold text-zinc-300 mb-4">System Status</h3>
          <div className="space-y-3">
            {[
              { label: 'Database', status: 'Connected', ok: true },
              { label: 'API Server', status: 'Running', ok: true },
              { label: 'Queue Worker', status: 'Not Running', ok: false },
              { label: 'Telegram Bots', status: 'Not Configured', ok: false },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between text-sm">
                <span className="text-zinc-400">{item.label}</span>
                <span className={`font-medium ${item.ok ? 'text-emerald-400' : 'text-yellow-400'}`}>
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
