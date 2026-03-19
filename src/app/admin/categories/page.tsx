'use client';

import { useEffect, useState, useCallback } from 'react';
import { Star, Pencil, Trash2, Plus, X, FileText } from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface CategoryContent {
  id: string;
  categoryId: string;
  aboutParagraphs: string[];
  standardText: string | null;
  relatedCategories: string[];
  faq: { question: string; answer: string }[];
}

interface Category {
  id: string;
  title: string;
  slug: string;
  h1: string | null;
  status: string;
  isPopular: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
  content: CategoryContent | null;
}

type CategoryModal = Partial<Category> & {
  _isNew?: boolean;
  _aboutParagraphs?: string[];
  _standardText?: string;
  _relatedCategories?: string[];
  _faq?: { question: string; answer: string }[];
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function toSlug(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/* ------------------------------------------------------------------ */
/*  Toast                                                              */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [modal, setModal] = useState<CategoryModal | null>(null);
  const [modalTab, setModalTab] = useState<'basic' | 'seo'>('basic');
  const [slugManual, setSlugManual] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'loading' } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Category | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'loading') => {
    setToast({ message, type });
  }, []);

  /* ---- Load categories ---- */
  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch('/api/v1/categories');
      const json = await res.json();
      if (json.success) {
        setCategories(json.data);
      } else {
        setError(json.error?.message || 'Failed to load categories');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadCategories(); }, [loadCategories]);

  /* ---- Filters ---- */
  const filtered = categories.filter((c) => {
    if (search && !c.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter && c.status !== statusFilter) return false;
    return true;
  });

  /* ---- Stats ---- */
  const stats = {
    total: categories.length,
    active: categories.filter((c) => c.status === 'active').length,
    popular: categories.filter((c) => c.isPopular).length,
    withContent: categories.filter((c) => c.content).length,
  };

  /* ---- Open edit modal ---- */
  const openEdit = async (cat: Category) => {
    try {
      const res = await fetch(`/api/v1/categories/${cat.id}`);
      const json = await res.json();
      if (json.success) {
        const data: Category = json.data;
        setModal({
          ...data,
          _aboutParagraphs: data.content?.aboutParagraphs ?? [],
          _standardText: data.content?.standardText ?? '',
          _relatedCategories: data.content?.relatedCategories ?? [],
          _faq: (data.content?.faq as { question: string; answer: string }[]) ?? [],
        });
      } else {
        setModal({
          ...cat,
          _aboutParagraphs: cat.content?.aboutParagraphs ?? [],
          _standardText: cat.content?.standardText ?? '',
          _relatedCategories: cat.content?.relatedCategories ?? [],
          _faq: (cat.content?.faq as { question: string; answer: string }[]) ?? [],
        });
      }
    } catch {
      setModal({
        ...cat,
        _aboutParagraphs: cat.content?.aboutParagraphs ?? [],
        _standardText: cat.content?.standardText ?? '',
        _relatedCategories: cat.content?.relatedCategories ?? [],
        _faq: (cat.content?.faq as { question: string; answer: string }[]) ?? [],
      });
    }
    setSlugManual(false);
    setModalTab('basic');
  };

  /* ---- Open create modal ---- */
  const openCreate = () => {
    setModal({
      _isNew: true,
      title: '',
      slug: '',
      h1: null,
      status: 'active',
      isPopular: false,
      seoTitle: null,
      seoDescription: null,
      content: null,
      _aboutParagraphs: [],
      _standardText: '',
      _relatedCategories: [],
      _faq: [],
    });
    setSlugManual(false);
    setModalTab('basic');
  };

  /* ---- Update modal field ---- */
  const updateField = (field: string, value: unknown) => {
    setModal((prev) => {
      if (!prev) return prev;
      const next = { ...prev, [field]: value };
      if (field === 'title' && !slugManual) {
        next.slug = toSlug(value as string);
      }
      return next;
    });
  };

  /* ---- Save ---- */
  const handleSave = async () => {
    if (!modal) return;
    if (!modal.title?.trim()) { showToast('Title is required', 'error'); return; }

    setSaving(true);
    try {
      /* Step 1: Save basic info */
      const basicBody: Record<string, unknown> = {
        title: modal.title.trim(),
        slug: modal.slug || toSlug(modal.title || ''),
        h1: modal.h1 || null,
        status: modal.status ?? 'active',
        isPopular: modal.isPopular ?? false,
        seoTitle: modal.seoTitle || null,
        seoDescription: modal.seoDescription || null,
      };

      const url = modal._isNew ? '/api/v1/categories' : `/api/v1/categories/${modal.id}`;
      const method = modal._isNew ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(basicBody),
      });
      const json = await res.json();
      if (!json.success) {
        showToast(json.error?.message || 'Save failed', 'error');
        return;
      }

      const categoryId = json.data.id;

      /* Step 2: Save SEO content (only if any field has data) */
      const hasContent =
        (modal._aboutParagraphs && modal._aboutParagraphs.length > 0) ||
        (modal._standardText && modal._standardText.trim()) ||
        (modal._relatedCategories && modal._relatedCategories.length > 0) ||
        (modal._faq && modal._faq.length > 0);

      if (hasContent || !modal._isNew) {
        const contentBody = {
          aboutParagraphs: (modal._aboutParagraphs || []).filter((p) => p.trim()),
          standardText: modal._standardText?.trim() || null,
          relatedCategories: modal._relatedCategories || [],
          faq: (modal._faq || []).filter((f) => f.question.trim() || f.answer.trim()),
        };

        const contentRes = await fetch(`/api/v1/categories/${categoryId}/content`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(contentBody),
        });
        const contentJson = await contentRes.json();
        if (!contentJson.success) {
          showToast('Category saved but content save failed', 'error');
          setModal(null);
          loadCategories();
          return;
        }
      }

      showToast('Saved successfully', 'success');
      setModal(null);
      loadCategories();
    } catch {
      showToast('Something went wrong', 'error');
    } finally {
      setSaving(false);
    }
  };

  /* ---- Delete ---- */
  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      const res = await fetch(`/api/v1/categories/${confirmDelete.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (res.status === 409) {
        showToast(json.error?.message || 'Cannot delete: in use', 'error');
      } else if (json.success) {
        showToast('Deleted successfully', 'success');
        setCategories((prev) => prev.filter((c) => c.id !== confirmDelete.id));
        setModal(null);
      } else {
        showToast(json.error?.message || 'Delete failed', 'error');
      }
    } catch {
      showToast('Something went wrong', 'error');
    }
    setConfirmDelete(null);
  };

  /* ---- About paragraphs helpers ---- */
  const addParagraph = () => {
    setModal((prev) => prev ? { ...prev, _aboutParagraphs: [...(prev._aboutParagraphs || []), ''] } : prev);
  };
  const updateParagraph = (idx: number, value: string) => {
    setModal((prev) => {
      if (!prev) return prev;
      const arr = [...(prev._aboutParagraphs || [])];
      arr[idx] = value;
      return { ...prev, _aboutParagraphs: arr };
    });
  };
  const removeParagraph = (idx: number) => {
    setModal((prev) => {
      if (!prev) return prev;
      const arr = [...(prev._aboutParagraphs || [])];
      arr.splice(idx, 1);
      return { ...prev, _aboutParagraphs: arr };
    });
  };

  /* ---- FAQ helpers ---- */
  const addFaq = () => {
    setModal((prev) => prev ? { ...prev, _faq: [...(prev._faq || []), { question: '', answer: '' }] } : prev);
  };
  const updateFaq = (idx: number, field: 'question' | 'answer', value: string) => {
    setModal((prev) => {
      if (!prev) return prev;
      const arr = [...(prev._faq || [])];
      arr[idx] = { ...arr[idx], [field]: value };
      return { ...prev, _faq: arr };
    });
  };
  const removeFaq = (idx: number) => {
    setModal((prev) => {
      if (!prev) return prev;
      const arr = [...(prev._faq || [])];
      arr.splice(idx, 1);
      return { ...prev, _faq: arr };
    });
  };

  /* ---- Related categories toggle ---- */
  const toggleRelated = (slug: string) => {
    setModal((prev) => {
      if (!prev) return prev;
      const current = prev._relatedCategories || [];
      const next = current.includes(slug)
        ? current.filter((s) => s !== slug)
        : [...current, slug];
      return { ...prev, _relatedCategories: next };
    });
  };

  /* ================================================================ */
  /*  RENDER                                                           */
  /* ================================================================ */

  return (
    <div className="p-6 space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Categories</h1>
          <p className="text-sm text-zinc-500 mt-1">Manage service categories and SEO content</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} /> New Category
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: stats.total, color: 'text-white' },
          { label: 'Active', value: stats.active, color: 'text-emerald-400' },
          { label: 'Popular', value: stats.popular, color: 'text-amber-400' },
          { label: 'With SEO Content', value: stats.withContent, color: 'text-blue-400' },
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
          placeholder="Search categories..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 w-64 focus:outline-none focus:border-zinc-500"
        />
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
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Slug</th>
                <th className="px-4 py-3 font-medium w-24">Status</th>
                <th className="px-4 py-3 font-medium w-16">Popular</th>
                <th className="px-4 py-3 font-medium w-28">SEO Content</th>
                <th className="px-4 py-3 font-medium w-24">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-zinc-500">Loading...</td></tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-zinc-500">No categories found</td></tr>
              )}
              {!loading && filtered.map((c) => (
                <tr key={c.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/50 transition-colors">
                  <td className="px-4 py-3 text-zinc-200 font-medium">{c.title}</td>
                  <td className="px-4 py-3 text-zinc-400">{c.slug}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs border ${
                      c.status === 'active'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
                    }`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {c.isPopular && <Star size={14} className="text-amber-400 fill-amber-400 inline" />}
                  </td>
                  <td className="px-4 py-3">
                    {c.content ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                        <FileText size={10} /> Has Content
                      </span>
                    ) : (
                      <span className="text-zinc-500 text-xs">None</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(c)} className="p-1.5 rounded hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors" title="Edit">
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => setConfirmDelete(c)}
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

      {/* Delete Confirm */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setConfirmDelete(null)}>
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 max-w-sm w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-white font-semibold mb-2">Delete Category</h3>
            <p className="text-zinc-400 text-sm mb-4">
              Delete &quot;{confirmDelete.title}&quot;? This cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirmDelete(null)} className="px-3 py-1.5 text-sm rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700">Cancel</button>
              <button onClick={handleDelete} className="px-3 py-1.5 text-sm rounded-lg bg-red-600 text-white hover:bg-red-500">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/*  EDIT / CREATE MODAL                                          */}
      {/* ============================================================ */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setModal(null)}>
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-3xl mx-4 max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 shrink-0">
              <h2 className="text-lg font-semibold text-white">{modal._isNew ? 'New Category' : 'Edit Category'}</h2>
              <button onClick={() => setModal(null)} className="text-zinc-400 hover:text-zinc-200"><X size={18} /></button>
            </div>

            {/* Tab Switcher */}
            <div className="flex border-b border-zinc-800 shrink-0">
              <button
                onClick={() => setModalTab('basic')}
                className={`px-6 py-3 text-sm font-medium transition-colors ${modalTab === 'basic' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-zinc-400 hover:text-zinc-200'}`}
              >Basic Info</button>
              <button
                onClick={() => setModalTab('seo')}
                className={`px-6 py-3 text-sm font-medium transition-colors ${modalTab === 'seo' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-zinc-400 hover:text-zinc-200'}`}
              >SEO Content</button>
            </div>

            {/* Modal Body (scrollable) */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1">

              {/* ---- BASIC INFO TAB ---- */}
              {modalTab === 'basic' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-zinc-400 mb-1">Title *</label>
                      <input
                        type="text"
                        value={modal.title || ''}
                        onChange={(e) => updateField('title', e.target.value)}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-zinc-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-400 mb-1">Slug</label>
                      <input
                        type="text"
                        value={modal.slug || ''}
                        onChange={(e) => { setSlugManual(true); updateField('slug', e.target.value); }}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-zinc-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">H1 (optional)</label>
                    <input
                      type="text"
                      value={modal.h1 || ''}
                      onChange={(e) => updateField('h1', e.target.value)}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-zinc-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-zinc-400 mb-1">Status</label>
                      <select
                        value={modal.status ?? 'active'}
                        onChange={(e) => updateField('status', e.target.value)}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                    <div className="flex items-end pb-1">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={modal.isPopular ?? false}
                          onChange={(e) => updateField('isPopular', e.target.checked)}
                          className="w-4 h-4 rounded bg-zinc-800 border-zinc-600 text-amber-500 focus:ring-amber-500 focus:ring-offset-0"
                        />
                        <span className="text-sm text-zinc-300">Popular category</span>
                      </label>
                    </div>
                  </div>

                  <p className="text-xs uppercase tracking-wider text-zinc-500 font-medium pt-2">SEO Meta</p>

                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">SEO Title</label>
                    <input
                      type="text"
                      value={modal.seoTitle || ''}
                      onChange={(e) => updateField('seoTitle', e.target.value)}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-zinc-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">SEO Description</label>
                    <textarea
                      value={modal.seoDescription || ''}
                      onChange={(e) => updateField('seoDescription', e.target.value)}
                      rows={3}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-zinc-500 resize-none"
                    />
                  </div>
                </>
              )}

              {/* ---- SEO CONTENT TAB ---- */}
              {modalTab === 'seo' && (
                <>
                  {/* About Paragraphs */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs uppercase tracking-wider text-zinc-500 font-medium">About Paragraphs</label>
                      <button
                        onClick={addParagraph}
                        className="flex items-center gap-1 px-2 py-1 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded transition-colors"
                      >
                        <Plus size={12} /> Add Paragraph
                      </button>
                    </div>
                    {(modal._aboutParagraphs || []).length === 0 && (
                      <p className="text-xs text-zinc-500 italic">No paragraphs yet. Click &quot;Add Paragraph&quot; to start.</p>
                    )}
                    <div className="space-y-3">
                      {(modal._aboutParagraphs || []).map((p, i) => (
                        <div key={i} className="relative">
                          <textarea
                            value={p}
                            onChange={(e) => updateParagraph(i, e.target.value)}
                            rows={3}
                            placeholder={`Paragraph ${i + 1}`}
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-zinc-500 resize-none pr-10"
                          />
                          <button
                            onClick={() => removeParagraph(i)}
                            className="absolute top-2 right-2 p-1 rounded hover:bg-zinc-700 text-zinc-500 hover:text-red-400 transition-colors"
                            title="Remove paragraph"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Standard Text */}
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-zinc-500 font-medium mb-2">Standard Text</label>
                    <textarea
                      value={modal._standardText || ''}
                      onChange={(e) => updateField('_standardText', e.target.value)}
                      rows={5}
                      placeholder="Standard category text..."
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-zinc-500 resize-none"
                    />
                  </div>

                  {/* Related Categories */}
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-zinc-500 font-medium mb-2">Related Categories</label>
                    <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-3 max-h-40 overflow-y-auto">
                      {categories.filter((c) => c.slug !== modal.slug).length === 0 && (
                        <p className="text-xs text-zinc-500 italic">No other categories available</p>
                      )}
                      <div className="flex flex-wrap gap-2">
                        {categories
                          .filter((c) => c.slug !== modal.slug)
                          .map((c) => {
                            const selected = (modal._relatedCategories || []).includes(c.slug);
                            return (
                              <button
                                key={c.id}
                                onClick={() => toggleRelated(c.slug)}
                                className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
                                  selected
                                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                    : 'bg-zinc-700/50 text-zinc-400 border-zinc-600 hover:border-zinc-500'
                                }`}
                              >
                                {c.title}
                              </button>
                            );
                          })}
                      </div>
                    </div>
                  </div>

                  {/* FAQ */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs uppercase tracking-wider text-zinc-500 font-medium">FAQ</label>
                      <button
                        onClick={addFaq}
                        className="flex items-center gap-1 px-2 py-1 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded transition-colors"
                      >
                        <Plus size={12} /> Add FAQ
                      </button>
                    </div>
                    {(modal._faq || []).length === 0 && (
                      <p className="text-xs text-zinc-500 italic">No FAQ entries yet. Click &quot;Add FAQ&quot; to start.</p>
                    )}
                    <div className="space-y-4">
                      {(modal._faq || []).map((faq, i) => (
                        <div key={i} className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-3 relative">
                          <button
                            onClick={() => removeFaq(i)}
                            className="absolute top-2 right-2 p-1 rounded hover:bg-zinc-700 text-zinc-500 hover:text-red-400 transition-colors"
                            title="Remove FAQ"
                          >
                            <X size={14} />
                          </button>
                          <div className="space-y-2 pr-6">
                            <div>
                              <label className="block text-xs text-zinc-400 mb-1">Question</label>
                              <textarea
                                value={faq.question}
                                onChange={(e) => updateFaq(i, 'question', e.target.value)}
                                rows={2}
                                placeholder="Enter question..."
                                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-zinc-500 resize-none"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-zinc-400 mb-1">Answer</label>
                              <textarea
                                value={faq.answer}
                                onChange={(e) => updateFaq(i, 'answer', e.target.value)}
                                rows={2}
                                placeholder="Enter answer..."
                                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-zinc-500 resize-none"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-800 shrink-0">
              <div>
                {!modal._isNew && (
                  <button
                    onClick={() => {
                      const cat = categories.find((c) => c.id === modal.id);
                      if (cat) setConfirmDelete(cat);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setModal(null)} className="px-4 py-2 text-sm rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors">Cancel</button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving && <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />}
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
