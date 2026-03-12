// ALTERNATIVE OFFERS — Admin page
// Summary cards, filterable table, status badges
'use client';

import { useState, useEffect, useCallback } from 'react';

type Offer = {
  id: string;
  offerSetId: string | null;
  requestedModel: { id: string; name: string };
  offeredModel: { id: string; name: string };
  generationReason: string;
  rank: number;
  status: string;
  shownAt: string | null;
  acceptedAt: string | null;
  rejectedAt: string | null;
  createdAt: string;
  conversion: { id: string; revenueAmount: number | null } | null;
};

const statusBadge: Record<string, string> = {
  generated: 'bg-zinc-500/10 text-zinc-400 border-zinc-700/50',
  shown: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  accepted: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
  expired: 'bg-zinc-500/10 text-zinc-500 border-zinc-700/50',
};

export default function AlternativeOffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [total, setTotal] = useState(0);

  // Filters
  const [filterStatus, setFilterStatus] = useState('');
  const [filterReason, setFilterReason] = useState('');
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    try {
      setError('');
      const params = new URLSearchParams();
      if (filterStatus) params.set('status', filterStatus);
      if (filterReason) params.set('generationReason', filterReason);
      params.set('page', String(page));
      params.set('limit', '25');

      const res = await fetch(`/api/v1/alternative-offers?${params}`);
      const data = await res.json();
      if (data.success) {
        setOffers(data.data.offers);
        setTotal(data.data.total);
      }
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [filterStatus, filterReason, page]);

  useEffect(() => { load(); }, [load]);

  // Compute summary
  const totalGenerated = total;
  const shownCount = offers.filter(o => ['shown', 'accepted', 'rejected'].includes(o.status)).length;
  const acceptedCount = offers.filter(o => o.status === 'accepted').length;
  const acceptanceRate = shownCount > 0 ? ((acceptedCount / shownCount) * 100).toFixed(1) : '0';
  const totalRevenue = offers.reduce((sum, o) => sum + (o.conversion?.revenueAmount ? Number(o.conversion.revenueAmount) : 0), 0);

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight mb-2">Alternative Offers</h1>
        <div className="space-y-4 animate-pulse"><div className="h-64 bg-zinc-800/30 rounded-xl" /></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight mb-2">Alternative Offers</h1>
        <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-6 text-red-400">{error}</div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">Alternative Offers</h1>
        <p className="text-sm text-zinc-500 mt-1">{total} total offers</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Generated', value: totalGenerated, color: 'text-zinc-100' },
          { label: 'Shown', value: shownCount, color: 'text-blue-400' },
          { label: 'Acceptance Rate', value: `${acceptanceRate}%`, color: 'text-emerald-400' },
          { label: 'Conversion Revenue', value: `${totalRevenue.toFixed(2)}`, color: 'text-amber-400' },
        ].map(card => (
          <div key={card.label} className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-5">
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">{card.label}</p>
            <p className={`text-2xl font-semibold ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); setLoading(true); }}
          className="rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-100 px-3 py-2 text-sm">
          <option value="">All Statuses</option>
          <option value="generated">Generated</option>
          <option value="shown">Shown</option>
          <option value="accepted">Accepted</option>
          <option value="rejected">Rejected</option>
          <option value="expired">Expired</option>
        </select>
        <select value={filterReason} onChange={e => { setFilterReason(e.target.value); setPage(1); setLoading(true); }}
          className="rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-100 px-3 py-2 text-sm">
          <option value="">All Reasons</option>
          <option value="requested_model_unavailable">Model Unavailable</option>
          <option value="price_mismatch">Price Mismatch</option>
          <option value="location_mismatch">Location Mismatch</option>
          <option value="schedule_conflict">Schedule Conflict</option>
          <option value="vip_restriction">VIP Restriction</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800/50">
              <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Requested</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Offered</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Reason</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Rank</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Status</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Shown</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Accepted</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Created</th>
            </tr>
          </thead>
          <tbody>
            {offers.map(o => (
              <tr key={o.id} className="border-b border-zinc-800/30 hover:bg-zinc-800/20">
                <td className="px-4 py-3 text-zinc-200">{o.requestedModel.name}</td>
                <td className="px-4 py-3 text-zinc-200">{o.offeredModel.name}</td>
                <td className="px-4 py-3 text-zinc-400 text-xs">{o.generationReason.replace(/_/g, ' ')}</td>
                <td className="px-4 py-3 text-center text-zinc-400">#{o.rank}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${statusBadge[o.status] || statusBadge.generated}`}>
                    {o.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-zinc-500 text-xs">
                  {o.shownAt ? new Date(o.shownAt).toLocaleDateString() : '-'}
                </td>
                <td className="px-4 py-3 text-zinc-500 text-xs">
                  {o.acceptedAt ? new Date(o.acceptedAt).toLocaleDateString() : '-'}
                </td>
                <td className="px-4 py-3 text-zinc-500 text-xs">
                  {new Date(o.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
            {offers.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-12 text-center text-zinc-500">No alternative offers found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {total > 25 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-zinc-500">Page {page} of {Math.ceil(total / 25)}</p>
          <div className="flex gap-2">
            <button onClick={() => { setPage(p => Math.max(1, p - 1)); setLoading(true); }} disabled={page === 1}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 text-sm hover:bg-zinc-700 disabled:opacity-50">Prev</button>
            <button onClick={() => { setPage(p => p + 1); setLoading(true); }} disabled={page * 25 >= total}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 text-sm hover:bg-zinc-700 disabled:opacity-50">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
