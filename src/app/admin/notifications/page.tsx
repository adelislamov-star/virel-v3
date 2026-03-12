// NOTIFICATIONS — Admin page
// Tabs, table, drawer with logs, resend for failed
'use client';

import { useState, useEffect, useCallback } from 'react';

type NotifItem = {
  id: string;
  eventType: string;
  channel: string;
  recipientType: string;
  recipientId: string;
  recipientAddress?: string | null;
  status: string;
  retryCount: number;
  sentAt?: string | null;
  failedAt?: string | null;
  createdAt: string;
  renderedSubject?: string | null;
  renderedBody: string;
  payloadJson?: any;
  provider?: string | null;
  templateId?: string | null;
};

type LogEntry = {
  id: string;
  attemptNumber: number;
  provider: string;
  status: string;
  errorText?: string | null;
  createdAt: string;
};

type Tab = 'all' | 'failed' | 'queued';

const statusBadge: Record<string, string> = {
  queued: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  sent: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  failed: 'bg-red-500/10 text-red-400 border-red-500/20',
  skipped: 'bg-zinc-500/10 text-zinc-500 border-zinc-700/50',
};

const channelBadge: Record<string, string> = {
  email: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  telegram: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  sms: 'bg-green-500/10 text-green-400 border-green-500/20',
  push: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
};

