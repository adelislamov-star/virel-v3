// RATES TAB - Dynamic from database, zero hardcoded durations
'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { sortRates } from '@/lib/sortRates';
import { durationLabel } from '@/lib/durationLabel';

// Available durations for the "add" dropdown — covers all known DB values
const ALL_KNOWN_DURATIONS = [
  '30min', '45min', '1hour', '90min', '2hours', '3hours',
  '4hours', '5hours', '6hours', '8hours',
  'extra_hour', 'overnight', 'overnight_9h',
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

function getExistingDurations(existingRates: any[]): string[] {
  return [...new Set((existingRates || []).map((r: any) => r.duration_type || r.durationType))];
}

export default function RatesTab({ model, onSave, saving }: any) {
  const initialDurations = useMemo(() => getExistingDurations(model?.rates || []), [model]);
  const [durations, setDurations] = useState<string[]>(initialDurations);
  const [rates, setRates] = useState<RatesState>(() =>
    buildInitialRates(model?.rates || [])
  );

  // Sorted duration rows for display
  const sortedDurations = useMemo(
    () => sortRates(durations.map(d => ({ duration_type: d }))).map(d => d.duration_type),
    [durations]
  );

  // Durations not yet added — available for the "add" dropdown
  const availableToAdd = ALL_KNOWN_DURATIONS.filter(d => !durations.includes(d));

  function addDuration(durationType: string) {
    if (!durations.includes(durationType)) {
      setDurations(prev => [...prev, durationType]);
    }
  }

  function removeDuration(durationType: string) {
    setDurations(prev => prev.filter(d => d !== durationType));
    // Clear rate data for removed duration
    setRates(prev => {
      const next = { ...prev };
      delete next[`${durationType}_incall` as RateKey];
      delete next[`${durationType}_outcall` as RateKey];
      return next;
    });
  }

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

    sortedDurations.forEach(durationType => {
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
            <span>Pricing Rates</span>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Rates'}
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
                  <th className="w-8"></th>
                </tr>
              </thead>
              <tbody>
                {sortedDurations.map(durationType => {
                  const label = durationLabel(durationType);
                  const incallPrice = getRate(durationType, 'incall', 'price');
                  const outcallPrice = getRate(durationType, 'outcall', 'price');
                  const taxiFee = getRate(durationType, 'outcall', 'taxiFee');

                  return (
                    <tr key={durationType} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="py-2 pr-4 font-medium">{label}</td>

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

                      <td className="py-2 px-1">
                        <button
                          type="button"
                          onClick={() => removeDuration(durationType)}
                          className="text-muted-foreground hover:text-red-400 transition-colors text-xs"
                          title={`Remove ${label}`}
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {sortedDurations.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-muted-foreground text-xs">
                      No durations added yet. Use the dropdown below to add one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Add duration row */}
          {availableToAdd.length > 0 && (
            <div className="mt-4 flex items-center gap-2">
              <select
                id="add-duration-select"
                className="h-8 px-2 text-sm border rounded bg-background"
                defaultValue=""
                onChange={e => {
                  if (e.target.value) {
                    addDuration(e.target.value);
                    e.target.value = '';
                  }
                }}
              >
                <option value="" disabled>+ Add duration...</option>
                {availableToAdd.map(d => (
                  <option key={d} value={d}>{durationLabel(d)}</option>
                ))}
              </select>
            </div>
          )}

          <p className="text-xs text-muted-foreground mt-4">
            Add durations as needed. Leave price empty to hide that duration. Taxi fee applies to outcall rates only.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 flex justify-end">
          <Button onClick={handleSave} disabled={saving} size="lg">
            {saving ? 'Saving...' : 'Save Rates'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
