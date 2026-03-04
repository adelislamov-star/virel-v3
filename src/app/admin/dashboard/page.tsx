// DASHBOARD
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type DashboardData = {
  revenue: { total: number; commission: number; avgBookingValue: number; mrr: number };
  operations: { activeBookings: number; cancellationRate: number; openIncidents: number; pendingReviews: number };
  models: { published: number; avgCompleteness: number; riskDistribution: { green: number; yellow: number; red: number } };
  quickLinks: { pendingReviews: number; openIncidents: number; fraudAlerts: number };
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadDashboard(); }, []);

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
    quickLinks: { pendingReviews: 0, openIncidents: 0, fraudAlerts: 0 }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">Dashboard</h1>
        <p className="text-sm text-zinc-500 mt-1">Operations overview</p>
      </div>

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
