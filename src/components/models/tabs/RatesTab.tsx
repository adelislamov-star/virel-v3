// RATES TAB - Full implementation
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// Duration options
const DURATIONS = [
  { key: '30min',       label: '30 min' },
  { key: '45min',       label: '45 min' },
  { key: '1hour',       label: '1 hour' },
  { key: '90min',       label: '90 min' },
  { key: '2hours',      label: '2 hours' },
  { key: 'extra_hour',  label: 'Extra hour' },
  { key: 'overnight',   label: 'Overnight' },
];

type RateKey = `${string}_${'incall' | 'outcall'}`;

interface RateRow {
  price: string;
  taxiFee: string;
}

type RatesState = {
  [key: RateKey]: RateRow;
};

function buildInitialRates(existingRates: any[]): RatesState {
  const state: RatesState = {};
  (existingRates || []).forEach((r: any) => {
    const key: RateKey = `${r.duration_type || r.durationType}_${r.call_type || r.callType}` as RateKey;
    state[key] = {
      price: r.price ? String(r.price) : '',
      taxiFee: r.taxi_fee || r.taxiFee ? String(r.taxi_fee || r.taxiFee) : '',
    };
  });
  return state;
}

export default function RatesTab({ model, onSave, saving }: any) {
  const [rates, setRates] = useState<RatesState>(() =>
    buildInitialRates(model?.rates || [])
  );

  function setRate(durationType: string, callType: 'incall' | 'outcall', field: 'price' | 'taxiFee', value: string) {
    const key: RateKey = `${durationType}_${callType}` as RateKey;
    setRates(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value,
      }
    }));
  }

  function getRate(durationType: string, callType: 'incall' | 'outcall', field: 'price' | 'taxiFee'): string {
    const key: RateKey = `${durationType}_${callType}` as RateKey;
    return rates[key]?.[field] || '';
  }

  function handleSave() {
    const ratesArray: any[] = [];

    DURATIONS.forEach(({ key: durationType }) => {
      ['incall', 'outcall'].forEach(callType => {
        const rateKey: RateKey = `${durationType}_${callType}` as RateKey;
        const row = rates[rateKey];
        if (row?.price) {
          ratesArray.push({
            durationType,
            callType,
            price: parseFloat(row.price),
            taxiFee: row.taxiFee ? parseFloat(row.taxiFee) : null,
            currency: 'GBP',
          });
        }
      });
    });

    onSave({ rates: ratesArray });
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>💰 Pricing Rates</span>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : '💾 Save Rates'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Duration</th>
                  <th className="text-center py-2 px-3 font-medium">Incall (£)</th>
                  <th className="text-center py-2 px-3 font-medium">Outcall (£)</th>
                  <th className="text-center py-2 px-3 font-medium text-muted-foreground">Taxi fee (£)</th>
                </tr>
              </thead>
              <tbody>
                {DURATIONS.map(({ key: durationType, label }) => {
                  const incallPrice = getRate(durationType, 'incall', 'price');
                  const outcallPrice = getRate(durationType, 'outcall', 'price');
                  const taxiFee = getRate(durationType, 'outcall', 'taxiFee');

                  return (
                    <tr key={durationType} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="py-2 pr-4 font-medium">{label}</td>

                      {/* Incall */}
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground">£</span>
                          <Input
                            type="number"
                            min="0"
                            step="5"
                            placeholder="—"
                            value={incallPrice}
                            onChange={e => setRate(durationType, 'incall', 'price', e.target.value)}
                            className="w-24 h-8 text-center"
                          />
                        </div>
                      </td>

                      {/* Outcall */}
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground">£</span>
                          <Input
                            type="number"
                            min="0"
                            step="5"
                            placeholder="—"
                            value={outcallPrice}
                            onChange={e => setRate(durationType, 'outcall', 'price', e.target.value)}
                            className="w-24 h-8 text-center"
                          />
                        </div>
                      </td>

                      {/* Taxi fee (only for outcall rows) */}
                      <td className="py-2 px-3">
                        {outcallPrice ? (
                          <div className="flex items-center gap-1">
                            <span className="text-muted-foreground">£</span>
                            <Input
                              type="number"
                              min="0"
                              step="5"
                              placeholder="—"
                              value={taxiFee}
                              onChange={e => setRate(durationType, 'outcall', 'taxiFee', e.target.value)}
                              className="w-20 h-8 text-center"
                            />
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs pl-2">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-muted-foreground mt-4">
            Leave empty to hide that duration. Taxi fee applies to outcall rates only.
          </p>
        </CardContent>
      </Card>

      {/* Save button at bottom */}
      <Card>
        <CardContent className="p-4 flex justify-end">
          <Button onClick={handleSave} disabled={saving} size="lg">
            {saving ? 'Saving...' : '💾 Save Rates'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
