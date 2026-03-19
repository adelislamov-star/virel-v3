'use client';

import { useEffect, useState, useCallback } from 'react';
import { Star, Pencil, Sparkles, Trash2, Plus, X } from 'lucide-react';

interface District {
  id: string;
  name: string;
  slug: string;
  tier: number;
  description: string | null;
  hotels: string[];
  restaurants: string[];
  landmarks: string[];
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string | null;
  aboutParagraphs: string[];
  standardTextParagraphs: string[];
  nearbyText: string | null;
  faq: { question: string; answer: string }[];
  ctaText: string | null;
  isActive: boolean;
  isPopular: boolean;
  sortOrder: number;
  modelCount: number;
}

interface TransportHub {
  id: string;
  name: string;
  slug: string;
  districtId: string;
  walkingMinutes: number;
  description: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  isActive: boolean;
}

type DistrictModal = Partial<District> & { _isNew?: boolean };
type HubModal = Partial<TransportHub> & { _isNew?: boolean };

const tierStyles: Record<number, string> = {
  1: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  2: 'bg-zinc-300/10 text-zinc-300 border-zinc-300/20',
  3: 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20',
};

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

function TagInput({ value, onChange, placeholder }: { value: string[]; onChange: (v: string[]) => void; placeholder: string }) {
  const [input, setInput] = useState('');

  const add = (val: string) => {
    const trimmed = val.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      add(input);
    }
    if (e.key === 'Backspace' && !input && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 flex flex-wrap gap-1 min-h-[38px] items-center">
      {value.map((tag, i) => (
        <span key={i} className="inline-flex items-center gap-1 bg-zinc-700 text-zinc-200 text-xs px-2 py-1 rounded">
          {tag}
          <button onClick={() => onChange(value.filter((_, j) => j !== i))} className="text-zinc-400 hover:text-zinc-200">
            <X size={10} />
          </button>
        </span>
      ))}
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => { if (input.trim()) add(input); }}
        placeholder={value.length === 0 ? placeholder : ''}
        className="flex-1 min-w-[100px] bg-transparent text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none py-0.5"
      />
    </div>
  );
}

