'use client';

import { useEffect, useState, useCallback } from 'react';
import { Pencil, Trash2, Plus, X } from 'lucide-react';

interface CallRate {
  id: string;
  label: string;
  durationMin: number;
  sortOrder: number;
  isActive: boolean;
}

type ModalData = Partial<CallRate> & { _isNew?: boolean };

function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);
  const bg = type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
    : 'bg-red-500/10 border-red-500/30 text-red-400';
  return (
    <div className={`fixed top-4 right-4 z-[100] px-4 py-3 rounded-lg border text-sm ${bg}`}>{message}</div>
  );
}

function formatDuration(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}h ${String(m).padStart(2, '0')}m`;
}

export default function CallRatesPage() {
  const [items, setItems] = useState<CallRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState<ModalData | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<CallRate | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  }, []);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch('/api/v1/call-rates');
      const json = await res.json();
      if (json.success) {
        setItems(json.data);
      } else {
        setError(json.error?.message || 'Failed to load');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleActive = async (rate: CallRate) => {
    try {
      const res = await fetch(`/api/v1/call-rates/${rate.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !rate.isActive }),
      });
      const json = await res.json();
      if (json.success) {
        setItems((prev) => prev.map((r) => r.id === rate.id ? { ...r, isActive: !r.isActive } : r));
      }
    } catch {
      showToast('Failed to update status', 'error');
    }
  };

  const handleSave = async () => {
    if (!modal) return;
    if (!modal.label?.trim()) { showToast('Label is required', 'error'); return; }
    if (!modal.durationMin || modal.durationMin <= 0) { showToast('Duration must be greater than 0', 'error'); return; }
    if (!Number.isInteger(modal.durationMin)) { showToast('Duration must be a whole number', 'error'); return; }

    setSaving(true);
    try {
      const body = {
        label: modal.label?.trim(),
        durationMin: modal.durationMin,
        sortOrder: modal.sortOrder ?? 0,
        isActive: modal.isActive ?? true,
      };

      const url = modal._isNew ? '/api/v1/call-rates' : `/api/v1/call-rates/${modal.id}`;
      const method = modal._isNew ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.success) {
        showToast('Saved successfully', 'success');
        setModal(null);
        load();
      } else {
        showToast(json.error?.message || 'Save failed', 'error');
      }
    } catch {
      showToast('Something went wrong', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (rate: CallRate) => {
    try {
      const res = await fetch(`/api/v1/call-rates/${rate.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (res.status === 409) {
        const msg = json.error?.message || 'Cannot delete: used in model rate sheets';
        showToast(msg, 'error');
      } else if (json.success) {
        showToast('Deleted successfully', 'success');
        setItems((prev) => prev.filter((r) => r.id !== rate.id));
      } else {
        showToast(json.error?.message || 'Delete failed', 'error');
      }
    } catch {
      showToast('Something went wrong', 'error');
    }
    setConfirmDelete(null);
  };

  const openAdd = () => {
    setModal({ _isNew: true, label: '', durationMin: 60, sortOrder: 0, isActive: true });
  };

  const openEdit = (rate: CallRate) => {
    setModal({ ...rate });
  };

  const updateModal = (field: string, value: unknown) => {
    setModal((prev) => prev ? { ...prev, [field]: value } : prev);
  };

  return (
    <div className="p-6 space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Call Rates</h1>
          <p className="text-sm text-zinc-500 mt-1">Duration templates for model pricing</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} /> Add Duration
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400 text-sm">{error}</div>
      )}

      {/* Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400 text-left">
                <th className="px-4 py-3 font-medium">Label</th>
                <th className="px-4 py-3 font-medium">Duration</th>
                <th className="px-4 py-3 font-medium w-20">Sort Order</th>
                <th className="px-4 py-3 font-medium w-16">Active</th>
                <th className="px-4 py-3 font-medium w-24">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-zinc-500">Loading...</td></tr>
              )}
              {!loading && items.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-zinc-500">No call rates found</td></tr>
              )}
              {!loading && items.map((item) => (
                <tr key={item.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/50 transition-colors">
                  <td className="px-4 py-3 text-zinc-200 font-medium">{item.label}</td>
                  <td className="px-4 py-3 text-zinc-400">{formatDuration(item.durationMin)}</td>
                  <td className="px-4 py-3 text-zinc-400">{item.sortOrder}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActive(item)}
                      className={`relative w-9 h-5 rounded-full transition-colors ${item.isActive ? 'bg-emerald-500' : 'bg-zinc-600'}`}
                    >
                      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${item.isActive ? 'left-[18px]' : 'left-0.5'}`} />
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(item)} className="p-1.5 rounded hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors" title="Edit">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => setConfirmDelete(item)} className="p-1.5 rounded hover:bg-zinc-700 text-zinc-400 hover:text-red-400 transition-colors" title="Delete">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirm */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setConfirmDelete(null)}>
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 max-w-sm w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-white font-semibold mb-2">Delete call rate</h3>
            <p className="text-zinc-400 text-sm mb-4">Delete &quot;{confirmDelete.label}&quot;? This cannot be undone.</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirmDelete(null)} className="px-3 py-1.5 text-sm rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700">Cancel</button>
              <button onClick={() => handleDelete(confirmDelete)} className="px-3 py-1.5 text-sm rounded-lg bg-red-600 text-white hover:bg-red-500">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Add/Edit */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setModal(null)}>
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
              <h2 className="text-lg font-semibold text-white">{modal._isNew ? 'Add Duration' : 'Edit Duration'}</h2>
              <button onClick={() => setModal(null)} className="text-zinc-400 hover:text-zinc-200"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Label *</label>
                <input
                  type="text"
                  value={modal.label || ''}
                  onChange={(e) => updateModal('label', e.target.value)}
                  placeholder='e.g. "1 Hour", "Overnight (9 hrs)"'
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-zinc-500"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Duration (minutes) *</label>
                <input
                  type="number"
                  value={modal.durationMin ?? 60}
                  onChange={(e) => updateModal('durationMin', parseInt(e.target.value) || 0)}
                  min={1}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-zinc-500"
                />
                <p className="text-xs text-zinc-500 mt-1">= {formatDuration(modal.durationMin ?? 0)}</p>
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Sort Order</label>
                <input
                  type="number"
                  value={modal.sortOrder ?? 0}
                  onChange={(e) => updateModal('sortOrder', parseInt(e.target.value) || 0)}
                  className="w-32 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-zinc-500"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
                <button
                  onClick={() => updateModal('isActive', !modal.isActive)}
                  className={`relative w-9 h-5 rounded-full transition-colors ${modal.isActive ? 'bg-emerald-500' : 'bg-zinc-600'}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${modal.isActive ? 'left-[18px]' : 'left-0.5'}`} />
                </button>
                Active
              </label>
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-zinc-800">
              <button onClick={() => setModal(null)} className="px-4 py-2 text-sm rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700">Cancel</button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-medium disabled:opacity-50"
              >
                {saving && <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />}
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
