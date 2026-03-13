'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';

type ClientRow = {
  id: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  riskStatus: string;
  vipStatus: boolean;
  totalSpent: number;
  lastBookingAt: string | null;
  segment: string | null;
};

type Pagination = { page: number; limit: number; total: number; totalPages: number };

const riskStyles: Record<string, string> = {
  normal: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  monitoring: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  restricted: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  blocked: 'bg-red-500/10 text-red-400 border-red-500/20',
};

const segmentStyles: Record<string, string> = {
  new: 'bg-blue-500/10 text-blue-400',
  active: 'bg-emerald-500/10 text-emerald-400',
  cooling: 'bg-yellow-500/10 text-yellow-400',
  at_risk: 'bg-amber-500/10 text-amber-400',
  lost: 'bg-red-500/10 text-red-400',
  vip: 'bg-purple-500/10 text-purple-400',
  whale: 'bg-indigo-500/10 text-indigo-400',
};

export default function ClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [vipFilter, setVipFilter] = useState('');
  const [segmentFilter, setSegmentFilter] = useState('');
  const [page, setPage] = useState(1);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const loadClients = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('search', search);
      if (riskFilter) params.set('riskStatus', riskFilter);
      if (vipFilter) params.set('vipStatus', vipFilter);
      if (segmentFilter) params.set('segment', segmentFilter);

      const res = await fetch(`/api/v1/clients?${params}`);
      const json = await res.json();
      if (json.success) {
        setClients(json.data.clients);
        setPagination(json.data.pagination);
      } else {
        setError(json.error?.message || 'Failed to load clients');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [search, riskFilter, vipFilter, segmentFilter, page]);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  const handleSearch = (val: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearch(val);
      setPage(1);
    }, 300);
  };

  const formatDate = (d: string | null) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatMoney = (v: number) => {
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(v);
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-white">Clients</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search name, phone, email..."
          onChange={(e) => handleSearch(e.target.value)}
          className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 w-72 focus:outline-none focus:border-zinc-500"
        />
        <select
          value={riskFilter}
          onChange={(e) => { setRiskFilter(e.target.value); setPage(1); }}
          className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200"
        >
          <option value="">All Risk</option>
          <option value="normal">Normal</option>
          <option value="monitoring">Monitoring</option>
          <option value="restricted">Restricted</option>
          <option value="blocked">Blocked</option>
        </select>
        <select
          value={vipFilter}
          onChange={(e) => { setVipFilter(e.target.value); setPage(1); }}
          className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200"
        >
          <option value="">All VIP</option>
          <option value="true">VIP Only</option>
          <option value="false">Non-VIP</option>
        </select>
        <select
          value={segmentFilter}
          onChange={(e) => { setSegmentFilter(e.target.value); setPage(1); }}
          className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200"
        >
          <option value="">All Segments</option>
          <option value="new">New</option>
          <option value="active">Active</option>
          <option value="cooling">Cooling</option>
          <option value="at_risk">At Risk</option>
          <option value="lost">Lost</option>
          <option value="vip">VIP</option>
          <option value="whale">Whale</option>
        </select>
      </div>

      {/* Table */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400 text-sm">{error}</div>
      )}

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400 text-left">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium">Risk</th>
                <th className="px-4 py-3 font-medium">VIP</th>
                <th className="px-4 py-3 font-medium">Total Spent</th>
                <th className="px-4 py-3 font-medium">Last Booking</th>
                <th className="px-4 py-3 font-medium">Segment</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-zinc-500">Loading...</td>
                </tr>
              )}
              {!loading && clients.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-zinc-500">No clients found</td>
                </tr>
              )}
              {!loading && clients.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => router.push(`/admin/clients/${c.id}`)}
                  className="border-b border-zinc-800/50 hover:bg-zinc-800/50 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 text-zinc-200 font-medium">{c.fullName}</td>
                  <td className="px-4 py-3 text-zinc-400">
                    <div>{c.phone || '—'}</div>
                    <div className="text-xs">{c.email || ''}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs border ${riskStyles[c.riskStatus] ?? 'bg-zinc-700 text-zinc-300'}`}>
                      {c.riskStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {c.vipStatus && <span className="text-purple-400 text-xs font-semibold">VIP</span>}
                  </td>
                  <td className="px-4 py-3 text-zinc-300">{formatMoney(Number(c.totalSpent))}</td>
                  <td className="px-4 py-3 text-zinc-400">{formatDate(c.lastBookingAt)}</td>
                  <td className="px-4 py-3">
                    {c.segment && (
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs ${segmentStyles[c.segment] ?? 'bg-zinc-700 text-zinc-300'}`}>
                        {c.segment.replace('_', ' ')}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-800">
            <span className="text-xs text-zinc-500">{pagination.total} clients</span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1 text-xs rounded bg-zinc-800 text-zinc-400 disabled:opacity-30 hover:bg-zinc-700"
              >
                Prev
              </button>
              <span className="text-xs text-zinc-400 py-1">
                {page} / {pagination.totalPages}
              </span>
              <button
                disabled={page >= pagination.totalPages}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1 text-xs rounded bg-zinc-800 text-zinc-400 disabled:opacity-30 hover:bg-zinc-700"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
