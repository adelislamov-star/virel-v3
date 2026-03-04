// DASHBOARD PAGE — UPDATED WITH PHASE 2 METRICS
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

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

  if (loading) return <div className="p-6">Loading...</div>;

  const d = data || {
    revenue: { total: 0, commission: 0, avgBookingValue: 0, mrr: 0 },
    operations: { activeBookings: 0, cancellationRate: 0, openIncidents: 0, pendingReviews: 0 },
    models: { published: 0, avgCompleteness: 0, riskDistribution: { green: 0, yellow: 0, red: 0 } },
    quickLinks: { pendingReviews: 0, openIncidents: 0, fraudAlerts: 0 }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">📊 Dashboard</h1>
        <p className="text-muted-foreground">Operations overview</p>
      </div>

      {/* Row 1: Revenue Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Revenue (this month)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">£{d.revenue.total.toFixed(0)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Commission</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">£{d.revenue.commission.toFixed(0)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Avg Booking Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">£{d.revenue.avgBookingValue.toFixed(0)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">MRR</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-muted-foreground">£{d.revenue.mrr}</div>
            <p className="text-xs text-muted-foreground">Phase 3</p>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Operations Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Active Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{d.operations.activeBookings}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Cancellation Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${d.operations.cancellationRate > 20 ? 'text-red-600' : d.operations.cancellationRate > 10 ? 'text-yellow-600' : 'text-green-600'}`}>
              {d.operations.cancellationRate}%
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Open Incidents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${d.operations.openIncidents > 0 ? 'text-orange-600' : ''}`}>
              {d.operations.openIncidents}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${d.operations.pendingReviews > 0 ? 'text-yellow-600' : ''}`}>
              {d.operations.pendingReviews}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Model Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Published Models</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{d.models.published}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Avg Completeness Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${d.models.avgCompleteness >= 80 ? 'text-green-600' : d.models.avgCompleteness >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
              {d.models.avgCompleteness}%
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Risk Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <span className="text-green-600 font-bold">🟢 {d.models.riskDistribution.green}</span>
              <span className="text-yellow-600 font-bold">🟡 {d.models.riskDistribution.yellow}</span>
              <span className="text-red-600 font-bold">🔴 {d.models.riskDistribution.red}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 4: Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/admin/reviews">
              <Button className="w-full justify-start" variant="outline">
                ⭐ Review Queue ({d.quickLinks.pendingReviews})
              </Button>
            </Link>
            <Link href="/admin/incidents">
              <Button className="w-full justify-start" variant="outline">
                ⚠️ Open Incidents ({d.quickLinks.openIncidents})
              </Button>
            </Link>
            <Link href="/admin/fraud">
              <Button className="w-full justify-start" variant="outline">
                🛡️ Fraud Alerts ({d.quickLinks.fraudAlerts})
              </Button>
            </Link>
            <Link href="/admin/action-center">
              <Button className="w-full justify-start" variant="outline">
                🎯 Action Center
              </Button>
            </Link>
            <Link href="/admin/bookings">
              <Button className="w-full justify-start" variant="outline">
                📅 All Bookings
              </Button>
            </Link>
            <Link href="/admin/reports">
              <Button className="w-full justify-start" variant="outline">
                📋 Reports
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Database</span>
              <span className="text-sm font-semibold text-green-600">✓ Connected</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">API Server</span>
              <span className="text-sm font-semibold text-green-600">✓ Running</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Queue Worker</span>
              <span className="text-sm font-semibold text-yellow-600">⚠ Not Running</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Telegram Bots</span>
              <span className="text-sm font-semibold text-yellow-600">⚠ Not Configured</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
