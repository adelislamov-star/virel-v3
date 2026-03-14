'use client';

import { useState, useEffect, useCallback } from 'react';
import { Lock } from 'lucide-react';
import SectionCard from './SectionCard';

const PUBLIC_TAGS = [
  'Girlfriend Experience','Open-minded','Dinner Companion','Travel Partner',
  'Wellness Specialist','Fetish-friendly','Duo Available','Dominatrix',
  'Massage Specialist','Party Girl','Tantric Expert','BDSM Specialist',
];

const AVAILABILITY_STATUSES = [
  { value: 'Available Now', color: 'border-emerald-500 text-emerald-400 bg-emerald-500/10' },
  { value: 'Advanced Notice', color: 'border-yellow-500 text-yellow-400 bg-yellow-500/10' },
  { value: 'Away', color: 'border-orange-500 text-orange-400 bg-orange-500/10' },
  { value: 'On Holiday', color: 'border-zinc-500 text-zinc-400 bg-zinc-500/10' },
];

interface Props {
  model: Record<string, unknown>;
  onToast: (msg: string, type: 'success' | 'error') => void;
  modelId: string;
  onModelUpdate?: () => void;
}

export default function Marketing({ model, onToast, modelId, onModelUpdate }: Props) {
  const [tagline, setTagline] = useState<string>((model.tagline as string) || '');
  const [availability, setAvailability] = useState<string>((model.availability as string) || '');
  const [publicTags, setPublicTags] = useState<string[]>(() => {
    const t = model.publicTags;
    return Array.isArray(t) ? t : [];
  });
  const [duoPartnerIds, setDuoPartnerIds] = useState<string[]>(() => {
    const d = model.duoPartnerIds;
    return Array.isArray(d) ? d : [];
  });
  const [responseTime, setResponseTime] = useState<string>((model.responseTimeMin as string) || '');
  const [isExclusive, setIsExclusive] = useState<boolean>((model.isExclusive as boolean) || false);
  const [isVerified, setIsVerified] = useState<boolean>((model.isVerified as boolean) || false);
  const [seoTitle, setSeoTitle] = useState<string>((model.seoTitle as string) || '');
  const [seoDescription, setSeoDescription] = useState<string>((model.seoDescription as string) || '');
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Duo partners list
  const [allModels, setAllModels] = useState<{ id: string; name: string; coverPhotoUrl?: string }[]>([]);
  const [duoOpen, setDuoOpen] = useState(false);

  useEffect(() => {
    fetch('/api/v1/models?status=Active&limit=100')
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data?.models) {
          setAllModels(json.data.models.filter((m: { id: string }) => m.id !== modelId));
        }
      })
      .catch(() => {});
  }, [modelId]);

  useEffect(() => { setDirty(true); }, [tagline, availability, publicTags, duoPartnerIds, responseTime, isExclusive, isVerified, seoTitle, seoDescription]);
  useEffect(() => { setDirty(false); }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/v1/models/${modelId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile: {
            tagline,
            availability,
            publicTags,
            duoPartnerIds,
            responseTimeMin: responseTime ? parseInt(responseTime) : null,
            isExclusive,
            isVerified,
            seoTitle,
            seoDescription,
          },
        }),
      });
      const json = await res.json();
      if (json.success) {
        onToast('Marketing saved', 'success');
        setDirty(false);
        onModelUpdate?.();
      } else {
        onToast(json.error?.message || 'Save failed', 'error');
      }
    } catch {
      onToast('Something went wrong', 'error');
    } finally {
      setSaving(false);
    }
  }, [modelId, tagline, availability, publicTags, duoPartnerIds, responseTime, isExclusive, isVerified, seoTitle, seoDescription, onToast, onModelUpdate]);

  const wasVerifiedByAI = (model.isVerified as boolean) && !!(model.verificationNote as string);

  return (
    <SectionCard title="Marketing & Presentation" isDirty={dirty} saving={saving} onSave={handleSave}>
      <div className="space-y-5">
        {/* Tagline */}
        <div>
          <label className="block text-xs text-zinc-400 mb-1">Tagline</label>
          <input
            type="text"
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            placeholder="Slender Russian Blonde"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-zinc-500"
          />
        </div>

        {/* Availability Status */}
        <div>
          <label className="block text-xs text-zinc-400 mb-2">Availability Status</label>
          <div className="flex flex-wrap gap-2">
            {AVAILABILITY_STATUSES.map((s) => (
              <button
                key={s.value}
                onClick={() => setAvailability(s.value)}
                className={`px-4 py-2 text-sm rounded-lg border-2 transition-all ${
                  availability === s.value ? s.color + ' font-medium' : 'border-zinc-700 text-zinc-400 bg-zinc-800/50 hover:border-zinc-600'
                }`}
              >
                {s.value}
              </button>
            ))}
          </div>
        </div>

        {/* Public Tags */}
        <div>
          <label className="block text-xs text-zinc-400 mb-2">Public Tags</label>
          <div className="flex flex-wrap gap-2">
            {PUBLIC_TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => setPublicTags(publicTags.includes(tag) ? publicTags.filter((t) => t !== tag) : [...publicTags, tag])}
                className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                  publicTags.includes(tag) ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-600'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* DUO Partners */}
        <div className="relative">
          <label className="block text-xs text-zinc-400 mb-1">DUO Partners</label>
          <button
            onClick={() => setDuoOpen(!duoOpen)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-left min-h-[38px] flex flex-wrap gap-1 items-center"
          >
            {duoPartnerIds.length === 0 ? (
              <span className="text-zinc-500">Select partners...</span>
            ) : (
              duoPartnerIds.map((id) => {
                const m = allModels.find((x) => x.id === id);
                return (
                  <span key={id} className="inline-flex items-center gap-1 bg-zinc-700 text-zinc-200 text-xs px-2 py-0.5 rounded">
                    {m?.coverPhotoUrl && (
                      <img src={m.coverPhotoUrl} alt="" className="w-4 h-4 rounded-full object-cover" />
                    )}
                    {m?.name || id}
                  </span>
                );
              })
            )}
          </button>
          {duoOpen && (
            <div className="absolute z-20 mt-1 w-full bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl max-h-48 overflow-y-auto">
              {allModels.map((m) => (
                <label key={m.id} className="flex items-center gap-2 px-3 py-1.5 hover:bg-zinc-700 cursor-pointer text-sm text-zinc-200">
                  <input
                    type="checkbox"
                    checked={duoPartnerIds.includes(m.id)}
                    onChange={() => setDuoPartnerIds(duoPartnerIds.includes(m.id) ? duoPartnerIds.filter((x) => x !== m.id) : [...duoPartnerIds, m.id])}
                    className="accent-amber-500"
                  />
                  {m.coverPhotoUrl && <img src={m.coverPhotoUrl} alt="" className="w-5 h-5 rounded-full object-cover" />}
                  {m.name}
                </label>
              ))}
              <div className="border-t border-zinc-700 p-1">
                <button onClick={() => setDuoOpen(false)} className="w-full px-3 py-1 text-xs text-zinc-400 hover:text-zinc-200">Close</button>
              </div>
            </div>
          )}
        </div>

        {/* Response Time, Exclusive, Verified */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Response Time</label>
            <input
              type="text"
              value={responseTime}
              onChange={(e) => setResponseTime(e.target.value)}
              placeholder="15 min"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-zinc-500"
            />
          </div>
          <div className="flex items-end pb-1">
            <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
              <button
                onClick={() => setIsExclusive(!isExclusive)}
                className={`relative w-9 h-5 rounded-full transition-colors ${isExclusive ? 'bg-emerald-500' : 'bg-zinc-600'}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${isExclusive ? 'left-[18px]' : 'left-0.5'}`} />
              </button>
              Is Exclusive
            </label>
          </div>
          <div className="flex items-end pb-1">
            <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
              <button
                onClick={() => {
                  if (wasVerifiedByAI && isVerified) return; // Can't revoke AI verification
                  setIsVerified(!isVerified);
                }}
                className={`relative w-9 h-5 rounded-full transition-colors ${isVerified ? 'bg-emerald-500' : 'bg-zinc-600'} ${wasVerifiedByAI && isVerified ? 'opacity-60' : ''}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${isVerified ? 'left-[18px]' : 'left-0.5'}`} />
              </button>
              Is Verified
              {wasVerifiedByAI && isVerified && (
                <span title="Verified by AI. Cannot be manually revoked."><Lock size={12} className="text-zinc-500" /></span>
              )}
            </label>
          </div>
        </div>

        {/* SEO */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="flex items-center justify-between text-xs text-zinc-400 mb-1">
              <span>SEO Title</span>
              <span className={(seoTitle.length) > 60 ? 'text-red-400' : ''}>{seoTitle.length}/60</span>
            </label>
            <input
              type="text"
              value={seoTitle}
              onChange={(e) => setSeoTitle(e.target.value)}
              maxLength={60}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-zinc-500"
            />
          </div>
          <div>
            <label className="flex items-center justify-between text-xs text-zinc-400 mb-1">
              <span>SEO Description</span>
              <span className={(seoDescription.length) > 155 ? 'text-red-400' : ''}>{seoDescription.length}/155</span>
            </label>
            <textarea
              value={seoDescription}
              onChange={(e) => setSeoDescription(e.target.value)}
              maxLength={155}
              rows={2}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-zinc-500 resize-none"
            />
          </div>
        </div>
      </div>
    </SectionCard>
  );
}
