'use client';

import { useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import SectionCard from './SectionCard';

const BUST_SIZES = ['28AA','28A','28B','28C','28D','30A','30B','30C','30D','30DD','32A','32B','32C','32D','32DD','32E','34A','34B','34C','34D','34DD','34E','34F','36A','36B','36C','36D','36DD','36E','36F','38B','38C','38D','38DD','40C','40D','40DD','42D','42DD'];
const EYE_COLORS = ['Blue','Green','Brown','Hazel','Grey','Dark Brown','Black'];
const HAIR_COLORS = ['Blonde','Brunette','Light Brown','Redhead','Black','Other'];
const SMOKING_OPTS = ['Non-Smoker','Occasional','Regular'];
const TATTOO_OPTS = ['None','Few (1-3)','Several (4-6)','Many (7+)','Full sleeves'];
const PIERCING_OPTS = ['Ears','Belly','Nipples','Nose','Tongue','Eyebrow','Lip','Other'];
const ORIENTATION_OPTS = ['Heterosexual','Bisexual','Lesbian','Other'];
const LANGUAGE_OPTS = ['English','Russian','French','Spanish','Italian','Portuguese','Arabic','Mandarin','German','Polish','Romanian','Ukrainian','Other'];
const TRAVEL_OPTS = ['London only','UK & Europe','Worldwide'];

export interface PhysicalStatsHandle {
  save: () => Promise<boolean>;
}

interface Props {
  model: Record<string, unknown>;
  onToast: (msg: string, type: 'success' | 'error') => void;
  modelId: string;
}

function MultiSelect({ options, selected, onChange, label }: { options: string[]; selected: string[]; onChange: (v: string[]) => void; label: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <label className="block text-xs text-zinc-400 mb-1">{label}</label>
      <button
        onClick={() => setOpen(!open)}
        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-left text-zinc-200 focus:outline-none focus:border-zinc-500 min-h-[38px] flex flex-wrap gap-1 items-center"
      >
        {selected.length === 0 ? <span className="text-zinc-500">Select...</span> : selected.map((s) => (
          <span key={s} className="inline-flex items-center bg-zinc-700 text-xs px-2 py-0.5 rounded">{s}</span>
        ))}
      </button>
      {open && (
        <div className="absolute z-20 mt-1 w-full bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl max-h-48 overflow-y-auto">
          {options.map((opt) => (
            <label key={opt} className="flex items-center gap-2 px-3 py-1.5 hover:bg-zinc-700 cursor-pointer text-sm text-zinc-200">
              <input
                type="checkbox"
                checked={selected.includes(opt)}
                onChange={() => onChange(selected.includes(opt) ? selected.filter((s) => s !== opt) : [...selected, opt])}
                className="accent-amber-500"
              />
              {opt}
            </label>
          ))}
          <div className="border-t border-zinc-700 p-1">
            <button onClick={() => setOpen(false)} className="w-full px-3 py-1 text-xs text-zinc-400 hover:text-zinc-200">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

const PhysicalStats = forwardRef<PhysicalStatsHandle, Props>(function PhysicalStats({ model, onToast, modelId }, ref) {
  const stats = (model.stats || {}) as Record<string, unknown>;
  const [weight, setWeight] = useState<number | null>((stats.weight as number) || null);
  const [bustSize, setBustSize] = useState<string>((stats.bustSize as string) || '');
  const [bustType, setBustType] = useState<string>((stats.bustType as string) || '');
  const [eyeColor, setEyeColor] = useState<string>((stats.eyeColour as string) || '');
  const [hairColor, setHairColor] = useState<string>((stats.hairColour as string) || '');
  const [measurements, setMeasurements] = useState<string>((model.measurements as string) || '');
  const [smokingStatus, setSmokingStatus] = useState<string>((stats.smokingStatus as string) || '');
  const [tattooStatus, setTattooStatus] = useState<string>((stats.tattooStatus as string) || '');
  const [piercingDetails, setPiercingDetails] = useState<string[]>(() => {
    const pd = model.piercingDetails;
    if (Array.isArray(pd)) return pd;
    if (typeof pd === 'string' && pd) return pd.split(',').map((s: string) => s.trim());
    return [];
  });
  const [orientation, setOrientation] = useState<string>((stats.orientation as string) || '');
  const [languages, setLanguages] = useState<string[]>(() => {
    const l = stats.languages;
    if (Array.isArray(l)) return l;
    return [];
  });
  const [education, setEducation] = useState<string>((model.education as string) || '');
  const [travel, setTravel] = useState<string>((model.travel as string) || '');
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => { setDirty(true); }, [weight, bustSize, bustType, eyeColor, hairColor, measurements, smokingStatus, tattooStatus, piercingDetails, orientation, languages, education, travel]);
  useEffect(() => { setDirty(false); }, []); // reset on mount

  const handleSave = useCallback(async (): Promise<boolean> => {
    setSaving(true);
    try {
      const res = await fetch(`/api/v1/models/${modelId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stats: { weight, bustSize, bustType, eyeColour: eyeColor, hairColour: hairColor, smokingStatus, tattooStatus, orientation, languages },
          profile: { measurements, piercingDetails, education, travel },
        }),
      });
      const json = await res.json();
      if (json.success) {
        setDirty(false);
        return true;
      } else {
        onToast(json.error?.message || 'Save failed', 'error');
        return false;
      }
    } catch {
      onToast('Something went wrong', 'error');
      return false;
    } finally {
      setSaving(false);
    }
  }, [modelId, weight, bustSize, bustType, eyeColor, hairColor, measurements, smokingStatus, tattooStatus, piercingDetails, orientation, languages, education, travel, onToast]);

  useImperativeHandle(ref, () => ({ save: handleSave }), [handleSave]);

  const sel = "w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200";
  const inp = "w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-zinc-500";

  return (
    <SectionCard title="Physical Stats" isDirty={dirty}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-xs text-zinc-400 mb-1">Weight (kg)</label>
          <select value={weight ?? ''} onChange={(e) => setWeight(e.target.value ? parseInt(e.target.value) : null)} className={sel}>
            <option value="">—</option>
            {Array.from({ length: 50 }, (_, i) => 40 + i).map((w) => (
              <option key={w} value={w}>{w} kg</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-zinc-400 mb-1">Bust Size</label>
          <select value={bustSize} onChange={(e) => setBustSize(e.target.value)} className={sel}>
            <option value="">—</option>
            {BUST_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-zinc-400 mb-1">Bust Type</label>
          <select value={bustType} onChange={(e) => setBustType(e.target.value)} className={sel}>
            <option value="">—</option>
            <option value="natural">Natural</option>
            <option value="silicone">Enhanced</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-zinc-400 mb-1">Eye Color</label>
          <select value={eyeColor} onChange={(e) => setEyeColor(e.target.value)} className={sel}>
            <option value="">—</option>
            {EYE_COLORS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-zinc-400 mb-1">Hair Color</label>
          <select value={hairColor} onChange={(e) => setHairColor(e.target.value)} className={sel}>
            <option value="">—</option>
            {HAIR_COLORS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-zinc-400 mb-1">Measurements</label>
          <input type="text" value={measurements} onChange={(e) => setMeasurements(e.target.value)} placeholder="32D-25-33" className={inp} />
        </div>
        <div>
          <label className="block text-xs text-zinc-400 mb-1">Smoking</label>
          <select value={smokingStatus} onChange={(e) => setSmokingStatus(e.target.value)} className={sel}>
            <option value="">—</option>
            {SMOKING_OPTS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-zinc-400 mb-1">Tattoos</label>
          <select value={tattooStatus} onChange={(e) => setTattooStatus(e.target.value)} className={sel}>
            <option value="">—</option>
            {TATTOO_OPTS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-zinc-400 mb-1">Orientation</label>
          <select value={orientation} onChange={(e) => setOrientation(e.target.value)} className={sel}>
            <option value="">—</option>
            {ORIENTATION_OPTS.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-zinc-400 mb-1">Travel</label>
          <select value={travel} onChange={(e) => setTravel(e.target.value)} className={sel}>
            <option value="">—</option>
            {TRAVEL_OPTS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-zinc-400 mb-1">Education</label>
          <input type="text" value={education} onChange={(e) => setEducation(e.target.value)} placeholder="Graduate, Masters, PhD..." className={inp} />
        </div>
        <div className="col-span-2 md:col-span-2">
          <MultiSelect options={PIERCING_OPTS} selected={piercingDetails} onChange={setPiercingDetails} label="Piercings" />
        </div>
        <div className="col-span-2 md:col-span-4">
          <MultiSelect options={LANGUAGE_OPTS} selected={languages} onChange={setLanguages} label="Languages" />
        </div>
      </div>
    </SectionCard>
  );
});

export default PhysicalStats;
