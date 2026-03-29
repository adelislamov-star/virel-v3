'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Star, Pencil, Sparkles, Trash2, Plus, X, ChevronUp, ChevronDown } from 'lucide-react';

interface Service {
  id: string;
  title: string;
  name: string | null;
  publicName: string | null;
  slug: string;
  category: string;
  description: string | null;
  isPublic: boolean;
  isPopular: boolean;
  isActive: boolean;
  status: string;
  sortOrder: number;
  defaultExtraPrice: number | null;
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string | null;
  introText: string | null;
  fullDescription: string | null;
  _count?: { models: number };
}

interface ServiceStats {
  total: number;
  public: number;
  membersOnly: number;
  active: number;
}

type ModalData = Partial<Service> & { _isNew?: boolean };

const CATEGORY_STYLE = 'bg-zinc-500/10 text-zinc-300 border-zinc-500/20';

function toSlug(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error' | 'loading'; onClose: () => void }) {
  useEffect(() => {
    if (type !== 'loading') {
      const t = setTimeout(onClose, 3000);
      return () => clearTimeout(t);
    }
  }, [type, onClose]);
  const bg = type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
    : type === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-400'
    : 'bg-blue-500/10 border-blue-500/30 text-blue-400';
  return (
    <div className={`fixed top-4 right-4 z-[100] px-4 py-3 rounded-lg border text-sm ${bg} flex items-center gap-2`}>
      {type === 'loading' && <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />}
      {message}
    </div>
  );
}

