// SLA MONITORING — Full implementation (replaces placeholder)
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type SLARecord = {
  id: string;
  entityType: string;
  entityId: string;
  startedAt: string;
  deadlineAt: string;
  completedAt: string | null;
  breached: boolean;
  escalatedAt: string | null;
  escalatedTo: string | null;
  policy: { name: string; deadlineMinutes: number };
};

type SLAStats = {
  totalRecords: number;
  breachedRecords: number;
  breachRate: number;
  avgResponseMinutes: number;
  activeTracking: number;
  breachedToday: number;
};

export default function SLAMonitoringPage() {
  const [stats, setStats] = useState<SLAStats | null>(null);
  const [breachedRecords, setBreachedRecords] = useState<SLARecord[]>([]);
  const [allRecords, setAllRecords] = useState<SLARecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [checking, setChecking] = useState(false);

  useEffect(() => { loadAll(); }, [filter]);

  async function loadAll() {
    try {
      const params = new URLSearchParams();
      if (filter === 'breached') params.set('breached', 'true');
      if (filter === 'open') params.set('breached', 'false');

      const [statsRes, breachedRes, allRes] = await Promise.all([
        fetch('/api/v1/sla/stats'),
        fetch('/api/v1/sla/records?breached=true&limit=50'),
        fetch(`/api/v1/sla/records?${params}&limit=50`)
      ]);

      const statsData = await statsRes.json();
      const breachedData = await breachedRes.json();
      const allData = await allRes.json();

      setStats(statsData.data);
      setBreachedRecords(breachedData.data?.records || []);
      setAllRecords(allData.data?.records || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function runBreachCheck() {
    setChecking(true);
    try {
      const res = await fetch('/api/v1/sla/check-breaches', { method: 'POST' });
      const data = await res.json();
      alert(`Checked. ${data.data?.breachedCount || 0} new breaches found.`);
      loadAll();
    } catch (e) { console.error(e); }
    setChecking(false);
  }

  function getOverdue(deadlineAt: string) {
    const diff = Date.now() - new Date(deadlineAt).getTime();
    if (diff <= 0) return '—';
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ${minutes % 60}m`;
    return `${Math.floor(hours / 24)}d ${hours % 24}h`;
  }

  function getDuration(start: string, end: string | null) {
    if (!end) return '—';
    const diff = new Date(end).getTime() - new Date(start).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes}m`;
    return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  }

  if (loading) return <div className="p-6"><h1 className="text-3xl font-bold mb-4">SLA Monitoring</h1><p>Loading...</p></div>;

  return (
    <div className="p-6 max-w-7xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">SLA Monitoring</h1>
          <p className="text-muted-foreground">Service level agreement tracking and alerts</p>
        </div>
        <Button onClick={runBreachCheck} disabled={checking}>
          {checking ? 'Checking...' : 'Check Breaches Now'}
        </Button>
      </div>

      {/* Summary Cards */}
      {stats && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">SLA Breach Rate</CardTitle></CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${stats.breachRate > 2 ? 'text-red-600' : 'text-green-600'}`}>
                {stats.breachRate.toFixed(1)}%
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">Avg Response Time</CardTitle></CardHeader>
            <CardContent><div className="text-3xl font-bold">{stats.avgResponseMinutes} min</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">Active Tracking</CardTitle></CardHeader>
            <CardContent><div className="text-3xl font-bold">{stats.activeTracking}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">Breached Today</CardTitle></CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${stats.breachedToday > 0 ? 'text-red-600' : ''}`}>
                {stats.breachedToday}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Breached SLAs */}
      {breachedRecords.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-red-600">Breached SLAs ({breachedRecords.length})</h2>
          <div className="space-y-2">
            {breachedRecords.map(r => (
              <Card key={r.id} className="border-red-300">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3">
                      <Badge variant="destructive">BREACHED</Badge>
                      <span className="font-medium">{r.entityType} / {r.entityId.slice(0, 8)}...</span>
                      <span className="text-muted-foreground">{r.policy.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span>Deadline: {new Date(r.deadlineAt).toLocaleString()}</span>
                      <span className="text-red-600 font-medium">Overdue: {getOverdue(r.deadlineAt)}</span>
                      {r.escalatedTo && <Badge variant="outline">Escalated: {r.escalatedTo}</Badge>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* All SLA Records */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-xl font-semibold">All SLA Records</h2>
          <div className="flex gap-1 ml-4">
            {['all', 'open', 'breached'].map(f => (
              <Button key={f} size="sm" variant={filter === f ? 'default' : 'outline'} onClick={() => setFilter(f)}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          {allRecords.map(r => (
            <Card key={r.id}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <Badge variant={r.breached ? 'destructive' : r.completedAt ? 'default' : 'outline'}>
                      {r.breached ? 'Breached' : r.completedAt ? 'Completed' : 'Active'}
                    </Badge>
                    <span className="font-medium">{r.entityType}</span>
                    <span className="text-muted-foreground">{r.policy.name}</span>
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <span>Started: {new Date(r.startedAt).toLocaleString()}</span>
                    <span>Deadline: {new Date(r.deadlineAt).toLocaleString()}</span>
                    <span>Duration: {getDuration(r.startedAt, r.completedAt)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {allRecords.length === 0 && (
            <Card><CardContent className="pt-6"><p className="text-center text-muted-foreground">No SLA records found.</p></CardContent></Card>
          )}
        </div>
      </div>
    </div>
  );
}
