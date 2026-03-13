// PAYMENTS PAGE — Manual payment tracking
'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

// ── Types ──────────────────────────────────────────────────
type Payment = {
  id: string;
  clientId: string | null;
  modelId: string | null;
  bookingId: string | null;
  amount: string | number;
  currency: string;
  method: string | null;
  status: string;
  reference: string | null;
  notes: string | null;
  receivedAt: string | null;
  createdAt: string;
  client: { id: string; fullName: string | null; email: string | null } | null;
  model: { id: string; name: string } | null;
  booking: { id: string; shortId: string | null } | null;
  createdBy: { id: string; name: string } | null;
};

type Summary = {
  totalReceived: number;
  receivedCount: number;
  totalPending: number;
  pendingCount: number;
  totalRefunded: number;
  refundedCount: number;
};

type Pagination = { page: number; limit: number; total: number; totalPages: number };

// ── Styles ──────────────────────────────────────────────────
const statusStyles: Record<string, string> = {
  pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  received: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  succeeded: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  refunded: 'bg-red-500/10 text-red-400 border-red-500/20',
  failed: 'bg-red-500/10 text-red-400 border-red-500/20',
  cancelled: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
};

const methodLabels: Record<string, string> = {
  cash: 'Cash',
  bank_transfer: 'Bank Transfer',
  card: 'Card',
  crypto: 'Crypto',
};

const formatMoney = (v: number) =>
  new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(v);

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