export default function LocationsPage() {
  const [tab, setTab] = useState<'districts' | 'hubs'>('districts');

  // Districts state
  const [districts, setDistricts] = useState<District[]>([]);
  const [dLoading, setDLoading] = useState(true);
  const [dError, setDError] = useState('');
  const [dSearch, setDSearch] = useState('');
  const [dTierFilter, setDTierFilter] = useState('');
  const [dStatusFilter, setDStatusFilter] = useState('');
  const [districtModal, setDistrictModal] = useState<DistrictModal | null>(null);
  const [slugManual, setSlugManual] = useState(false);
  const [seoGenerating, setSeoGenerating] = useState(false);

  // Hubs state
  const [hubs, setHubs] = useState<TransportHub[]>([]);
  const [hLoading, setHLoading] = useState(true);
  const [hSearch, setHSearch] = useState('');
  const [hDistrictFilter, setHDistrictFilter] = useState('');
  const [hStatusFilter, setHStatusFilter] = useState('');
  const [hubModal, setHubModal] = useState<HubModal | null>(null);
  const [hubSlugManual, setHubSlugManual] = useState(false);

  // Shared
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'loading' } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'district' | 'hub'; item: District | TransportHub } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'loading') => {
    setToast({ message, type });
  }, []);

  // Load districts
  const loadDistricts = useCallback(async () => {
    try {
      setDLoading(true);
      setDError('');
      const res = await fetch('/api/v1/districts');
      const json = await res.json();
      if (json.success) {
        setDistricts(json.data);
      } else {
        setDError(json.error?.message || 'Failed to load districts');
      }
    } catch (err: unknown) {
      setDError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setDLoading(false);
    }
  }, []);

  // Load all transport hubs from all districts
  const loadHubs = useCallback(async () => {
    try {
      setHLoading(true);
      // Need to load hubs from all districts
      const dRes = await fetch('/api/v1/districts');
      const dJson = await dRes.json();
      if (!dJson.success) return;
      const allDistricts: District[] = dJson.data;

      const allHubs: TransportHub[] = [];
      for (const d of allDistricts) {
        const hRes = await fetch(`/api/v1/districts/${d.id}/transport-hubs`);
        const hJson = await hRes.json();
        if (hJson.success) {
          allHubs.push(...hJson.data);
        }
      }
      setHubs(allHubs);
    } catch {
      // Silently fail
    } finally {
      setHLoading(false);
    }
  }, []);

  useEffect(() => { loadDistricts(); }, [loadDistricts]);
  useEffect(() => { loadHubs(); }, [loadHubs]);

  // District filters
  const filteredDistricts = districts.filter((d) => {
    if (dSearch && !d.name.toLowerCase().includes(dSearch.toLowerCase())) return false;
    if (dTierFilter && d.tier !== parseInt(dTierFilter)) return false;
    if (dStatusFilter === 'active' && !d.isActive) return false;
    if (dStatusFilter === 'inactive' && d.isActive) return false;
    return true;
  });

  // Hub filters
  const filteredHubs = hubs.filter((h) => {
    if (hSearch && !h.name.toLowerCase().includes(hSearch.toLowerCase())) return false;
    if (hDistrictFilter && h.districtId !== hDistrictFilter) return false;
    if (hStatusFilter === 'active' && !h.isActive) return false;
    if (hStatusFilter === 'inactive' && h.isActive) return false;
    return true;
  });

  // District stats
  const districtStats = {
    total: districts.length,
    tier1: districts.filter((d) => d.tier === 1).length,
    tier2: districts.filter((d) => d.tier === 2).length,
    tier3: districts.filter((d) => d.tier === 3).length,
  };

  // Toggle active
  const toggleDistrictActive = async (d: District) => {
    try {
      const res = await fetch(`/api/v1/districts/${d.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !d.isActive }),
      });
      const json = await res.json();
      if (json.success) {
        setDistricts((prev) => prev.map((x) => x.id === d.id ? { ...x, isActive: !x.isActive } : x));
      }
    } catch {
      showToast('Failed to update', 'error');
    }
  };

  const toggleHubActive = async (h: TransportHub) => {
    try {
      const res = await fetch(`/api/v1/transport-hubs/${h.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !h.isActive }),
      });
      const json = await res.json();
      if (json.success) {
        setHubs((prev) => prev.map((x) => x.id === h.id ? { ...x, isActive: !x.isActive } : x));
      }
    } catch {
      showToast('Failed to update', 'error');
    }
  };

  // Save district
  const handleSaveDistrict = async () => {
    if (!districtModal) return;
    if (!districtModal.name?.trim()) { showToast('Name is required', 'error'); return; }

    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        name: districtModal.name?.trim(),
        slug: districtModal.slug || toSlug(districtModal.name || ''),
        tier: districtModal.tier ?? 1,
        description: districtModal.description || null,
        hotels: districtModal.hotels ?? [],
        restaurants: districtModal.restaurants ?? [],
        landmarks: districtModal.landmarks ?? [],
        seoTitle: districtModal.seoTitle || null,
        seoDescription: districtModal.seoDescription || null,
        seoKeywords: districtModal.seoKeywords || null,
        aboutParagraphs: districtModal.aboutParagraphs ?? [],
        standardTextParagraphs: districtModal.standardTextParagraphs ?? [],
        nearbyText: districtModal.nearbyText || null,
        faq: districtModal.faq ?? [],
        ctaText: districtModal.ctaText || null,
        isPopular: districtModal.isPopular ?? false,
        isActive: districtModal.isActive ?? true,
        sortOrder: districtModal.sortOrder ?? 0,
      };

      const url = districtModal._isNew ? '/api/v1/districts' : `/api/v1/districts/${districtModal.id}`;
      const method = districtModal._isNew ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.success) {
        showToast('Saved successfully', 'success');
        setDistrictModal(null);
        loadDistricts();
      } else {
        showToast(json.error?.message || 'Save failed', 'error');
      }
    } catch {
      showToast('Something went wrong', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Save hub
  const handleSaveHub = async () => {
    if (!hubModal) return;
    if (!hubModal.name?.trim()) { showToast('Name is required', 'error'); return; }
    if (!hubModal.districtId) { showToast('District is required', 'error'); return; }

    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        name: hubModal.name?.trim(),
        slug: hubModal.slug || toSlug(hubModal.name || ''),
        walkingMinutes: hubModal.walkingMinutes ?? 5,
        description: hubModal.description || null,
        seoTitle: hubModal.seoTitle || null,
        seoDescription: hubModal.seoDescription || null,
        isActive: hubModal.isActive ?? true,
      };

      let url: string;
      let method: string;
      if (hubModal._isNew) {
        url = `/api/v1/districts/${hubModal.districtId}/transport-hubs`;
        method = 'POST';
      } else {
        url = `/api/v1/transport-hubs/${hubModal.id}`;
        method = 'PUT';
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.success) {
        showToast('Saved successfully', 'success');
        setHubModal(null);
        loadHubs();
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
  const handleDelete = async () => {
    if (!confirmDelete) return;
    const { type, item } = confirmDelete;
    try {
      const url = type === 'district'
        ? `/api/v1/districts/${item.id}`
        : `/api/v1/transport-hubs/${item.id}`;

      const res = await fetch(url, { method: 'DELETE' });
      const json = await res.json();
      if (res.status === 409) {
        showToast(json.error?.message || `Cannot delete: in use`, 'error');
      } else if (json.success) {
        showToast('Deleted successfully', 'success');
        if (type === 'district') {
          setDistricts((prev) => prev.filter((d) => d.id !== item.id));
        } else {
          setHubs((prev) => prev.filter((h) => h.id !== item.id));
        }
      } else {
        showToast(json.error?.message || 'Delete failed', 'error');
      }
    } catch {
      showToast('Something went wrong', 'error');
    }
    setConfirmDelete(null);
  };

  // Generate SEO for district
  const handleGenerateSeo = async (districtId?: string) => {
    if (!districtId) { showToast('Save first to generate SEO', 'error'); return; }
    const d = districts.find((x) => x.id === districtId) || districtModal;
    if (!d) return;
    if ((!d.hotels || d.hotels.length === 0) && (!d.landmarks || d.landmarks.length === 0)) {
      showToast('Add at least one hotel or landmark first', 'error');
      return;
    }

    setSeoGenerating(true);
    showToast('Generating...', 'loading');
    try {
      const res = await fetch(`/api/v1/districts/${districtId}/generate-seo`, { method: 'POST' });
      if (res.status === 503) {
        showToast('AI not configured. Please add ANTHROPIC_API_KEY.', 'error');
        return;
      }
      const json = await res.json();
      if (json.success) {
        const data = json.data;
        setDistrictModal((prev) => prev ? {
          ...prev,
          seoTitle: data.seoTitle,
          seoDescription: data.seoDescription,
          seoKeywords: data.seoKeywords,
          description: data.description,
        } : prev);
        showToast('SEO generated successfully', 'success');
      } else {
        showToast(json.error?.message || 'Generation failed', 'error');
      }
    } catch {
      showToast('Something went wrong', 'error');
    } finally {
      setSeoGenerating(false);
    }
  };

  // Open district edit
  const openDistrictEdit = async (d: District) => {
    try {
      const res = await fetch(`/api/v1/districts/${d.id}`);
      const json = await res.json();
      if (json.success) {
        const data = json.data;
        setDistrictModal({
          ...data,
          modelCount: data.modelLocations?.length ?? d.modelCount,
          faq: Array.isArray(data.faq) ? data.faq : [],
          aboutParagraphs: Array.isArray(data.aboutParagraphs) ? data.aboutParagraphs : [],
          standardTextParagraphs: Array.isArray(data.standardTextParagraphs) ? data.standardTextParagraphs : [],
        });
      } else {
        setDistrictModal({ ...d });
      }
    } catch {
      setDistrictModal({ ...d });
    }
    setSlugManual(false);
  };

  const openDistrictAdd = () => {
    setDistrictModal({
      _isNew: true,
      name: '',
      slug: '',
      tier: 1,
      description: null,
      hotels: [],
      restaurants: [],
      landmarks: [],
      seoTitle: null,
      seoDescription: null,
      seoKeywords: null,
      aboutParagraphs: [],
      standardTextParagraphs: [],
      nearbyText: null,
      faq: [],
      ctaText: null,
      isPopular: false,
      isActive: true,
      sortOrder: 0,
      modelCount: 0,
    });
    setSlugManual(false);
  };

  const openHubAdd = () => {
    setHubModal({
      _isNew: true,
      name: '',
      slug: '',
      districtId: districts[0]?.id || '',
      walkingMinutes: 5,
      description: null,
      seoTitle: null,
      seoDescription: null,
      isActive: true,
    });
    setHubSlugManual(false);
  };

  const openHubEdit = (h: TransportHub) => {
    setHubModal({ ...h });
    setHubSlugManual(false);
  };

  const updateDistrict = (field: string, value: unknown) => {
    setDistrictModal((prev) => {
      if (!prev) return prev;
      const next = { ...prev, [field]: value };
      if (field === 'name' && !slugManual) {
        next.slug = toSlug(value as string);
      }
      return next;
    });
  };

  const updateHub = (field: string, value: unknown) => {
    setHubModal((prev) => {
      if (!prev) return prev;
      const next = { ...prev, [field]: value };
      if (field === 'name' && !hubSlugManual) {
        next.slug = toSlug(value as string);
      }
      return next;
    });
  };

  const getDistrictName = (id: string) => districts.find((d) => d.id === id)?.name || '—';

  return (
    <div className="p-6 space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Locations</h1>
          <p className="text-sm text-zinc-500 mt-1">London districts and transport hubs</p>
        </div>
        <button
          onClick={tab === 'districts' ? openDistrictAdd : openHubAdd}
          className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} /> {tab === 'districts' ? 'Add District' : 'Add Transport Hub'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-800">
        <button
          onClick={() => setTab('districts')}
          className={`px-6 py-3 text-sm font-medium transition-colors ${tab === 'districts' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-zinc-400 hover:text-zinc-200'}`}
        >Districts</button>
        <button
          onClick={() => setTab('hubs')}
          className={`px-6 py-3 text-sm font-medium transition-colors ${tab === 'hubs' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-zinc-400 hover:text-zinc-200'}`}
        >Transport Hubs</button>
      </div>

      {/* ===== DISTRICTS TAB ===== */}
      {tab === 'districts' && (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Districts', value: districtStats.total, color: 'text-white' },
              { label: 'Tier 1', value: districtStats.tier1, color: 'text-amber-400' },
              { label: 'Tier 2', value: districtStats.tier2, color: 'text-zinc-300' },
              { label: 'Tier 3', value: districtStats.tier3, color: 'text-zinc-500' },
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
              placeholder="Search districts..."
              value={dSearch}
              onChange={(e) => setDSearch(e.target.value)}
              className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 w-64 focus:outline-none focus:border-zinc-500"
            />
            <select
              value={dTierFilter}
              onChange={(e) => setDTierFilter(e.target.value)}
              className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200"
            >
              <option value="">All Tiers</option>
              <option value="1">Tier 1</option>
              <option value="2">Tier 2</option>
              <option value="3">Tier 3</option>
            </select>
            <select
              value={dStatusFilter}
              onChange={(e) => setDStatusFilter(e.target.value)}
              className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {dError && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400 text-sm">{dError}</div>
          )}

          {/* Districts Table */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-400 text-left">
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Slug</th>
                    <th className="px-4 py-3 font-medium w-16">Tier</th>
                    <th className="px-4 py-3 font-medium w-16">Models</th>
                    <th className="px-4 py-3 font-medium w-12">Popular</th>
                    <th className="px-4 py-3 font-medium w-16">Active</th>
                    <th className="px-4 py-3 font-medium w-28">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {dLoading && (
                    <tr><td colSpan={7} className="px-4 py-12 text-center text-zinc-500">Loading...</td></tr>
                  )}
                  {!dLoading && filteredDistricts.length === 0 && (
                    <tr><td colSpan={7} className="px-4 py-12 text-center text-zinc-500">No districts found</td></tr>
                  )}
                  {!dLoading && filteredDistricts.map((d) => (
                    <tr key={d.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/50 transition-colors">
                      <td className="px-4 py-3 text-zinc-200 font-medium">{d.name}</td>
                      <td className="px-4 py-3 text-zinc-400">{d.slug}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs border ${tierStyles[d.tier] ?? tierStyles[3]}`}>
                          T{d.tier}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-zinc-400">{d.modelCount}</td>
                      <td className="px-4 py-3 text-center">
                        {d.isPopular && <Star size={14} className="text-amber-400 fill-amber-400 inline" />}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleDistrictActive(d)}
                          className={`relative w-9 h-5 rounded-full transition-colors ${d.isActive ? 'bg-emerald-500' : 'bg-zinc-600'}`}
                        >
                          <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${d.isActive ? 'left-[18px]' : 'left-0.5'}`} />
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => openDistrictEdit(d)} className="p-1.5 rounded hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors" title="Edit">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => handleGenerateSeo(d.id)} className="p-1.5 rounded hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors" title="Generate SEO">
                            <Sparkles size={14} />
                          </button>
                          <button
                            onClick={() => {
                              if (d.modelCount > 0) {
                                showToast(`Cannot delete: ${d.modelCount} models are assigned to this district`, 'error');
                              } else {
                                setConfirmDelete({ type: 'district', item: d });
                              }
                            }}
                            className="p-1.5 rounded hover:bg-zinc-700 text-zinc-400 hover:text-red-400 transition-colors"
                            title="Delete"
                          >
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
        </>
      )}

      {/* ===== TRANSPORT HUBS TAB ===== */}
      {tab === 'hubs' && (
        <>
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <input
              type="text"
              placeholder="Search hubs..."
              value={hSearch}
              onChange={(e) => setHSearch(e.target.value)}
              className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 w-64 focus:outline-none focus:border-zinc-500"
            />
            <select
              value={hDistrictFilter}
              onChange={(e) => setHDistrictFilter(e.target.value)}
              className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200"
            >
              <option value="">All Districts</option>
              {districts.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
            <select
              value={hStatusFilter}
              onChange={(e) => setHStatusFilter(e.target.value)}
              className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Hubs Table */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-400 text-left">
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Slug</th>
                    <th className="px-4 py-3 font-medium">District</th>
                    <th className="px-4 py-3 font-medium">Walking Time</th>
                    <th className="px-4 py-3 font-medium w-16">Active</th>
                    <th className="px-4 py-3 font-medium w-24">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {hLoading && (
                    <tr><td colSpan={6} className="px-4 py-12 text-center text-zinc-500">Loading...</td></tr>
                  )}
                  {!hLoading && filteredHubs.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-12 text-center text-zinc-500">No transport hubs found</td></tr>
                  )}
                  {!hLoading && filteredHubs.map((h) => (
                    <tr key={h.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/50 transition-colors">
                      <td className="px-4 py-3 text-zinc-200 font-medium">{h.name}</td>
                      <td className="px-4 py-3 text-zinc-400">{h.slug}</td>
                      <td className="px-4 py-3 text-zinc-400">{getDistrictName(h.districtId)}</td>
                      <td className="px-4 py-3 text-zinc-400">{h.walkingMinutes} min walk</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleHubActive(h)}
                          className={`relative w-9 h-5 rounded-full transition-colors ${h.isActive ? 'bg-emerald-500' : 'bg-zinc-600'}`}
                        >
                          <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${h.isActive ? 'left-[18px]' : 'left-0.5'}`} />
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => openHubEdit(h)} className="p-1.5 rounded hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors" title="Edit">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => setConfirmDelete({ type: 'hub', item: h })} className="p-1.5 rounded hover:bg-zinc-700 text-zinc-400 hover:text-red-400 transition-colors" title="Delete">
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
        </>
      )}

      {/* Delete Confirm */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setConfirmDelete(null)}>
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 max-w-sm w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-white font-semibold mb-2">Delete {confirmDelete.type}</h3>
            <p className="text-zinc-400 text-sm mb-4">
              Delete &quot;{confirmDelete.item.name}&quot;? This cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirmDelete(null)} className="px-3 py-1.5 text-sm rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700">Cancel</button>
              <button onClick={handleDelete} className="px-3 py-1.5 text-sm rounded-lg bg-red-600 text-white hover:bg-red-500">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* District Modal */}
      {districtModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setDistrictModal(null)}>
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
              <h2 className="text-lg font-semibold text-white">{districtModal._isNew ? 'Add District' : 'Edit District'}</h2>
              <button onClick={() => setDistrictModal(null)} className="text-zinc-400 hover:text-zinc-200"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-5">
              {/* Basic */}
              <p className="text-xs uppercase tracking-wider text-zinc-500 font-medium">Basic</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Name *</label>
                  <input
                    type="text"
                    value={districtModal.name || ''}
                    onChange={(e) => updateDistrict('name', e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-zinc-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Slug</label>
                  <input
                    type="text"
                    value={districtModal.slug || ''}
                    onChange={(e) => { setSlugManual(true); updateDistrict('slug', e.target.value); }}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-zinc-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Tier *</label>
                  <select
                    value={districtModal.tier ?? 1}
                    onChange={(e) => updateDistrict('tier', parseInt(e.target.value))}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200"
                  >
                    <option value={1}>1 — Top Demand</option>
                    <option value={2}>2 — High Demand</option>
                    <option value={3}>3 — Growing</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Sort Order</label>
                  <input
                    type="number"
                    value={districtModal.sortOrder ?? 0}
                    onChange={(e) => updateDistrict('sortOrder', parseInt(e.target.value) || 0)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-zinc-500"
                  />
                </div>
              </div>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
                  <button
                    onClick={() => updateDistrict('isPopular', !districtModal.isPopular)}
                    className={`relative w-9 h-5 rounded-full transition-colors ${districtModal.isPopular ? 'bg-emerald-500' : 'bg-zinc-600'}`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${districtModal.isPopular ? 'left-[18px]' : 'left-0.5'}`} />
                  </button>
                  Popular
                </label>
                <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
                  <button
                    onClick={() => updateDistrict('isActive', !districtModal.isActive)}
                    className={`relative w-9 h-5 rounded-full transition-colors ${districtModal.isActive ? 'bg-emerald-500' : 'bg-zinc-600'}`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${districtModal.isActive ? 'left-[18px]' : 'left-0.5'}`} />
                  </button>
                  Active
                </label>
              </div>

              <div className="h-px bg-zinc-800" />

              {/* Local Knowledge */}
              <p className="text-xs uppercase tracking-wider text-zinc-500 font-medium">Local Knowledge</p>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Hotels</label>
                <TagInput
                  value={districtModal.hotels ?? []}
                  onChange={(v) => updateDistrict('hotels', v)}
                  placeholder="Add hotel names..."
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Restaurants</label>
                <TagInput
                  value={districtModal.restaurants ?? []}
                  onChange={(v) => updateDistrict('restaurants', v)}
                  placeholder="Add restaurant names..."
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Landmarks</label>
                <TagInput
                  value={districtModal.landmarks ?? []}
                  onChange={(v) => updateDistrict('landmarks', v)}
                  placeholder="Add landmarks..."
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Description (300-500 words)</label>
                <textarea
                  value={districtModal.description || ''}
                  onChange={(e) => updateDistrict('description', e.target.value)}
                  rows={6}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-zinc-500 resize-none"
                />
              </div>

              <div className="h-px bg-zinc-800" />

              {/* SEO */}
              <p className="text-xs uppercase tracking-wider text-zinc-500 font-medium">SEO</p>
              <div>
                <label className="flex items-center justify-between text-xs text-zinc-400 mb-1">
                  <span>SEO Title</span>
                  <span className={(districtModal.seoTitle?.length ?? 0) > 60 ? 'text-red-400' : ''}>{districtModal.seoTitle?.length ?? 0}/60</span>
                </label>
                <input
                  type="text"
                  value={districtModal.seoTitle || ''}
                  onChange={(e) => updateDistrict('seoTitle', e.target.value)}
                  maxLength={60}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-zinc-500"
                />
              </div>
              <div>
                <label className="flex items-center justify-between text-xs text-zinc-400 mb-1">
                  <span>SEO Description</span>
                  <span className={(districtModal.seoDescription?.length ?? 0) > 155 ? 'text-red-400' : ''}>{districtModal.seoDescription?.length ?? 0}/155</span>
                </label>
                <textarea
                  value={districtModal.seoDescription || ''}
                  onChange={(e) => updateDistrict('seoDescription', e.target.value)}
                  maxLength={155}
                  rows={2}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-zinc-500 resize-none"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">SEO Keywords</label>
                <input
                  type="text"
                  value={districtModal.seoKeywords || ''}
                  onChange={(e) => updateDistrict('seoKeywords', e.target.value)}
                  placeholder="keyword1, keyword2"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-zinc-500"
                />
              </div>
              <button
                onClick={() => handleGenerateSeo(districtModal.id)}
                disabled={!districtModal.name || seoGenerating || districtModal._isNew}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
              >
                {seoGenerating ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Sparkles size={14} />
                )}
                Generate SEO with AI
              </button>
              {districtModal._isNew && (
                <p className="text-xs text-zinc-500">Save first to generate SEO</p>
              )}

              <div className="h-px bg-zinc-800" />

              {/* SEO Content */}
              <p className="text-xs uppercase tracking-wider text-zinc-500 font-medium">SEO Content</p>

              {/* About Paragraphs */}
              <div>
                <label className="block text-xs text-zinc-400 mb-1">About Paragraphs</label>
                {(districtModal.aboutParagraphs ?? []).map((p, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <textarea
                      value={p}
                      onChange={(e) => {
                        const updated = [...(districtModal.aboutParagraphs ?? [])];
                        updated[i] = e.target.value;
                        updateDistrict('aboutParagraphs', updated);
                      }}
                      rows={3}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-zinc-500 resize-none"
                    />
                    <button
                      onClick={() => {
                        const updated = (districtModal.aboutParagraphs ?? []).filter((_, j) => j !== i);
                        updateDistrict('aboutParagraphs', updated);
                      }}
                      className="text-zinc-500 hover:text-red-400 shrink-0 mt-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => updateDistrict('aboutParagraphs', [...(districtModal.aboutParagraphs ?? []), ''])}
                  className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-200"
                >
                  <Plus size={12} /> Add Paragraph
                </button>
              </div>

              {/* Standard Text Paragraphs */}
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Standard Text Paragraphs</label>
                {(districtModal.standardTextParagraphs ?? []).map((p, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <textarea
                      value={p}
                      onChange={(e) => {
                        const updated = [...(districtModal.standardTextParagraphs ?? [])];
                        updated[i] = e.target.value;
                        updateDistrict('standardTextParagraphs', updated);
                      }}
                      rows={3}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-zinc-500 resize-none"
                    />
                    <button
                      onClick={() => {
                        const updated = (districtModal.standardTextParagraphs ?? []).filter((_, j) => j !== i);
                        updateDistrict('standardTextParagraphs', updated);
                      }}
                      className="text-zinc-500 hover:text-red-400 shrink-0 mt-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => updateDistrict('standardTextParagraphs', [...(districtModal.standardTextParagraphs ?? []), ''])}
                  className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-200"
                >
                  <Plus size={12} /> Add Paragraph
                </button>
              </div>

              {/* Nearby Text */}
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Nearby Text</label>
                <textarea
                  value={districtModal.nearbyText || ''}
                  onChange={(e) => updateDistrict('nearbyText', e.target.value)}
                  rows={3}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-zinc-500 resize-none"
                />
              </div>

              {/* FAQ */}
              <div>
                <label className="block text-xs text-zinc-400 mb-1">FAQ</label>
                {(districtModal.faq ?? []).map((item, i) => (
                  <div key={i} className="flex gap-2 mb-3">
                    <div className="flex-1 space-y-2">
                      <textarea
                        value={item.question}
                        onChange={(e) => {
                          const updated = [...(districtModal.faq ?? [])];
                          updated[i] = { ...updated[i], question: e.target.value };
                          updateDistrict('faq', updated);
                        }}
                        placeholder="Question"
                        rows={2}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-zinc-500 resize-none"
                      />
                      <textarea
                        value={item.answer}
                        onChange={(e) => {
                          const updated = [...(districtModal.faq ?? [])];
                          updated[i] = { ...updated[i], answer: e.target.value };
                          updateDistrict('faq', updated);
                        }}
                        placeholder="Answer"
                        rows={2}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-zinc-500 resize-none"
                      />
                    </div>
                    <button
                      onClick={() => {
                        const updated = (districtModal.faq ?? []).filter((_, j) => j !== i);
                        updateDistrict('faq', updated);
                      }}
                      className="text-zinc-500 hover:text-red-400 shrink-0 mt-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => updateDistrict('faq', [...(districtModal.faq ?? []), { question: '', answer: '' }])}
                  className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-200"
                >
                  <Plus size={12} /> Add FAQ
                </button>
              </div>

              {/* CTA Text */}
              <div>
                <label className="block text-xs text-zinc-400 mb-1">CTA Text</label>
                <input
                  type="text"
                  value={districtModal.ctaText || ''}
                  onChange={(e) => updateDistrict('ctaText', e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-zinc-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-zinc-800">
              <button onClick={() => setDistrictModal(null)} className="px-4 py-2 text-sm rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700">Cancel</button>
              <button
                onClick={handleSaveDistrict}
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

      {/* Hub Modal */}
      {hubModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setHubModal(null)}>
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
              <h2 className="text-lg font-semibold text-white">{hubModal._isNew ? 'Add Transport Hub' : 'Edit Transport Hub'}</h2>
              <button onClick={() => setHubModal(null)} className="text-zinc-400 hover:text-zinc-200"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Name *</label>
                <input
                  type="text"
                  value={hubModal.name || ''}
                  onChange={(e) => updateHub('name', e.target.value)}
                  placeholder="e.g. Bond Street"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-zinc-500"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Slug</label>
                <input
                  type="text"
                  value={hubModal.slug || ''}
                  onChange={(e) => { setHubSlugManual(true); updateHub('slug', e.target.value); }}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-zinc-500"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">District *</label>
                <select
                  value={hubModal.districtId || ''}
                  onChange={(e) => updateHub('districtId', e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200"
                >
                  <option value="">Select district...</option>
                  {districts.filter((d) => d.isActive).map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Walking Minutes</label>
                <input
                  type="number"
                  value={hubModal.walkingMinutes ?? 5}
                  onChange={(e) => updateHub('walkingMinutes', parseInt(e.target.value) || 0)}
                  min={0}
                  className="w-32 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-zinc-500"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Description (150-250 words)</label>
                <textarea
                  value={hubModal.description || ''}
                  onChange={(e) => updateHub('description', e.target.value)}
                  rows={4}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-zinc-500 resize-none"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">SEO Title</label>
                <input
                  type="text"
                  value={hubModal.seoTitle || ''}
                  onChange={(e) => updateHub('seoTitle', e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-zinc-500"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">SEO Description</label>
                <textarea
                  value={hubModal.seoDescription || ''}
                  onChange={(e) => updateHub('seoDescription', e.target.value)}
                  rows={2}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-zinc-500 resize-none"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
                <button
                  onClick={() => updateHub('isActive', !hubModal.isActive)}
                  className={`relative w-9 h-5 rounded-full transition-colors ${hubModal.isActive ? 'bg-emerald-500' : 'bg-zinc-600'}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${hubModal.isActive ? 'left-[18px]' : 'left-0.5'}`} />
                </button>
                Active
              </label>
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-zinc-800">
              <button onClick={() => setHubModal(null)} className="px-4 py-2 text-sm rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700">Cancel</button>
              <button
                onClick={handleSaveHub}
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
