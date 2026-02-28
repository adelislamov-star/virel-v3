// ADDRESS TAB - Full implementation
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const AIRPORTS = [
  { key: 'heathrowAvailable',  label: '✈️ Heathrow (LHR)' },
  { key: 'gatwickAvailable',   label: '✈️ Gatwick (LGW)' },
  { key: 'stanstedAvailable',  label: '✈️ Stansted (STN)' },
];

interface AddressState {
  street: string;
  flatNumber: string;
  flatFloor: string;
  postCode: string;
  tubeStation: string;
  heathrowAvailable: boolean;
  gatwickAvailable: boolean;
  stanstedAvailable: boolean;
}

function buildInitialAddress(address: any): AddressState {
  return {
    street: address?.street || address?.address_line1 || '',
    flatNumber: address?.flatNumber || address?.flat_number || '',
    flatFloor: address?.flatFloor != null ? String(address.flatFloor) :
               address?.flat_floor != null ? String(address.flat_floor) : '',
    postCode: address?.postCode || address?.post_code || address?.postcode || '',
    tubeStation: address?.tubeStation || address?.tube_station || '',
    heathrowAvailable: address?.heathrowAvailable ?? address?.heathrow_available ?? false,
    gatwickAvailable: address?.gatwickAvailable ?? address?.gatwick_available ?? false,
    stanstedAvailable: address?.stanstedAvailable ?? address?.stansted_available ?? false,
  };
}

export default function AddressTab({ model, onSave, saving }: any) {
  const [address, setAddress] = useState<AddressState>(() =>
    buildInitialAddress(model?.address)
  );

  function setField(field: keyof AddressState, value: string | boolean) {
    setAddress(prev => ({ ...prev, [field]: value }));
  }

  function handleSave() {
    onSave({
      address: {
        ...address,
        flatFloor: address.flatFloor !== '' ? parseInt(address.flatFloor) : null,
      }
    });
  }

  const hasAddress = address.street || address.postCode;

  return (
    <div className="space-y-4">
      {/* Incall Address */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>📍 Incall Address</span>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : '💾 Save Address'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Street */}
          <div className="space-y-1.5">
            <Label>Street address</Label>
            <Input
              placeholder="e.g. 34 Baker Street"
              value={address.street}
              onChange={e => setField('street', e.target.value)}
            />
          </div>

          {/* Flat / Floor / Postcode in a row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Flat / Apt #</Label>
              <Input
                placeholder="e.g. 4B"
                value={address.flatNumber}
                onChange={e => setField('flatNumber', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Floor</Label>
              <Input
                type="number"
                placeholder="e.g. 2"
                value={address.flatFloor}
                onChange={e => setField('flatFloor', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Post code</Label>
              <Input
                placeholder="e.g. W1U 6RS"
                value={address.postCode}
                onChange={e => setField('postCode', e.target.value.toUpperCase())}
              />
            </div>
          </div>

          {/* Tube station */}
          <div className="space-y-1.5">
            <Label>Nearest tube station</Label>
            <Input
              placeholder="e.g. Baker Street (Jubilee, Bakerloo)"
              value={address.tubeStation}
              onChange={e => setField('tubeStation', e.target.value)}
            />
          </div>

          {/* Preview */}
          {hasAddress && (
            <div className="rounded bg-muted p-3 text-sm text-muted-foreground">
              <strong>Preview:</strong>{' '}
              {[
                address.flatNumber && `Flat ${address.flatNumber}`,
                address.street,
                address.postCode,
              ].filter(Boolean).join(', ')}
              {address.tubeStation && ` · 🚇 ${address.tubeStation}`}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Airport Outcalls */}
      <Card>
        <CardHeader>
          <CardTitle>✈️ Airport Outcalls</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {AIRPORTS.map(({ key, label }) => {
              const isEnabled = address[key as keyof AddressState] as boolean;
              return (
                <div
                  key={key}
                  className={`flex items-center gap-3 p-3 rounded border cursor-pointer transition-colors ${
                    isEnabled
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setField(key as keyof AddressState, !isEnabled)}
                >
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                    isEnabled ? 'bg-primary border-primary' : 'border-muted-foreground'
                  }`}>
                    {isEnabled && (
                      <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className="font-medium">{label}</span>
                  {isEnabled && (
                    <span className="ml-auto text-xs text-primary font-medium">Available</span>
                  )}
                </div>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Enable airports where this model can meet clients for outcall bookings.
          </p>
        </CardContent>
      </Card>

      {/* Save button at bottom */}
      <Card>
        <CardContent className="p-4 flex justify-end">
          <Button onClick={handleSave} disabled={saving} size="lg">
            {saving ? 'Saving...' : '💾 Save Address'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
