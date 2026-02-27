// BASIC INFO TAB
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function BasicInfoTab({ model, onSave, saving }: any) {
  const [form, setForm] = useState({
    name: model.name || '',
    publicCode: model.publicCode || '',
    status: model.status || 'active',
    visibility: model.visibility || 'public',
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
        visibility: form.visibility,
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
        
        <CardContent className="space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium mb-2">Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 border rounded-md bg-background"
              required
            />
          </div>
          
          {/* Public Code */}
          <div>
            <label className="block text-sm font-medium mb-2">Public Code *</label>
            <input
              type="text"
              value={form.publicCode}
              onChange={(e) => setForm({ ...form, publicCode: e.target.value.toUpperCase() })}
              className="w-full px-3 py-2 border rounded-md bg-background"
              placeholder="SOPHIA-MF"
              required
            />
          </div>
          
          {/* Status & Visibility */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full px-3 py-2 border rounded-md bg-background"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Visibility</label>
              <select
                value={form.visibility}
                onChange={(e) => setForm({ ...form, visibility: e.target.value })}
                className="w-full px-3 py-2 border rounded-md bg-background"
              >
                <option value="public">Public</option>
                <option value="private">Private</option>
                <option value="unlisted">Unlisted</option>
              </select>
            </div>
          </div>
          
          {/* Internal Rating */}
          <div>
            <label className="block text-sm font-medium mb-2">Internal Rating (0-5)</label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="5"
              value={form.ratingInternal}
              onChange={(e) => setForm({ ...form, ratingInternal: e.target.value as any })}
              className="w-full px-3 py-2 border rounded-md bg-background"
            />
          </div>
          
          {/* Work Preferences */}
          <div>
            <label className="block text-sm font-medium mb-3">Work Preferences</label>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.workWithCouples}
                  onChange={(e) => setForm({ ...form, workWithCouples: e.target.checked })}
                  className="w-4 h-4"
                />
                <span>Work with couples</span>
              </label>
              
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.workWithWomen}
                  onChange={(e) => setForm({ ...form, workWithWomen: e.target.checked })}
                  className="w-4 h-4"
                />
                <span>Work with women</span>
              </label>
              
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.blackClientsWelcome}
                  onChange={(e) => setForm({ ...form, blackClientsWelcome: e.target.checked })}
                  className="w-4 h-4"
                />
                <span>Black clients welcome</span>
              </label>
              
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.disabledClientsWelcome}
                  onChange={(e) => setForm({ ...form, disabledClientsWelcome: e.target.checked })}
                  className="w-4 h-4"
                />
                <span>Disabled clients welcome</span>
              </label>
            </div>
          </div>
          
          {/* Internal Notes */}
          <div>
            <label className="block text-sm font-medium mb-2">Internal Notes</label>
            <textarea
              value={form.notesInternal}
              onChange={(e) => setForm({ ...form, notesInternal: e.target.value })}
              className="w-full px-3 py-2 border rounded-md bg-background"
              rows={4}
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
