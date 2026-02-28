'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Stats {
  revenue: {
    total: number;
    thisMonth: number;
    lastMonth: number;
    growth: number;
  };
  bookings: {
    total: number;
    completed: number;
    cancelled: number;
    inProgress: number;
    conversionRate: number;
  };
  inquiries: {
    total: number;
    converted: number;
    conversionRate: number;
  };
  models: {
    total: number;
    active: number;
  };
  topModels: Array<{ name: string; bookings: number; revenue: number }>;
  recentActivity: Array<{ type: string; description: string; time: string }>;
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30d');

  useEffect(() => {
    loadStats();
  }, [period]);

  async function loadStats() {
    try {
      const res = await fetch(`/api/v1/analytics?period=${period}`);
      const data = await res.json();
      if (data.success) setStats(data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="p-6 text-muted-foreground">Loading analytics...</div>;
  if (!stats) return <div className="p-6 text-red-500">Failed to load analytics</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">📊 Analytics</h1>
          <p className="text-muted-foreground">Business performance overview</p>
        </div>
        <select
          value={period}
          onChange={e => setPeriod(e.target.value)}
          className="border border-border rounded-md px-3 py-2 bg-background"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="all">All time</option>
        </select>
      </div>

      {/* Revenue Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">£{stats.revenue.total.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">£{stats.revenue.thisMonth.toLocaleString()}</p>
            <p className={`text-sm mt-1 ${stats.revenue.growth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {stats.revenue.growth >= 0 ? '↑' : '↓'} {Math.abs(stats.revenue.growth)}% vs last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.bookings.total}</p>
            <p className="text-sm text-muted-foreground mt-1">{stats.bookings.completed} completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Inquiry Conversion</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.inquiries.conversionRate}%</p>
            <p className="text-sm text-muted-foreground mt-1">{stats.inquiries.converted}/{stats.inquiries.total} converted</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Booking Status Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Booking Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: 'Completed', value: stats.bookings.completed, color: 'bg-green-500' },
              { label: 'In Progress', value: stats.bookings.inProgress, color: 'bg-blue-500' },
              { label: 'Cancelled', value: stats.bookings.cancelled, color: 'bg-red-500' },
            ].map(item => (
              <div key={item.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{item.label}</span>
                  <span className="font-medium">{item.value}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className={`${item.color} h-2 rounded-full`}
                    style={{ width: stats.bookings.total ? `${(item.value / stats.bookings.total) * 100}%` : '0%' }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Top Models */}
        <Card>
          <CardHeader>
            <CardTitle>Top Models</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.topModels.length > 0 ? (
              <div className="space-y-3">
                {stats.topModels.map((model, i) => (
                  <div key={model.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold">{i + 1}</span>
                      <span className="font-medium">{model.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">£{model.revenue.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">{model.bookings} bookings</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No data yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Models Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Models Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-muted rounded-xl">
              <p className="text-3xl font-bold">{stats.models.total}</p>
              <p className="text-muted-foreground text-sm">Total Models</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-xl">
              <p className="text-3xl font-bold text-green-500">{stats.models.active}</p>
              <p className="text-muted-foreground text-sm">Active Models</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
