// DATA GOVERNANCE — Quality checks management
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type QualityCheck = {
  id: string;
  checkType: string;
  entityType: string;
  entityId: string;
  status: string;
  severity: string;
  details: any;
  resolvedAt: string | null;
  resolvedBy: string | null;
  createdAt: string;
};

type Summary = {
  open: number;
  errors: number;
  warnings: number;
  avgCompleteness: number;
};

export default function DataGovernancePage() {
  const [checks, setChecks] = useState<QualityCheck[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [statusFilter, setStatusFilter] = useState('open');
  const [typeFilter, setTypeFilter] = useState('');

  useEffect(() => { loadChecks(); }, [statusFilter, typeFilter]);

  async function loadChecks() {
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (typeFilter) params.set('checkType', typeFilter);
      params.set('limit', '100');

      const res = await fetch(`/api/v1/data-governance/checks?${params}`);
      const data = await res.json();
      setChecks(data.data?.checks || []);
      setSummary(data.data?.summary || null);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function runChecks() {
    setRunning(true);
    try {
      const res = await fetch('/api/v1/data-governance/run', { method: 'POST' });
      const data = await res.json();
      alert(`Quality check complete: ${data.data?.newChecks || 0} new issues found, ${data.data?.existing || 0} existing.`);
      loadChecks();
    } catch (e) { console.error(e); }
    setRunning(false);
  }

  async function handleAction(id: string, action: 'resolve' | 'ignore') {
    try {
      await fetch(`/api/v1/data-governance/checks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      loadChecks();
    } catch (e) { console.error(e); }
  }

  function getSeverityBadge(severity: string) {
    const map: Record<string, any> = { error: 'destructive', warning: 'orange', info: 'default' };
    return <Badge variant={map[severity] || 'default'}>{severity}</Badge>;
  }

  function getStatusBadge(status: string) {
    const map: Record<string, any> = { open: 'destructive', resolved: 'default', ignored: 'secondary' };
    return <Badge variant={map[status] || 'default'}>{status}</Badge>;
  }

  function getCheckTypeLabel(type: string) {
    const labels: Record<string, string> = {
      profile_completeness: 'Profile Completeness',
      outdated_profile: 'Outdated Profile',
      missing_photos: 'Missing Photos',
      stale_availability: 'Stale Availability',
      price_anomaly: 'Price Anomaly'
    };
    return labels[type] || type.replace(/_/g, ' ');
  }

  function getDetailSummary(details: any) {
    if (!details) return '';
    if (typeof details === 'string') return details;
    return details.message || JSON.stringify(details).slice(0, 80);
  }

  if (loading) return <div className="p-6"><h1 className="text-3xl font-bold mb-4">Data Governance</h1><p>Loading...</p></div>;

  return (
    <div className="p-6 max-w-7xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Data Governance</h1>
          <p className="text-muted-foreground">Data quality monitoring and issue tracking</p>
        </div>
        <Button onClick={runChecks} disabled={running}>
          {running ? 'Running...' : 'Run Checks Now'}
        </Button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">Open Issues</CardTitle></CardHeader>
            <CardContent><div className={`text-3xl font-bold ${summary.open > 0 ? 'text-red-600' : ''}`}>{summary.open}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">Errors</CardTitle></CardHeader>
            <CardContent><div className="text-3xl font-bold text-red-600">{summary.errors}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">Warnings</CardTitle></CardHeader>
            <CardContent><div className="text-3xl font-bold text-yellow-600">{summary.warnings}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">Avg Completeness</CardTitle></CardHeader>
            <CardContent><div className={`text-3xl font-bold ${summary.avgCompleteness < 70 ? 'text-red-600' : 'text-green-600'}`}>{summary.avgCompleteness}%</div></CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4 mb-4">
        <div className="flex gap-1">
          {['open', 'resolved', 'ignored', ''].map(s => (
            <Button key={s || 'all'} size="sm" variant={statusFilter === s ? 'default' : 'outline'} onClick={() => setStatusFilter(s)}>
              {s || 'All'}
            </Button>
          ))}
        </div>
        <select className="rounded-md border p-1 text-sm bg-background" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <option value="">All Types</option>
          <option value="profile_completeness">Profile Completeness</option>
          <option value="outdated_profile">Outdated Profile</option>
          <option value="missing_photos">Missing Photos</option>
          <option value="stale_availability">Stale Availability</option>
        </select>
      </div>

      {/* Checks List */}
      <div className="space-y-2">
        {checks.map(check => (
          <Card key={check.id}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline">{getCheckTypeLabel(check.checkType)}</Badge>
                    {getSeverityBadge(check.severity)}
                    {getStatusBadge(check.status)}
                    <span className="text-sm text-muted-foreground">{check.entityType} / {check.entityId.slice(0, 8)}...</span>
                  </div>
                  <p className="text-sm">{getDetailSummary(check.details)}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Created: {new Date(check.createdAt).toLocaleString()}
                    {check.resolvedAt && ` | Resolved: ${new Date(check.resolvedAt).toLocaleString()} by ${check.resolvedBy}`}
                  </p>
                </div>
                {check.status === 'open' && (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleAction(check.id, 'resolve')}>Resolve</Button>
                    <Button size="sm" variant="outline" onClick={() => handleAction(check.id, 'ignore')}>Ignore</Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {checks.length === 0 && (
          <Card><CardContent className="pt-6"><p className="text-center text-muted-foreground">No quality checks found.</p></CardContent></Card>
        )}
      </div>
    </div>
  );
}
