// MODEL PROFILE EDIT PAGE — Vertical sections layout
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Phone, MessageCircle, ExternalLink, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';

import { useRevalidate } from '@/hooks/useRevalidate';
import BasicInfoTab from '@/components/models/tabs/BasicInfoTab';
import BasicInfoAndContact from './sections/BasicInfoAndContact';
import MediaTab from '@/components/models/tabs/MediaTab';

import PhysicalStats from './sections/PhysicalStats';
import Marketing from './sections/Marketing';
import Wardrobe from './sections/Wardrobe';
import Locations from './sections/Locations';
import Services from './sections/Services';
import Rates from './sections/Rates';
import Availability from './sections/Availability';
import Contact from './sections/Contact';
import PaymentMethods from './sections/PaymentMethods';
import AITools from './sections/AITools';

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

const NAV_SECTIONS = [
  { id: 'basic',    label: 'Basic & Contact' },
  { id: 'physical', label: 'Physical' },
  { id: 'marketing',label: 'Marketing' },
  { id: 'wardrobe', label: 'Wardrobe' },
  { id: 'locations',label: 'Locations' },
  { id: 'services', label: 'Services' },
  { id: 'rates',    label: 'Rates' },
  { id: 'payment',  label: 'Payment' },
  { id: 'availability', label: 'Availability' },
] as const;

