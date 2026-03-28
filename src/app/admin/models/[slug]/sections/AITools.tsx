'use client';

import { useState } from 'react';
import { Sparkles, CheckCircle, XCircle } from 'lucide-react';
import SectionCard from './SectionCard';

interface Props {
  model: Record<string, unknown>;
  modelId: string;
  onToast: (msg: string, type: 'success' | 'error' | 'loading') => void;
  onModelUpdate?: () => void;
}

export default function AITools({ model, modelId, onToast, onModelUpdate }: Props) {
  // Bio generation
  const [bioGenerating, setBioGenerating] = useState(false);
  const [bioResult, setBioResult] = useState<{ bio: string; tagline: string } | null>(null);
  const [bioApplying, setBioApplying] = useState(false);

  // Photo verification
  const [profilePhotoUrl, setProfilePhotoUrl] = useState('');
  const [selfiePhotoUrl, setSelfiePhotoUrl] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{ isVerified: boolean; confidence: number; note: string } | null>(null);

  // SEO generation
  const [seoGenerating, setSeoGenerating] = useState(false);

  // Generate Bio
  const handleGenerateBio = async () => {
    setBioGenerating(true);
    setBioResult(null);
    try {
      const res = await fetch(`/api/v1/models/${modelId}/generate-bio`, { method: 'POST' });
      if (res.status === 503) {
        onToast('AI not configured. Please add ANTHROPIC_API_KEY.', 'error');
        return;
      }
      const json = await res.json();
      if (json.success) {
        setBioResult(json.data);
        onToast('Bio generated', 'success');
      } else {
        onToast(json.error?.message || 'Generation failed', 'error');
      }
    } catch {
      onToast('Something went wrong', 'error');
    } finally {
      setBioGenerating(false);
    }
  };

  const handleApplyBio = async () => {
    if (!bioResult) return;
    setBioApplying(true);
    try {
      const res = await fetch(`/api/v1/models/${modelId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          basicInfo: { notesInternal: bioResult.bio },
          profile: { tagline: bioResult.tagline },
        }),
      });
      const json = await res.json();
      if (json.success) {
        onToast('Bio applied', 'success');
        setBioResult(null);
        onModelUpdate?.();
      } else {
        onToast('Failed to apply', 'error');
      }
    } catch {
      onToast('Something went wrong', 'error');
    } finally {
      setBioApplying(false);
    }
  };

  // Verify Photos
  const handleVerifyPhotos = async () => {
    if (!profilePhotoUrl || !selfiePhotoUrl) {
      onToast('Both photo URLs are required', 'error');
      return;
    }
    setVerifying(true);
    setVerifyResult(null);
    try {
      const res = await fetch(`/api/v1/models/${modelId}/verify-photos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profilePhotoUrl, selfiePhotoUrl }),
      });
      if (res.status === 503) {
        onToast('AI not configured. Please add ANTHROPIC_API_KEY.', 'error');
        return;
      }
      const json = await res.json();
      if (json.success) {
        setVerifyResult(json.data);
        if (json.data.isVerified) {
          onToast('Photo verification passed', 'success');
          onModelUpdate?.();
        } else {
          onToast('Photo verification failed', 'error');
        }
      } else {
        onToast(json.error?.message || 'Verification failed', 'error');
      }
    } catch {
      onToast('Something went wrong', 'error');
    } finally {
      setVerifying(false);
    }
  };

  // Generate SEO
  const handleGenerateSeo = async () => {
    setSeoGenerating(true);
    try {
      // Use generate-bio endpoint approach — but for SEO we'll update via profile
      const res = await fetch(`/api/v1/models/${modelId}/generate-bio`, { method: 'POST' });
      if (res.status === 503) {
        onToast('AI not configured. Please add ANTHROPIC_API_KEY.', 'error');
        return;
      }
      const json = await res.json();
      if (json.success) {
        // Generate SEO from the model data
        const name = model.name as string;
        const tagline = (model.tagline as string) || json.data.tagline || '';
        const seoTitle = `${name} - Elite Companion London | Vaurel`.slice(0, 60);
        const seoDesc = tagline ? `Meet ${name}. ${tagline}. Available for exclusive encounters in London.`.slice(0, 155) : `Meet ${name}. Available for exclusive encounters in London.`.slice(0, 155);

        await fetch(`/api/v1/models/${modelId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profile: { seoTitle, seoDescription: seoDesc } }),
        });

        onToast('SEO generated and applied', 'success');
        onModelUpdate?.();
      } else {
        onToast('Generation failed', 'error');
      }
    } catch {
      onToast('Something went wrong', 'error');
    } finally {
      setSeoGenerating(false);
    }
  };

  const isAlreadyVerified = model.isVerified as boolean;

  return (
    <SectionCard title="AI Tools">
      <div className="space-y-6">
        {/* Generate Bio */}
        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-medium text-zinc-200 flex items-center gap-2">
              <Sparkles size={14} className="text-purple-400" /> Generate Bio
            </h3>
            <p className="text-xs text-zinc-500 mt-1">
              AI writes a sophisticated 150-200 word bio based on model profile.
              Requires: Name, Nationality or Age filled in Basic Info.
            </p>
          </div>
          <button
            onClick={handleGenerateBio}
            disabled={bioGenerating}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white rounded-lg text-sm font-medium transition-colors"
          >
            {bioGenerating ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Sparkles size={14} />}
            Generate Bio
          </button>

          {bioResult && (
            <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Generated Bio</h4>
                <div className="flex gap-2">
                  <button
                    onClick={handleApplyBio}
                    disabled={bioApplying}
                    className="px-3 py-1 text-xs rounded bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-50"
                  >
                    Apply
                  </button>
                  <button onClick={() => setBioResult(null)} className="px-3 py-1 text-xs rounded bg-zinc-700 text-zinc-300 hover:bg-zinc-600">
                    Discard
                  </button>
                </div>
              </div>
              <p className="text-sm text-zinc-300 leading-relaxed">{bioResult.bio}</p>
              <p className="text-xs text-zinc-400">Tagline: <span className="text-zinc-200">{bioResult.tagline}</span></p>
            </div>
          )}
        </div>

        <div className="h-px bg-zinc-800" />

        {/* Verify Photos */}
        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-medium text-zinc-200 flex items-center gap-2">
              <Sparkles size={14} className="text-purple-400" /> Verify Photos
            </h3>
            <p className="text-xs text-zinc-500 mt-1">
              AI compares profile photo with selfie to confirm same person.
              Requires: at least 2 photos uploaded.
            </p>
          </div>
          {isAlreadyVerified && (
            <div className="flex items-center gap-2 text-emerald-400 text-xs">
              <CheckCircle size={14} />
              This model is already verified
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Profile Photo URL</label>
              <input
                type="text"
                value={profilePhotoUrl}
                onChange={(e) => setProfilePhotoUrl(e.target.value)}
                placeholder="https://..."
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-zinc-500"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Selfie URL</label>
              <input
                type="text"
                value={selfiePhotoUrl}
                onChange={(e) => setSelfiePhotoUrl(e.target.value)}
                placeholder="https://..."
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-zinc-500"
              />
            </div>
          </div>
          <button
            onClick={handleVerifyPhotos}
            disabled={verifying || !profilePhotoUrl || !selfiePhotoUrl}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white rounded-lg text-sm font-medium transition-colors"
          >
            {verifying ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Sparkles size={14} />}
            Verify Photos
          </button>

          {verifyResult && (
            <div className={`flex items-center gap-2 text-sm ${verifyResult.isVerified ? 'text-emerald-400' : 'text-red-400'}`}>
              {verifyResult.isVerified ? <CheckCircle size={16} /> : <XCircle size={16} />}
              {verifyResult.isVerified ? 'Verified' : 'Not verified'} ({verifyResult.confidence}% confidence). {verifyResult.note}
            </div>
          )}
        </div>

        <div className="h-px bg-zinc-800" />

        {/* Generate SEO */}
        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-medium text-zinc-200 flex items-center gap-2">
              <Sparkles size={14} className="text-purple-400" /> Generate SEO
            </h3>
            <p className="text-xs text-zinc-500 mt-1">
              AI generates SEO title and description for this model&apos;s profile page.
            </p>
          </div>
          <button
            onClick={handleGenerateSeo}
            disabled={seoGenerating}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white rounded-lg text-sm font-medium transition-colors"
          >
            {seoGenerating ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Sparkles size={14} />}
            Generate SEO
          </button>
        </div>
      </div>
    </SectionCard>
  );
}
