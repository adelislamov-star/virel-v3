'use client';

import { useState, useCallback } from 'react';
import SectionCard from './SectionCard';

interface Props {
  model: {
    phone?: string | null;
    phone2?: string | null;
    email?: string | null;
    whatsapp?: boolean;
    telegram?: boolean;
    viber?: boolean;
    signal?: boolean;
  };
  modelId: string;
  onToast: (msg: string, type: 'success' | 'error') => void;
  onModelUpdate: () => void;
}

export default function Contact({ model, modelId, onToast, onModelUpdate }: Props) {
  const [phone, setPhone] = useState(model.phone || '');
  const [phone2, setPhone2] = useState(model.phone2 || '');
  const [email, setEmail] = useState(model.email || '');
  const [whatsapp, setWhatsapp] = useState(model.whatsapp || false);
  const [telegram, setTelegram] = useState(model.telegram || false);
  const [viber, setViber] = useState(model.viber || false);
  const [signal, setSignal] = useState(model.signal || false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const mark = () => setDirty(true);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/v1/models/${modelId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact: {
            phone: phone || null,
            phone2: phone2 || null,
            email: email || null,
            whatsapp,
            telegram,
            viber,
            signal,
          },
        }),
      });
      const json = await res.json();
      if (json.success) {
        onToast('Contact saved', 'success');
        setDirty(false);
        onModelUpdate();
      } else {
        onToast(json.error?.message || 'Save failed', 'error');
      }
    } catch {
      onToast('Something went wrong', 'error');
    } finally {
      setSaving(false);
    }
  }, [modelId, phone, phone2, email, whatsapp, telegram, viber, signal, onToast, onModelUpdate]);

  const inputCls = 'w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-zinc-500';

  const messengers = [
    { label: 'WhatsApp', checked: whatsapp, set: setWhatsapp },
    { label: 'Telegram', checked: telegram, set: setTelegram },
    { label: 'Viber', checked: viber, set: setViber },
    { label: 'Signal', checked: signal, set: setSignal },
  ];

  return (
    <SectionCard title="Contact" isDirty={dirty} saving={saving} onSave={handleSave}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-zinc-400 mb-1">Phone (primary)</label>
          <input className={inputCls} value={phone} onChange={(e) => { setPhone(e.target.value); mark(); }} placeholder="+44..." />
        </div>
        <div>
          <label className="block text-xs text-zinc-400 mb-1">Phone (secondary)</label>
          <input className={inputCls} value={phone2} onChange={(e) => { setPhone2(e.target.value); mark(); }} placeholder="+44..." />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs text-zinc-400 mb-1">Email</label>
          <input type="email" className={inputCls} value={email} onChange={(e) => { setEmail(e.target.value); mark(); }} placeholder="email@example.com" />
        </div>
      </div>

      <div className="mt-4">
        <label className="block text-xs text-zinc-400 mb-2">Messengers (available on primary phone)</label>
        <div className="flex flex-wrap gap-3">
          {messengers.map((m) => (
            <label key={m.label} className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
              <input
                type="checkbox"
                checked={m.checked}
                onChange={() => { m.set(!m.checked); mark(); }}
                className="accent-amber-500"
              />
              {m.label}
            </label>
          ))}
        </div>
      </div>
    </SectionCard>
  );
}
