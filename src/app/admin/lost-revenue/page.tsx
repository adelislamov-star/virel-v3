// LOST REVENUE — Admin page
// Summary cards, table with filters, add entry form
'use client';

import { useState, useEffect, useCallback } from 'react';

// ─── Types ───────────────────────────────────────────────

type Entry = {
  id: string;
  type: string;
  amount: number;
  amountType: string;
  currency: string;
  responsibleRole: string;
  status: string;
  rootCause: string;
  detectionSource: string;
  detectedAt: string;
  notes?: string | null;
  bookingId?: string | null;
  clientId?: string | null;
  modelId?: string | null;
};

type Summary = {
  totalEntries: number;
  grandTotal: number;
  byType: Record<string, { count: number; total: number }>;
  byRole: Record<string, { count: number; total: number }>;
};

const TYPE_OPTIONS = [
  'unanswered_lead', 'model_unavailable', 'client_declined_price', 'payment_failed',
  'booking_cancelled_after_hold', 'no_alternative_offered', 'receptionist_delay',
  'double_booking_loss', 'dispute_refund', 'no_show', 'wrong_quote', 'service_mismatch',
];

const ROLE_OPTIONS = ['client', 'model', 'receptionist', 'system'];
const STATUS_OPTIONS = ['open', 'resolved', 'waived'];

const statusBadge: Record<string, string> = {
  open: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  resolved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  waived: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
};

const typeBadge: Record<string, string> = {
  no_show: 'bg-red-500/10 text-red-400 border-red-500/20',
  payment_failed: 'bg-red-500/10 text-red-400 border-red-500/20',
  booking_cancelled_after_hold: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  receptionist_delay: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  double_booking_loss: 'bg-red-500/10 text-red-400 border-red-500/20',
};

// ─── Component ───────────────────────────────────────────

