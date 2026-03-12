// ACTION CENTER — Operations Feed
// Tabs: All / My Tasks / Overdue / Critical
// Priority badges, actions: Acknowledge / Assign / Resolve / Dismiss / Snooze
'use client';

import { useState, useEffect, useCallback } from 'react';

// ─── Types ───────────────────────────────────────────────

type FeedItem = {
  id: string;
  type: string;
  sourceModule: string;
  priority: string;
  entityType: string;
  entityId: string;
  title: string;
  description?: string | null;
  assignedUserId?: string | null;
  status: string;
  dueAt?: string | null;
  snoozedUntil?: string | null;
  resolutionNote?: string | null;
  createdAt: string;
  resolvedAt?: string | null;
};

type Tab = 'all' | 'my_tasks' | 'overdue' | 'critical';

const priorityBadge: Record<string, string> = {
  critical: 'bg-red-500/10 text-red-400 border-red-500/20',
  high: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  low: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
};

const statusBadge: Record<string, string> = {
  new: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  acknowledged: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  in_progress: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  resolved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  dismissed: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
};

const SOURCE_OPTIONS = ['sla', 'fraud', 'reviews', 'bookings', 'payments', 'retention', 'jobs', 'membership', 'data_quality', 'lost_revenue'];
const PRIORITY_OPTIONS = ['critical', 'high', 'medium', 'low'];
const STATUS_OPTIONS = ['new', 'acknowledged', 'in_progress', 'resolved', 'dismissed'];

const SNOOZE_PRESETS = [
  { label: '1 hour', hours: 1 },
  { label: '4 hours', hours: 4 },
  { label: 'Tomorrow 9am', hours: -1 },
];

// ─── Helpers ─────────────────────────────────────────────

function entityLink(entityType: string, entityId: string): string {
  const map: Record<string, string> = {
    booking: `/admin/bookings/${entityId}`,
    review: '/admin/reviews',
    incident: '/admin/incidents',
    model: `/admin/models/${entityId}`,
    client: `/admin/clients/${entityId}`,
    payment: `/admin/payments`,
    lost_revenue_entry: `/admin/lost-revenue`,
  };
  return map[entityType] || '#';
}

function tomorrowAt9(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(9, 0, 0, 0);
  return d;
}

// ─── Component ───────────────────────────────────────────

