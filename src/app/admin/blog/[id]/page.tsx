'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Eye, Save, Send, Sparkles, X, Plus } from 'lucide-react';
import { useRevalidate } from '@/hooks/useRevalidate';
import type { BlogPost } from '@/types/blog';

type District = { id: string; name: string };
type Service = { id: string; title: string };

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

export default function BlogEditorPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.id as string;

  // Post fields
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugManual, setSlugManual] = useState(false);
  const [slugEditing, setSlugEditing] = useState(false);
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [category, setCategory] = useState('guide');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [relatedDistricts, setRelatedDistricts] = useState<string[]>([]);
  const [relatedServices, setRelatedServices] = useState<string[]>([]);

  // Reference data
  const [districts, setDistricts] = useState<District[]>([]);
  const [services, setServices] = useState<Service[]>([]);

  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [autoSaveTime, setAutoSaveTime] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [districtsOpen, setDistrictsOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);

  // AI generation
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiPreview, setAiPreview] = useState<{ title: string; excerpt: string; content: string } | null>(null);

  const { revalidate, isRevalidating, revalidateStatus } = useRevalidate();
  const dirtyRef = useRef(false);
  const autoSaveRef = useRef<ReturnType<typeof setTimeout>>();

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const markDirty = useCallback(() => {
    setDirty(true);
    dirtyRef.current = true;
    setAutoSaveTime(null);
  }, []);

  // Load post
  useEffect(() => {
    const loadPost = async () => {
      try {
        const res = await fetch(`/api/v1/blog/${postId}`);
        const json = await res.json();
        if (json.success && json.data) {
          const p: BlogPost = json.data;
          setTitle(p.title);
          setSlug(p.slug);
          setExcerpt(p.excerpt || '');
          setContent(p.content);
          setCoverImage(p.coverImage || '');
          setCategory(p.category);
          setTags(p.tags || []);
          setSeoTitle(p.seoTitle || '');
          setSeoDescription(p.seoDescription || '');
          setAuthorName(p.authorName || '');
          setIsPublished(p.isPublished);
          setRelatedDistricts(p.relatedDistricts || []);
          setRelatedServices(p.relatedServices || []);
        } else {
          showToast('Failed to load post', 'error');
        }
      } catch {
        showToast('Failed to load post', 'error');
      } finally {
        setLoading(false);
      }
    };
    loadPost();
  }, [postId]);

  // Load districts and services
  useEffect(() => {
    const loadRefs = async () => {
      try {
        const [dRes, sRes] = await Promise.all([
          fetch('/api/v1/districts'),
          fetch('/api/v1/services'),
        ]);
        const dJson = await dRes.json();
        const sJson = await sRes.json();
        if (dJson.success) setDistricts(dJson.data || []);
        if (sJson.success) setServices(sJson.data?.services || []);
      } catch {
        // silent
      }
    };
    loadRefs();
  }, []);

  // Auto-generate slug from title
  useEffect(() => {
    if (!slugManual && title) {
      setSlug(generateSlug(title));
    }
  }, [title, slugManual]);

  // Auto-save every 60s
  useEffect(() => {
    autoSaveRef.current = setInterval(() => {
      if (dirtyRef.current) {
        handleSave(false, true);
      }
    }, 60000);
    return () => {
      if (autoSaveRef.current) clearInterval(autoSaveRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  const buildPayload = (publish: boolean) => ({
    title,
    slug,
    excerpt: excerpt || null,
    content,
    coverImage: coverImage || null,
    category,
    tags,
    seoTitle: seoTitle || null,
    seoDescription: seoDescription || null,
    authorName: authorName || null,
    isPublished: publish,
    relatedDistricts,
    relatedServices,
  });

  const handleSave = async (publish: boolean, isAutoSave = false) => {
    if (publish) {
      if (!title.trim()) {
        showToast('Title is required to publish', 'error');
        return;
      }
      if (!content.trim()) {
        showToast('Content is required to publish', 'error');
        return;
      }
      if (!confirm('Publish this post? It will be visible to all visitors.')) return;
    }

    const setter = publish ? setPublishing : setSaving;
    setter(true);

    try {
      const res = await fetch(`/api/v1/blog/${postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload(publish)),
      });
      const json = await res.json();
      if (json.success) {
        setDirty(false);
        dirtyRef.current = false;
        if (publish) setIsPublished(true);
        // Auto-revalidate blog pages
        if (!isAutoSave) {
          revalidate(`/blog/${slug}`);
          revalidate('/blog');
        }
        if (isAutoSave) {
          const now = new Date();
          setAutoSaveTime(
            now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
          );
        } else {
          showToast(publish ? 'Post published!' : 'Draft saved', 'success');
        }
      } else {
        showToast(json.error || 'Failed to save', 'error');
      }
    } catch {
      showToast('Failed to save', 'error');
    } finally {
      setter(false);
    }
  };

  const handleAiGenerate = async () => {
    setAiGenerating(true);
    try {
      const res = await fetch(`/api/v1/blog/${postId}/generate`, { method: 'POST' });
      const json = await res.json();
      if (json.success && json.data) {
        setAiPreview({
          title: json.data.title || '',
          excerpt: json.data.excerpt || '',
          content: json.data.content || '',
        });
      } else {
        showToast(json.error || 'AI generation failed', 'error');
      }
    } catch {
      showToast('AI generation failed', 'error');
    } finally {
      setAiGenerating(false);
    }
  };

  const applyAiContent = () => {
    if (!aiPreview) return;
    setTitle(aiPreview.title);
    setExcerpt(aiPreview.excerpt);
    setContent(aiPreview.content);
    setAiPreview(null);
    markDirty();
  };

  const addTag = (value: string) => {
    const tag = value.trim().toLowerCase();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
      markDirty();
    }
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
    markDirty();
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(tagInput);
    }
  };

  const toggleDistrict = (id: string) => {
    setRelatedDistricts((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
    markDirty();
  };

  const toggleService = (id: string) => {
    setRelatedServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
    markDirty();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center">
        <p className="text-zinc-500">Loading post...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
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

      {/* Top Bar */}
      <div className="sticky top-0 z-50 bg-zinc-950/80 backdrop-blur border-b border-zinc-800 px-6 py-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push('/admin/blog')}
            className="flex items-center gap-2 text-zinc-400 hover:text-zinc-200 text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Blog
          </button>

          <div className="flex items-center gap-3">
            {/* Auto-save status */}
            <span className="text-xs text-zinc-500">
              {dirty ? 'Unsaved changes' : autoSaveTime ? `Auto-saved at ${autoSaveTime}` : ''}
            </span>

            <button
              onClick={() => {
                if (isPublished) window.open(`/blog/${slug}`, '_blank');
              }}
              disabled={!isPublished}
              className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-zinc-700 text-zinc-300 hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <Eye className="w-4 h-4" />
              Preview
            </button>

            <button
              type="button"
              onClick={async () => {
                await revalidate(`/blog/${slug}`);
                await revalidate('/blog');
              }}
              disabled={isRevalidating}
              className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition-colors ${
                revalidateStatus === 'success'
                  ? 'bg-green-600 text-white'
                  : revalidateStatus === 'error'
                  ? 'bg-red-600 text-white'
                  : 'border border-zinc-700 text-zinc-300 hover:bg-zinc-800'
              }`}
            >
              {isRevalidating
                ? '⟳ Обновление...'
                : revalidateStatus === 'success'
                ? '✓ Обновлено!'
                : '🔄 Обновить сайт'}
            </button>

            <button
              onClick={() => handleSave(false)}
              disabled={saving}
              className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-zinc-700 text-zinc-300 hover:bg-zinc-800 disabled:opacity-50 transition-colors"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Draft'}
            </button>

            <button
              onClick={() => handleSave(true)}
              disabled={publishing}
              className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50 transition-colors"
            >
              <Send className="w-4 h-4" />
              {publishing ? 'Publishing...' : 'Publish'}
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Title */}
        <input
          type="text"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            markDirty();
          }}
          placeholder="Post title..."
          className="w-full bg-transparent text-3xl font-bold text-zinc-100 placeholder:text-zinc-600 outline-none mb-2"
        />

        {/* Slug */}
        <div className="flex items-center gap-2 mb-6 text-sm">
          <span className="text-zinc-500">Slug:</span>
          {slugEditing ? (
            <input
              type="text"
              value={slug}
              onChange={(e) => {
                setSlug(generateSlug(e.target.value));
                setSlugManual(true);
                markDirty();
              }}
              onBlur={() => setSlugEditing(false)}
              autoFocus
              className="bg-zinc-800 border border-zinc-700 rounded px-2 py-0.5 text-sm text-zinc-200 flex-1"
            />
          ) : (
            <>
              <span className="text-zinc-400">{slug || '—'}</span>
              <button
                onClick={() => setSlugEditing(true)}
                className="text-xs text-blue-400 hover:text-blue-300"
              >
                Edit
              </button>
            </>
          )}
        </div>

        {/* Two column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - 2/3 */}
          <div className="lg:col-span-2 space-y-6">
            {/* Cover Image */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <label className="block text-xs text-zinc-400 uppercase tracking-wider mb-2">
                Cover Image URL
              </label>
              <input
                type="text"
                value={coverImage}
                onChange={(e) => {
                  setCoverImage(e.target.value);
                  markDirty();
                }}
                placeholder="https://..."
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-500"
              />
              {coverImage && (
                <div className="mt-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={coverImage}
                    alt="Cover preview"
                    className="h-32 w-auto rounded-lg object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>

            {/* Excerpt */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <label className="block text-xs text-zinc-400 uppercase tracking-wider mb-2">
                Excerpt
              </label>
              <textarea
                value={excerpt}
                onChange={(e) => {
                  setExcerpt(e.target.value);
                  markDirty();
                }}
                placeholder="2-3 sentence summary..."
                rows={3}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-500 resize-none"
              />
            </div>

            {/* Content */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-zinc-400 uppercase tracking-wider">Content</label>
                <button
                  onClick={handleAiGenerate}
                  disabled={aiGenerating || !title.trim() || !category}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-purple-600/20 text-purple-400 hover:bg-purple-600/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {aiGenerating ? 'Generating...' : 'Generate with AI'}
                </button>
              </div>

              {/* AI Preview */}
              {aiPreview && (
                <div className="mb-4 bg-purple-500/5 border border-purple-500/20 rounded-lg p-4">
                  <p className="text-xs text-purple-400 font-medium mb-2">AI Generated Content</p>
                  <p className="text-sm text-zinc-300 mb-1">
                    <span className="text-zinc-500">Title:</span> {aiPreview.title}
                  </p>
                  <p className="text-sm text-zinc-300 mb-1">
                    <span className="text-zinc-500">Excerpt:</span> {aiPreview.excerpt}
                  </p>
                  <p className="text-sm text-zinc-400 line-clamp-3 mb-3">
                    {aiPreview.content.slice(0, 200)}...
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={applyAiContent}
                      className="text-xs px-3 py-1.5 rounded bg-purple-600 text-white hover:bg-purple-500 transition-colors"
                    >
                      Apply All
                    </button>
                    <button
                      onClick={() => setAiPreview(null)}
                      className="text-xs px-3 py-1.5 rounded border border-zinc-700 text-zinc-400 hover:bg-zinc-800 transition-colors"
                    >
                      Discard
                    </button>
                  </div>
                </div>
              )}

              <textarea
                value={content}
                onChange={(e) => {
                  setContent(e.target.value);
                  markDirty();
                }}
                placeholder="Write your post content..."
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-500 resize-y min-h-[400px]"
              />
            </div>
          </div>

          {/* Right column - 1/3 */}
          <div className="space-y-6">
            {/* Category */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <label className="block text-xs text-zinc-400 uppercase tracking-wider mb-2">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  markDirty();
                }}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200"
              >
                <option value="guide">London Guide</option>
                <option value="lifestyle">Lifestyle</option>
                <option value="occasions">Occasions</option>
                <option value="news">Agency News</option>
              </select>
            </div>

            {/* Tags */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <label className="block text-xs text-zinc-400 uppercase tracking-wider mb-2">
                Tags
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-zinc-700 text-zinc-200 text-xs px-2 py-0.5 rounded flex items-center gap-1"
                  >
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="text-zinc-400 hover:text-zinc-200"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder="Add tag (Enter or comma)"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-500"
              />
            </div>

            {/* Related Districts */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <label className="block text-xs text-zinc-400 uppercase tracking-wider mb-2">
                Related Districts
              </label>
              <div className="relative">
                <button
                  onClick={() => setDistrictsOpen(!districtsOpen)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 text-left flex items-center justify-between"
                >
                  <span>
                    {relatedDistricts.length > 0
                      ? `${relatedDistricts.length} selected`
                      : 'Select districts'}
                  </span>
                  <Plus className="w-4 h-4 text-zinc-400" />
                </button>
                {districtsOpen && (
                  <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-zinc-800 border border-zinc-700 rounded-lg max-h-48 overflow-y-auto shadow-xl">
                    {districts.map((d) => (
                      <label
                        key={d.id}
                        className="flex items-center gap-2 px-3 py-2 hover:bg-zinc-700 cursor-pointer text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={relatedDistricts.includes(d.id)}
                          onChange={() => toggleDistrict(d.id)}
                          className="rounded border-zinc-600"
                        />
                        <span className="text-zinc-200">{d.name}</span>
                      </label>
                    ))}
                    {districts.length === 0 && (
                      <p className="px-3 py-2 text-xs text-zinc-500">No districts available</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Related Services */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <label className="block text-xs text-zinc-400 uppercase tracking-wider mb-2">
                Related Services
              </label>
              <div className="relative">
                <button
                  onClick={() => setServicesOpen(!servicesOpen)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 text-left flex items-center justify-between"
                >
                  <span>
                    {relatedServices.length > 0
                      ? `${relatedServices.length} selected`
                      : 'Select services'}
                  </span>
                  <Plus className="w-4 h-4 text-zinc-400" />
                </button>
                {servicesOpen && (
                  <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-zinc-800 border border-zinc-700 rounded-lg max-h-48 overflow-y-auto shadow-xl">
                    {services.map((s) => (
                      <label
                        key={s.id}
                        className="flex items-center gap-2 px-3 py-2 hover:bg-zinc-700 cursor-pointer text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={relatedServices.includes(s.id)}
                          onChange={() => toggleService(s.id)}
                          className="rounded border-zinc-600"
                        />
                        <span className="text-zinc-200">{s.title}</span>
                      </label>
                    ))}
                    {services.length === 0 && (
                      <p className="px-3 py-2 text-xs text-zinc-500">No services available</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Author */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <label className="block text-xs text-zinc-400 uppercase tracking-wider mb-2">
                Author Name
              </label>
              <input
                type="text"
                value={authorName}
                onChange={(e) => {
                  setAuthorName(e.target.value);
                  markDirty();
                }}
                placeholder="Author name"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-500"
              />
            </div>

            {/* SEO */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <label className="block text-xs text-zinc-400 uppercase tracking-wider mb-3">
                SEO
              </label>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-zinc-500">SEO Title</span>
                    <span
                      className={`text-xs ${
                        seoTitle.length > 60 ? 'text-red-400' : 'text-zinc-500'
                      }`}
                    >
                      {seoTitle.length}/60
                    </span>
                  </div>
                  <input
                    type="text"
                    value={seoTitle}
                    onChange={(e) => {
                      setSeoTitle(e.target.value);
                      markDirty();
                    }}
                    maxLength={60}
                    placeholder="SEO title"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-500"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-zinc-500">SEO Description</span>
                    <span
                      className={`text-xs ${
                        seoDescription.length > 155 ? 'text-red-400' : 'text-zinc-500'
                      }`}
                    >
                      {seoDescription.length}/155
                    </span>
                  </div>
                  <textarea
                    value={seoDescription}
                    onChange={(e) => {
                      setSeoDescription(e.target.value);
                      markDirty();
                    }}
                    maxLength={155}
                    rows={3}
                    placeholder="SEO description"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-500 resize-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
