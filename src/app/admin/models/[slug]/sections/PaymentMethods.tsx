'use client';

import { useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import SectionCard from './SectionCard';
import { PAYMENT_METHODS } from '@/constants/model-form';

export interface PaymentMethodsHandle {
  save: () => Promise<boolean>;
}

interface Props {
  model: Record<string, unknown>;
  modelId: string;
  onToast: (msg: string, type: 'success' | 'error') => void;
  onModelUpdate: () => void;
}

const FIELD_MAP: Record<string, string> = {
  cash: 'paymentCash',
  terminal: 'paymentTerminal',
  bankTransfer: 'paymentBankTransfer',
  monese: 'paymentMonese',
  monzo: 'paymentMonzo',
  revolut: 'paymentRevolut',
  starling: 'paymentStarling',
  btc: 'paymentBTC',
  ltc: 'paymentLTC',
  usdt: 'paymentUSDT',
};

const PaymentMethods = forwardRef<PaymentMethodsHandle, Props>(function PaymentMethods({ model, modelId, onToast, onModelUpdate }, ref) {
  const initial: Record<string, boolean> = {};
  for (const pm of PAYMENT_METHODS) {
    const field = FIELD_MAP[pm.value];
    initial[pm.value] = field ? (model[field] as boolean) || false : false;
  }

  const [methods, setMethods] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const toggle = (key: string) => {
    setMethods((prev) => ({ ...prev, [key]: !prev[key] }));
    setDirty(true);
  };

  const handleSave = useCallback(async (): Promise<boolean> => {
    setSaving(true);
    try {
      const payment: Record<string, boolean> = {};
      for (const [key, field] of Object.entries(FIELD_MAP)) {
        payment[field] = methods[key] || false;
      }

      const res = await fetch(`/api/v1/models/${modelId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment }),
      });
      const json = await res.json();
      if (json.success) {
        setDirty(false);
        onModelUpdate();
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
  }, [modelId, methods, onToast, onModelUpdate]);

  useImperativeHandle(ref, () => ({ save: handleSave }), [handleSave]);

  const enabledCount = Object.values(methods).filter(Boolean).length;

  return (
    <SectionCard title="Payment Methods" isDirty={dirty}>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
        {PAYMENT_METHODS.map((pm) => (
          <label
            key={pm.value}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
              methods[pm.value]
                ? 'border-amber-500/40 bg-amber-500/10 text-amber-300'
                : 'border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:border-zinc-600'
            }`}
          >
            <input
              type="checkbox"
              checked={methods[pm.value]}
              onChange={() => toggle(pm.value)}
              className="accent-amber-500"
            />
            <span className="text-sm">{pm.label}</span>
          </label>
        ))}
      </div>
      <p className="text-xs text-zinc-500 mt-3">{enabledCount} method{enabledCount !== 1 ? 's' : ''} enabled</p>
    </SectionCard>
  );
});

export default PaymentMethods;