export default function NotificationsPage() {
  const [items, setItems] = useState<NotifItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<Tab>('all');
  const [page, setPage] = useState(1);

  const [filterChannel, setFilterChannel] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  const [selected, setSelected] = useState<NotifItem | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [drawerLoading, setDrawerLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      setError('');
      const p = new URLSearchParams();
      if (tab !== 'all') p.set('status', tab);
      if (filterChannel) p.set('channel', filterChannel);
      if (filterDateFrom) p.set('dateFrom', filterDateFrom);
      if (filterDateTo) p.set('dateTo', filterDateTo);
      p.set('page', String(page));
      p.set('limit', '20');

      const res = await fetch(`/api/v1/notifications?${p}`);
      const data = await res.json();
      if (data.success) { setItems(data.data.notifications); setTotal(data.data.total); }
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [tab, page, filterChannel, filterDateFrom, filterDateTo]);

  useEffect(() => { load(); }, [load]);

  async function openDrawer(item: NotifItem) {
    setSelected(item);
    setDrawerLoading(true);
    try {
      const res = await fetch(`/api/v1/notifications/${item.id}`);
      const data = await res.json();
      if (data.success) { setSelected(data.data.notification); setLogs(data.data.logs); }
    } catch {}
    setDrawerLoading(false);
  }

  async function handleResend(item: NotifItem) {
    await fetch('/api/v1/notifications/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        templateId: item.templateId,
        recipientAddress: item.recipientAddress || item.recipientId,
        payloadJson: item.payloadJson || {},
      }),
    });
    load();
  }

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight mb-2">Notifications</h1>
        <p className="text-sm text-zinc-500 mb-8">Notification delivery log</p>
        <div className="space-y-4 animate-pulse">
          <div className="h-12 bg-zinc-800/30 rounded-xl" />
          <div className="h-64 bg-zinc-800/30 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight mb-2">Notifications</h1>
        <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-6 text-red-400">{error}</div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">Notifications</h1>
        <p className="text-sm text-zinc-500 mt-1">{total} notifications</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-1 w-fit">
        {([
          { key: 'all', label: 'All' },
          { key: 'failed', label: 'Failed' },
          { key: 'queued', label: 'Queued' },
        ] as { key: Tab; label: string }[]).map(t => (
          <button key={t.key} onClick={() => { setTab(t.key); setPage(1); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t.key ? 'bg-amber-500 text-zinc-900' : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <select value={filterChannel} onChange={e => { setFilterChannel(e.target.value); setPage(1); }}
          className="rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-100 px-3 py-2 text-sm">
          <option value="">All Channels</option>
          <option value="email">Email</option>
          <option value="telegram">Telegram</option>
          <option value="sms">SMS</option>
          <option value="push">Push</option>
        </select>
        <input type="date" value={filterDateFrom} onChange={e => { setFilterDateFrom(e.target.value); setPage(1); }}
          className="rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-100 px-3 py-2 text-sm" />
        <input type="date" value={filterDateTo} onChange={e => { setFilterDateTo(e.target.value); setPage(1); }}
          className="rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-100 px-3 py-2 text-sm" />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-zinc-800/50 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/80">
              <th className="text-left text-xs font-medium text-zinc-500 uppercase px-4 py-3">Event</th>
              <th className="text-left text-xs font-medium text-zinc-500 uppercase px-4 py-3">Channel</th>
              <th className="text-left text-xs font-medium text-zinc-500 uppercase px-4 py-3">Recipient</th>
              <th className="text-left text-xs font-medium text-zinc-500 uppercase px-4 py-3">Status</th>
              <th className="text-left text-xs font-medium text-zinc-500 uppercase px-4 py-3">Time</th>
              <th className="text-center text-xs font-medium text-zinc-500 uppercase px-4 py-3">Retries</th>
              <th className="text-right text-xs font-medium text-zinc-500 uppercase px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 cursor-pointer" onClick={() => openDrawer(item)}>
                <td className="px-4 py-3 text-zinc-200 text-xs">{item.eventType}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${channelBadge[item.channel] || 'bg-zinc-500/10 text-zinc-400 border-zinc-700/50'}`}>
                    {item.channel}
                  </span>
                </td>
                <td className="px-4 py-3 text-zinc-400 text-xs font-mono">{item.recipientId.slice(0, 12)}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${statusBadge[item.status] || ''}`}>
                    {item.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-zinc-400 text-xs">
                  {new Date(item.sentAt || item.failedAt || item.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </td>
                <td className="px-4 py-3 text-center text-zinc-400">{item.retryCount}</td>
                <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                  {item.status === 'failed' && (
                    <button onClick={() => handleResend(item)}
                      className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 text-xs hover:bg-amber-500/20">
                      Resend
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-zinc-500">No notifications found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {total > 20 && (
        <div className="flex items-center justify-between mt-4 text-sm text-zinc-500">
          <span>Page {page} of {Math.ceil(total / 20)}</span>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 rounded bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 text-zinc-300">Prev</button>
            <button disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)} className="px-3 py-1 rounded bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 text-zinc-300">Next</button>
          </div>
        </div>
      )}

      {/* Drawer */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 flex justify-end z-50" onClick={() => setSelected(null)}>
          <div className="bg-zinc-900 border-l border-zinc-700 w-full max-w-lg overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-zinc-100">Notification Details</h2>
                <button onClick={() => setSelected(null)} className="text-zinc-500 hover:text-zinc-100 text-lg">&times;</button>
              </div>

              {drawerLoading ? (
                <div className="space-y-3 animate-pulse">{[...Array(4)].map((_, i) => <div key={i} className="h-6 bg-zinc-800/30 rounded" />)}</div>
              ) : (
                <>
                  <div className="space-y-3 mb-6">
                    {[
                      ['Event', selected.eventType],
                      ['Channel', selected.channel],
                      ['Status', selected.status],
                      ['Recipient', `${selected.recipientType}: ${selected.recipientId}`],
                      ['Address', selected.recipientAddress || '-'],
                      ['Provider', selected.provider || '-'],
                      ['Retries', String(selected.retryCount)],
                      ['Created', new Date(selected.createdAt).toLocaleString()],
                      ['Sent', selected.sentAt ? new Date(selected.sentAt).toLocaleString() : '-'],
                    ].map(([label, val]) => (
                      <div key={label} className="flex justify-between text-sm">
                        <span className="text-zinc-500">{label}</span>
                        <span className="text-zinc-200">{val}</span>
                      </div>
                    ))}
                  </div>

                  {selected.renderedSubject && (
                    <div className="mb-4">
                      <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Subject</p>
                      <p className="text-sm text-zinc-200 bg-zinc-800/50 rounded-lg p-3">{selected.renderedSubject}</p>
                    </div>
                  )}

                  <div className="mb-6">
                    <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Body</p>
                    <pre className="text-xs text-zinc-300 bg-zinc-800/50 rounded-lg p-3 whitespace-pre-wrap max-h-40 overflow-y-auto">{selected.renderedBody}</pre>
                  </div>

                  {selected.status === 'failed' && (
                    <button onClick={() => { handleResend(selected); setSelected(null); }}
                      className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-900 text-sm font-medium mb-6">
                      Resend
                    </button>
                  )}

                  <div>
                    <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">Delivery Log ({logs.length})</p>
                    {logs.length === 0 ? (
                      <p className="text-sm text-zinc-500">No log entries</p>
                    ) : (
                      <div className="space-y-2">
                        {logs.map(log => (
                          <div key={log.id} className="bg-zinc-800/30 border border-zinc-800/50 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-medium text-zinc-300">Attempt {log.attemptNumber}</span>
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs ${log.status === 'sent' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                                {log.status}
                              </span>
                              <span className="text-xs text-zinc-600">{log.provider}</span>
                              <span className="text-xs text-zinc-600 ml-auto">{new Date(log.createdAt).toLocaleTimeString()}</span>
                            </div>
                            {log.errorText && <p className="text-xs text-red-400 mt-1">{log.errorText}</p>}
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
