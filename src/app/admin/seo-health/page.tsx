// SEO HEALTH PAGE
'use client';

import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';

type SEOPage = {
  id: string;
  pageType: string;
  path: string;
  title: string;
  metaDescription: string;
  indexStatus: string;
  canonicalUrl?: string;
  lastCrawledAt?: string;
  createdAt: string;
};

const TYPE_FILTERS = [
  { value: 'all', label: 'All Types' },
  { value: 'model_profile', label: 'Model Profile' },
  { value: 'geo_page', label: 'Geo Page' },
  { value: 'blog_post', label: 'Blog Post' },
  { value: 'service_page', label: 'Service Page' }
];

const INDEX_FILTERS = [
  { value: 'all', label: 'All Status' },
  { value: 'indexed', label: 'Indexed' },
  { value: 'not_indexed', label: 'Not Indexed' },
  { value: 'blocked', label: 'Blocked' }
];

const indexStyles: Record<string, string> = {
  indexed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  not_indexed: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  blocked: 'bg-red-500/10 text-red-400 border-red-500/20',
};

const typeStyles: Record<string, string> = {
  model_profile: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  geo_page: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  blog_post: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  service_page: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
};

export default function SEOHealthPage() {
  const [pages, setPages] = useState<SEOPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all');
  const [indexFilter, setIndexFilter] = useState('all');
  const [editId, setEditId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editIndexStatus, setEditIndexStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [total, setTotal] = useState(0);

  useEffect(() => { loadPages(); }, [typeFilter, indexFilter]);

  async function loadPages() {
    try {
      setLoading(true);
      const params = new URLSearchParams({ limit: '50' });
      if (typeFilter !== 'all') params.set('page_type', typeFilter);
      if (indexFilter !== 'all') params.set('index_status', indexFilter);
      const res = await fetch(`/api/v1/seo/pages?${params}`);
      const data = await res.json();
      setPages(data.data?.pages || []);
      setTotal(data.data?.pagination?.total || 0);
    } catch (error) {
      console.error('Failed to load SEO pages:', error);
    } finally {
      setLoading(false);
    }
  }

  function startEdit(page: SEOPage) {
    setEditId(page.id);
    setEditTitle(page.title);
    setEditDescription(page.metaDescription);
    setEditIndexStatus(page.indexStatus);
  }

  async function saveEdit() {
    if (!editId) return;
    try {
      setSubmitting(true);
      await fetch(`/api/v1/seo/pages/${editId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editTitle, metaDescription: editDescription, indexStatus: editIndexStatus })
      });
      setEditId(null);
      await loadPages();
    } catch (error) {
      console.error('Failed to save SEO page:', error);
    } finally {
      setSubmitting(false);
    }
  }

  const indexed = pages.filter(p => p.indexStatus === 'indexed').length;
  const notIndexed = pages.filter(p => p.indexStatus === 'not_indexed').length;
  const blocked = pages.filter(p => p.indexStatus === 'blocked').length;
  const inputClass = 'w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors duration-150';
  const selectClass = 'px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-zinc-200 focus:outline-none focus:border-zinc-600 transition-colors duration-150';

  if (loading && pages.length === 0) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">SEO Health</h1>
          <p className="text-sm text-zinc-500 mt-1">Loading...</p>
        </div>
        <div className="space-y-4 animate-pulse">
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-zinc-800/30 rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">SEO Health</h1>
        <p className="text-sm text-zinc-500 mt-1">{total} pages tracked</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-5">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Total Pages</p>
          <p className="text-2xl font-semibold text-zinc-100 mt-2">{total}</p>
        </div>
        <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-5">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Indexed</p>
          <p className="text-2xl font-semibold text-emerald-400 mt-2">{indexed}</p>
        </div>
        <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-5">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Not Indexed</p>
          <p className="text-2xl font-semibold text-yellow-400 mt-2">{notIndexed}</p>
        </div>
        <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-5">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Blocked</p>
          <p className="text-2xl font-semibold text-red-400 mt-2">{blocked}</p>
        </div>
      </div>

      <div className="flex gap-4 mb-6 flex-wrap">
        <select className={selectClass} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          {TYPE_FILTERS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>
        <select className={selectClass} value={indexFilter} onChange={e => setIndexFilter(e.target.value)}>
          {INDEX_FILTERS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>
      </div>

      <div className="space-y-3">
        {pages.map(page => (
          <div key={page.id} className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-5">
            {editId === page.id ? (
              <div className="space-y-3">
                <input type="text" className={inputClass} value={editTitle} onChange={e => setEditTitle(e.target.value)} placeholder="Page title" />
                <textarea className={inputClass} rows={2} value={editDescription} onChange={e => setEditDescription(e.target.value)} placeholder="Meta description" />
                <div className="flex gap-4 items-center">
                  <select className={selectClass} value={editIndexStatus} onChange={e => setEditIndexStatus(e.target.value)}>
                    <option value="indexed">Indexed</option>
                    <option value="not_indexed">Not Indexed</option>
                    <option value="blocked">Blocked</option>
                  </select>
                  <button disabled={submitting} onClick={saveEdit} className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-900 text-xs font-medium transition-colors duration-150">Save</button>
                  <button onClick={() => setEditId(null)} className="px-3 py-1.5 rounded-lg border border-zinc-700 hover:border-zinc-600 text-zinc-300 text-xs font-medium transition-colors duration-150">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${indexStyles[page.indexStatus] || 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'}`}>{page.indexStatus.replace('_', ' ')}</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${typeStyles[page.pageType] || 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'}`}>{page.pageType.replace('_', ' ')}</span>
                  </div>
                  <p className="text-sm font-medium text-zinc-200 mb-1">{page.title}</p>
                  <p className="text-xs text-zinc-500">{page.path}</p>
                  <p className="text-xs text-zinc-600 mt-1">
                    Last crawled: {page.lastCrawledAt ? formatDistanceToNow(new Date(page.lastCrawledAt), { addSuffix: true }) : 'Never'}
                  </p>
                </div>
                <button onClick={() => startEdit(page)} className="px-3 py-1.5 rounded-lg border border-zinc-700 hover:border-zinc-600 text-zinc-300 text-xs font-medium transition-colors duration-150 ml-4 shrink-0">Edit</button>
              </div>
            )}
          </div>
        ))}

        {pages.length === 0 && !loading && (
          <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-8 text-center">
            <p className="text-zinc-500">No SEO pages found. Run the seed script to generate them.</p>
          </div>
        )}
      </div>
    </div>
  );
}