export default function LostRevenuePage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [page, setPage] = useState(1);

  // Add form
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState('unanswered_lead');
  const [formAmount, setFormAmount] = useState('');
  const [formCurrency, setFormCurrency] = useState('GBP');
  const [formRole, setFormRole] = useState('client');
  const [formRootCause, setFormRootCause] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formBookingId, setFormBookingId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Action modal
  const [actionEntry, setActionEntry] = useState<Entry | null>(null);
  const [actionType, setActionType] = useState<'resolved' | 'waived'>('resolved');
  const [actionReason, setActionReason] = useState('');

  const loadData = useCallback(async () => {
    try {
      setError('');
      const params = new URLSearchParams();
      if (filterType) params.set('type', filterType);
      if (filterStatus) params.set('status', filterStatus);
      if (filterRole) params.set('responsibleRole', filterRole);
      if (filterDateFrom) params.set('dateFrom', filterDateFrom);
      if (filterDateTo) params.set('dateTo', filterDateTo);
      params.set('page', String(page));
      params.set('limit', '20');

      const [listRes, summaryRes] = await Promise.all([
        fetch(`/api/v1/lost-revenue?${params}`),
        fetch('/api/v1/lost-revenue/summary'),
      ]);

      const listData = await listRes.json();
      const summaryData = await summaryRes.json();

      if (listData.success) {
        setEntries(listData.data.entries);
        setTotal(listData.data.total);
      }
      if (summaryData.success) {
        setSummary(summaryData.data);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [filterType, filterStatus, filterRole, filterDateFrom, filterDateTo, page]);

  useEffect(() => { loadData(); }, [loadData]);

  async function handleAddEntry(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/v1/lost-revenue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: formType,
          amount: parseFloat(formAmount),
          currency: formCurrency,
          responsibleRole: formRole,
          rootCause: formRootCause,
          notes: formNotes || undefined,
          bookingId: formBookingId || undefined,
          detectionSource: 'manual',
        }),
      });
      if (res.ok) {
        setShowForm(false);
        setFormAmount(''); setFormRootCause(''); setFormNotes(''); setFormBookingId('');
        loadData();
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAction() {
    if (!actionEntry || !actionReason) return;
    try {
      await fetch(`/api/v1/lost-revenue/${actionEntry.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: actionType, reasonCode: actionReason }),
      });
      setActionEntry(null);
      setActionReason('');
      loadData();
    } catch {}
  }

  function fmtMoney(amount: number, currency: string) {
    return `${currency === 'GBP' ? '\u00a3' : currency} ${amount.toFixed(2)}`;
  }

  // ─── Render ──────────────────────────────────────────────

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight mb-2">Lost Revenue</h1>
        <p className="text-sm text-zinc-500 mb-8">Revenue leakage tracking</p>
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
        <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight mb-2">Lost Revenue</h1>
        <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-6 text-red-400">{error}</div>
      </div>
    );
  }

  const topTypes = summary ? Object.entries(summary.byType).sort((a, b) => b[1].total - a[1].total).slice(0, 3) : [];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">Lost Revenue</h1>
          <p className="text-sm text-zinc-500 mt-1">Revenue leakage tracking &mdash; current month</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-900 text-sm font-medium transition-colors"
        >
          {showForm ? 'Cancel' : '+ Add Entry'}
        </button>
      </div>

      {/* ── Summary Cards ────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-5">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Total Lost</p>
          <p className="text-2xl font-semibold text-red-400 mt-2">
            {fmtMoney(summary?.grandTotal ?? 0, 'GBP')}
          </p>
          <p className="text-xs text-zinc-500 mt-1">{summary?.totalEntries ?? 0} entries</p>
        </div>
        {topTypes.map(([type, data]) => (
          <div key={type} className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-5">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{type.replace(/_/g, ' ')}</p>
            <p className="text-2xl font-semibold text-zinc-100 mt-2">{fmtMoney(data.total, 'GBP')}</p>
            <p className="text-xs text-zinc-500 mt-1">{data.count} entries</p>
          </div>
        ))}
      </div>

      {/* ── By Role Summary ──────────────────────────────── */}
      {summary && Object.keys(summary.byRole).length > 0 && (
        <div className="grid grid-cols-4 gap-4 mb-8">
          {Object.entries(summary.byRole).map(([role, data]) => (
            <div key={role} className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-4">
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{role}</p>
              <p className="text-lg font-semibold text-zinc-100 mt-1">{fmtMoney(data.total, 'GBP')}</p>
              <p className="text-xs text-zinc-500">{data.count} entries</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Add Entry Form ───────────────────────────────── */}
      {showForm && (
        <form onSubmit={handleAddEntry} className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-6 mb-8">
          <h3 className="text-sm font-semibold text-zinc-100 mb-4">New Lost Revenue Entry</h3>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Type</label>
              <select value={formType} onChange={e => setFormType(e.target.value)}
                className="w-full rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-100 px-3 py-2 text-sm">
                {TYPE_OPTIONS.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Amount</label>
              <input type="number" step="0.01" required value={formAmount} onChange={e => setFormAmount(e.target.value)}
                className="w-full rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-100 px-3 py-2 text-sm" placeholder="0.00" />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Currency</label>
              <select value={formCurrency} onChange={e => setFormCurrency(e.target.value)}
                className="w-full rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-100 px-3 py-2 text-sm">
                <option value="GBP">GBP</option>
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Responsible Role</label>
              <select value={formRole} onChange={e => setFormRole(e.target.value)}
                className="w-full rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-100 px-3 py-2 text-sm">
                {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Root Cause</label>
              <input type="text" required value={formRootCause} onChange={e => setFormRootCause(e.target.value)}
                className="w-full rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-100 px-3 py-2 text-sm" placeholder="Brief description" />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Booking ID (optional)</label>
              <input type="text" value={formBookingId} onChange={e => setFormBookingId(e.target.value)}
                className="w-full rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-100 px-3 py-2 text-sm" placeholder="cuid..." />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-xs text-zinc-500 mb-1">Notes (optional)</label>
            <textarea value={formNotes} onChange={e => setFormNotes(e.target.value)} rows={2}
              className="w-full rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-100 px-3 py-2 text-sm" />
          </div>
          <button type="submit" disabled={submitting}
            className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-900 text-sm font-medium disabled:opacity-50">
            {submitting ? 'Saving...' : 'Save Entry'}
          </button>
        </form>
      )}

      {/* ── Filters ──────────────────────────────────────── */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <select value={filterType} onChange={e => { setFilterType(e.target.value); setPage(1); }}
          className="rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-100 px-3 py-2 text-sm">
          <option value="">All Types</option>
          {TYPE_OPTIONS.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
        </select>
        <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
          className="rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-100 px-3 py-2 text-sm">
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterRole} onChange={e => { setFilterRole(e.target.value); setPage(1); }}
          className="rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-100 px-3 py-2 text-sm">
          <option value="">All Roles</option>
          {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <input type="date" value={filterDateFrom} onChange={e => { setFilterDateFrom(e.target.value); setPage(1); }}
          className="rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-100 px-3 py-2 text-sm" />
        <input type="date" value={filterDateTo} onChange={e => { setFilterDateTo(e.target.value); setPage(1); }}
          className="rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-100 px-3 py-2 text-sm" />
      </div>

      {/* ── Table ────────────────────────────────────────── */}
      <div className="rounded-xl border border-zinc-800/50 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/80">
              <th className="text-left text-xs font-medium text-zinc-500 uppercase px-4 py-3">Type</th>
              <th className="text-right text-xs font-medium text-zinc-500 uppercase px-4 py-3">Amount</th>
              <th className="text-left text-xs font-medium text-zinc-500 uppercase px-4 py-3">Role</th>
              <th className="text-left text-xs font-medium text-zinc-500 uppercase px-4 py-3">Status</th>
              <th className="text-left text-xs font-medium text-zinc-500 uppercase px-4 py-3">Detected</th>
              <th className="text-left text-xs font-medium text-zinc-500 uppercase px-4 py-3">Root Cause</th>
              <th className="text-right text-xs font-medium text-zinc-500 uppercase px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {entries.map(entry => (
              <tr key={entry.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${typeBadge[entry.type] || 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'}`}>
                    {entry.type.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-mono text-zinc-100">
                  {fmtMoney(entry.amount, entry.currency)}
                </td>
                <td className="px-4 py-3 text-zinc-300">{entry.responsibleRole}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${statusBadge[entry.status] || ''}`}>
                    {entry.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-zinc-400 text-xs">
                  {new Date(entry.detectedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </td>
                <td className="px-4 py-3 text-zinc-400 truncate max-w-[200px]">{entry.rootCause}</td>
                <td className="px-4 py-3 text-right">
                  {entry.status === 'open' && (
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => { setActionEntry(entry); setActionType('resolved'); }}
                        className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 text-xs hover:bg-emerald-500/20"
                      >
                        Resolve
                      </button>
                      <button
                        onClick={() => { setActionEntry(entry); setActionType('waived'); }}
                        className="px-2 py-1 rounded bg-zinc-500/10 text-zinc-400 text-xs hover:bg-zinc-500/20"
                      >
                        Waive
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {entries.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-zinc-500">
                  No lost revenue entries found
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

      {/* ── Action Modal (Resolve / Waive) ───────────────── */}
      {actionEntry && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setActionEntry(null)}>
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-zinc-100 mb-4">
              {actionType === 'resolved' ? 'Resolve' : 'Waive'} Entry
            </h3>
            <p className="text-sm text-zinc-400 mb-4">
              {actionEntry.type.replace(/_/g, ' ')} &mdash; {fmtMoney(actionEntry.amount, actionEntry.currency)}
            </p>
            <label className="block text-xs text-zinc-500 mb-1">Reason Code (required)</label>
            <input type="text" value={actionReason} onChange={e => setActionReason(e.target.value)}
              className="w-full rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-100 px-3 py-2 text-sm mb-4" placeholder="e.g. recovered, not_recoverable, false_positive" />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setActionEntry(null)}
                className="px-4 py-2 rounded-lg bg-zinc-800 text-zinc-300 text-sm hover:bg-zinc-700">Cancel</button>
              <button onClick={handleAction} disabled={!actionReason}
                className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-900 text-sm font-medium disabled:opacity-50">
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