export default function ServicesPage() {
  const [items, setItems] = useState<Service[]>([]);
  const [stats, setStats] = useState<ServiceStats>({ total: 0, public: 0, membersOnly: 0, active: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [visFilter, setVisFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modal, setModal] = useState<ModalData | null>(null);
  const [modalTab, setModalTab] = useState<'basic' | 'seo'>('basic');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'loading' } | null>(null);
  const [slugManual, setSlugManual] = useState(false);
  const [seoGenerating, setSeoGenerating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Service | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'loading') => {
    setToast({ message, type });
  }, []);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch('/api/v1/services');
      const json = await res.json();
      if (json.success) {
        setItems(json.services);
        if (json.stats) setStats(json.stats);
      } else {
        setError(json.error?.message || 'Failed to load services');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSearch = (val: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setSearch(val), 300);
  };

  // Filter
  const filtered = items.filter((s) => {
    if (search) {
      const q = search.toLowerCase();
      if (!(s.title?.toLowerCase().includes(q) || s.name?.toLowerCase().includes(q) || s.publicName?.toLowerCase().includes(q))) return false;
    }
    if (catFilter && s.category?.toLowerCase() !== catFilter.toLowerCase()) return false;
    if (visFilter === 'public' && !s.isPublic) return false;
    if (visFilter === 'members' && s.isPublic) return false;
    if (statusFilter === 'active' && !s.isActive) return false;
    if (statusFilter === 'inactive' && s.isActive) return false;
    return true;
  }).sort((a, b) => {
    const catA = a.category?.toLowerCase() ?? '';
    const catB = b.category?.toLowerCase() ?? '';
    if (catA !== catB) return catA.localeCompare(catB);
    if (catFilter) return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
    return (a.title ?? '').localeCompare(b.title ?? '', 'en', { sensitivity: 'base' });
  });

  // Stats from API
  const totalCount = stats.total;
  const publicCount = stats.public;
  const membersCount = stats.membersOnly;
  const activeCount = stats.active;

  // Categories for filter dropdown
  const categories = [...new Set(items.map((s) => s.category).filter(Boolean))].sort();

  // Toggle visibility
  const toggleVisibility = async (service: Service) => {
    try {
      const res = await fetch(`/api/v1/services/${service.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublic: !service.isPublic }),
      });
      const json = await res.json();
      if (json.success) {
        const newVal = !service.isPublic;
        setItems((prev) =>
          prev.map((s) => s.id === service.id ? { ...s, isPublic: newVal } : s)
        );
        setStats((prev) => ({
          ...prev,
          public: newVal ? prev.public + 1 : prev.public - 1,
          membersOnly: newVal ? prev.membersOnly - 1 : prev.membersOnly + 1,
        }));
      } else {
        showToast('Failed to update visibility', 'error');
      }
    } catch {
      showToast('Failed to update visibility', 'error');
    }
  };

  // Move service up/down within category
  const moveService = async (service: Service, direction: 'up' | 'down') => {
    const categoryItems = items
      .filter(s => s.category === service.category)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    const idx = categoryItems.findIndex(s => s.id === service.id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= categoryItems.length) return;
    const swapWith = categoryItems[swapIdx];
    const newOrder = service.sortOrder ?? 0;
    const swapOrder = swapWith.sortOrder ?? 0;
    try {
      await Promise.all([
        fetch(`/api/v1/services/${service.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sortOrder: swapOrder }),
        }),
        fetch(`/api/v1/services/${swapWith.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sortOrder: newOrder }),
        }),
      ]);
      setItems(prev => prev.map(s => {
        if (s.id === service.id) return { ...s, sortOrder: swapOrder };
        if (s.id === swapWith.id) return { ...s, sortOrder: newOrder };
        return s;
      }));
    } catch {
      showToast('Failed to reorder', 'error');
    }
  };

  // Toggle active status
  const toggleActive = async (service: Service) => {
    try {
      const res = await fetch(`/api/v1/services/${service.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !service.isActive }),
      });
      const json = await res.json();
      if (json.success) {
        const newVal = !service.isActive;
        setItems((prev) => prev.map((s) => s.id === service.id ? { ...s, isActive: newVal } : s));
        setStats((prev) => ({
          ...prev,
          active: newVal ? prev.active + 1 : prev.active - 1,
        }));
      }
    } catch {
      showToast('Failed to update status', 'error');
    }
  };

  // Save modal
  const handleSave = async () => {
    if (!modal) return;
    if (!modal.title?.trim()) { showToast('Title is required', 'error'); return; }

    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        title: modal.title?.trim(),
        slug: modal.slug || toSlug(modal.title || ''),
        category: modal.category || '',
        description: modal.description || null,
        publicName: modal.publicName || null,
        name: modal.name || null,
        isPublic: modal.isPublic ?? true,
        isPopular: modal.isPopular ?? false,
        isActive: modal.isActive ?? true,
        sortOrder: modal.sortOrder ?? 0,
        defaultExtraPrice: modal.defaultExtraPrice !== null && modal.defaultExtraPrice !== undefined
          ? parseFloat(String(modal.defaultExtraPrice))
          : null,
        seoTitle: modal.seoTitle || null,
        seoDescription: modal.seoDescription || null,
        seoKeywords: modal.seoKeywords || null,
        introText: modal.introText || null,
        fullDescription: modal.fullDescription || null,
      };

      const url = modal._isNew ? '/api/v1/services' : `/api/v1/services/${modal.id}`;
      const method = modal._isNew ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.success) {
        showToast('Saved successfully', 'success');
        setModal(null);
        load();
      } else {
        showToast(json.error?.message || 'Save failed', 'error');
      }
    } catch {
      showToast('Something went wrong', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Delete
  const handleDelete = async (service: Service) => {
    try {
      const res = await fetch(`/api/v1/services/${service.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (res.status === 409) {
        showToast(json.error?.message || 'Cannot delete: service is assigned to models', 'error');
      } else if (json.success) {
        showToast('Deleted successfully', 'success');
        setItems((prev) => prev.filter((s) => s.id !== service.id));
        setStats((prev) => ({
          ...prev,
          total: prev.total - 1,
          public: service.isPublic ? prev.public - 1 : prev.public,
          membersOnly: !service.isPublic ? prev.membersOnly - 1 : prev.membersOnly,
          active: service.isActive ? prev.active - 1 : prev.active,
        }));
      } else {
        showToast(json.error?.message || 'Delete failed', 'error');
      }
    } catch {
      showToast('Something went wrong', 'error');
    }
    setConfirmDelete(null);
  };

  // Generate SEO for all services without SEO content
  const handleGenerateAll = async () => {
    const noSeo = items.filter(s => !s.seoTitle)
    if (noSeo.length === 0) {
      showToast('All services already have SEO content', 'success')
      return
    }
    if (!confirm(`Generate SEO for ${noSeo.length} services? Takes ~${Math.ceil(noSeo.length * 1.5 / 60)} minutes.`)) return

    showToast(`Generating SEO for ${noSeo.length} services...`, 'loading')
    let success = 0
    let failed = 0

    for (const service of noSeo) {
      try {
        const res = await fetch(`/api/v1/services/${service.id}/generate-seo`, { method: 'POST' })
        const json = await res.json()
        if (json.success) success++
        else failed++
      } catch {
        failed++
      }
      await new Promise(r => setTimeout(r, 1500))
    }

    showToast(`Done: ${success} generated, ${failed} failed`, success > 0 ? 'success' : 'error')
    load()
  }

  // Generate SEO
  const handleGenerateSeo = async (serviceId?: string) => {
    if (!serviceId) {
      showToast('Save first to generate SEO', 'error');
      return;
    }
    setSeoGenerating(true);
    showToast('Generating...', 'loading');
    try {
      const res = await fetch(`/api/v1/services/${serviceId}/generate-seo`, { method: 'POST' });
      if (res.status === 503) {
        showToast('AI not configured. Please add ANTHROPIC_API_KEY.', 'error');
        return;
      }
      const json = await res.json();
      if (json.success) {
        const d = json.data;
        setModal((prev) => prev ? {
          ...prev,
          seoTitle: d.seoTitle,
          seoDescription: d.seoDescription,
          seoKeywords: d.seoKeywords,
          introText: d.introText,
          fullDescription: d.fullDescription,
        } : prev);
        if (json.quality) {
          const { score, maxScore } = json.quality
          const emoji = score >= 5 ? '✅' : score >= 3 ? '⚠️' : '❌'
          showToast(`${emoji} SEO generated — Quality: ${score}/${maxScore}`, score >= 4 ? 'success' : 'error')
        } else {
          showToast('SEO generated successfully', 'success')
        }
      } else {
        showToast(json.error?.message || 'Generation failed', 'error');
      }
    } catch {
      showToast('Something went wrong', 'error');
    } finally {
      setSeoGenerating(false);
    }
  };

  const openEdit = async (service: Service) => {
    // Fetch full service data
    try {
      const res = await fetch(`/api/v1/services/${service.id}`);
      const json = await res.json();
      if (json.success) {
        setModal(json.data);
        setModalTab('basic');
        setSlugManual(false);
      }
    } catch {
      setModal({ ...service });
      setModalTab('basic');
      setSlugManual(false);
    }
  };

  const openAdd = () => {
    setModal({
      _isNew: true,
      title: '',
      name: null,
      publicName: null,
      slug: '',
      category: '',
      description: null,
      isPublic: true,
      isPopular: false,
      isActive: true,
      sortOrder: 0,
      defaultExtraPrice: null,
      seoTitle: null,
      seoDescription: null,
      seoKeywords: null,
      introText: null,
      fullDescription: null,
    });
    setModalTab('basic');
    setSlugManual(false);
  };

  const updateModal = (field: string, value: unknown) => {
    setModal((prev) => {
      if (!prev) return prev;
      const next = { ...prev, [field]: value };
      if (field === 'title' && !slugManual) {
        next.slug = toSlug(value as string);
      }
      return next;
    });
  };

  return (
    <div className="p-6 space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Services</h1>
          <p className="text-sm text-zinc-500 mt-1">Manage service catalogue</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleGenerateAll}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Sparkles size={16} />
            Generate All SEO
          </button>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={16} /> Add Service
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Services', value: totalCount, color: 'text-white' },
          { label: 'Public', value: publicCount, color: 'text-emerald-400' },
          { label: 'Members Only', value: membersCount, color: 'text-yellow-400' },
          { label: 'Active', value: activeCount, color: 'text-blue-400' },
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
          placeholder="Search by name..."
          onChange={(e) => handleSearch(e.target.value)}
          className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 w-64 focus:outline-none focus:border-zinc-500"
        />
        <select
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
          className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select
          value={visFilter}
          onChange={(e) => setVisFilter(e.target.value)}
          className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200"
        >
          <option value="">All Visibility</option>
          <option value="public">Public</option>
          <option value="members">Members Only</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
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
                <th className="px-4 py-3 font-medium w-8">#</th>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Public Name</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Visibility</th>
                <th className="px-4 py-3 font-medium w-16">Models</th>
                <th className="px-4 py-3 font-medium w-12">Popular</th>
                <th className="px-4 py-3 font-medium w-20">Extra</th>
                <th className="px-4 py-3 font-medium w-16">Active</th>
                <th className="px-4 py-3 font-medium w-28">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={10} className="px-4 py-12 text-center text-zinc-500">Loading...</td></tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={10} className="px-4 py-12 text-center text-zinc-500">No services found</td></tr>
              )}
              {!loading && filtered.map((item, idx) => (
                <tr key={item.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/50 transition-colors">
                  <td className="px-4 py-3 text-zinc-500">{idx + 1}</td>
                  <td className="px-4 py-3 text-zinc-200 font-medium">{item.title}</td>
                  <td className="px-4 py-3 text-zinc-400">{item.publicName || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs border ${CATEGORY_STYLE}`}>
                      {item.category}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleVisibility(item)}
                      className={`inline-block px-2 py-0.5 rounded-full text-xs border transition-opacity hover:opacity-70 cursor-pointer ${item.isPublic ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'}`}
                      title="Click to toggle visibility"
                    >
                      {item.isPublic ? 'Public' : 'Members Only'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-zinc-400">{item._count?.models ?? 0}</td>
                  <td className="px-4 py-3 text-center">
                    {item.isPopular && <Star size={14} className="text-amber-400 fill-amber-400 inline" />}
                  </td>
                  <td className="px-4 py-3">
                    {catFilter ? (
                      <div className="flex flex-col gap-0.5">
                        <button
                          onClick={() => moveService(item, 'up')}
                          className="p-0.5 rounded hover:bg-zinc-700 text-zinc-500 hover:text-zinc-200 transition-colors"
                          title="Move up"
                        >
                          <ChevronUp size={14} />
                        </button>
                        <button
                          onClick={() => moveService(item, 'down')}
                          className="p-0.5 rounded hover:bg-zinc-700 text-zinc-500 hover:text-zinc-200 transition-colors"
                          title="Move down"
                        >
                          <ChevronDown size={14} />
                        </button>
                      </div>
                    ) : (
                      <span className="text-zinc-600 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {item.defaultExtraPrice != null ? (
                      <span className="text-xs text-amber-400 font-medium">+£{item.defaultExtraPrice}</span>
                    ) : (
                      <span className="text-zinc-600 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActive(item)}
                      className={`relative w-9 h-5 rounded-full transition-colors ${item.isActive ? 'bg-emerald-500' : 'bg-zinc-600'}`}
                    >
                      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${item.isActive ? 'left-[18px]' : 'left-0.5'}`} />
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(item)} className="p-1.5 rounded hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors" title="Edit">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => handleGenerateSeo(item.id)} className="p-1.5 rounded hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors" title="Generate SEO">
                        <Sparkles size={14} />
                      </button>
                      <button onClick={() => setConfirmDelete(item)} className="p-1.5 rounded hover:bg-zinc-700 text-zinc-400 hover:text-red-400 transition-colors" title="Delete">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirm */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setConfirmDelete(null)}>
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 max-w-sm w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-white font-semibold mb-2">Delete service</h3>
            <p className="text-zinc-400 text-sm mb-4">Delete service &quot;{confirmDelete.title}&quot;? This cannot be undone.</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirmDelete(null)} className="px-3 py-1.5 text-sm rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700">Cancel</button>
              <button onClick={() => handleDelete(confirmDelete)} className="px-3 py-1.5 text-sm rounded-lg bg-red-600 text-white hover:bg-red-500">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Add/Edit */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setModal(null)}>
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
              <h2 className="text-lg font-semibold text-white">{modal._isNew ? 'Add Service' : 'Edit Service'}</h2>
              <button onClick={() => setModal(null)} className="text-zinc-400 hover:text-zinc-200"><X size={18} /></button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-zinc-800">
              <button
                onClick={() => setModalTab('basic')}
                className={`px-6 py-3 text-sm font-medium transition-colors ${modalTab === 'basic' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-zinc-400 hover:text-zinc-200'}`}
              >Basic</button>
              <button
                onClick={() => setModalTab('seo')}
                className={`px-6 py-3 text-sm font-medium transition-colors ${modalTab === 'seo' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-zinc-400 hover:text-zinc-200'}`}
              >SEO</button>
            </div>

            <div className="p-6 space-y-4">
              {modalTab === 'basic' && (
                <>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Title *</label>
                    <input
                      type="text"
                      value={modal.title || ''}
                      onChange={(e) => updateModal('title', e.target.value)}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-zinc-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Public Name</label>
                    <input
                      type="text"
                      value={modal.publicName || ''}
                      onChange={(e) => updateModal('publicName', e.target.value)}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-zinc-500"
                      placeholder="Elegant name for the front site"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Slug</label>
                    <input
                      type="text"
                      value={modal.slug || ''}
                      onChange={(e) => { setSlugManual(true); updateModal('slug', e.target.value); }}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-zinc-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Category</label>
                    <select
                      value={modal.category || ''}
                      onChange={(e) => updateModal('category', e.target.value)}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200"
                    >
                      <option value="">— select category —</option>
                      {categories.map((c) => (
                        <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Description</label>
                    <textarea
                      value={modal.description || ''}
                      onChange={(e) => updateModal('description', e.target.value)}
                      rows={3}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-zinc-500 resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
                      <button
                        onClick={() => updateModal('isPublic', !modal.isPublic)}
                        className={`relative w-9 h-5 rounded-full transition-colors ${modal.isPublic ? 'bg-emerald-500' : 'bg-zinc-600'}`}
                      >
                        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${modal.isPublic ? 'left-[18px]' : 'left-0.5'}`} />
                      </button>
                      Public
                    </label>
                    <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
                      <button
                        onClick={() => updateModal('isPopular', !modal.isPopular)}
                        className={`relative w-9 h-5 rounded-full transition-colors ${modal.isPopular ? 'bg-emerald-500' : 'bg-zinc-600'}`}
                      >
                        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${modal.isPopular ? 'left-[18px]' : 'left-0.5'}`} />
                      </button>
                      Popular
                    </label>
                    <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
                      <button
                        onClick={() => updateModal('isActive', !modal.isActive)}
                        className={`relative w-9 h-5 rounded-full transition-colors ${modal.isActive ? 'bg-emerald-500' : 'bg-zinc-600'}`}
                      >
                        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${modal.isActive ? 'left-[18px]' : 'left-0.5'}`} />
                      </button>
                      Active
                    </label>
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Sort Order</label>
                    <input
                      type="number"
                      value={modal.sortOrder ?? 0}
                      onChange={(e) => updateModal('sortOrder', parseInt(e.target.value) || 0)}
                      className="w-32 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-zinc-500"
                    />
                  </div>
                  {/* Extra Cost */}
                  <div className="border border-zinc-700/60 rounded-xl p-4 bg-zinc-800/30 space-y-3">
                    <label className="flex items-center gap-3 text-sm text-zinc-300 cursor-pointer">
                      <button
                        type="button"
                        onClick={() => updateModal('defaultExtraPrice', modal.defaultExtraPrice != null ? null : 0)}
                        className={`relative w-9 h-5 rounded-full transition-colors ${modal.defaultExtraPrice != null ? 'bg-emerald-500' : 'bg-zinc-600'}`}
                      >
                        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${modal.defaultExtraPrice != null ? 'left-[18px]' : 'left-0.5'}`} />
                      </button>
                      <span className="font-medium">Extra Cost</span>
                      <span className="text-zinc-500 text-xs">(additional charge for this service)</span>
                    </label>
                    {modal.defaultExtraPrice != null && (
                      <div className="flex items-center gap-2 pl-11">
                        <span className="text-zinc-400 text-sm">£</span>
                        <input
                          type="number"
                          min="0"
                          step="10"
                          value={modal.defaultExtraPrice ?? 0}
                          onChange={(e) => updateModal('defaultExtraPrice', parseFloat(e.target.value) || 0)}
                          className="w-36 bg-zinc-800 border border-amber-500/40 rounded-lg px-3 py-2 text-sm text-amber-400 font-medium focus:outline-none focus:border-amber-500"
                        />
                        <span className="text-zinc-500 text-xs">default extra per booking</span>
                      </div>
                    )}
                  </div>
                </>
              )}

              {modalTab === 'seo' && (
                <>
                  <div>
                    <label className="flex items-center justify-between text-xs text-zinc-400 mb-1">
                      <span>SEO Title</span>
                      <span className={(modal.seoTitle?.length ?? 0) > 60 ? 'text-red-400' : ''}>{modal.seoTitle?.length ?? 0}/60</span>
                    </label>
                    <input
                      type="text"
                      value={modal.seoTitle || ''}
                      onChange={(e) => updateModal('seoTitle', e.target.value)}
                      maxLength={60}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-zinc-500"
                    />
                  </div>
                  <div>
                    <label className="flex items-center justify-between text-xs text-zinc-400 mb-1">
                      <span>SEO Description</span>
                      <span className={(modal.seoDescription?.length ?? 0) > 155 ? 'text-red-400' : ''}>{modal.seoDescription?.length ?? 0}/155</span>
                    </label>
                    <textarea
                      value={modal.seoDescription || ''}
                      onChange={(e) => updateModal('seoDescription', e.target.value)}
                      maxLength={155}
                      rows={2}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-zinc-500 resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">SEO Keywords</label>
                    <input
                      type="text"
                      value={modal.seoKeywords || ''}
                      onChange={(e) => updateModal('seoKeywords', e.target.value)}
                      placeholder="keyword1, keyword2, keyword3"
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-zinc-500"
                    />
                  </div>
                  <div>
                    <label className="flex items-center justify-between text-xs text-zinc-400 mb-1">
                      <span>Introduction Text (80-100 words)</span>
                      <span className={
                        (() => {
                          const wc = (modal.introText || '').split(' ').filter(Boolean).length
                          return wc >= 70 && wc <= 110 ? 'text-emerald-400' : 'text-amber-400'
                        })()
                      }>
                        {(modal.introText || '').split(' ').filter(Boolean).length} words
                      </span>
                    </label>
                    <textarea
                      value={modal.introText || ''}
                      onChange={(e) => updateModal('introText', e.target.value)}
                      rows={4}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-zinc-500 resize-none"
                    />
                  </div>
                  <div>
                    <label className="flex items-center justify-between text-xs text-zinc-400 mb-1">
                      <span>Full Description (400-500 words)</span>
                      <span className={
                        (modal.fullDescription || '').split(' ').filter(Boolean).length >= 400
                          ? 'text-emerald-400' : 'text-amber-400'
                      }>
                        {(modal.fullDescription || '').split(' ').filter(Boolean).length} words
                      </span>
                    </label>
                    <textarea
                      value={modal.fullDescription || ''}
                      onChange={(e) => updateModal('fullDescription', e.target.value)}
                      rows={8}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-zinc-500 resize-none"
                    />
                  </div>
                  <button
                    onClick={() => handleGenerateSeo(modal.id)}
                    disabled={!modal.title || seoGenerating || modal._isNew}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    {seoGenerating ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Sparkles size={14} />
                    )}
                    Generate with AI
                  </button>
                  {modal._isNew && (
                    <p className="text-xs text-zinc-500">Save first to generate SEO</p>
                  )}
                  {(modal.fullDescription || modal.introText) && (
                    <div className="border border-zinc-700/40 rounded-lg p-3 bg-zinc-800/20 space-y-1.5">
                      <p className="text-[11px] text-zinc-500 uppercase tracking-wide font-medium">
                        Content Quality Check
                      </p>
                      {[
                        {
                          label: `"${modal.title} London" in text`,
                          ok: `${modal.introText || ''} ${modal.fullDescription || ''}`
                                .toLowerCase()
                                .includes(`${(modal.title || '').toLowerCase()} london`)
                        },
                        {
                          label: '"Vaurel" mentioned',
                          ok: `${modal.introText || ''} ${modal.fullDescription || ''}`
                                .toLowerCase()
                                .includes('vaurel')
                        },
                        {
                          label: 'Price reference (£300)',
                          ok: `${modal.introText || ''} ${modal.fullDescription || ''}`
                                .includes('300')
                        },
                        {
                          label: '"Discreet" or "discretion"',
                          ok: `${modal.introText || ''} ${modal.fullDescription || ''}`
                                .toLowerCase()
                                .match(/discreet|discretion/) !== null
                        },
                        {
                          label: 'Intro 70-100 words',
                          ok: (() => {
                            const wc = (modal.introText || '').split(' ').filter(Boolean).length
                            return wc >= 70 && wc <= 110
                          })()
                        },
                        {
                          label: 'Description 400+ words',
                          ok: (modal.fullDescription || '').split(' ').filter(Boolean).length >= 400
                        },
                      ].map(({ label, ok }) => (
                        <div key={label} className="flex items-center gap-2 text-xs">
                          <span className={ok ? 'text-emerald-400' : 'text-red-400'}>
                            {ok ? '✓' : '✗'}
                          </span>
                          <span className={ok ? 'text-zinc-300' : 'text-zinc-500'}>{label}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-zinc-800">
              <button onClick={() => setModal(null)} className="px-4 py-2 text-sm rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700">Cancel</button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-medium disabled:opacity-50"
              >
                {saving && <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />}
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
