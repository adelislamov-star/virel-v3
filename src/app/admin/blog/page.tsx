'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Trash2, Eye, Pencil } from 'lucide-react';
import type { BlogPost } from '@/types/blog';

const categoryLabels: Record<string, string> = {
  guide: 'London Guide',
  lifestyle: 'Lifestyle',
  occasions: 'Occasions',
  news: 'Agency News',
};

const categoryStyles: Record<string, string> = {
  guide: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  lifestyle: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  occasions: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  news: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
};

export default function BlogListPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams();
      if (categoryFilter) params.set('category', categoryFilter);
      if (statusFilter) params.set('isPublished', statusFilter);
      if (search) params.set('search', search);

      const res = await fetch(`/api/v1/blog?${params}`);
      const json = await res.json();
      if (json.success) {
        setPosts(json.data);
      } else {
        setError(json.error || 'Failed to load posts');
      }
    } catch {
      setError('Failed to load posts');
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, statusFilter, search]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSearchChange = (value: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearch(value);
    }, 300);
  };

  const handleNewPost = async () => {
    try {
      setCreating(true);
      const res = await fetch('/api/v1/blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Untitled Post', category: 'guide' }),
      });
      const json = await res.json();
      if (json.success && json.data?.id) {
        router.push(`/admin/blog/${json.data.id}`);
      } else {
        showToast(json.error || 'Failed to create post', 'error');
      }
    } catch {
      showToast('Failed to create post', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This action cannot be undone.`)) return;

    try {
      const res = await fetch(`/api/v1/blog/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        showToast('Post deleted', 'success');
        load();
      } else {
        showToast(json.error || 'Failed to delete', 'error');
      }
    } catch {
      showToast('Failed to delete post', 'error');
    }
  };

  // Stats
  const totalPosts = posts.length;
  const publishedCount = posts.filter((p) => p.isPublished).length;
  const draftCount = posts.filter((p) => !p.isPublished).length;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-[100] px-4 py-2 rounded-lg text-sm font-medium shadow-lg ${
            toast.type === 'success'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'bg-red-500/20 text-red-400 border border-red-500/30'
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Blog</h1>
          <p className="text-zinc-400 text-sm mt-1">Editorial content and London guides</p>
        </div>
        <button
          onClick={handleNewPost}
          disabled={creating}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          {creating ? 'Creating...' : 'New Post'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <p className="text-zinc-400 text-xs uppercase tracking-wider">Total Posts</p>
          <p className="text-2xl font-bold mt-1">{totalPosts}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <p className="text-zinc-400 text-xs uppercase tracking-wider">Published</p>
          <p className="text-2xl font-bold mt-1 text-emerald-400">{publishedCount}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <p className="text-zinc-400 text-xs uppercase tracking-wider">Drafts</p>
          <p className="text-2xl font-bold mt-1 text-zinc-400">{draftCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-6">
        <div className="flex flex-wrap gap-3">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200"
          >
            <option value="">All Categories</option>
            <option value="guide">London Guide</option>
            <option value="lifestyle">Lifestyle</option>
            <option value="occasions">Occasions</option>
            <option value="news">Agency News</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200"
          >
            <option value="">All Status</option>
            <option value="true">Published</option>
            <option value="false">Draft</option>
          </select>

          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search posts..."
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-9 pr-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-500"
            />
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-zinc-500">Loading...</div>
        ) : posts.length === 0 ? (
          <div className="p-8 text-center text-zinc-500">No posts found</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400 text-xs uppercase tracking-wider">
                <th className="text-left px-4 py-3">Title</th>
                <th className="text-left px-4 py-3">Category</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Published</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-zinc-200 truncate max-w-[300px]">{post.title}</p>
                    <p className="text-xs text-zinc-500 mt-0.5 truncate max-w-[300px]">{post.slug}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block text-xs px-2 py-0.5 rounded border ${
                        categoryStyles[post.category] || 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
                      }`}
                    >
                      {categoryLabels[post.category] || post.category}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block text-xs px-2 py-0.5 rounded border ${
                        post.isPublished
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
                      }`}
                    >
                      {post.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-400">
                    {post.publishedAt
                      ? new Date(post.publishedAt).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })
                      : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => router.push(`/admin/blog/${post.id}`)}
                        className="p-1.5 rounded hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (post.isPublished) {
                            window.open(`/blog/${post.slug}`, '_blank');
                          }
                        }}
                        disabled={!post.isPublished}
                        className="p-1.5 rounded hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Preview"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(post.id, post.title)}
                        className="p-1.5 rounded hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