export default function ModelEditPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [deleting, setDeleting] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [publishAudit, setPublishAudit] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [model, setModel] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirtySections, setDirtySections] = useState<Set<string>>(new Set());
  const markDirty = (section: string) => setDirtySections(prev => new Set(prev).add(section));
  const markClean = (section: string) => setDirtySections(prev => { const next = new Set(prev); next.delete(section); return next; });
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'loading' } | null>(null);

  const { revalidate } = useRevalidate();

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'loading') => {
    setToast({ message, type });
  }, []);

  const [loadError, setLoadError] = useState<string | null>(null);

  // Database ID derived from loaded model — used for all write API calls
  const modelId: string = model?.id ?? '';

  const loadModel = useCallback(async () => {
    try {
      // Fetch by slug — API GET accepts both id and slug
      const res = await fetch(`/api/v1/models/${slug}`);
      const data = await res.json();
      if (data.success) {
        setModel(data.data.model);
        setLoadError(null);
      } else {
        setLoadError(data.error?.message || `Failed to load model (${res.status})`);
      }
    } catch (error) {
      console.error('Failed to load model:', error);
      setLoadError('Network error loading model');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => { loadModel(); }, [loadModel]);

  useEffect(() => {
    if (!modelId) return;
    fetch(`/api/v1/models/${modelId}/publish-check`, { credentials: 'include' })
      .then(r => r.json())
      .then(j => { if (j.success) setPublishAudit(j.data); })
      .catch(() => {});
  }, [modelId, model]);

  async function deleteModel() {
    if (!confirm(`DELETE "${model?.name}"?\n\nThis will permanently remove the profile and ALL photos from storage.`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/v1/models/${modelId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast('Model deleted', 'success');
        window.location.href = '/admin/models';
      } else {
        showToast(data.error?.message || 'Delete failed', 'error');
        setDeleting(false);
      }
    } catch {
      showToast('Delete failed', 'error');
      setDeleting(false);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function saveModel(updates: any) {
    setSaving(true);
    try {
      const res = await fetch(`/api/v1/models/${modelId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Saved successfully', 'success');
        // Auto-revalidate model page and homepage
        if (model?.slug) {
          revalidate(`/companions/${model.slug}`);
          revalidate('/');
        }
        loadModel();
      } else {
        showToast(data.error?.message || 'Save failed', 'error');
      }
    } catch {
      showToast('Save failed', 'error');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[200px]">
        <div className="flex items-center gap-3 text-zinc-400">
          <div className="w-5 h-5 border-2 border-zinc-600 border-t-zinc-300 rounded-full animate-spin" />
          Loading model...
        </div>
      </div>
    );
  }

  if (!model) {
    return (
      <div className="p-6 text-zinc-400">
        {loadError || 'Model not found'}
        {loadError && (
          <button onClick={() => { setLoading(true); loadModel(); }} className="ml-4 text-blue-400 underline">
            Retry
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{model.name}</h1>
          <div className="flex items-center gap-2 mt-2">
            <Badge>{model.publicCode}</Badge>
            <Badge variant={model.status === 'active' ? 'default' : 'secondary'}>
              {model.status}
            </Badge>
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => {
              const url = `${window.location.origin}/companions/${model.slug}`;
              navigator.clipboard.writeText(url);
              showToast('Profile link copied', 'success');
            }}
          >
            Copy Link
          </Button>
          <Button
            variant="outline"
            onClick={() => window.open(`/companions/${model.slug}`, '_blank')}
          >
            Preview
          </Button>
          <Button
            variant="destructive"
            onClick={deleteModel}
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Delete Profile'}
          </Button>
          <Button
            variant="outline"
            onClick={() => window.location.href = '/admin/models'}
          >
            Back to Models
          </Button>
        </div>
      </div>

      {/* Publish Readiness — compact chip row */}
      {publishAudit && (
        <div className={`rounded-xl px-4 py-2.5 flex items-center gap-3 border ${publishAudit.ready ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-amber-500/5 border-amber-500/20'}`}>
          <span className={`text-xs font-semibold whitespace-nowrap ${publishAudit.ready ? 'text-emerald-400' : 'text-amber-400'}`}>
            {publishAudit.ready ? '✅ Ready' : `⚠️ ${publishAudit.score}%`}
          </span>
          <div className="flex flex-wrap gap-1.5 flex-1">
            {publishAudit.checks.map((check: any) => (
              <span
                key={check.key}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                  check.passed
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-red-500/10 text-red-400 border-red-500/20'
                }`}
                title={check.passed ? (check.dbCount > 1 ? `${check.dbCount} items` : 'Passed') : check.hint}
              >
                {check.passed ? '✓' : '✗'} {check.label}
              </span>
            ))}
          </div>
          <span className="text-[11px] text-zinc-500 whitespace-nowrap">
            {publishAudit.checks.filter((c: any) => c.passed).length}/{publishAudit.checks.length}
          </span>
        </div>
      )}

      {/* Main layout: sticky nav + content */}
      <div className="flex gap-4 items-start">

        {/* Sticky sidebar nav */}
        <div className="hidden lg:block w-32 flex-shrink-0" style={{ position: 'sticky', top: '1rem', alignSelf: 'flex-start' }}>
          <nav className="bg-zinc-900 border border-zinc-800 rounded-xl p-2 space-y-0.5">
            {NAV_SECTIONS.map(({ id, label }) => (
              <a
                key={id}
                href={`#${id}`}
                onClick={(e) => { e.preventDefault(); document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}
                className="flex items-center justify-between px-3 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors group"
              >
                <span>{label}</span>
                {dirtySections.has(id) && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                )}
              </a>
            ))}
          </nav>
        </div>

        {/* Sections */}
        <div className="flex-1 space-y-4 min-w-0">

      <div id="basic">
          <BasicInfoAndContact
            model={model}
            modelId={modelId}
            onSave={saveModel}
            saving={saving}
            onToast={showToast}
            onModelUpdate={loadModel}
            onDirty={() => markDirty('basic')}
          />
        </div>

      <div id="physical">
        <PhysicalStats model={model} modelId={modelId} onToast={showToast} />
      </div>

      <div id="marketing">
        <Marketing model={model} modelId={modelId} onToast={showToast} onModelUpdate={loadModel} />
      </div>

      <div id="wardrobe">
        <Wardrobe model={model} modelId={modelId} onToast={showToast} />
      </div>

      <div id="locations">
        <Locations modelId={modelId} onToast={showToast} />
      </div>

      <div id="services">
        <Services modelId={modelId} onToast={showToast} />
      </div>

      <div id="rates">
        <Rates modelId={modelId} onToast={showToast} />
      </div>

      <div id="payment">
        <PaymentMethods model={model} modelId={modelId} onToast={showToast} onModelUpdate={loadModel} />
      </div>

      <div id="availability">
        <Availability modelId={modelId} onToast={showToast} />
      </div>

      {/* Section: AI Tools */}
      <AITools model={model} modelId={modelId} onToast={showToast} onModelUpdate={loadModel} />

      {/* Section: Media */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="px-4 py-2.5 border-b border-zinc-800">
          <h2 className="text-base font-semibold text-white">Media</h2>
        </div>
        <div className="p-4">
          <MediaTab model={model} />
        </div>
      </div>

        </div>{/* end sections */}
      </div>{/* end flex layout */}

      {/* Floating Action Bar */}
      {model && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-zinc-900 border border-zinc-700 rounded-2xl px-4 py-2.5 shadow-2xl shadow-black/50">
          {/* Call */}
          {model.phone && (
            <a
              href={`tel:${model.phone}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-medium transition-colors"
              title="Call model"
            >
              <Phone size={13} />
              Call
            </a>
          )}
          {/* WhatsApp */}
          {model.whatsapp && model.phone && (
            <a
              href={`https://wa.me/${model.phone?.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors"
              title="WhatsApp"
            >
              <MessageCircle size={13} />
              WhatsApp
            </a>
          )}
          {/* Telegram */}
          {model.telegram && model.telegramTag && (
            <a
              href={`https://t.me/${model.telegramTag}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors"
              title="Telegram"
            >
              <Send size={13} />
              Telegram
            </a>
          )}
          {/* Divider */}
          <div className="w-px h-5 bg-zinc-700" />
          {/* View on site */}
          <a
            href={`/companions/${model.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-900 text-xs font-medium transition-colors"
            title="View on site"
          >
            <ExternalLink size={13} />
            View site
          </a>
        </div>
      )}
    </div>
  );
}
