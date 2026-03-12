// JOB QUEUE — Admin page
// Tabs, summary cards, table with actions, job drawer with logs
'use client';

import { useState, useEffect, useCallback } from 'react';

// ─── Types ───────────────────────────────────────────────

type Job = {
  id: string;
  type: string;
  status: string;
  priority: string;
  attempts: number;
  maxAttempts: number;
  workerName?: string | null;
  scheduledAt: string;
  startedAt?: string | null;
  finishedAt?: string | null;
  failedAt?: string | null;
  errorText?: string | null;
  createdAt: string;
  parentJobId?: string | null;
  payloadJson?: any;
};

type JobLogEntry = {
  id: string;
  step: string;
  status: string;
  message: string;
  createdAt: string;
};

type Tab = 'all' | 'running' | 'failed' | 'dead_letter';

const priorityBadge: Record<string, string> = {
  critical: 'bg-red-500/10 text-red-400 border-red-500/20',
  high: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  normal: 'bg-zinc-500/10 text-zinc-300 border-zinc-700/50',
  low: 'bg-zinc-500/10 text-zinc-500 border-zinc-700/50',
};

const statusBadge: Record<string, string> = {
  queued: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  running: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  succeeded: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  failed: 'bg-red-500/10 text-red-400 border-red-500/20',
  dead_letter: 'bg-red-500/20 text-red-300 border-red-500/30',
  cancelled: 'bg-zinc-500/10 text-zinc-500 border-zinc-700/50',
};

