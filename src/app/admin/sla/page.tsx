// SLA MONITORING + SYSTEM HEALTH
'use client';

import { useEffect, useState, useCallback } from 'react';

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

type CronHealthEntry = {
  cronPath: string;
  lastExecutedAt: string | null;
  lastStatus: string;
  lastDurationMs: number | null;
};

type StalledJob = {
  id: string;
  type: string;
  startedAt: string | null;
  lastHeartbeatAt: string | null;
};

type DeadLetterEntry = { type: string; count: number };

type HealthData = {
  cronHealth: CronHealthEntry[];
  stalledJobs: StalledJob[];
  deadLetterByType: DeadLetterEntry[];
  deadLetterTotal: number;
  failedNotifications: number;
  queueStats: { queued: number; running: number; failed24h: number };
};

export default function SLAMonitoringPage() {
  const [stats, setStats] = useState<SLAStats | null>(null);
  const [breachedRecords, setBreachedRecords] = useState<SLARecord[]>([]);
  const [allRecords, setAllRecords] = useState<SLARecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [checking, setChecking] = useState(false);
  const [health, setHealth] = useState<HealthData | null>(null);

  const loadHealth = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/sla/health');
      const d = await res.json();
      if (d.success) setHealth(d.data);
    } catch {}
  }, []);

  useEffect(() => { loadAll(); loadHealth(); }, [filter]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const iv = setInterval(() => { loadAll(); loadHealth(); }, 60_000);
    return () => clearInterval(iv);
  }, [filter]);

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
    if (diff <= 0) return '\u2014';
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ${minutes % 60}m`;
    return `${Math.floor(hours / 24)}d ${hours % 24}h`;
  }

  function getDuration(start: string, end: string | null) {
    if (!end) return '\u2014';
    const diff = new Date(end).getTime() - new Date(start).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes}m`;
    return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  }

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">SLA Monitoring</h1>
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
          <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">SLA Monitoring</h1>
          <p className="text-sm text-zinc-500 mt-1">Service level agreement tracking and alerts</p>
        </div>
        <button onClick={runBreachCheck} disabled={checking} className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-900 text-sm font-medium transition-colors duration-150 disabled:opacity-50">
          {checking ? 'Checking...' : 'Check Breaches Now'}
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-5">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">SLA Breach Rate</p>
            <p className={`text-2xl font-semibold mt-2 ${stats.breachRate > 2 ? 'text-red-400' : 'text-emerald-400'}`}>{stats.breachRate.toFixed(1)}%</p>
          </div>
          <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-5">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Avg Response Time</p>
            <p className="text-2xl font-semibold text-zinc-100 mt-2">{stats.avgResponseMinutes} min</p>
          </div>
          <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-5">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Active Tracking</p>
            <p className="text-2xl font-semibold text-zinc-100 mt-2">{stats.activeTracking}</p>
          </div>
          <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-5">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Breached Today</p>
            <p className={`text-2xl font-semibold mt-2 ${stats.breachedToday > 0 ? 'text-red-400' : 'text-zinc-100'}`}>{stats.breachedToday}</p>
          </div>
        </div>
      )}

      {breachedRecords.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-red-400 uppercase tracking-wider mb-3">Breached SLAs ({breachedRecords.length})</h2>
          <div className="space-y-2">
            {breachedRecords.map(r => (
              <div key={r.id} className="rounded-xl border border-red-500/30 bg-red-500/5 px-5 py-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border bg-red-500/10 text-red-400 border-red-500/20">BREACHED</span>
                    <span className="font-medium text-zinc-200">{r.entityType} / {r.entityId.slice(0, 8)}...</span>
                    <span className="text-zinc-500">{r.policy.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-zinc-500 text-xs">Deadline: {new Date(r.deadlineAt).toLocaleString()}</span>
                    <span className="text-red-400 font-medium text-xs">Overdue: {getOverdue(r.deadlineAt)}</span>
                    {r.escalatedTo && <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border border-zinc-700/50 text-zinc-500">Escalated: {r.escalatedTo}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center gap-4 mb-4">
          <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">All SLA Records</h2>
          <div className="flex gap-1">
            {['all', 'open', 'breached'].map(f => (
              <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors duration-150 ${filter === f ? 'bg-amber-500 text-zinc-900' : 'border border-zinc-700 hover:border-zinc-600 text-zinc-400 hover:text-zinc-200'}`}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          {allRecords.map(r => (
            <div key={r.id} className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 px-5 py-3">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${r.breached ? 'bg-red-500/10 text-red-400 border-red-500/20' : r.completedAt ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'}`}>
                    {r.breached ? 'Breached' : r.completedAt ? 'Completed' : 'Active'}
                  </span>
                  <span className="font-medium text-zinc-200">{r.entityType}</span>
                  <span className="text-zinc-500">{r.policy.name}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-zinc-500">
                  <span>Started: {new Date(r.startedAt).toLocaleString()}</span>
                  <span>Deadline: {new Date(r.deadlineAt).toLocaleString()}</span>
                  <span>Duration: {getDuration(r.startedAt, r.completedAt)}</span>
                </div>
              </div>
            </div>
          ))}
          {allRecords.length === 0 && (
            <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-8 text-center"><p className="text-zinc-500">No SLA records found.</p></div>
          )}
        </div>
      </div>

      {/* ── System Health ─────────────────────────────────────── */}
      <div className="mt-12 border-t border-zinc-800/50 pt-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-zinc-100">System Health</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Cron jobs, queue, notifications — auto-refreshes every 60s</p>
          </div>
          <button onClick={() => { loadAll(); loadHealth(); }} className="px-3 py-1.5 rounded-lg border border-zinc-700 hover:border-zinc-600 text-zinc-400 hover:text-zinc-200 text-xs font-medium transition-colors">
            Refresh
          </button>
        </div>

        {!health ? (
          <div className="animate-pulse space-y-4">
            <div className="h-40 bg-zinc-800/30 rounded-xl" />
          </div>
        ) : (
          <>
            {/* Queue Stats */}
            <div className="grid grid-cols-4 gap-4 mb-8">
              <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-5">
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Queued Jobs</p>
                <p className="text-2xl font-semibold text-zinc-100 mt-2">{health.queueStats.queued}</p>
              </div>
              <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-5">
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Running Jobs</p>
                <p className="text-2xl font-semibold text-zinc-100 mt-2">{health.queueStats.running}</p>
              </div>
              <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-5">
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Failed (24h)</p>
                <p className={`text-2xl font-semibold mt-2 ${health.queueStats.failed24h > 0 ? 'text-red-400' : 'text-zinc-100'}`}>{health.queueStats.failed24h}</p>
              </div>
              <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-5">
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Failed Notifications (24h)</p>
                <p className={`text-2xl font-semibold mt-2 ${health.failedNotifications > 0 ? 'text-red-400' : 'text-zinc-100'}`}>{health.failedNotifications}</p>
              </div>
            </div>

            {/* Cron Health Table */}
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-3">Cron Health</h3>
              <div className="rounded-xl border border-zinc-800/50 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800/50">
                      <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase">Cron Path</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase">Last Run</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-zinc-500 uppercase">Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {health.cronHealth.map((c) => (
                      <tr key={c.cronPath} className="border-b border-zinc-800/30">
                        <td className="px-4 py-2.5 text-zinc-300 font-mono text-xs">{c.cronPath}</td>
                        <td className="px-4 py-2.5 text-zinc-500 text-xs">
                          {c.lastExecutedAt ? new Date(c.lastExecutedAt).toLocaleString() : 'Never'}
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${
                            c.lastStatus === 'success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : c.lastStatus === 'error' ? 'bg-red-500/10 text-red-400 border-red-500/20'
                              : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
                          }`}>{c.lastStatus}</span>
                        </td>
                        <td className="px-4 py-2.5 text-right text-zinc-500 text-xs">
                          {c.lastDurationMs != null ? `${c.lastDurationMs}ms` : '\u2014'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Stalled Jobs */}
            {health.stalledJobs.length > 0 && (
              <div className="mb-8">
                <h3 className="text-sm font-semibold text-red-400 uppercase tracking-wider mb-3">Stalled Jobs ({health.stalledJobs.length})</h3>
                <div className="space-y-2">
                  {health.stalledJobs.map((j) => (
                    <div key={j.id} className="rounded-xl border border-red-500/30 bg-red-500/5 px-5 py-3">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border bg-red-500/10 text-red-400 border-red-500/20">STALLED</span>
                          <span className="font-medium text-zinc-200">{j.type}</span>
                          <span className="text-zinc-500 text-xs">{j.id.slice(0, 8)}...</span>
                        </div>
                        <div className="text-xs text-zinc-500">
                          Last heartbeat: {j.lastHeartbeatAt ? new Date(j.lastHeartbeatAt).toLocaleString() : 'None'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Dead Letter Queue */}
            {health.deadLetterTotal > 0 && (
              <div className="mb-8">
                <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-3">Dead Letter Queue — Last 7 Days ({health.deadLetterTotal})</h3>
                <div className="rounded-xl border border-zinc-800/50 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-800/50">
                        <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase">Job Type</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-zinc-500 uppercase">Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {health.deadLetterByType.map((d) => (
                        <tr key={d.type} className="border-b border-zinc-800/30">
                          <td className="px-4 py-2.5 text-zinc-300">{d.type}</td>
                          <td className="px-4 py-2.5 text-right text-amber-400 font-medium">{d.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
