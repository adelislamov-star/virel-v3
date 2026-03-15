// MODELS LIST PAGE
'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const statusStyles: Record<string, string> = {
  draft: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  vacation: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  archived: 'bg-red-500/10 text-red-400 border-red-500/20',
};

const STATUS_FILTERS = ['All', 'Active', 'Vacation', 'Archived', 'Draft'] as const;
type StatusFilter = typeof STATUS_FILTERS[number];

type SortField = 'name' | 'rateAsc' | 'rateDesc' | 'views' | 'updated';
const SORT_OPTIONS: { value: SortField; label: string }[] = [
  { value: 'name', label: 'Name' },
  { value: 'rateAsc', label: 'Rate (low to high)' },
  { value: 'rateDesc', label: 'Rate (high to low)' },
  { value: 'views', label: 'Views' },
  { value: 'updated', label: 'Last Updated' },
];

function mapFilterToStatus(filter: StatusFilter): string | null {
  switch (filter) {
    case 'All': return null;
    case 'Active': return 'active';
    case 'Vacation': return 'vacation';
    case 'Archived': return 'archived';
    case 'Draft': return 'draft';
  }
}

export default function ModelsPage() {
  const router = useRouter();
  const [models, setModels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [sortBy, setSortBy] = useState<SortField>('name');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState('');

  useEffect(() => { loadModels(); }, []);

  async function loadModels() {
    try {
      const res = await fetch('/api/v1/models?all=true');
      if (!res.ok) {
        console.error('Models API returned', res.status);
        setLoadError(res.status === 401 ? 'Not authenticated. Please log in.' : `API error ${res.status}`);
        setLoading(false);
        return;
      }
      const data = await res.json();
      if (!data.success) {
        setLoadError(data.error?.message || 'Failed to load models');
        setLoading(false);
        return;
      }
      setModels(data.data?.models || []);
      setLoading(false);
    } catch (error: any) {
      console.error('Failed to load models:', error);
      setLoadError(error.message || 'Network error');
      setLoading(false);
    }
  }

  const filteredModels = useMemo(() => {
    let result = [...models];

    // Filter
    const status = mapFilterToStatus(statusFilter);
    if (status) {
      result = result.filter(m => m.status === status);
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'name': return (a.name || '').localeCompare(b.name || '');
        case 'rateAsc': return (a.ratingInternal ?? 0) - (b.ratingInternal ?? 0);
        case 'rateDesc': return (b.ratingInternal ?? 0) - (a.ratingInternal ?? 0);
        case 'views': return (b.viewsTotal ?? 0) - (a.viewsTotal ?? 0);
        case 'updated': return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime();
        default: return 0;
      }
    });

    return result;
  }, [models, statusFilter, sortBy]);

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === filteredModels.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filteredModels.map(m => m.id)));
    }
  }

  async function handleBulkAction() {
    if (!bulkAction || selected.size === 0) return;

    const ids = Array.from(selected);
    for (const id of ids) {
      try {
        await fetch(`/api/v1/models/${id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ newStatus: bulkAction }),
        });
      } catch {}
    }

    setSelected(new Set());
    setBulkAction('');
    loadModels();
  }

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">Models</h1>
          <p className="text-sm text-zinc-500 mt-1">Loading...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
          {[...Array(6)].map((_, i) => <div key={i} className="h-40 bg-zinc-800/30 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">Models</h1>
        </div>
        <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-8 text-center">
          <p className="text-red-400 font-medium mb-2">{loadError}</p>
          <button onClick={() => { setLoadError(null); setLoading(true); loadModels(); }} className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">Models</h1>
          <p className="text-sm text-zinc-500 mt-1">{filteredModels.length} of {models.length} models</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => router.push('/admin/quick-upload')}
            className="px-4 py-2 rounded-lg border border-zinc-700 hover:border-zinc-600 text-zinc-300 hover:text-zinc-100 text-sm font-medium transition-colors duration-150"
          >
            Quick Upload
          </button>
          <Link href="/admin/models/new"
            className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-900 text-sm font-medium transition-colors duration-150"
          >
            + Add Model
          </Link>
        </div>
      </div>

      {/* Filter chips + Sort */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1.5">
          {STATUS_FILTERS.map(filter => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                statusFilter === filter
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-600 hover:text-zinc-300'
              }`}
            >
              {filter}
              {filter !== 'All' && (
                <span className="ml-1 opacity-60">
                  {models.filter(m => m.status === mapFilterToStatus(filter)).length}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <label className="text-xs text-zinc-500">Sort:</label>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as SortField)}
            className="rounded-md border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-xs text-zinc-200 focus:outline-none"
          >
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {/* Bulk actions bar */}
      {selected.size > 0 && (
        <div className="mb-4 flex items-center gap-3 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-2.5">
          <span className="text-sm text-amber-400 font-medium">{selected.size} selected</span>
          <select
            value={bulkAction}
            onChange={e => setBulkAction(e.target.value)}
            className="rounded-md border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs text-zinc-200"
          >
            <option value="">Change status to...</option>
            <option value="active">Active</option>
            <option value="vacation">Vacation</option>
            <option value="archived">Archived</option>
            <option value="draft">Draft</option>
          </select>
          <button
            onClick={handleBulkAction}
            disabled={!bulkAction}
            className="rounded-md bg-amber-500 px-3 py-1 text-xs font-medium text-zinc-900 disabled:opacity-40 hover:bg-amber-400 transition-colors"
          >
            Apply
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="ml-auto text-xs text-zinc-400 hover:text-zinc-200"
          >
            Clear selection
          </button>
        </div>
      )}

      {/* Select all checkbox */}
      {filteredModels.length > 0 && (
        <div className="mb-3 flex items-center gap-2">
          <input
            type="checkbox"
            checked={selected.size === filteredModels.length && filteredModels.length > 0}
            onChange={toggleSelectAll}
            className="accent-amber-500 cursor-pointer"
          />
          <span className="text-xs text-zinc-500">Select all</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredModels.map(model => (
          <div
            key={model.id}
            className={`rounded-xl border bg-zinc-900/50 p-5 hover:bg-zinc-800/30 transition-colors duration-100 ${
              selected.has(model.id) ? 'border-amber-500/40' : 'border-zinc-800/50'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={selected.has(model.id)}
                  onChange={() => toggleSelect(model.id)}
                  className="mt-1.5 accent-amber-500 cursor-pointer"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg text-zinc-100 truncate">{model.name}</h3>
                  <p className="text-xs text-zinc-500">{model.publicCode}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${statusStyles[model.status] || statusStyles.draft}`}>
                  {model.status}
                </span>
              </div>

              {/* Performance Stats */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-zinc-800/50 rounded-lg py-2">
                  <div className="text-xs text-zinc-500">Views</div>
                  <div className="text-sm font-semibold text-zinc-200">{model.viewsTotal ?? 0}</div>
                  {(model.viewsToday ?? 0) > 0 && (
                    <div className="text-[10px] text-emerald-400">+{model.viewsToday} today</div>
                  )}
                </div>
                <div className="bg-zinc-800/50 rounded-lg py-2">
                  <div className="text-xs text-zinc-500">Bookings</div>
                  <div className="text-sm font-semibold text-zinc-200">{model.bookingsTotal ?? model._count?.bookings ?? 0}</div>
                </div>
                <div className="bg-zinc-800/50 rounded-lg py-2">
                  <div className="text-xs text-zinc-500">Conv.</div>
                  <div className="text-sm font-semibold text-zinc-200">
                    {(model.viewsTotal ?? 0) > 0 && (model.bookingsCompleted ?? 0) > 0
                      ? `${Math.round(((model.bookingsCompleted ?? 0) / (model.viewsTotal ?? 1)) * 100)}%`
                      : '—'}
                  </div>
                </div>
              </div>

              {/* Last updated */}
              <div className="flex items-center justify-between text-xs text-zinc-500">
                {model.ratingInternal && (
                  <span>Rating: <span className="font-semibold text-zinc-300">{model.ratingInternal}/5</span></span>
                )}
                {model.updatedAt && (
                  <span>Updated {new Date(model.updatedAt).toLocaleDateString()}</span>
                )}
              </div>

              <button
                onClick={() => window.location.href = `/admin/models/${model.id}`}
                className="w-full px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-900 text-sm font-medium transition-colors duration-150"
              >
                Edit Profile
              </button>
            </div>
          </div>
        ))}

        {filteredModels.length === 0 && (
          <div className="col-span-full rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-8 text-center">
            <p className="text-zinc-500">No models found{statusFilter !== 'All' ? ` with status "${statusFilter}"` : ''}</p>
          </div>
        )}
      </div>

    </div>
  );
}
