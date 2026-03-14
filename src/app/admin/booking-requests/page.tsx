'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import type { BookingRequest } from '@/types/booking';
import {
  CheckCircle,
  Eye,
  StickyNote,
  X,
  MessageCircle,
  Send,
  Phone,
  Clock,
  AlertCircle,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Inbox,
} from 'lucide-react';

/* ───── helpers ───── */

interface ModelOption {
  id: string;
  name: string;
}

interface DistrictOption {
  id: string;
  name: string;
}

interface Meta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

type DateFilter = 'all' | 'today' | 'tomorrow' | 'week';

function formatDuration(minutes: number): string {
  if (minutes >= 60) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h} Hour${h > 1 ? 's' : ''} ${m} Min` : `${h} Hour${h > 1 ? 's' : ''}`;
  }
  return `${minutes} Min`;
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDateTime(dateStr: string): string {
  return `${formatDate(dateStr)} ${formatTime(dateStr)}`;
}

function isOlderThan30Min(dateStr: string): boolean {
  return Date.now() - new Date(dateStr).getTime() > 30 * 60 * 1000;
}

function isToday(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  return d.toDateString() === now.toDateString();
}

function isTomorrow(dateStr: string): boolean {
  const d = new Date(dateStr);
  const tom = new Date();
  tom.setDate(tom.getDate() + 1);
  return d.toDateString() === tom.toDateString();
}

function isThisWeek(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);
  return d >= startOfWeek && d < endOfWeek;
}

function cleanPhone(phone: string): string {
  return phone.replace(/[\s+\-()]/g, '');
}

/* ───── toast ───── */

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

let toastId = 0;

/* ───── main component ───── */

export default function BookingRequestsPage() {
  /* data state */
  const [requests, setRequests] = useState<BookingRequest[]>([]);
  const [meta, setMeta] = useState<Meta>({ total: 0, page: 1, limit: 20, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  /* filters */
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [modelFilter, setModelFilter] = useState<string>('');
  const [districtFilter, setDistrictFilter] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [page, setPage] = useState(1);

  /* reference data */
  const [models, setModels] = useState<ModelOption[]>([]);
  const [districts, setDistricts] = useState<DistrictOption[]>([]);

  /* drawer */
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<BookingRequest | null>(null);
  const [drawerNotes, setDrawerNotes] = useState('');
  const [noteSaving, setNoteSaving] = useState(false);
  const [clientHistory, setClientHistory] = useState<BookingRequest[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  /* reject modal */
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  /* toast */
  const [toasts, setToasts] = useState<Toast[]>([]);

  /* refs */
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ───── toast helpers ───── */

  const showToast = useCallback((message: string, type: Toast['type'] = 'success') => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  /* ───── data loading ───── */

  const loadRequests = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (statusFilter) params.set('status', statusFilter);
      if (dateFilter !== 'all') params.set('date', dateFilter);
      if (modelFilter) params.set('modelId', modelFilter);

      const res = await fetch(`/api/v1/booking-requests?${params}`);
      const json = await res.json();

      if (json.success) {
        let list: BookingRequest[] = json.data || [];

        /* client-side filters the API doesn't support */
        if (search) {
          const q = search.toLowerCase();
          list = list.filter(
            (r) =>
              r.clientName.toLowerCase().includes(q) ||
              r.clientEmail.toLowerCase().includes(q) ||
              r.clientPhone.includes(q),
          );
        }
        if (districtFilter) {
          list = list.filter((r) => r.districtId === districtFilter);
        }

        setRequests(list);
        setMeta(
          json.meta || {
            total: list.length,
            page,
            limit: 20,
            totalPages: Math.ceil(list.length / 20),
          },
        );
      }
      setLastUpdated(new Date());
    } catch {
      showToast('Failed to load booking requests', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, dateFilter, modelFilter, districtFilter, search, showToast]);

  const loadModels = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/models?status=Active&limit=100');
      const json = await res.json();
      if (json.success) {
        const list = json.data?.models || [];
        setModels(list.map((m: { id: string; name: string }) => ({ id: m.id, name: m.name })));
      }
    } catch {
      /* silent */
    }
  }, []);

  const loadDistricts = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/districts');
      const json = await res.json();
      if (json.success) {
        setDistricts(
          (json.data || []).map((d: { id: string; name: string }) => ({ id: d.id, name: d.name })),
        );
      }
    } catch {
      /* silent */
    }
  }, []);

  /* initial load */
  useEffect(() => {
    loadModels();
    loadDistricts();
  }, [loadModels, loadDistricts]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  /* auto-refresh every 30s */
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      loadRequests();
    }, 30000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [loadRequests]);

  /* ───── stats ───── */

  const pendingCount = requests.filter((r) => r.status === 'pending').length;
  const confirmedTodayCount = requests.filter(
    (r) => r.status === 'confirmed' && r.confirmedAt && isToday(r.confirmedAt),
  ).length;
  const thisWeekCount = requests.filter((r) => isThisWeek(r.createdAt)).length;
  const weekRevenue = requests
    .filter((r) => r.status === 'confirmed' && isThisWeek(r.createdAt))
    .reduce((sum, r) => sum + r.grandTotal, 0);

  /* ───── actions ───── */

  const handleConfirm = async (id: string) => {
    if (!window.confirm('Confirm this booking request?')) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/v1/booking-requests/${id}/confirm`, { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        showToast('Booking confirmed successfully');
        loadRequests();
        if (selectedRequest?.id === id) {
          setSelectedRequest({ ...selectedRequest, status: 'confirmed', confirmedAt: new Date().toISOString() });
        }
      } else {
        showToast(json.error?.message || 'Failed to confirm', 'error');
      }
    } catch {
      showToast('Failed to confirm booking', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const openRejectModal = (id: string) => {
    setRejectingId(id);
    setRejectReason('');
    setRejectModalOpen(true);
  };

  const handleReject = async () => {
    if (!rejectingId) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/v1/booking-requests/${rejectingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled', internalNotes: rejectReason || undefined }),
      });
      const json = await res.json();
      if (json.success) {
        showToast('Booking rejected');
        setRejectModalOpen(false);
        loadRequests();
        if (selectedRequest?.id === rejectingId) {
          setSelectedRequest({ ...selectedRequest, status: 'cancelled' });
        }
      } else {
        showToast(json.error?.message || 'Failed to reject', 'error');
      }
    } catch {
      showToast('Failed to reject booking', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const saveNotes = async () => {
    if (!selectedRequest) return;
    setNoteSaving(true);
    try {
      const res = await fetch(`/api/v1/booking-requests/${selectedRequest.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ internalNotes: drawerNotes }),
      });
      const json = await res.json();
      if (json.success) {
        showToast('Notes saved');
        setSelectedRequest({ ...selectedRequest, internalNotes: drawerNotes });
        loadRequests();
      } else {
        showToast('Failed to save notes', 'error');
      }
    } catch {
      showToast('Failed to save notes', 'error');
    } finally {
      setNoteSaving(false);
    }
  };

  /* ───── drawer open ───── */

  const openDrawer = async (req: BookingRequest) => {
    setSelectedRequest(req);
    setDrawerNotes(req.internalNotes || '');
    setDrawerOpen(true);
    setClientHistory([]);

    /* fetch full detail */
    try {
      const res = await fetch(`/api/v1/booking-requests/${req.id}`);
      const json = await res.json();
      if (json.success && json.data) {
        setSelectedRequest(json.data);
        setDrawerNotes(json.data.internalNotes || '');
      }
    } catch {
      /* keep what we have */
    }

    /* client history */
    setHistoryLoading(true);
    try {
      const res = await fetch('/api/v1/booking-requests?limit=100');
      const json = await res.json();
      if (json.success) {
        const all: BookingRequest[] = json.data || [];
        setClientHistory(
          all.filter((b) => b.clientEmail === req.clientEmail && b.id !== req.id),
        );
      }
    } catch {
      /* silent */
    } finally {
      setHistoryLoading(false);
    }
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setSelectedRequest(null);
  };

  /* ───── search debounce ───── */

  const handleSearch = (value: string) => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setSearch(value);
      setPage(1);
    }, 300);
  };

  /* ───── helpers for model/district name lookup ───── */

  const modelName = (id: string | null): string => {
    if (!id) return '—';
    return models.find((m) => m.id === id)?.name || id.slice(0, 8);
  };

  const districtName = (id: string | null): string => {
    if (!id) return '—';
    return districts.find((d) => d.id === id)?.name || id.slice(0, 8);
  };

  /* ───── render helpers ───── */

  const StatusBadge = ({ status }: { status: BookingRequest['status'] }) => {
    if (status === 'pending') {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-500/10 text-yellow-400 px-2.5 py-0.5 text-xs font-medium">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-400" />
          </span>
          Pending
        </span>
      );
    }
    if (status === 'confirmed') {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 text-emerald-400 px-2.5 py-0.5 text-xs font-medium">
          <CheckCircle size={12} />
          Confirmed
        </span>
      );
    }
    return (
      <span className="inline-flex items-center rounded-full bg-zinc-500/10 text-zinc-400 px-2.5 py-0.5 text-xs font-medium">
        Cancelled
      </span>
    );
  };

  const TypeBadge = ({ type }: { type: string }) => {
    if (type === 'incall') {
      return (
        <span className="inline-flex items-center rounded-full bg-blue-500/10 text-blue-400 px-2.5 py-0.5 text-xs font-medium">
          Incall
        </span>
      );
    }
    return (
      <span className="inline-flex items-center rounded-full bg-purple-500/10 text-purple-400 px-2.5 py-0.5 text-xs font-medium">
        Outcall
      </span>
    );
  };

  /* ───── render ───── */

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">Booking Requests</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Last updated: {lastUpdated.toLocaleTimeString('en-GB')}
          </p>
        </div>
        <button
          onClick={() => loadRequests()}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-zinc-400 hover:text-zinc-200 bg-zinc-800 border border-zinc-700 rounded-lg transition-colors"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle size={16} className="text-red-400" />
            <span className="text-sm text-zinc-400">Pending</span>
          </div>
          <p className="text-2xl font-bold text-red-400">{pendingCount}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle size={16} className="text-emerald-400" />
            <span className="text-sm text-zinc-400">Confirmed Today</span>
          </div>
          <p className="text-2xl font-bold text-emerald-400">{confirmedTodayCount}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={16} className="text-blue-400" />
            <span className="text-sm text-zinc-400">Total This Week</span>
          </div>
          <p className="text-2xl font-bold text-blue-400">{thisWeekCount}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-purple-400 text-base font-bold">{requests[0]?.currency || '£'}</span>
            <span className="text-sm text-zinc-400">Revenue This Week</span>
          </div>
          <p className="text-2xl font-bold text-purple-400">
            {weekRevenue.toLocaleString('en-GB', { minimumFractionDigits: 0 })}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-600"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <select
          value={dateFilter}
          onChange={(e) => {
            setDateFilter(e.target.value as DateFilter);
            setPage(1);
          }}
          className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-600"
        >
          <option value="all">All Dates</option>
          <option value="today">Today</option>
          <option value="tomorrow">Tomorrow</option>
          <option value="week">This Week</option>
        </select>

        <select
          value={modelFilter}
          onChange={(e) => {
            setModelFilter(e.target.value);
            setPage(1);
          }}
          className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-600"
        >
          <option value="">All Models</option>
          {models.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>

        <select
          value={districtFilter}
          onChange={(e) => {
            setDistrictFilter(e.target.value);
            setPage(1);
          }}
          className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-600"
        >
          <option value="">All Districts</option>
          {districts.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>

        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search name, email, phone..."
            onChange={(e) => handleSearch(e.target.value)}
            className="bg-zinc-800 border border-zinc-700 rounded-lg pl-9 pr-3 py-2 text-sm text-zinc-300 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-600 w-64"
          />
        </div>
      </div>

      {/* Table */}
      {loading && requests.length === 0 ? (
        <div className="space-y-3 animate-pulse">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 bg-zinc-800/30 rounded-xl" />
          ))}
        </div>
      ) : requests.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Inbox size={48} className="text-zinc-600 mb-4" />
          <h3 className="text-lg font-medium text-zinc-300 mb-1">No booking requests</h3>
          <p className="text-sm text-zinc-500">
            {statusFilter || dateFilter !== 'all' || search
              ? 'Try adjusting your filters'
              : 'New requests will appear here automatically'}
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-zinc-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    Model
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    District
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {requests.map((req) => {
                  const isStale = req.status === 'pending' && isOlderThan30Min(req.createdAt);
                  return (
                    <tr
                      key={req.id}
                      className={`transition-colors ${
                        isStale
                          ? 'bg-red-500/5 hover:bg-red-500/10'
                          : 'hover:bg-zinc-800/50'
                      }`}
                    >
                      <td className="px-4 py-3 text-zinc-300 whitespace-nowrap">
                        <div className="text-sm">{formatTime(req.date)}</div>
                        <div className="text-xs text-zinc-500">{formatDate(req.date)}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-zinc-200 font-medium">{req.clientName}</div>
                        <div className="text-xs text-zinc-500">{req.clientPhone}</div>
                      </td>
                      <td className="px-4 py-3 text-zinc-300 whitespace-nowrap">
                        {modelName(req.modelId)}
                      </td>
                      <td className="px-4 py-3 text-zinc-300 whitespace-nowrap">
                        {formatDuration(req.duration)}
                      </td>
                      <td className="px-4 py-3 text-zinc-300 whitespace-nowrap">
                        {districtName(req.districtId)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <TypeBadge type={req.callType} />
                      </td>
                      <td className="px-4 py-3 text-right text-zinc-200 font-medium whitespace-nowrap">
                        {req.currency} {req.grandTotal.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <StatusBadge status={req.status} />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {req.status === 'pending' && (
                            <button
                              onClick={() => handleConfirm(req.id)}
                              disabled={actionLoading}
                              title="Confirm"
                              className="p-1.5 rounded-md text-emerald-400 hover:bg-emerald-500/10 transition-colors disabled:opacity-50"
                            >
                              <CheckCircle size={15} />
                            </button>
                          )}
                          <button
                            onClick={() => openDrawer(req)}
                            title="View Details"
                            className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/50 transition-colors"
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            onClick={() => {
                              openDrawer(req);
                              setTimeout(() => {
                                const el = document.getElementById('drawer-notes');
                                if (el) el.focus();
                              }, 300);
                            }}
                            title="Add Note"
                            className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/50 transition-colors"
                          >
                            <StickyNote size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {meta.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-zinc-500">
                Showing {(page - 1) * meta.limit + 1}–{Math.min(page * meta.limit, meta.total)} of{' '}
                {meta.total}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-sm text-zinc-400">
                  Page {page} of {meta.totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                  disabled={page >= meta.totalPages}
                  className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ───── Drawer Backdrop + Panel ───── */}
      {drawerOpen && selectedRequest && (
        <>
          {/* backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={closeDrawer}
          />

          {/* drawer panel */}
          <div className="fixed right-0 top-0 h-full w-full max-w-[500px] bg-zinc-900 border-l border-zinc-800 shadow-2xl z-50 flex flex-col overflow-hidden">
            {/* header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
              <h2 className="text-lg font-semibold text-zinc-100">Booking Details</h2>
              <button
                onClick={closeDrawer}
                className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/50 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* scrollable content */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
              {/* Client Info */}
              <section>
                <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
                  Client Information
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">Name</span>
                    <span className="text-zinc-200">{selectedRequest.clientName}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">Email</span>
                    <span className="text-zinc-200">{selectedRequest.clientEmail}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">Phone</span>
                    <span className="text-zinc-200">{selectedRequest.clientPhone}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">Preferred Contact</span>
                    <span className="text-zinc-200 capitalize">{selectedRequest.preferredContact}</span>
                  </div>
                  {selectedRequest.clientTelegramId && (
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-500">Telegram</span>
                      <span className="text-zinc-200">@{selectedRequest.clientTelegramId}</span>
                    </div>
                  )}
                </div>
              </section>

              {/* Booking Details */}
              <section>
                <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
                  Booking Details
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">Date &amp; Time</span>
                    <span className="text-zinc-200">{formatDateTime(selectedRequest.date)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">Duration</span>
                    <span className="text-zinc-200">{formatDuration(selectedRequest.duration)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">Model</span>
                    <span className="text-zinc-200">{modelName(selectedRequest.modelId)}</span>
                  </div>
                  {selectedRequest.model2Id && (
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-500">Model 2</span>
                      <span className="text-zinc-200">{modelName(selectedRequest.model2Id)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">Type</span>
                    <TypeBadge type={selectedRequest.callType} />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">District</span>
                    <span className="text-zinc-200">{districtName(selectedRequest.districtId)}</span>
                  </div>
                  {selectedRequest.address && (
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-500">Address</span>
                      <span className="text-zinc-200 text-right max-w-[200px]">{selectedRequest.address}</span>
                    </div>
                  )}
                  {selectedRequest.hotelName && (
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-500">Hotel</span>
                      <span className="text-zinc-200">
                        {selectedRequest.hotelName}
                        {selectedRequest.roomNumber ? `, Room ${selectedRequest.roomNumber}` : ''}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">Status</span>
                    <StatusBadge status={selectedRequest.status} />
                  </div>
                  {selectedRequest.confirmedAt && (
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-500">Confirmed At</span>
                      <span className="text-zinc-200">{formatDateTime(selectedRequest.confirmedAt)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">Source</span>
                    <span className="text-zinc-200 capitalize">{selectedRequest.source}</span>
                  </div>
                  {selectedRequest.occasion && (
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-500">Occasion</span>
                      <span className="text-zinc-200">{selectedRequest.occasion}</span>
                    </div>
                  )}
                  {selectedRequest.restaurantNeeded && (
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-500">Restaurant</span>
                      <span className="text-zinc-200">Required</span>
                    </div>
                  )}
                  {selectedRequest.transportNeeded && (
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-500">Transport</span>
                      <span className="text-zinc-200">Required</span>
                    </div>
                  )}
                </div>
              </section>

              {/* Pricing */}
              <section>
                <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
                  Pricing Breakdown
                </h3>
                <div className="space-y-2 bg-zinc-800/50 rounded-lg p-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Base Price</span>
                    <span className="text-zinc-200">
                      {selectedRequest.currency} {selectedRequest.basePrice.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Extras</span>
                    <span className="text-zinc-200">
                      {selectedRequest.currency} {selectedRequest.extrasTotal.toLocaleString()}
                    </span>
                  </div>
                  <div className="border-t border-zinc-700 pt-2 flex justify-between text-sm font-semibold">
                    <span className="text-zinc-300">Grand Total</span>
                    <span className="text-zinc-100">
                      {selectedRequest.currency} {selectedRequest.grandTotal.toLocaleString()}
                    </span>
                  </div>
                </div>
              </section>

              {/* Extras / Requests */}
              {(selectedRequest.selectedExtras.length > 0 || selectedRequest.specialRequests) && (
                <section>
                  <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
                    Extras &amp; Requests
                  </h3>
                  {selectedRequest.selectedExtras.length > 0 && (
                    <div className="space-y-1 mb-3">
                      {selectedRequest.selectedExtras.map((extra, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span className="text-zinc-400">{extra.name || extra.serviceId}</span>
                          <span className="text-zinc-300">
                            {selectedRequest.currency} {extra.price.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  {selectedRequest.specialRequests && (
                    <p className="text-sm text-zinc-400 bg-zinc-800/50 rounded-lg p-3 italic">
                      {selectedRequest.specialRequests}
                    </p>
                  )}
                </section>
              )}

              {/* Reception Notes */}
              <section>
                <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
                  Reception Notes
                </h3>
                <textarea
                  id="drawer-notes"
                  value={drawerNotes}
                  onChange={(e) => setDrawerNotes(e.target.value)}
                  rows={4}
                  placeholder="Add internal notes..."
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-300 placeholder-zinc-500 resize-none focus:outline-none focus:ring-1 focus:ring-zinc-600"
                />
                <button
                  onClick={saveNotes}
                  disabled={noteSaving}
                  className="mt-2 px-4 py-1.5 text-sm bg-zinc-700 hover:bg-zinc-600 text-zinc-200 rounded-lg disabled:opacity-50 transition-colors"
                >
                  {noteSaving ? 'Saving...' : 'Save Notes'}
                </button>
              </section>

              {/* Client History */}
              <section>
                <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
                  Client History
                </h3>
                {historyLoading ? (
                  <p className="text-sm text-zinc-500">Loading history...</p>
                ) : clientHistory.length === 0 ? (
                  <p className="text-sm text-zinc-500">No previous bookings found</p>
                ) : (
                  <div className="space-y-2">
                    {clientHistory.map((h) => (
                      <div
                        key={h.id}
                        className="flex items-center justify-between bg-zinc-800/50 rounded-lg px-3 py-2"
                      >
                        <div>
                          <div className="text-sm text-zinc-300">{formatDate(h.date)}</div>
                          <div className="text-xs text-zinc-500">
                            {modelName(h.modelId)} · {formatDuration(h.duration)}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-zinc-300">
                            {h.currency} {h.grandTotal.toLocaleString()}
                          </span>
                          <StatusBadge status={h.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>

            {/* Action Buttons */}
            <div className="border-t border-zinc-800 px-6 py-4">
              <div className="flex flex-wrap gap-2">
                {selectedRequest.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleConfirm(selectedRequest.id)}
                      disabled={actionLoading}
                      className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors disabled:opacity-50"
                    >
                      <CheckCircle size={14} />
                      {actionLoading ? 'Confirming...' : 'Confirm'}
                    </button>
                    <button
                      onClick={() => openRejectModal(selectedRequest.id)}
                      disabled={actionLoading}
                      className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <X size={14} />
                      Reject
                    </button>
                  </>
                )}
                <a
                  href={`https://wa.me/${cleanPhone(selectedRequest.clientPhone)}?text=Hello ${encodeURIComponent(selectedRequest.clientName)}, regarding your booking request with Virel...`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-green-600/20 hover:bg-green-600/30 text-green-400 rounded-lg transition-colors"
                >
                  <MessageCircle size={14} />
                  WhatsApp
                </a>
                {selectedRequest.clientTelegramId ? (
                  <a
                    href={`https://t.me/${selectedRequest.clientTelegramId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg transition-colors"
                  >
                    <Send size={14} />
                    Telegram
                  </a>
                ) : (
                  <button
                    disabled
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-zinc-800 text-zinc-600 rounded-lg cursor-not-allowed"
                  >
                    <Send size={14} />
                    Telegram
                  </button>
                )}
                <a
                  href={`tel:${selectedRequest.clientPhone}`}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-zinc-700 hover:bg-zinc-600 text-zinc-200 rounded-lg transition-colors"
                >
                  <Phone size={14} />
                  Call
                </a>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ───── Reject Modal ───── */}
      {rejectModalOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/60 z-[60]"
            onClick={() => setRejectModalOpen(false)}
          />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl z-[70] p-6">
            <h3 className="text-lg font-semibold text-zinc-100 mb-4">Reject Booking</h3>
            <p className="text-sm text-zinc-400 mb-4">
              Are you sure you want to reject this booking? You can optionally provide a reason.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              placeholder="Reason for rejection (optional)"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-300 placeholder-zinc-500 resize-none focus:outline-none focus:ring-1 focus:ring-zinc-600 mb-4"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setRejectModalOpen(false)}
                className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 bg-zinc-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading}
                className="px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {actionLoading ? 'Rejecting...' : 'Reject Booking'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ───── Toast Notifications ───── */}
      <div className="fixed top-4 right-4 z-[100] space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium animate-in slide-in-from-right ${
              toast.type === 'success'
                ? 'bg-emerald-600 text-white'
                : toast.type === 'error'
                  ? 'bg-red-600 text-white'
                  : 'bg-zinc-700 text-zinc-100'
            }`}
          >
            {toast.type === 'success' && <CheckCircle size={14} />}
            {toast.type === 'error' && <AlertCircle size={14} />}
            {toast.message}
            <button
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              className="ml-2 opacity-70 hover:opacity-100"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
