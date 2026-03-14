// MODEL PROFILE EDIT PAGE — Vertical sections layout
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import BasicInfoTab from '@/components/models/tabs/BasicInfoTab';
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

export default function ModelEditPage() {
  const params = useParams();
  const modelId = params.id as string;

  const [deleting, setDeleting] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [model, setModel] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'loading' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'loading') => {
    setToast({ message, type });
  }, []);

  const loadModel = useCallback(async () => {
    try {
      const res = await fetch(`/api/v1/models/${modelId}`);
      const data = await res.json();
      if (data.success) {
        setModel(data.data.model);
      }
    } catch (error) {
      console.error('Failed to load model:', error);
    } finally {
      setLoading(false);
    }
  }, [modelId]);

  useEffect(() => { loadModel(); }, [loadModel]);

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
    return <div className="p-6 text-zinc-400">Model not found</div>;
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
            <Badge variant={model.status === 'active' || model.status === 'published' ? 'default' : 'secondary'}>
              {model.status}
            </Badge>
            <Badge variant="outline">{model.visibility}</Badge>
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

      {/* Section: Basic Info (existing component) */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-800">
          <h2 className="text-base font-semibold text-white">Basic Info</h2>
        </div>
        <div className="p-6">
          <BasicInfoTab model={model} onSave={saveModel} saving={saving} />
        </div>
      </div>

      {/* Section: Contact */}
      <Contact model={model} modelId={modelId} onToast={showToast} onModelUpdate={loadModel} />

      {/* Section 1: Physical Stats */}
      <PhysicalStats model={model} modelId={modelId} onToast={showToast} />

      {/* Section 2: Marketing & Presentation */}
      <Marketing model={model} modelId={modelId} onToast={showToast} onModelUpdate={loadModel} />

      {/* Section 3: Wardrobe */}
      <Wardrobe model={model} modelId={modelId} onToast={showToast} />

      {/* Section 4: Locations */}
      <Locations modelId={modelId} onToast={showToast} />

      {/* Section 5: Services */}
      <Services modelId={modelId} onToast={showToast} />

      {/* Section 6: Rates */}
      <Rates modelId={modelId} onToast={showToast} />

      {/* Section: Payment Methods */}
      <PaymentMethods model={model} modelId={modelId} onToast={showToast} onModelUpdate={loadModel} />

      {/* Section 7: Availability */}
      <Availability modelId={modelId} onToast={showToast} />

      {/* Section 8: AI Tools */}
      <AITools model={model} modelId={modelId} onToast={showToast} onModelUpdate={loadModel} />

      {/* Section: Media (existing component) */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-800">
          <h2 className="text-base font-semibold text-white">Media</h2>
        </div>
        <div className="p-6">
          <MediaTab model={model} />
        </div>
      </div>
    </div>
  );
}