export default function ActionCenterPage() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<Tab>('all');
  const [page, setPage] = useState(1);

  // Filters
  const [filterModule, setFilterModule] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Modals
  const [snoozeItem, setSnoozeItem] = useState<FeedItem | null>(null);
  const [snoozeCustom, setSnoozeCustom] = useState('');
  const [assignItem, setAssignItem] = useState<FeedItem | null>(null);
  const [assignUserId, setAssignUserId] = useState('');
  const [resolveItem, setResolveItem] = useState<FeedItem | null>(null);
  const [resolveNote, setResolveNote] = useState('');
  const [resolveAction, setResolveAction] = useState<'resolved' | 'dismissed'>('resolved');

  // Hardcoded current user for demo (TODO: from auth)
  const currentUserId = 'current-user';

  const loadItems = useCallback(async () => {
    try {
      setError('');
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '20');

      // Tab-based defaults
      if (tab === 'my_tasks') params.set('assignedUserId', currentUserId);
      if (tab === 'critical') params.set('priority', 'critical');
      if (tab === 'overdue') {
        // For overdue, we fetch all non-resolved and filter client-side by dueAt
      }

      // Explicit filters override tab
      if (filterModule) params.set('sourceModule', filterModule);
      if (filterPriority && tab !== 'critical') params.set('priority', filterPriority);
      if (filterStatus) params.set('status', filterStatus);

      const res = await fetch(`/api/v1/operations-feed?${params}`);
      const data = await res.json();

      if (data.success) {
        let feedItems = data.data.items as FeedItem[];

        // Client-side filter for overdue tab
        if (tab === 'overdue') {
          const now = new Date();
          feedItems = feedItems.filter(i => i.dueAt && new Date(i.dueAt) < now && i.status !== 'resolved' && i.status !== 'dismissed');
        }

        setItems(feedItems);
        setTotal(data.data.total);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [tab, page, filterModule, filterPriority, filterStatus]);

  useEffect(() => { loadItems(); }, [loadItems]);

  // ─── Actions ─────────────────────────────────────────────

  async function handleAcknowledge(item: FeedItem) {
    await fetch(`/api/v1/operations-feed/${item.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'acknowledged' }),
    });
    loadItems();
  }

  async function handleAssign() {
    if (!assignItem || !assignUserId) return;
    await fetch(`/api/v1/operations-feed/${assignItem.id}/assign`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: assignUserId }),
    });
    setAssignItem(null);
    setAssignUserId('');
    loadItems();
  }

  async function handleResolveOrDismiss() {
    if (!resolveItem) return;
    await fetch(`/api/v1/operations-feed/${resolveItem.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: resolveAction, note: resolveNote || undefined }),
    });
    setResolveItem(null);
    setResolveNote('');
    loadItems();
  }

  async function handleSnooze(until: Date) {
    if (!snoozeItem) return;
    await fetch(`/api/v1/operations-feed/${snoozeItem.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: snoozeItem.status, snoozedUntil: until.toISOString() }),
    });
    setSnoozeItem(null);
    setSnoozeCustom('');
    loadItems();
  }

  // ─── Counts ──────────────────────────────────────────────

  const criticalCount = items.filter(i => i.priority === 'critical').length;
  const overdueCount = items.filter(i => i.dueAt && new Date(i.dueAt) < new Date() && i.status !== 'resolved' && i.status !== 'dismissed').length;

  // ─── Render ──────────────────────────────────────────────

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight mb-2">Action Center</h1>
        <p className="text-sm text-zinc-500 mb-8">Operations feed</p>
        <div className="space-y-4 animate-pulse">
          <div className="h-12 bg-zinc-800/30 rounded-xl" />
          <div className="h-20 bg-zinc-800/30 rounded-xl" />
          <div className="h-20 bg-zinc-800/30 rounded-xl" />
          <div className="h-20 bg-zinc-800/30 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight mb-2">Action Center</h1>
        <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-6 text-red-400">{error}</div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">Action Center</h1>
        <p className="text-sm text-zinc-500 mt-1">{total} items in operations feed</p>
      </div>

      {/* ── Tabs ─────────────────────────────────────────── */}
      <div className="flex gap-1 mb-6 bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-1 w-fit">
        {([
          { key: 'all', label: 'All' },
          { key: 'my_tasks', label: 'My Tasks' },
          { key: 'overdue', label: `Overdue${overdueCount > 0 ? ` (${overdueCount})` : ''}` },
          { key: 'critical', label: `Critical${criticalCount > 0 ? ` (${criticalCount})` : ''}` },
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

      {/* ── Filters ──────────────────────────────────────── */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <select value={filterModule} onChange={e => { setFilterModule(e.target.value); setPage(1); }}
          className="rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-100 px-3 py-2 text-sm">
          <option value="">All Modules</option>
          {SOURCE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterPriority} onChange={e => { setFilterPriority(e.target.value); setPage(1); }}
          className="rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-100 px-3 py-2 text-sm">
          <option value="">All Priorities</option>
          {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
          className="rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-100 px-3 py-2 text-sm">
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* ── Items List ───────────────────────────────────── */}
      <div className="space-y-3">
        {items.map(item => {
          const isOverdue = item.dueAt && new Date(item.dueAt) < new Date() && item.status !== 'resolved' && item.status !== 'dismissed';
          const isSnoozed = item.snoozedUntil && new Date(item.snoozedUntil) > new Date();

          return (
            <div
              key={item.id}
              className={`rounded-xl border p-5 transition-colors ${
                item.priority === 'critical'
                  ? 'border-red-500/30 bg-red-500/5 hover:bg-red-500/10'
                  : isOverdue
                  ? 'border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10'
                  : 'border-zinc-800/50 bg-zinc-900/50 hover:bg-zinc-800/30'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Badges row */}
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${priorityBadge[item.priority] || priorityBadge.low}`}>
                      {item.priority}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${statusBadge[item.status] || statusBadge.new}`}>
                      {item.status.replace('_', ' ')}
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border border-zinc-700/50 text-zinc-500">
                      {item.sourceModule}
                    </span>
                    {isOverdue && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border bg-red-500/10 text-red-400 border-red-500/20">
                        OVERDUE
                      </span>
                    )}
                    {isSnoozed && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border bg-blue-500/10 text-blue-400 border-blue-500/20">
                        Snoozed until {new Date(item.snoozedUntil!).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>

                  {/* Title & metadata */}
                  <h3 className="text-sm font-medium text-zinc-200 mb-1">{item.title}</h3>
                  <div className="flex items-center gap-3 text-xs text-zinc-500">
                    <a href={entityLink(item.entityType, item.entityId)} className="text-amber-400 hover:underline">
                      {item.entityType}/{item.entityId.slice(0, 8)}
                    </a>
                    {item.assignedUserId && (
                      <span>Assigned: {item.assignedUserId.slice(0, 8)}</span>
                    )}
                    {item.dueAt && (
                      <span>Due: {new Date(item.dueAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                    )}
                    <span>{new Date(item.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  {item.description && (
                    <p className="text-xs text-zinc-500 mt-2 line-clamp-2">{item.description}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 shrink-0 flex-wrap">
                  {item.status === 'new' && (
                    <button
                      onClick={() => handleAcknowledge(item)}
                      className="px-2.5 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 text-xs hover:bg-blue-500/20 transition-colors"
                    >
                      Ack
                    </button>
                  )}
                  <button
                    onClick={() => setAssignItem(item)}
                    className="px-2.5 py-1.5 rounded-lg bg-purple-500/10 text-purple-400 text-xs hover:bg-purple-500/20 transition-colors"
                  >
                    Assign
                  </button>
                  {item.status !== 'resolved' && item.status !== 'dismissed' && (
                    <>
                      <button
                        onClick={() => { setResolveItem(item); setResolveAction('resolved'); }}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs hover:bg-emerald-500/20 transition-colors"
                      >
                        Resolve
                      </button>
                      <button
                        onClick={() => { setResolveItem(item); setResolveAction('dismissed'); }}
                        className="px-2.5 py-1.5 rounded-lg bg-zinc-500/10 text-zinc-400 text-xs hover:bg-zinc-500/20 transition-colors"
                      >
                        Dismiss
                      </button>
                      <button
                        onClick={() => setSnoozeItem(item)}
                        className="px-2.5 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 text-xs hover:bg-amber-500/20 transition-colors"
                      >
                        Snooze
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {items.length === 0 && (
          <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-12 text-center">
            <p className="text-zinc-500">
              {tab === 'all' ? 'No items in the operations feed.' :
               tab === 'my_tasks' ? 'No tasks assigned to you.' :
               tab === 'overdue' ? 'No overdue items.' :
               'No critical items.'}
            </p>
          </div>
        )}
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

      {/* ── Snooze Modal ─────────────────────────────────── */}
      {snoozeItem && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setSnoozeItem(null)}>
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-zinc-100 mb-4">Snooze Item</h3>
            <p className="text-sm text-zinc-400 mb-4 truncate">{snoozeItem.title}</p>
            <div className="space-y-2 mb-4">
              {SNOOZE_PRESETS.map(preset => (
                <button
                  key={preset.label}
                  onClick={() => {
                    const until = preset.hours === -1 ? tomorrowAt9() : new Date(Date.now() + preset.hours * 3600_000);
                    handleSnooze(until);
                  }}
                  className="w-full px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-sm text-left transition-colors"
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <label className="block text-xs text-zinc-500 mb-1">Custom date/time</label>
            <input
              type="datetime-local"
              value={snoozeCustom}
              onChange={e => setSnoozeCustom(e.target.value)}
              className="w-full rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-100 px-3 py-2 text-sm mb-3"
            />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setSnoozeItem(null)}
                className="px-4 py-2 rounded-lg bg-zinc-800 text-zinc-300 text-sm hover:bg-zinc-700">Cancel</button>
              <button
                onClick={() => snoozeCustom && handleSnooze(new Date(snoozeCustom))}
                disabled={!snoozeCustom}
                className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-900 text-sm font-medium disabled:opacity-50"
              >
                Snooze
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Assign Modal ─────────────────────────────────── */}
      {assignItem && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setAssignItem(null)}>
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-zinc-100 mb-4">Assign Item</h3>
            <p className="text-sm text-zinc-400 mb-4 truncate">{assignItem.title}</p>
            <label className="block text-xs text-zinc-500 mb-1">User ID</label>
            <input type="text" value={assignUserId} onChange={e => setAssignUserId(e.target.value)}
              className="w-full rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-100 px-3 py-2 text-sm mb-4" placeholder="User ID..." />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setAssignItem(null)}
                className="px-4 py-2 rounded-lg bg-zinc-800 text-zinc-300 text-sm hover:bg-zinc-700">Cancel</button>
              <button onClick={handleAssign} disabled={!assignUserId}
                className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-900 text-sm font-medium disabled:opacity-50">
                Assign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Resolve/Dismiss Modal ────────────────────────── */}
      {resolveItem && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setResolveItem(null)}>
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-zinc-100 mb-4">
              {resolveAction === 'resolved' ? 'Resolve' : 'Dismiss'} Item
            </h3>
            <p className="text-sm text-zinc-400 mb-4 truncate">{resolveItem.title}</p>
            <label className="block text-xs text-zinc-500 mb-1">Note (optional)</label>
            <textarea value={resolveNote} onChange={e => setResolveNote(e.target.value)} rows={3}
              className="w-full rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-100 px-3 py-2 text-sm mb-4" placeholder="Resolution note..." />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setResolveItem(null)}
                className="px-4 py-2 rounded-lg bg-zinc-800 text-zinc-300 text-sm hover:bg-zinc-700">Cancel</button>
              <button onClick={handleResolveOrDismiss}
                className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-900 text-sm font-medium">
                {resolveAction === 'resolved' ? 'Resolve' : 'Dismiss'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
