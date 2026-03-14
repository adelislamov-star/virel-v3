'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

type Inquiry = {
  id: string;
  source: string;
  status: string;
  priority: string;
  message: string | null;
  createdAt: string;
  client: { fullName: string | null } | null;
  assignedUser: { name: string | null } | null;
};

const statusStyles: Record<string, string> = {
  new: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  qualified: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  awaiting_client: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  awaiting_deposit: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  converted: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  lost: 'bg-red-500/10 text-red-400 border-red-500/20',
  spam: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
};

const priorityStyles: Record<string, string> = {
  low: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  normal: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  high: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  critical: 'bg-red-500/10 text-red-400 border-red-500/20',
};

const sourceStyles: Record<string, string> = {
  web: 'bg-blue-500/10 text-blue-400',
  telegram: 'bg-sky-500/10 text-sky-400',
  whatsapp: 'bg-emerald-500/10 text-emerald-400',
  phone: 'bg-purple-500/10 text-purple-400',
};

export default function LeadsPage() {
  const [items, setItems] = useState<Inquiry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Stats
  const [stats, setStats] = useState({ total: 0, new: 0, converted: 0, rate: '0' });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams({ page: String(page) });
      if (statusFilter) params.set('status', statusFilter);

      const res = await fetch(`/api/v1/inquiries?${params}`);
      const json = await res.json();
      if (json.success) {
        let list: Inquiry[] = json.inquiries;

        // Client-side filters (API doesn't support these params)
        if (search) {
          const q = search.toLowerCase();
          list = list.filter((i) =>
            (i.message?.toLowerCase().includes(q)) ||
            i.source.toLowerCase().includes(q) ||
            (i.client?.fullName?.toLowerCase().includes(q))
          );
        }
        if (priorityFilter) {
          list = list.filter((i) => i.priority === priorityFilter);
        }

        setItems(list);
        setTotal(json.total);
        setTotalPages(Math.ceil(json.total / 20));
      } else {
        setError(json.error?.message || 'Failed to load leads');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, priorityFilter, page]);

  // Load stats (all inquiries to compute counts)
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/v1/inquiries?page=1&limit=1000');
        const json = await res.json();
        if (json.success) {
          const all = json.inquiries as Inquiry[];
          const newCount = all.filter((i) => i.status === 'new').length;
          const convertedCount = all.filter((i) => i.status === 'converted').length;
          setStats({
            total: json.total,
            new: newCount,
            converted: convertedCount,
            rate: json.total > 0 ? ((convertedCount / json.total) * 100).toFixed(1) : '0',
          });
        }
      } catch {}
    })();
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSearch = (val: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setSearch(val); setPage(1); }, 300);
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-white">Leads / Inquiries</h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Leads', value: stats.total, color: 'text-white' },
          { label: 'New', value: stats.new, color: 'text-blue-400' },
          { label: 'Converted', value: stats.converted, color: 'text-emerald-400' },
          { label: 'Conversion Rate', value: `${stats.rate}%`, color: 'text-purple-400' },
        ].map((s) => (
          <div key={s.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <div className="text-xs text-zinc-500 mb-1">{s.label}</div>
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search message, source..."
          onChange={(e) => handleSearch(e.target.value)}
          className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 w-72 focus:outline-none focus:border-zinc-500"
        />
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200"
        >
          <option value="">All Status</option>
          <option value="new">New</option>
          <option value="qualified">Qualified</option>
          <option value="awaiting_client">Awaiting Client</option>
          <option value="awaiting_deposit">Awaiting Deposit</option>
          <option value="converted">Converted</option>
          <option value="lost">Lost</option>
          <option value="spam">Spam</option>
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }}
          className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200"
        >
          <option value="">All Priority</option>
          <option value="low">Low</option>
          <option value="normal">Normal</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400 text-sm">{error}</div>
      )}

      {/* Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400 text-left">
                <th className="px-4 py-3 font-medium">Source</th>
                <th className="px-4 py-3 font-medium">Client</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Priority</th>
                <th className="px-4 py-3 font-medium">Message</th>
                <th className="px-4 py-3 font-medium">Assigned To</th>
                <th className="px-4 py-3 font-medium">Created At</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-zinc-500">Loading...</td></tr>
              )}
              {!loading && items.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-zinc-500">No leads found</td></tr>
              )}
              {!loading && items.map((item) => (
                <tr key={item.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/50 transition-colors">
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs ${sourceStyles[item.source] ?? 'bg-zinc-700 text-zinc-300'}`}>
                      {item.source}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-200">{item.client?.fullName || 'Unknown'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs border ${statusStyles[item.status] ?? 'bg-zinc-700 text-zinc-300'}`}>
                      {item.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs border ${priorityStyles[item.priority] ?? 'bg-zinc-700 text-zinc-300'}`}>
                      {item.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-400 max-w-[200px] truncate">
                    {item.message ? item.message.slice(0, 60) : '—'}
                  </td>
                  <td className="px-4 py-3 text-zinc-400">{item.assignedUser?.name || '—'}</td>
                  <td className="px-4 py-3 text-zinc-400">{formatDate(item.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-800">
            <span className="text-xs text-zinc-500">{total} leads</span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1 text-xs rounded bg-zinc-800 text-zinc-400 disabled:opacity-30 hover:bg-zinc-700"
              >Prev</button>
              <span className="text-xs text-zinc-400 py-1">{page} / {totalPages}</span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1 text-xs rounded bg-zinc-800 text-zinc-400 disabled:opacity-30 hover:bg-zinc-700"
              >Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
