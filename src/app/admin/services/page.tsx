'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Trash2, Pencil, Plus, X, Check } from 'lucide-react';

interface Service {
  id: string;
  title: string;
  slug: string;
  category: string;
  description: string | null;
  defaultExtraPrice: number | null;
  isPopular: boolean;
  status: string;
}

interface ServiceCategory {
  id: string;
  name: string;
  services: Service[];
}

const CATEGORY_OPTIONS = [
  'Connection', 'Oral', 'Intimate', 'Group',
  'Touch & Wellness', 'Fetish', 'Domination', 'Other',
];

export default function AdminServicesPage() {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // New service form
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Other');
  const [newDescription, setNewDescription] = useState('');
  const [newExtraPrice, setNewExtraPrice] = useState('');
  const [saving, setSaving] = useState(false);

  // Editing
  const [editId, setEditId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editExtraPrice, setEditExtraPrice] = useState('');

  useEffect(() => { loadServices(); }, []);

  async function loadServices() {
    try {
      const res = await fetch('/api/v1/services');
      const data = await res.json();
      if (data.success) {
        // API returns flat array — group by category
        const services = data.services || [];
        const grouped: Record<string, Service[]> = {};
        for (const s of services) {
          const cat = s.category || 'Other';
          if (!grouped[cat]) grouped[cat] = [];
          grouped[cat].push(s);
        }
        setCategories(
          Object.entries(grouped).map(([name, svcs]) => ({
            id: name,
            name,
            services: svcs,
          }))
        );
      }
    } catch (e) {
      console.error('Failed to load services', e);
    } finally {
      setLoading(false);
    }
  }

  async function addService() {
    if (!newTitle.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/v1/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
          category: newCategory,
          description: newDescription.trim() || null,
          defaultExtraPrice: newExtraPrice || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowAdd(false);
        setNewTitle('');
        setNewCategory('Other');
        setNewDescription('');
        setNewExtraPrice('');
        await loadServices();
      } else {
        alert(data.error?.message || 'Failed to create service');
      }
    } catch (e) {
      alert('Failed to create service');
    } finally {
      setSaving(false);
    }
  }

  async function deleteService(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This removes it from all model profiles.`)) return;
    try {
      const res = await fetch(`/api/v1/services/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) await loadServices();
      else alert(data.error?.message || 'Failed to delete');
    } catch {
      alert('Failed to delete service');
    }
  }

  function startEdit(s: Service) {
    setEditId(s.id);
    setEditTitle(s.title);
    setEditCategory(s.category || 'Other');
    setEditDescription(s.description || '');
    setEditExtraPrice(s.defaultExtraPrice ? String(s.defaultExtraPrice) : '');
  }

  async function saveEdit() {
    if (!editId || !editTitle.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/v1/services/${editId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle.trim(),
          category: editCategory,
          description: editDescription.trim() || null,
          defaultExtraPrice: editExtraPrice ? parseFloat(editExtraPrice) : null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEditId(null);
        await loadServices();
      } else {
        alert(data.error?.message || 'Failed to update');
      }
    } catch {
      alert('Failed to update service');
    } finally {
      setSaving(false);
    }
  }

  const totalServices = categories.reduce((sum, c) => sum + c.services.length, 0);

  const filteredCategories = categories
    .map(cat => ({
      ...cat,
      services: cat.services.filter(s =>
        !searchQuery ||
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.slug.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter(cat => cat.services.length > 0);

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">Loading services catalogue...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Service Catalogue</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {totalServices} services across {categories.length} categories
          </p>
        </div>
        <Button onClick={() => setShowAdd(true)} disabled={showAdd}>
          <Plus size={16} className="mr-2" /> Add Service
        </Button>
      </div>

      {/* Search */}
      <div className="mb-4">
        <Input
          placeholder="Search services..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="max-w-xs"
        />
      </div>

      {/* Add new service form */}
      {showAdd && (
        <Card className="mb-4 border-primary/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="font-medium text-sm">New Service</p>
              <Button variant="ghost" size="sm" onClick={() => setShowAdd(false)}>
                <X size={14} />
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <Input
                placeholder="Service name"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                autoFocus
              />
              <select
                value={newCategory}
                onChange={e => setNewCategory(e.target.value)}
                className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {CATEGORY_OPTIONS.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <Input
                placeholder="Description (optional)"
                value={newDescription}
                onChange={e => setNewDescription(e.target.value)}
              />
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Default extra price"
                  value={newExtraPrice}
                  onChange={e => setNewExtraPrice(e.target.value)}
                  className="w-32"
                />
                <Button onClick={addService} disabled={saving || !newTitle.trim()}>
                  {saving ? '...' : 'Add'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Categories */}
      {filteredCategories.map(category => (
        <Card key={category.id} className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              {category.name}
              <Badge variant="secondary" className="text-xs font-normal">
                {category.services.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="divide-y divide-border">
              {category.services.map(service => (
                <div key={service.id} className="flex items-center gap-3 py-2.5 group">
                  {editId === service.id ? (
                    <>
                      <Input
                        value={editTitle}
                        onChange={e => setEditTitle(e.target.value)}
                        className="h-8 text-sm flex-1"
                      />
                      <select
                        value={editCategory}
                        onChange={e => setEditCategory(e.target.value)}
                        className="h-8 rounded border border-input bg-background px-2 text-xs"
                      >
                        {CATEGORY_OPTIONS.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                      <Input
                        type="number"
                        placeholder="Extra £"
                        value={editExtraPrice}
                        onChange={e => setEditExtraPrice(e.target.value)}
                        className="h-8 w-20 text-sm"
                      />
                      <Button variant="ghost" size="sm" onClick={saveEdit} disabled={saving}>
                        <Check size={14} />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setEditId(null)}>
                        <X size={14} />
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{service.title}</span>
                          <span className="text-xs text-muted-foreground">{service.slug}</span>
                          {service.isPopular && (
                            <span className="text-xs text-amber-500">Popular</span>
                          )}
                        </div>
                        {service.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">{service.description}</p>
                        )}
                      </div>
                      {service.defaultExtraPrice != null && service.defaultExtraPrice > 0 && (
                        <Badge variant="outline" className="text-xs">
                          +£{service.defaultExtraPrice}
                        </Badge>
                      )}
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="sm" onClick={() => startEdit(service)}>
                          <Pencil size={14} />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => deleteService(service.id, service.title)}>
                          <Trash2 size={14} className="text-destructive" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {filteredCategories.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            No services found{searchQuery ? ` for "${searchQuery}"` : ''}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
