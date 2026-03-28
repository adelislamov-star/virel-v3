// BASIC INFO TAB
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function BasicInfoTab({ model, onSave, saving, onDirty }: any) {
  const [form, setForm] = useState({
    name: model.name || '',
    publicCode: model.publicCode || '',
    status: model.status || 'active',
    
    ratingInternal: model.ratingInternal || 0,
    notesInternal: model.notesInternal || '',
    workWithCouples: model.workPreferences?.work_with_couples || false,
    workWithWomen: model.workPreferences?.work_with_women || false,
    blackClientsWelcome: model.workPreferences?.black_clients_welcome !== false,
    disabledClientsWelcome: model.workPreferences?.disabled_clients_welcome !== false,
  });
  
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({
      basicInfo: {
        name: form.name,
        publicCode: form.publicCode,
        status: form.status,
        
        ratingInternal: parseFloat(form.ratingInternal as any) || 0,
        notesInternal: form.notesInternal,
      },
      workPreferences: {
        workWithCouples: form.workWithCouples,
        workWithWomen: form.workWithWomen,
        blackClientsWelcome: form.blackClientsWelcome,
        disabledClientsWelcome: form.disabledClientsWelcome,
      }
    });
  }
  
  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-3">
          {/* Name + Public Code — 2 cols */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => { setForm({ ...form, name: e.target.value }); onDirty?.(); }}
                className="w-full px-3 py-2 border rounded-md bg-background"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Public Code *</label>
              <input
                type="text"
                value={form.publicCode}
                onChange={(e) => { setForm({ ...form, publicCode: e.target.value.toUpperCase() }); onDirty?.(); }}
                className="w-full px-3 py-2 border rounded-md bg-background"
                placeholder="SOPHIA-MF"
                required
              />
            </div>
          </div>

          {/* Status + Rating — 2 cols */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => { setForm({ ...form, status: e.target.value }); onDirty?.(); }}
                className="w-full px-3 py-2 border rounded-md bg-background"
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="vacation">Vacation</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Internal Rating (0-5)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="5"
                value={form.ratingInternal}
                onChange={(e) => { setForm({ ...form, ratingInternal: e.target.value as any }); onDirty?.(); }}
                className="w-full px-3 py-2 border rounded-md bg-background"
              />
            </div>
          </div>

          {/* Work Preferences — 2 col grid */}
          <div>
            <label className="block text-xs font-medium mb-1">Work Preferences</label>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.workWithCouples}
                  onChange={(e) => { setForm({ ...form, workWithCouples: e.target.checked }); onDirty?.(); }}
                  className="w-4 h-4"
                />
                <span>Work with couples</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.workWithWomen}
                  onChange={(e) => { setForm({ ...form, workWithWomen: e.target.checked }); onDirty?.(); }}
                  className="w-4 h-4"
                />
                <span>Work with women</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.blackClientsWelcome}
                  onChange={(e) => { setForm({ ...form, blackClientsWelcome: e.target.checked }); onDirty?.(); }}
                  className="w-4 h-4"
                />
                <span>Black clients welcome</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.disabledClientsWelcome}
                  onChange={(e) => { setForm({ ...form, disabledClientsWelcome: e.target.checked }); onDirty?.(); }}
                  className="w-4 h-4"
                />
                <span>Disabled clients welcome</span>
              </label>
            </div>
          </div>

          {/* Internal Notes — 2 rows */}
          <div>
            <label className="block text-xs font-medium mb-1">Internal Notes</label>
            <textarea
              value={form.notesInternal}
              onChange={(e) => { setForm({ ...form, notesInternal: e.target.value }); onDirty?.(); }}
              className="w-full px-3 py-2 border rounded-md bg-background"
              rows={2}
            />
          </div>
          
          {/* Save Button */}
          <Button type="submit" disabled={saving} size="lg" className="w-full">
            {saving ? 'Saving...' : 'Save Basic Info'}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