// ── Component ──────────────────────────────────────────────
export default function PaymentsPage() {
  const [items, setItems] = useState<Payment[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [summary, setSummary] = useState<Summary>({ totalReceived: 0, receivedCount: 0, totalPending: 0, pendingCount: 0, totalRefunded: 0, refundedCount: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    clientId: '', modelId: '', amount: '', method: 'cash', status: 'pending',
    reference: '', notes: '', receivedAt: '',
  });

  // Clients & Models for selects
  const [clients, setClients] = useState<{ id: string; fullName: string | null }[]>([]);
  const [models, setModels] = useState<{ id: string; name: string }[]>([]);

  // ── Load data ──────────────────────────────────────────────
  const loadPayments = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (statusFilter) params.set('status', statusFilter);
      if (methodFilter) params.set('method', methodFilter);
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);

      const res = await fetch(`/api/v1/payments?${params}`);
      const json = await res.json();
      if (json.success) {
        setItems(json.data.items);
        setPagination(json.data.pagination);
      } else {
        setError(json.error?.message || 'Failed to load payments');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, methodFilter, dateFrom, dateTo]);

  const loadSummary = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/payments/summary');
      const json = await res.json();
      if (json.success) setSummary(json.data);
    } catch {}
  }, []);

  const loadSelectOptions = useCallback(async () => {
    try {
      const [clientsRes, modelsRes] = await Promise.all([
        fetch('/api/v1/clients?limit=200&fields=id,fullName'),
        fetch('/api/v1/models?limit=200&fields=id,name'),
      ]);
      const clientsJson = await clientsRes.json();
      const modelsJson = await modelsRes.json();
      setClients(clientsJson.data?.items || clientsJson.data?.clients || []);
      setModels(modelsJson.data?.items || modelsJson.data?.models || []);
    } catch {}
  }, []);

  useEffect(() => { loadPayments(); }, [loadPayments]);
  useEffect(() => { loadSummary(); loadSelectOptions(); }, []);

  // ── Create payment ──────────────────────────────────────────
  const handleCreate = async () => {
    if (!form.amount || Number(form.amount) <= 0) return;
    setSaving(true);
    try {
      const res = await fetch('/api/v1/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: form.clientId || null,
          modelId: form.modelId || null,
          amount: Number(form.amount),
          method: form.method,
          status: form.status,
          reference: form.reference || null,
          notes: form.notes || null,
          receivedAt: form.receivedAt || null,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setShowModal(false);
        setForm({ clientId: '', modelId: '', amount: '', method: 'cash', status: 'pending', reference: '', notes: '', receivedAt: '' });
        loadPayments();
        loadSummary();
      } else {
        setError(json.error?.message || 'Failed to create payment');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // ── Delete payment ──────────────────────────────────────────
  const handleDelete = async (id: string) => {
    if (!confirm('Delete this payment?')) return;
    try {
      const res = await fetch(`/api/v1/payments/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        loadPayments();
        loadSummary();
      }
    } catch {}
  };

  // ── Export CSV ──────────────────────────────────────────────
  const exportCSV = () => {
    const headers = ['Date', 'Client', 'Model', 'Amount', 'Method', 'Status', 'Reference', 'Notes'];
    const rows = items.map((p) => [
      formatDate(p.createdAt),
      p.client?.fullName || p.client?.email || '',
      p.model?.name || '',
      Number(p.amount).toFixed(2),
      methodLabels[p.method || ''] || p.method || '',
      p.status,
      p.reference || '',
      (p.notes || '').replace(/"/g, '""'),
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payments-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Render ──────────────────────────────────────────────────
  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">Payments</h1>
          <p className="text-sm text-zinc-500 mt-1">{pagination.total} total payments</p>
        </div>
        <div className="flex gap-3">
          <button onClick={exportCSV} className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium transition-colors border border-zinc-700">
            Export CSV
          </button>
          <button onClick={() => setShowModal(true)} className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-900 text-sm font-medium transition-colors">
            + Add Payment
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-5">
          <div className="text-xs text-zinc-500 mb-1">Total Received</div>
          <div className="text-2xl font-bold text-emerald-400">{formatMoney(summary.totalReceived)}</div>
          <div className="text-xs text-zinc-500 mt-1">{summary.receivedCount} payments</div>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-5">
          <div className="text-xs text-zinc-500 mb-1">Pending</div>
          <div className="text-2xl font-bold text-amber-400">{formatMoney(summary.totalPending)}</div>
          <div className="text-xs text-zinc-500 mt-1">{summary.pendingCount} payments</div>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-5">
          <div className="text-xs text-zinc-500 mb-1">Refunded</div>
          <div className="text-2xl font-bold text-red-400">{formatMoney(summary.totalRefunded)}</div>
          <div className="text-xs text-zinc-500 mt-1">{summary.refundedCount} payments</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200">
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="received">Received</option>
          <option value="succeeded">Succeeded</option>
          <option value="refunded">Refunded</option>
        </select>
        <select value={methodFilter} onChange={(e) => { setMethodFilter(e.target.value); setPage(1); }}
          className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200">
          <option value="">All Methods</option>
          <option value="cash">Cash</option>
          <option value="bank_transfer">Bank Transfer</option>
          <option value="card">Card</option>
          <option value="crypto">Crypto</option>
        </select>
        <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
          className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200" placeholder="From" />
        <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
          className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200" placeholder="To" />
        {(statusFilter || methodFilter || dateFrom || dateTo) && (
          <button onClick={() => { setStatusFilter(''); setMethodFilter(''); setDateFrom(''); setDateTo(''); setPage(1); }}
            className="px-3 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors">
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
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Client</th>
                <th className="px-4 py-3 font-medium">Model</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Method</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Reference</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-zinc-500">Loading...</td></tr>
              )}
              {!loading && items.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-zinc-500">No payments found</td></tr>
              )}
              {!loading && items.map((p) => (
                <tr key={p.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                  <td className="px-4 py-3 text-zinc-300">{formatDate(p.createdAt)}</td>
                  <td className="px-4 py-3 text-zinc-300">{p.client?.fullName || p.client?.email || '—'}</td>
                  <td className="px-4 py-3 text-zinc-300">{p.model?.name || '—'}</td>
                  <td className="px-4 py-3 text-emerald-400 font-medium">{formatMoney(Number(p.amount))}</td>
                  <td className="px-4 py-3">
                    <span className="inline-block px-2 py-0.5 rounded-md text-xs bg-zinc-800 text-zinc-300">
                      {methodLabels[p.method || ''] || p.method || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${statusStyles[p.status] || 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-400 text-xs max-w-[150px] truncate" title={p.reference || p.notes || ''}>
                    {p.reference || p.notes || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleDelete(p.id)}
                      className="px-2 py-1 rounded text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-800">
            <span className="text-xs text-zinc-500">{pagination.total} payments</span>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)}
                className="px-3 py-1 text-xs rounded bg-zinc-800 text-zinc-400 disabled:opacity-30 hover:bg-zinc-700">
                Prev
              </button>
              <span className="text-xs text-zinc-400 py-1">{page} / {pagination.totalPages}</span>
              <button disabled={page >= pagination.totalPages} onClick={() => setPage(page + 1)}
                className="px-3 py-1 text-xs rounded bg-zinc-800 text-zinc-400 disabled:opacity-30 hover:bg-zinc-700">
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Add Payment Modal ────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-zinc-100">Add Payment</h2>
              <button onClick={() => setShowModal(false)} className="text-zinc-500 hover:text-zinc-300 text-xl">&times;</button>
            </div>

            <div className="space-y-4">
              {/* Client */}
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Client</label>
                <select value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200">
                  <option value="">— None —</option>
                  {clients.map((c) => <option key={c.id} value={c.id}>{c.fullName || c.id}</option>)}
                </select>
              </div>

              {/* Model */}
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Model</label>
                <select value={form.modelId} onChange={(e) => setForm({ ...form, modelId: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200">
                  <option value="">— None —</option>
                  {models.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Amount (GBP) *</label>
                <input type="number" step="0.01" min="0" value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200"
                  placeholder="0.00" />
              </div>

              {/* Method + Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Method *</label>
                  <select value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200">
                    <option value="cash">Cash</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="card">Card</option>
                    <option value="crypto">Crypto</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Status</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200">
                    <option value="pending">Pending</option>
                    <option value="received">Received</option>
                    <option value="refunded">Refunded</option>
                  </select>
                </div>
              </div>

              {/* Reference */}
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Reference</label>
                <input type="text" value={form.reference}
                  onChange={(e) => setForm({ ...form, reference: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200"
                  placeholder="Bank ref, invoice #, etc." />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Notes</label>
                <textarea value={form.notes} rows={2}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 resize-none"
                  placeholder="Additional details..." />
              </div>

              {/* Received At */}
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Received At</label>
                <input type="date" value={form.receivedAt}
                  onChange={(e) => setForm({ ...form, receivedAt: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200" />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium border border-zinc-700 transition-colors">
                Cancel
              </button>
              <button onClick={handleCreate} disabled={saving || !form.amount}
                className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-zinc-900 text-sm font-medium transition-colors">
                {saving ? 'Saving...' : 'Save Payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
