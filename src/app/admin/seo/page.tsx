// SEO HEALTH PAGE
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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

function getTypeColor(type: string): any {
  const colors: Record<string, string> = { model_profile: 'default', geo_page: 'secondary', blog_post: 'outline', service_page: 'orange' };
  return colors[type] || 'default';
}

function getIndexColor(status: string): any {
  const colors: Record<string, string> = { indexed: 'default', not_indexed: 'yellow', blocked: 'destructive' };
  return colors[status] || 'default';
}

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

  // Stats
  const indexed = pages.filter(p => p.indexStatus === 'indexed').length;
  const notIndexed = pages.filter(p => p.indexStatus === 'not_indexed').length;
  const blocked = pages.filter(p => p.indexStatus === 'blocked').length;

  if (loading && pages.length === 0) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">🔍 SEO Health</h1>
        <p className="text-muted-foreground">{total} pages tracked</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Total Pages</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">{total}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Indexed</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold text-green-600">{indexed}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Not Indexed</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold text-yellow-600">{notIndexed}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Blocked</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold text-red-600">{blocked}</div></CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6 flex-wrap">
        <select
          className="rounded-md border p-2 text-sm bg-background"
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
        >
          {TYPE_FILTERS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>
        <select
          className="rounded-md border p-2 text-sm bg-background"
          value={indexFilter}
          onChange={e => setIndexFilter(e.target.value)}
        >
          {INDEX_FILTERS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>
      </div>

      {/* Pages List */}
      <div className="space-y-3">
        {pages.map(page => (
          <Card key={page.id}>
            <CardContent className="pt-6">
              {editId === page.id ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    className="w-full rounded-md border p-2 text-sm bg-background"
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                    placeholder="Page title"
                  />
                  <textarea
                    className="w-full rounded-md border p-2 text-sm bg-background"
                    rows={2}
                    value={editDescription}
                    onChange={e => setEditDescription(e.target.value)}
                    placeholder="Meta description"
                  />
                  <div className="flex gap-4 items-center">
                    <select
                      className="rounded-md border p-2 text-sm bg-background"
                      value={editIndexStatus}
                      onChange={e => setEditIndexStatus(e.target.value)}
                    >
                      <option value="indexed">Indexed</option>
                      <option value="not_indexed">Not Indexed</option>
                      <option value="blocked">Blocked</option>
                    </select>
                    <Button size="sm" disabled={submitting} onClick={saveEdit}>Save</Button>
                    <Button size="sm" variant="outline" onClick={() => setEditId(null)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={getIndexColor(page.indexStatus)}>{page.indexStatus.replace('_', ' ')}</Badge>
                      <Badge variant={getTypeColor(page.pageType)}>{page.pageType.replace('_', ' ')}</Badge>
                    </div>
                    <p className="font-semibold text-sm mb-1">{page.title}</p>
                    <p className="text-xs text-muted-foreground">{page.path}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Last crawled: {page.lastCrawledAt
                        ? formatDistanceToNow(new Date(page.lastCrawledAt), { addSuffix: true })
                        : 'Never'}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => startEdit(page)}>Edit</Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {pages.length === 0 && !loading && (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              No SEO pages found. Run the seed script to generate them.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
