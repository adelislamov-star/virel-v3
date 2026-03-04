// DATA GOVERNANCE
'use client';

import { useEffect, useState } from 'react';

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

type Summary = { open: number; errors: number; warnings: number; avgCompleteness: number };

const severityStyles: Record<string, string> = {
  error: 'bg-red-500/10 text-red-400 border-red-500/20',
  warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  info: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
};

const dgStatusStyles: Record<string, string> = {
  open: 'bg-red-500/10 text-red-400 border-red-500/20',
  resolved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  ignored: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
};

const checkTypeLabels: Record<string, string> = {
  profile_completeness: 'Profile Completeness',
  outdated_profile: 'Outdated Profile',
  missing_photos: 'Missing Photos',
  stale_availability: 'Stale Availability',
  price_anomaly: 'Price Anomaly',
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

  function getDetailSummary(details: any) {
    if (!details) return '';
    if (typeof details === 'string') return details;
    return details.message || JSON.stringify(details).slice(0, 80);
  }

  const selectClass = 'px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-zinc-200 focus:outline-none focus:border-zinc-600 transition-colors duration-150';

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">Data Governance</h1>
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

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">Data Governance</h1>
          <p className="text-sm text-zinc-500 mt-1">Data quality monitoring and issue tracking</p>
        </div>
        <button onClick={runChecks} disabled={running} className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-900 text-sm font-medium transition-colors duration-150 disabled:opacity-50">
          {running ? 'Running...' : 'Run Checks Now'}
        </button>
      </div>

      {summary && (
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-5">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Open Issues</p>
            <p className={`text-2xl font-semibold mt-2 ${summary.open > 0 ? 'text-red-400' : 'text-zinc-100'}`}>{summary.open}</p>
          </div>
          <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-5">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Errors</p>
            <p className="text-2xl font-semibold text-red-400 mt-2">{summary.errors}</p>
          </div>
          <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-5">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Warnings</p>
            <p className="text-2xl font-semibold text-yellow-400 mt-2">{summary.warnings}</p>
          </div>
          <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-5">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Avg Completeness</p>
            <p className={`text-2xl font-semibold mt-2 ${summary.avgCompleteness < 70 ? 'text-red-400' : 'text-emerald-400'}`}>{summary.avgCompleteness}%</p>
          </div>
        </div>
      )}

      <div className="flex gap-4 mb-4">
        <div className="flex gap-1">
          {['open', 'resolved', 'ignored', ''].map(s => (
            <button key={s || 'all'} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors duration-150 ${statusFilter === s ? 'bg-amber-500 text-zinc-900' : 'border border-zinc-700 hover:border-zinc-600 text-zinc-400 hover:text-zinc-200'}`}>
              {s || 'All'}
            </button>
          ))}
        </div>
        <select className={selectClass} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <option value="">All Types</option>
          <option value="profile_completeness">Profile Completeness</option>
          <option value="outdated_profile">Outdated Profile</option>
          <option value="missing_photos">Missing Photos</option>
          <option value="stale_availability">Stale Availability</option>
        </select>
      </div>

      <div className="space-y-2">
        {checks.map(check => (
          <div key={check.id} className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 px-5 py-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border border-zinc-700/50 text-zinc-400">{checkTypeLabels[check.checkType] || check.checkType.replace(/_/g, ' ')}</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${severityStyles[check.severity] || 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'}`}>{check.severity}</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${dgStatusStyles[check.status] || 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'}`}>{check.status}</span>
                  <span className="text-xs text-zinc-500">{check.entityType} / {check.entityId.slice(0, 8)}...</span>
                </div>
                <p className="text-sm text-zinc-300">{getDetailSummary(check.details)}</p>
                <p className="text-xs text-zinc-600 mt-1">
                  Created: {new Date(check.createdAt).toLocaleString()}
                  {check.resolvedAt && ` | Resolved: ${new Date(check.resolvedAt).toLocaleString()} by ${check.resolvedBy}`}
                </p>
              </div>
              {check.status === 'open' && (
                <div className="flex gap-2 ml-4 shrink-0">
                  <button onClick={() => handleAction(check.id, 'resolve')} className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-900 text-xs font-medium transition-colors duration-150">Resolve</button>
                  <button onClick={() => handleAction(check.id, 'ignore')} className="px-3 py-1.5 rounded-lg border border-zinc-700 hover:border-zinc-600 text-zinc-300 text-xs font-medium transition-colors duration-150">Ignore</button>
                </div>
              )}
            </div>
          </div>
        ))}
        {checks.length === 0 && (
          <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-8 text-center"><p className="text-zinc-500">No quality checks found.</p></div>
        )}
      </div>
    </div>
  );
}