// ─── Component ───────────────────────────────────────────

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<Tab>('all');
  const [page, setPage] = useState(1);

  // Drawer
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [jobLogs, setJobLogs] = useState<JobLogEntry[]>([]);
  const [drawerLoading, setDrawerLoading] = useState(false);

  // Counts for summary
  const [counts, setCounts] = useState({ queued: 0, running: 0, failed: 0, dead_letter: 0 });

  const loadJobs = useCallback(async () => {
    try {
      setError('');
      const params = new URLSearchParams();
      if (tab !== 'all') params.set('status', tab);
      params.set('page', String(page));
      params.set('limit', '20');

      const res = await fetch(`/api/v1/jobs?${params}`);
      const data = await res.json();

      if (data.success) {
        setJobs(data.data.jobs);
        setTotal(data.data.total);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [tab, page]);

  const loadCounts = useCallback(async () => {
    try {
      const [q, r, f, d] = await Promise.all([
        fetch('/api/v1/jobs?status=queued&limit=1').then(r => r.json()),
        fetch('/api/v1/jobs?status=running&limit=1').then(r => r.json()),
        fetch('/api/v1/jobs?status=failed&limit=1').then(r => r.json()),
        fetch('/api/v1/jobs?status=dead_letter&limit=1').then(r => r.json()),
      ]);
      setCounts({
        queued: q.data?.total ?? 0,
        running: r.data?.total ?? 0,
        failed: f.data?.total ?? 0,
        dead_letter: d.data?.total ?? 0,
      });
    } catch {}
  }, []);

  useEffect(() => {
    loadJobs();
    loadCounts();
  }, [loadJobs, loadCounts]);

  // Auto-refresh every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadJobs();
      loadCounts();
    }, 10_000);
    return () => clearInterval(interval);
  }, [loadJobs, loadCounts]);

  async function openDrawer(job: Job) {
    setSelectedJob(job);
    setDrawerLoading(true);
    try {
      const res = await fetch(`/api/v1/jobs/${job.id}`);
      const data = await res.json();
      if (data.success) {
        setSelectedJob(data.data.job);
        setJobLogs(data.data.logs);
      }
    } catch {}
    setDrawerLoading(false);
  }

  async function handleRetry(jobId: string) {
    const reason = prompt('Reason code for retry:');
    if (!reason) return;
    await fetch(`/api/v1/jobs/${jobId}/retry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reasonCode: reason }),
    });
    loadJobs();
    loadCounts();
  }

  async function handleCancel(jobId: string) {
    if (!confirm('Cancel this job?')) return;
    await fetch(`/api/v1/jobs/${jobId}/cancel`, { method: 'POST' });
    loadJobs();
    loadCounts();
  }

  // ─── Render ──────────────────────────────────────────────

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight mb-2">Job Queue</h1>
        <p className="text-sm text-zinc-500 mb-8">Background job management</p>
        <div className="space-y-4 animate-pulse">
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-zinc-800/30 rounded-xl" />)}
          </div>
          <div className="h-64 bg-zinc-800/30 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight mb-2">Job Queue</h1>
        <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-6 text-red-400">{error}</div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">Job Queue</h1>
        <p className="text-sm text-zinc-500 mt-1">Background job management</p>
      </div>

      {/* ── Summary Cards ────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-5">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Queued</p>
          <p className={`text-2xl font-semibold mt-2 ${counts.queued > 0 ? 'text-blue-400' : 'text-zinc-100'}`}>{counts.queued}</p>
        </div>
        <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-5">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Running</p>
          <p className={`text-2xl font-semibold mt-2 ${counts.running > 0 ? 'text-purple-400' : 'text-zinc-100'}`}>{counts.running}</p>
        </div>
        <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-5">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Failed</p>
          <p className={`text-2xl font-semibold mt-2 ${counts.failed > 0 ? 'text-red-400' : 'text-zinc-100'}`}>{counts.failed}</p>
        </div>
        <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-5">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Dead Letter</p>
          <p className={`text-2xl font-semibold mt-2 ${counts.dead_letter > 0 ? 'text-red-300' : 'text-zinc-100'}`}>{counts.dead_letter}</p>
        </div>
      </div>

      {/* ── Tabs ─────────────────────────────────────────── */}
      <div className="flex gap-1 mb-6 bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-1 w-fit">
        {([
          { key: 'all', label: 'All' },
          { key: 'running', label: `Running${counts.running > 0 ? ` (${counts.running})` : ''}` },
          { key: 'failed', label: `Failed${counts.failed > 0 ? ` (${counts.failed})` : ''}` },
          { key: 'dead_letter', label: `Dead Letter${counts.dead_letter > 0 ? ` (${counts.dead_letter})` : ''}` },
        ] as { key: Tab; label: string }[]).map(t => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setPage(1); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.key
                ? 'bg-amber-500 text-zinc-900'
                : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Table ────────────────────────────────────────── */}
      <div className="rounded-xl border border-zinc-800/50 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/80">
              <th className="text-left text-xs font-medium text-zinc-500 uppercase px-4 py-3">Type</th>
              <th className="text-left text-xs font-medium text-zinc-500 uppercase px-4 py-3">Priority</th>
              <th className="text-left text-xs font-medium text-zinc-500 uppercase px-4 py-3">Status</th>
              <th className="text-center text-xs font-medium text-zinc-500 uppercase px-4 py-3">Attempts</th>
              <th className="text-left text-xs font-medium text-zinc-500 uppercase px-4 py-3">Scheduled</th>
              <th className="text-left text-xs font-medium text-zinc-500 uppercase px-4 py-3">Started</th>
              <th className="text-left text-xs font-medium text-zinc-500 uppercase px-4 py-3">Worker</th>
              <th className="text-right text-xs font-medium text-zinc-500 uppercase px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map(job => (
              <tr
                key={job.id}
                className="border-b border-zinc-800/50 hover:bg-zinc-800/30 cursor-pointer"
                onClick={() => openDrawer(job)}
              >
                <td className="px-4 py-3 text-zinc-200 font-mono text-xs">{job.type}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${priorityBadge[job.priority] || priorityBadge.normal}`}>
                    {job.priority}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${statusBadge[job.status] || ''}`}>
                    {job.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-4 py-3 text-center text-zinc-400">
                  {job.attempts}/{job.maxAttempts}
                </td>
                <td className="px-4 py-3 text-zinc-400 text-xs">
                  {new Date(job.scheduledAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </td>
                <td className="px-4 py-3 text-zinc-400 text-xs">
                  {job.startedAt
                    ? new Date(job.startedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                    : '-'}
                </td>
                <td className="px-4 py-3 text-zinc-500 text-xs">{job.workerName || '-'}</td>
                <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                  <div className="flex gap-2 justify-end">
                    {(job.status === 'failed' || job.status === 'dead_letter') && (
                      <button
                        onClick={() => handleRetry(job.id)}
                        className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 text-xs hover:bg-amber-500/20 transition-colors"
                      >
                        Retry
                      </button>
                    )}
                    {job.status === 'queued' && (
                      <button
                        onClick={() => handleCancel(job.id)}
                        className="px-2.5 py-1 rounded-lg bg-red-500/10 text-red-400 text-xs hover:bg-red-500/20 transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {jobs.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-zinc-500">
                  {tab === 'all' ? 'No jobs in queue' :
                   tab === 'running' ? 'No jobs currently running' :
                   tab === 'failed' ? 'No failed jobs' :
                   'No dead letter jobs'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {total > 20 && (
        <div className="flex items-center justify-between mt-4 text-sm text-zinc-500">
          <span>Page {page} of {Math.ceil(total / 20)}</span>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
              className="px-3 py-1 rounded bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 text-zinc-300">Prev</button>
            <button disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)}
              className="px-3 py-1 rounded bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 text-zinc-300">Next</button>
          </div>
        </div>
      )}

      {/* ── Job Drawer ───────────────────────────────────── */}
      {selectedJob && (
        <div className="fixed inset-0 bg-black/60 flex justify-end z-50" onClick={() => setSelectedJob(null)}>
          <div
            className="bg-zinc-900 border-l border-zinc-700 w-full max-w-lg overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-zinc-100">Job Details</h2>
                <button
                  onClick={() => setSelectedJob(null)}
                  className="text-zinc-500 hover:text-zinc-100 text-lg"
                >
                  &times;
                </button>
              </div>

              {drawerLoading ? (
                <div className="space-y-3 animate-pulse">
                  {[...Array(5)].map((_, i) => <div key={i} className="h-6 bg-zinc-800/30 rounded" />)}
                </div>
              ) : (
                <>
                  {/* Job info */}
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-500">ID</span>
                      <span className="text-zinc-200 font-mono text-xs">{selectedJob.id}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-500">Type</span>
                      <span className="text-zinc-200">{selectedJob.type}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-500">Status</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${statusBadge[selectedJob.status] || ''}`}>
                        {selectedJob.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-500">Priority</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${priorityBadge[selectedJob.priority] || ''}`}>
                        {selectedJob.priority}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-500">Attempts</span>
                      <span className="text-zinc-200">{selectedJob.attempts}/{selectedJob.maxAttempts}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-500">Worker</span>
                      <span className="text-zinc-200">{selectedJob.workerName || '-'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-500">Scheduled</span>
                      <span className="text-zinc-200 text-xs">{new Date(selectedJob.scheduledAt).toLocaleString()}</span>
                    </div>
                    {selectedJob.startedAt && (
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-500">Started</span>
                        <span className="text-zinc-200 text-xs">{new Date(selectedJob.startedAt).toLocaleString()}</span>
                      </div>
                    )}
                    {selectedJob.finishedAt && (
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-500">Finished</span>
                        <span className="text-zinc-200 text-xs">{new Date(selectedJob.finishedAt).toLocaleString()}</span>
                      </div>
                    )}
                    {selectedJob.parentJobId && (
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-500">Parent Job</span>
                        <span className="text-zinc-200 font-mono text-xs">{selectedJob.parentJobId}</span>
                      </div>
                    )}
                    {selectedJob.errorText && (
                      <div className="mt-3">
                        <p className="text-xs text-zinc-500 mb-1">Error</p>
                        <pre className="bg-red-500/5 border border-red-500/20 rounded-lg p-3 text-xs text-red-400 whitespace-pre-wrap">{selectedJob.errorText}</pre>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mb-6">
                    {(selectedJob.status === 'failed' || selectedJob.status === 'dead_letter') && (
                      <button
                        onClick={() => { handleRetry(selectedJob.id); setSelectedJob(null); }}
                        className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-900 text-sm font-medium transition-colors"
                      >
                        Retry
                      </button>
                    )}
                    {selectedJob.status === 'queued' && (
                      <button
                        onClick={() => { handleCancel(selectedJob.id); setSelectedJob(null); }}
                        className="px-4 py-2 rounded-lg bg-red-500/10 text-red-400 text-sm hover:bg-red-500/20 transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                  </div>

                  {/* Payload */}
                  {selectedJob.payloadJson && (
                    <div className="mb-6">
                      <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Payload</p>
                      <pre className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-3 text-xs text-zinc-300 whitespace-pre-wrap overflow-x-auto max-h-40">
                        {JSON.stringify(selectedJob.payloadJson, null, 2)}
                      </pre>
                    </div>
                  )}

                  {/* Logs */}
                  <div>
                    <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">
                      Execution Log ({jobLogs.length})
                    </p>
                    {jobLogs.length === 0 ? (
                      <p className="text-sm text-zinc-500">No log entries yet</p>
                    ) : (
                      <div className="space-y-2">
                        {jobLogs.map(log => (
                          <div key={log.id} className="bg-zinc-800/30 border border-zinc-800/50 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-medium text-zinc-300">{log.step}</span>
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs ${
                                log.status === 'succeeded' ? 'bg-emerald-500/10 text-emerald-400' :
                                log.status === 'failed' ? 'bg-red-500/10 text-red-400' :
                                'bg-blue-500/10 text-blue-400'
                              }`}>
                                {log.status}
                              </span>
                              <span className="text-xs text-zinc-600 ml-auto">
                                {new Date(log.createdAt).toLocaleTimeString()}
                              </span>
                            </div>
                            <p className="text-xs text-zinc-400">{log.message}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
