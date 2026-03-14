'use client';

import { useState, useEffect, useCallback } from 'react';
import SectionCard from './SectionCard';

const WARDROBE_OPTIONS = [
  'Schoolgirl','Secretary','Nurse','Bikini','Catsuit',
  'PVC','Lingerie','Corset','Latex','Stilettos','Bunny',
  'Stockings','Police','French Maid','Teacher','Stewardess','Housekeeper',
];

interface Props {
  model: Record<string, unknown>;
  onToast: (msg: string, type: 'success' | 'error') => void;
  modelId: string;
}

export default function Wardrobe({ model, onToast, modelId }: Props) {
  const [selected, setSelected] = useState<string[]>(() => {
    const w = model.wardrobe;
    return Array.isArray(w) ? w : [];
  });
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => { setDirty(true); }, [selected]);
  useEffect(() => { setDirty(false); }, []);

  const toggle = (item: string) => {
    setSelected((prev) => prev.includes(item) ? prev.filter((s) => s !== item) : [...prev, item]);
  };

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/v1/models/${modelId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: { wardrobe: selected } }),
      });
      const json = await res.json();
      if (json.success) {
        onToast('Wardrobe saved', 'success');
        setDirty(false);
      } else {
        onToast(json.error?.message || 'Save failed', 'error');
      }
    } catch {
      onToast('Something went wrong', 'error');
    } finally {
      setSaving(false);
    }
  }, [modelId, selected, onToast]);

  return (
    <SectionCard title="Wardrobe" isDirty={dirty} saving={saving} onSave={handleSave}>
      <p className="text-xs text-zinc-500 mb-3">Select available wardrobe options:</p>
      <div className="flex flex-wrap gap-2">
        {WARDROBE_OPTIONS.map((item) => (
          <button
            key={item}
            onClick={() => toggle(item)}
            className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
              selected.includes(item)
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 font-medium'
                : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-600'
            }`}
          >
            {item}
          </button>
        ))}
      </div>
    </SectionCard>
  );
}
