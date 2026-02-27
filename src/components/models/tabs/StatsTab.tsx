// STATS TAB (Physical characteristics)
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function StatsTab({ model, onSave, saving }: any) {
  const stats = model.stats || {};
  
  const [form, setForm] = useState({
    age: stats.age || '',
    height: stats.height || '',
    weight: stats.weight || '',
    dressSize: stats.dressSize || '',
    feetSize: stats.feetSize || stats.feet_size || '',
    bustSize: stats.bustSize || '',
    bustType: stats.bustType || 'natural',
    hairColour: stats.hairColour || '',
    eyeColour: stats.eyeColour || '',
    smokingStatus: stats.smokingStatus || 'no',
    tattooStatus: stats.tattooStatus || 'none',
    piercingStatus: stats.piercingStatus || '',
    orientation: stats.orientation || 'hetero',
    nationality: stats.nationality || '',
    languages: stats.languages?.join(', ') || '',
  });
  
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({
      stats: {
        ...form,
        age: parseInt(form.age as any) || null,
        height: parseInt(form.height as any) || null,
        weight: parseInt(form.weight as any) || null,
        languages: form.languages.split(',').map((s: string) => s.trim()).filter(Boolean),
      }
    });
  }
  
  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Physical Stats</CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Age</label>
              <input type="number" value={form.age} onChange={(e) => setForm({...form, age: e.target.value})} className="w-full px-3 py-2 border rounded-md bg-background" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Height (cm)</label>
              <input type="number" value={form.height} onChange={(e) => setForm({...form, height: e.target.value})} className="w-full px-3 py-2 border rounded-md bg-background" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Weight (kg)</label>
              <input type="number" value={form.weight} onChange={(e) => setForm({...form, weight: e.target.value})} className="w-full px-3 py-2 border rounded-md bg-background" />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Dress Size (UK)</label>
              <input type="text" value={form.dressSize} onChange={(e) => setForm({...form, dressSize: e.target.value})} className="w-full px-3 py-2 border rounded-md bg-background" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Feet Size (UK)</label>
              <input type="text" value={form.feetSize} onChange={(e) => setForm({...form, feetSize: e.target.value})} className="w-full px-3 py-2 border rounded-md bg-background" />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Breast Size</label>
              <input type="text" value={form.bustSize} onChange={(e) => setForm({...form, bustSize: e.target.value})} className="w-full px-3 py-2 border rounded-md bg-background" placeholder="34C" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Breast Type</label>
              <select value={form.bustType} onChange={(e) => setForm({...form, bustType: e.target.value})} className="w-full px-3 py-2 border rounded-md bg-background">
                <option value="natural">Natural</option>
                <option value="silicone">Silicone</option>
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Hair Colour</label>
              <input type="text" value={form.hairColour} onChange={(e) => setForm({...form, hairColour: e.target.value})} className="w-full px-3 py-2 border rounded-md bg-background" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Eye Colour</label>
              <input type="text" value={form.eyeColour} onChange={(e) => setForm({...form, eyeColour: e.target.value})} className="w-full px-3 py-2 border rounded-md bg-background" />
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Smoking</label>
              <select value={form.smokingStatus} onChange={(e) => setForm({...form, smokingStatus: e.target.value})} className="w-full px-3 py-2 border rounded-md bg-background">
                <option value="no">No</option>
                <option value="yes">Yes</option>
                <option value="social">Social</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tattoo</label>
              <select value={form.tattooStatus} onChange={(e) => setForm({...form, tattooStatus: e.target.value})} className="w-full px-3 py-2 border rounded-md bg-background">
                <option value="none">None</option>
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Piercing</label>
              <input type="text" value={form.piercingStatus} onChange={(e) => setForm({...form, piercingStatus: e.target.value})} className="w-full px-3 py-2 border rounded-md bg-background" placeholder="Ears, Nose" />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Orientation</label>
              <select value={form.orientation} onChange={(e) => setForm({...form, orientation: e.target.value})} className="w-full px-3 py-2 border rounded-md bg-background">
                <option value="hetero">Hetero</option>
                <option value="bi">Bi</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Nationality</label>
              <input type="text" value={form.nationality} onChange={(e) => setForm({...form, nationality: e.target.value})} className="w-full px-3 py-2 border rounded-md bg-background" />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Languages (comma-separated)</label>
            <input type="text" value={form.languages} onChange={(e) => setForm({...form, languages: e.target.value})} className="w-full px-3 py-2 border rounded-md bg-background" placeholder="English, French, Spanish" />
          </div>
          
          <Button type="submit" disabled={saving} size="lg" className="w-full">
            {saving ? 'Saving...' : 'Save Physical Stats'}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
