'use client';
import { useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import SectionCard from './SectionCard';

export interface BasicInfoAndContactHandle {
  save: () => Promise<boolean>;
}

interface Props {
  model: any;
  modelId: string;
  onSave: (updates: any) => Promise<void>;
  saving: boolean;
  onToast: (msg: string, type: 'success' | 'error') => void;
  onModelUpdate: () => void;
  onDirty?: () => void;
}

const BasicInfoAndContact = forwardRef<BasicInfoAndContactHandle, Props>(function BasicInfoAndContact({ model, modelId, onSave, saving, onToast, onModelUpdate, onDirty }, ref) {
  // Basic Info state
  const [name, setName] = useState(model.name || '');
  const [publicCode, setPublicCode] = useState(model.publicCode || '');
  const [status, setStatus] = useState(model.status || 'active');
  const [ratingInternal, setRatingInternal] = useState(model.ratingInternal || 0);
  const [notesInternal, setNotesInternal] = useState(model.notesInternal || '');
  const [workWithCouples, setWorkWithCouples] = useState(model.workPreferences?.work_with_couples || false);
  const [workWithWomen, setWorkWithWomen] = useState(model.workPreferences?.work_with_women || false);
  const [blackClientsWelcome, setBlackClientsWelcome] = useState(model.workPreferences?.black_clients_welcome !== false);
  const [disabledClientsWelcome, setDisabledClientsWelcome] = useState(model.workPreferences?.disabled_clients_welcome !== false);

  // Contact state
  const [phone, setPhone] = useState(model.phone || '');
  const [phone2, setPhone2] = useState(model.phone2 || '');
  const [email, setEmail] = useState(model.email || '');
  const [telegramPhone, setTelegramPhone] = useState(model.telegramPhone || '');
  const [telegramTag, setTelegramTag] = useState(model.telegramTag || '');
  const [whatsapp, setWhatsapp] = useState(model.whatsapp || false);
  const [telegram, setTelegram] = useState(model.telegram || false);
  const [viber, setViber] = useState(model.viber || false);
  const [signal, setSignal] = useState(model.signal || false);

  const [dirty, setDirty] = useState(false);

  const mark = () => { setDirty(true); onDirty?.(); };

  const saveAll = useCallback(async (): Promise<boolean> => {
    try {
      // Save basic info
      await onSave({
        basicInfo: { name, publicCode, status, ratingInternal: parseFloat(ratingInternal) || 0, notesInternal },
        workPreferences: { workWithCouples, workWithWomen, blackClientsWelcome, disabledClientsWelcome },
      });

      // Save contact
      const res = await fetch(`/api/v1/models/${modelId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact: { phone: phone || null, phone2: phone2 || null, email: email || null, telegramPhone: telegramPhone || null, telegramTag: telegramTag || null, whatsapp, telegram, viber, signal } }),
      });
      const json = await res.json();
      if (json.success) {
        setDirty(false);
        onModelUpdate();
        return true;
      } else {
        onToast(json.error?.message || 'Contact save failed', 'error');
        return false;
      }
    } catch {
      onToast('Something went wrong', 'error');
      return false;
    }
  }, [modelId, name, publicCode, status, ratingInternal, notesInternal, workWithCouples, workWithWomen, blackClientsWelcome, disabledClientsWelcome, phone, phone2, email, telegramPhone, telegramTag, whatsapp, telegram, viber, signal, onSave, onToast, onModelUpdate]);

  useImperativeHandle(ref, () => ({ save: saveAll }), [saveAll]);

  const inp = 'w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-zinc-200 focus:outline-none focus:border-zinc-500';
  const lbl = 'block text-xs text-zinc-400 mb-1';

  return (
    <SectionCard title="Basic Info & Contact" isDirty={dirty}>
      <div className="grid grid-cols-2 gap-6">
        {/* LEFT -- Basic Info */}
        <div className="space-y-3">
          <div className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">Basic Info</div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Name *</label>
              <input className={inp} value={name} onChange={e => { setName(e.target.value); mark(); }} required />
            </div>
            <div>
              <label className={lbl}>Public Code *</label>
              <input className={inp} value={publicCode} onChange={e => { setPublicCode(e.target.value.toUpperCase()); mark(); }} placeholder="SOPHIA-MF" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Status</label>
              <select className={inp} value={status} onChange={e => { setStatus(e.target.value); mark(); }}>
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="vacation">Vacation</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div>
              <label className={lbl}>Rating (0-5)</label>
              <input type="number" step="0.1" min="0" max="5" className={inp} value={ratingInternal} onChange={e => { setRatingInternal(e.target.value as any); mark(); }} />
            </div>
          </div>
          <div>
            <label className={lbl}>Work Preferences</label>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
              {[
                ['workWithCouples', 'Couples', workWithCouples, setWorkWithCouples],
                ['workWithWomen', 'Women', workWithWomen, setWorkWithWomen],
                ['blackClientsWelcome', 'Black clients', blackClientsWelcome, setBlackClientsWelcome],
                ['disabledClientsWelcome', 'Disabled clients', disabledClientsWelcome, setDisabledClientsWelcome],
              ].map(([key, label, val, setter]: any) => (
                <label key={key} className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                  <input type="checkbox" checked={val} onChange={e => { setter(e.target.checked); mark(); }} className="accent-amber-500 w-3.5 h-3.5" />
                  {label}
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className={lbl}>Internal Notes</label>
            <textarea className={inp + ' resize-none'} value={notesInternal} onChange={e => { setNotesInternal(e.target.value); mark(); }} rows={2} />
          </div>
        </div>

        {/* RIGHT -- Contact */}
        <div className="space-y-3">
          <div className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">Contact</div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Phone (primary)</label>
              <input className={inp} value={phone} onChange={e => { setPhone(e.target.value); mark(); }} placeholder="+44..." />
            </div>
            <div>
              <label className={lbl}>Phone (secondary)</label>
              <input className={inp} value={phone2} onChange={e => { setPhone2(e.target.value); mark(); }} placeholder="+44..." />
            </div>
          </div>
          <div>
            <label className={lbl}>Email</label>
            <input type="email" className={inp} value={email} onChange={e => { setEmail(e.target.value); mark(); }} placeholder="email@example.com" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Telegram Phone</label>
              <input className={inp} value={telegramPhone} onChange={e => { setTelegramPhone(e.target.value); mark(); }} placeholder="+44..." />
            </div>
            <div>
              <label className={lbl}>Telegram Tag</label>
              <input className={inp} value={telegramTag} onChange={e => { setTelegramTag(e.target.value); mark(); }} placeholder="@username" />
            </div>
          </div>
          <div>
            <label className={lbl}>Messengers</label>
            <div className="flex flex-wrap gap-3">
              {[['WhatsApp', whatsapp, setWhatsapp], ['Telegram', telegram, setTelegram], ['Viber', viber, setViber], ['Signal', signal, setSignal]].map(([label, val, setter]: any) => (
                <label key={label} className="flex items-center gap-1.5 text-xs text-zinc-300 cursor-pointer">
                  <input type="checkbox" checked={val} onChange={() => { setter(!val); mark(); }} className="accent-amber-500 w-3.5 h-3.5" />
                  {label}
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </SectionCard>
  );
});

export default BasicInfoAndContact;
