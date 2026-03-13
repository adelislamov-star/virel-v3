// AUDIT LOG PAGE — Full activity journal
'use client';

import { useEffect, useState, useCallback } from 'react';

// ── Types ──────────────────────────────────────────────────
type AuditEntry = {
  id: string;
  actorUserId: string | null;
  actorType: string;
  action: string;
  entityType: string;
  entityId: string;
  before: Record<string, any> | null;
  after: Record<string, any> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  actor: { name: string | null; email: string | null } | null;
};

type Pagination = { page: number; limit: number; total: number; totalPages: number };

// ── Styles ──────────────────────────────────────────────────
const actionColors: Record<string, string> = {
  created: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  updated: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  deleted: 'bg-red-500/10 text-red-400 border-red-500/20',
  login: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  CREATE: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  UPDATE: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  DELETE: 'bg-red-500/10 text-red-400 border-red-500/20',
  STATUS_CHANGE: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  MERGE: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
};

function getActionColor(action: string): string {
  for (const [key, cls] of Object.entries(actionColors)) {
    if (action.toLowerCase().includes(key.toLowerCase())) return cls;
  }
  return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
}

const formatDateTime = (d: string) =>
  new Date(d).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });

// ── Component ──────────────────────────────────────────────
export default function AuditLogPage() {
  const [items, setItems] = useState<AuditEntry[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [entityTypeFilter, setEntityTypeFilter] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);

  // Detail modal
  const [selected, setSelected] = useState<AuditEntry | null>(null);

  // ── Load data ──────────────────────────────────────────────
  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (entityTypeFilter) params.set('entityType', entityTypeFilter);
      if (searchFilter) params.set('search', searchFilter);
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);

      const res = await fetch(`/api/v1/audit?${params}`);
      const json = await res.json();
      if (json.success) {
        setItems(json.data.items);
        setPagination(json.data.pagination);
      } else {
        setError(json.error?.message || 'Failed to load audit log');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, entityTypeFilter, searchFilter, dateFrom, dateTo]);

  useEffect(() => { load(); }, [load]);

  // Debounced search
  const [searchInput, setSearchInput] = useState('');
  useEffect(() => {
    const t = setTimeout(() => { setSearchFilter(searchInput); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  // ── Render ──────────────────────────────────────────────────
  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">Audit Log</h1>
        <p className="text-sm text-zinc-500 mt-1">{pagination.total} entries &middot; 90-day retention</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search action, entity ID..."
          className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 w-64 focus:outline-none focus:border-amber-500/50"
        />
        <select
          value={entityTypeFilter}
          onChange={(e) => { setEntityTypeFilter(e.target.value); setPage(1); }}
          className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200"
        >
          <option value="">All Entity Types</option>
          <option value="model">Model</option>
          <option value="booking">Booking</option>
          <option value="client">Client</option>
          <option value="payment">Payment</option>
          <option value="auth">Auth</option>
          <option value="settings">Settings</option>
          <option value="incident">Incident</option>
          <option value="inquiry">Inquiry</option>
          <option value="user">User</option>
        </select>
        <input
          type="date" value={dateFrom}
          onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
          className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200"
        />
        <input
          type="date" value={dateTo}
          onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
          className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200"
        />
        {(entityTypeFilter || searchInput || dateFrom || dateTo) && (
          <button
            onClick={() => { setEntityTypeFilter(''); setSearchInput(''); setSearchFilter(''); setDateFrom(''); setDateTo(''); setPage(1); }}
            className="px-3 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            Clear filters
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400 text-sm mb-6">{error}</div>
      )}

      {/* Table */}
      <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400 text-left">
                <th className="px-4 py-3 font-medium">Time</th>
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Action</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Entity ID</th>
                <th className="px-4 py-3 font-medium">IP</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-zinc-500">Loading...</td></tr>
              )}
              {!loading && items.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-zinc-500">No audit entries found</td></tr>
              )}
              {!loading && items.map((entry) => (
                <tr
                  key={entry.id}
                  onClick={() => setSelected(entry)}
                  className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors cursor-pointer"
                >
                  <td className="px-4 py-3 text-zinc-400 text-xs whitespace-nowrap">{formatDateTime(entry.createdAt)}</td>
                  <td className="px-4 py-3 text-zinc-300">
                    {entry.actorType === 'system' || entry.actorType === 'cron' ? (
                      <span className="text-zinc-500 italic">{entry.actorType}</span>
                    ) : (
                      entry.actor?.name || entry.actor?.email || entry.actorUserId?.slice(0, 8) || '—'
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${getActionColor(entry.action)}`}>
                      {entry.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-zinc-400 text-xs">{entry.entityType}</td>
                  <td className="px-4 py-3 font-mono text-zinc-500 text-xs">{entry.entityId ? entry.entityId.slice(0, 12) : '—'}</td>
                  <td className="px-4 py-3 text-zinc-500 text-xs font-mono">{entry.ipAddress || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-800">
            <span className="text-xs text-zinc-500">{pagination.total} entries</span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1 text-xs rounded bg-zinc-800 text-zinc-400 disabled:opacity-30 hover:bg-zinc-700"
              >Prev</button>
              <span className="text-xs text-zinc-400 py-1">{page} / {pagination.totalPages}</span>
              <button
                disabled={page >= pagination.totalPages}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1 text-xs rounded bg-zinc-800 text-zinc-400 disabled:opacity-30 hover:bg-zinc-700"
              >Next</button>
            </div>
          </div>
        )}
      </div>

      {/* ── Detail Modal ────────────────────────────────────── */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setSelected(null)}>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-zinc-100">Audit Entry Detail</h2>
              <button onClick={() => setSelected(null)} className="text-zinc-500 hover:text-zinc-300 text-xl">&times;</button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Time</label>
                  <div className="text-sm text-zinc-200">{formatDateTime(selected.createdAt)}</div>
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Actor</label>
                  <div className="text-sm text-zinc-200">
                    {selected.actor?.name || selected.actor?.email || selected.actorUserId || selected.actorType}
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Action</label>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${getActionColor(selected.action)}`}>
                    {selected.action}
                  </span>
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Entity Type</label>
                  <div className="text-sm text-zinc-200">{selected.entityType}</div>
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Entity ID</label>
                  <div className="text-sm text-zinc-300 font-mono text-xs break-all">{selected.entityId || '—'}</div>
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Actor Type</label>
                  <div className="text-sm text-zinc-200">{selected.actorType}</div>
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">IP Address</label>
                  <div className="text-sm text-zinc-300 font-mono">{selected.ipAddress || '—'}</div>
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">User Agent</label>
                  <div className="text-xs text-zinc-400 truncate" title={selected.userAgent || ''}>{selected.userAgent || '—'}</div>
                </div>
              </div>

              {/* Before JSON */}
              {selected.before && Object.keys(selected.before).length > 0 && (
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Before</label>
                  <pre className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs text-red-300 overflow-x-auto max-h-48">
                    {JSON.stringify(selected.before, null, 2)}
                  </pre>
                </div>
              )}

              {/* After JSON */}
              {selected.after && Object.keys(selected.after).length > 0 && (
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">After</label>
                  <pre className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs text-emerald-300 overflow-x-auto max-h-48">
                    {JSON.stringify(selected.after, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setSelected(null)}
                className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium border border-zinc-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
