'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import type { ConciergePartner } from '@/types/concierge';

interface District {
  id: string;
  name: string;
}

interface FormData {
  name: string;
  type: string;
  districtId: string;
  address: string;
  website: string;
  phone: string;
  priceRange: string;
  description: string;
  imageUrl: string;
  isActive: boolean;
  sortOrder: number;
}

const emptyForm: FormData = {
  name: '',
  type: 'restaurant',
  districtId: '',
  address: '',
  website: '',
  phone: '',
  priceRange: '',
  description: '',
  imageUrl: '',
  isActive: true,
  sortOrder: 0,
};

const TYPE_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'hotel', label: 'Hotel' },
  { value: 'chauffeur', label: 'Chauffeur' },
  { value: 'flowers', label: 'Flowers' },
  { value: 'gifts', label: 'Gifts' },
  { value: 'events', label: 'Events' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'true', label: 'Active' },
  { value: 'false', label: 'Inactive' },
];

const PRICE_RANGE_OPTIONS = ['', '£', '££', '£££', '££££'];

const typeBadgeStyles: Record<string, string> = {
  restaurant: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  hotel: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  chauffeur: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  flowers: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  gifts: 'bg-green-500/10 text-green-400 border-green-500/20',
  events: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
};

export default function AdminConciergePage() {
  const [partners, setPartners] = useState<ConciergePartner[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [typeFilter, setTypeFilter] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const loadPartners = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (typeFilter) params.set('type', typeFilter);
      if (districtFilter) params.set('districtId', districtFilter);
      if (statusFilter) params.set('isActive', statusFilter);

      const res = await fetch(`/api/v1/concierge?${params}`);
      const json = await res.json();
      if (json.success) {
        setPartners(json.data || []);
      }
    } catch {
      showToast('Failed to load partners', 'error');
    } finally {
      setLoading(false);
    }
  }, [typeFilter, districtFilter, statusFilter, showToast]);

  const loadDistricts = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/districts');
      const json = await res.json();
      if (json.success) {
        setDistricts(json.data || []);
      }
    } catch {
      console.error('Failed to load districts');
    }
  }, []);

  useEffect(() => {
    loadPartners();
  }, [loadPartners]);

  useEffect(() => {
    loadDistricts();
  }, [loadDistricts]);

  // Filtered by search (client-side)
  const filtered = partners.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.type.toLowerCase().includes(q) ||
      (p.address?.toLowerCase().includes(q) ?? false)
    );
  });

  // Stats
  const totalPartners = partners.length;
  const restaurantCount = partners.filter((p) => p.type === 'restaurant').length;
  const hotelCount = partners.filter((p) => p.type === 'hotel').length;

  function openAddModal() {
    setEditingId(null);
    setForm(emptyForm);
    setShowModal(true);
  }

  function openEditModal(partner: ConciergePartner) {
    setEditingId(partner.id);
    setForm({
      name: partner.name,
      type: partner.type,
      districtId: partner.districtId || '',
      address: partner.address || '',
      website: partner.website || '',
      phone: partner.phone || '',
      priceRange: partner.priceRange || '',
      description: partner.description || '',
      imageUrl: partner.imageUrl || '',
      isActive: partner.isActive,
      sortOrder: partner.sortOrder,
    });
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.name.trim() || !form.type) {
      showToast('Name and Type are required', 'error');
      return;
    }

    setSaving(true);
    try {
      const body = {
        name: form.name.trim(),
        type: form.type,
        districtId: form.districtId || null,
        address: form.address.trim() || null,
        website: form.website.trim() || null,
        phone: form.phone.trim() || null,
        priceRange: form.priceRange || null,
        description: form.description.trim() || null,
        imageUrl: form.imageUrl.trim() || null,
        isActive: form.isActive,
        sortOrder: form.sortOrder,
      };

      const url = editingId ? `/api/v1/concierge/${editingId}` : '/api/v1/concierge';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();

      if (json.success) {
        showToast(editingId ? 'Partner updated' : 'Partner created', 'success');
        setShowModal(false);
        await loadPartners();
      } else {
        showToast(json.error?.message || 'Failed to save', 'error');
      }
    } catch {
      showToast('Failed to save partner', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(partner: ConciergePartner) {
    if (!confirm(`Delete "${partner.name}"? This action cannot be undone.`)) return;

    try {
      const res = await fetch(`/api/v1/concierge/${partner.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        showToast('Partner deleted', 'success');
        await loadPartners();
      } else {
        showToast(json.error?.message || 'Failed to delete', 'error');
      }
    } catch {
      showToast('Failed to delete partner', 'error');
    }
  }

  async function toggleActive(partner: ConciergePartner) {
    try {
      const res = await fetch(`/api/v1/concierge/${partner.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !partner.isActive }),
      });
      const json = await res.json();
      if (json.success) {
        await loadPartners();
      } else {
        showToast('Failed to update status', 'error');
      }
    } catch {
      showToast('Failed to update status', 'error');
    }
  }

  function getDistrictName(districtId: string | null): string {
    if (!districtId) return '—';
    const d = districts.find((d) => d.id === districtId);
    return d ? d.name : '—';
  }

  if (loading && partners.length === 0) {
    return (
      <div className="p-8">
        <p className="text-zinc-400">Loading concierge partners...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-[100] px-4 py-3 rounded-lg text-sm font-medium shadow-lg transition-all ${
            toast.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'bg-red-500/10 text-red-400 border border-red-500/20'
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-100">Concierge Partners</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Restaurants, hotels and lifestyle partners
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-zinc-200 transition-colors"
        >
          <Plus size={16} />
          Add Partner
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <p className="text-xs text-zinc-400 uppercase tracking-wider">Total Partners</p>
          <p className="text-2xl font-semibold text-zinc-100 mt-1">{totalPartners}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <p className="text-xs text-zinc-400 uppercase tracking-wider">Restaurants</p>
          <p className="text-2xl font-semibold text-orange-400 mt-1">{restaurantCount}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <p className="text-xs text-zinc-400 uppercase tracking-wider">Hotels</p>
          <p className="text-2xl font-semibold text-blue-400 mt-1">{hotelCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 outline-none"
        >
          {TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <select
          value={districtFilter}
          onChange={(e) => setDistrictFilter(e.target.value)}
          className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 outline-none"
        >
          <option value="">All Districts</option>
          {districts.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 outline-none"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Search partners..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 outline-none flex-1 min-w-[200px]"
        />
      </div>

      {/* Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800">
              <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">
                Name
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">
                Type
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">
                District
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">
                Price Range
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">
                Active
              </th>
              <th className="text-right px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">
                  No partners found
                </td>
              </tr>
            ) : (
              filtered.map((partner) => (
                <tr key={partner.id} className="hover:bg-zinc-800/50 transition-colors">
                  <td className="px-4 py-3 text-zinc-200 font-medium">{partner.name}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium border ${
                        typeBadgeStyles[partner.type] || 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
                      }`}
                    >
                      {partner.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-400">
                    {getDistrictName(partner.districtId)}
                  </td>
                  <td className="px-4 py-3 text-zinc-400">{partner.priceRange || '—'}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActive(partner)}
                      className={`relative w-9 h-5 rounded-full transition-colors ${
                        partner.isActive ? 'bg-emerald-500' : 'bg-zinc-600'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                          partner.isActive ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEditModal(partner)}
                        className="p-1.5 rounded-md hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(partner)}
                        className="p-1.5 rounded-md hover:bg-zinc-700 text-zinc-400 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-zinc-800">
              <h2 className="text-lg font-semibold text-zinc-100">
                {editingId ? 'Edit Partner' : 'Add Partner'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 outline-none focus:border-zinc-500"
                  placeholder="Partner name"
                />
              </div>

              {/* Type */}
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Type *</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 outline-none focus:border-zinc-500"
                >
                  {TYPE_OPTIONS.filter((o) => o.value !== '').map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* District */}
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">District</label>
                <select
                  value={form.districtId}
                  onChange={(e) => setForm({ ...form, districtId: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 outline-none focus:border-zinc-500"
                >
                  <option value="">— None —</option>
                  {districts.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Address</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 outline-none focus:border-zinc-500"
                  placeholder="Address"
                />
              </div>

              {/* Website & Phone */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Website</label>
                  <input
                    type="text"
                    value={form.website}
                    onChange={(e) => setForm({ ...form, website: e.target.value })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 outline-none focus:border-zinc-500"
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Phone</label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 outline-none focus:border-zinc-500"
                    placeholder="+44..."
                  />
                </div>
              </div>

              {/* Price Range */}
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Price Range</label>
                <select
                  value={form.priceRange}
                  onChange={(e) => setForm({ ...form, priceRange: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 outline-none focus:border-zinc-500"
                >
                  {PRICE_RANGE_OPTIONS.map((pr) => (
                    <option key={pr || '__none'} value={pr}>
                      {pr || '— None —'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 outline-none focus:border-zinc-500 resize-none"
                  placeholder="Brief description..."
                />
              </div>

              {/* Image URL */}
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Image URL</label>
                <input
                  type="text"
                  value={form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 outline-none focus:border-zinc-500"
                  placeholder="https://..."
                />
              </div>

              {/* Is Active & Sort Order */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Active</label>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, isActive: !form.isActive })}
                    className={`relative w-9 h-5 rounded-full transition-colors ${
                      form.isActive ? 'bg-emerald-500' : 'bg-zinc-600'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                        form.isActive ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Sort Order</label>
                  <input
                    type="number"
                    value={form.sortOrder}
                    onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 outline-none focus:border-zinc-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-zinc-800">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : editingId ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
