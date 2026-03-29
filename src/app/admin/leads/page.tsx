'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

type Inquiry = {
  id: string;
  source: string;
  status: string;
  priority: string;
  subject: string | null;
  message: string | null;
  createdAt: string;
  client: { fullName: string | null } | null;
  assignedUser: { name: string | null } | null;
};

function parseLeadMessage(message: string): Record<string, string> {
  const fields: Record<string, string> = {};
  message.split(' | ').forEach((part) => {
    const colonIdx = part.indexOf(': ');
    if (colonIdx !== -1) {
      const key = part.substring(0, colonIdx).trim();
      const value = part.substring(colonIdx + 2).trim();
      fields[key] = value;
    }
  });
  return fields;
}

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
  const [selectedLead, setSelectedLead] = useState<Inquiry | null>(null);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

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

  // Close sidebar on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) {
        setSelectedLead(null);
      }
    }
    if (selectedLead) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [selectedLead]);

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedLead || statusUpdating) return;
    setStatusUpdating(true);
    try {
      const res = await fetch(`/api/v1/inquiries/${selectedLead.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newStatus }),
      });
      const json = await res.json();
      if (json.success) {
        setSelectedLead({ ...selectedLead, status: newStatus });
        setItems((prev) =>
          prev.map((i) => (i.id === selectedLead.id ? { ...i, status: newStatus } : i))
        );
      } else {
        alert(json.error?.message || 'Failed to update status');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setStatusUpdating(false);
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  const formatDateTime = (d: string) =>
    new Date(d).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });

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
                <tr
                  key={item.id}
                  onClick={() => setSelectedLead(item)}
                  className="border-b border-zinc-800/50 hover:bg-zinc-800/50 transition-colors cursor-pointer">
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

      {/* Sidebar overlay + panel */}
      {selectedLead && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40 transition-opacity" />
          <div
            ref={sidebarRef}
            className="fixed top-0 right-0 h-full w-[420px] max-w-full bg-zinc-900 border-l border-zinc-800 z-50 shadow-2xl overflow-y-auto animate-slide-in-right"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
              <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Lead Details</h2>
              <button
                onClick={() => setSelectedLead(null)}
                className="text-zinc-500 hover:text-zinc-300 text-xl leading-none"
              >&times;</button>
            </div>

            <div className="px-6 py-5 space-y-6">
              {/* Meta badges */}
              <div className="flex flex-wrap gap-3 items-center">
                <span className={`inline-block px-2 py-0.5 rounded-full text-xs ${sourceStyles[selectedLead.source] ?? 'bg-zinc-700 text-zinc-300'}`}>
                  {selectedLead.source}
                </span>
                <span className={`inline-block px-2 py-0.5 rounded-full text-xs border ${statusStyles[selectedLead.status] ?? 'bg-zinc-700 text-zinc-300'}`}>
                  {selectedLead.status.replace(/_/g, ' ')}
                </span>
                <span className={`inline-block px-2 py-0.5 rounded-full text-xs border ${priorityStyles[selectedLead.priority] ?? 'bg-zinc-700 text-zinc-300'}`}>
                  {selectedLead.priority}
                </span>
              </div>
              <div className="text-xs text-zinc-500">Created: {formatDateTime(selectedLead.createdAt)}</div>

              {/* Subject */}
              {selectedLead.subject && (
                <div>
                  <div className="text-xs text-zinc-500 mb-1">Subject</div>
                  <div className="text-sm text-zinc-200">{selectedLead.subject}</div>
                </div>
              )}

              {/* Enquiry Details */}
              <div className="border-t border-zinc-800 pt-4">
                <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Enquiry Details</h3>
                {selectedLead.message ? (
                  <div className="space-y-2">
                    {(() => {
                      const fields = parseLeadMessage(selectedLead.message!);
                      const fieldOrder = ['Name', 'Contact', 'Companion', 'Date', 'Time', 'Duration', 'Type', 'Message'];
                      const orderedKeys = [
                        ...fieldOrder.filter((k) => fields[k]),
                        ...Object.keys(fields).filter((k) => !fieldOrder.includes(k)),
                      ];
                      return orderedKeys.length > 0 ? (
                        orderedKeys.map((key) => (
                          <div key={key} className="flex text-sm">
                            <span className="text-zinc-500 w-28 shrink-0">{key}:</span>
                            <span className="text-zinc-200 break-all">{fields[key]}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-zinc-400 whitespace-pre-wrap">{selectedLead.message}</p>
                      );
                    })()}
                  </div>
                ) : (
                  <p className="text-sm text-zinc-500">No message</p>
                )}
              </div>

              {/* Actions */}
              <div className="border-t border-zinc-800 pt-4">
                <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Actions</h3>
                <div className="flex flex-wrap gap-3">
                  <select
                    value={selectedLead.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    disabled={statusUpdating}
                    className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 disabled:opacity-50"
                  >
                    {['new', 'qualified', 'awaiting_client', 'awaiting_deposit', 'converted', 'lost', 'spam'].map((s) => (
                      <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                  {selectedLead.status === 'new' && (
                    <button
                      onClick={() => handleStatusChange('qualified')}
                      disabled={statusUpdating}
                      className="px-4 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50 transition-colors"
                    >
                      Mark as Contacted
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <style jsx>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in-right {
          animation: slideInRight 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}
