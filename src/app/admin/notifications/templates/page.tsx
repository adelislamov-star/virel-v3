// NOTIFICATION TEMPLATES — Admin page
// List, create, edit, delete, preview templates
'use client';

import { useState, useEffect, useCallback } from 'react';

type Template = {
  id: string;
  code: string;
  name: string;
  channel: string;
  eventType: string;
  subjectTemplate?: string | null;
  bodyTemplate: string;
  isActive: boolean;
  version: number;
  createdAt: string;
};

const channelBadge: Record<string, string> = {
  email: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  telegram: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  sms: 'bg-green-500/10 text-green-400 border-green-500/20',
  push: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
};

const EMPTY_FORM = { code: '', name: '', channel: 'email', eventType: '', subjectTemplate: '', bodyTemplate: '' };

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal state
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [editId, setEditId] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState<Template | null>(null);

  // Preview
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [previewResult, setPreviewResult] = useState<{ subject: string | null; body: string } | null>(null);

  const load = useCallback(async () => {
    try {
      setError('');
      const res = await fetch('/api/v1/notification-templates');
      const data = await res.json();
      if (data.success) setTemplates(data.data.templates);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  function openCreate() {
    setForm(EMPTY_FORM);
    setModalMode('create');
  }

  function openEdit(t: Template) {
    setEditId(t.id);
    setForm({ code: t.code, name: t.name, channel: t.channel, eventType: t.eventType, subjectTemplate: t.subjectTemplate || '', bodyTemplate: t.bodyTemplate });
    setModalMode('edit');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (modalMode === 'create') {
        await fetch('/api/v1/notification-templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...form, subjectTemplate: form.subjectTemplate || undefined }),
        });
      } else {
        await fetch(`/api/v1/notification-templates/${editId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: form.name, channel: form.channel, eventType: form.eventType, subjectTemplate: form.subjectTemplate || null, bodyTemplate: form.bodyTemplate }),
        });
      }
      setModalMode(null);
      load();
    } finally { setSubmitting(false); }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await fetch(`/api/v1/notification-templates/${deleteTarget.id}`, { method: 'DELETE' });
    setDeleteTarget(null);
    load();
  }

  async function handleToggleActive(t: Template) {
    await fetch(`/api/v1/notification-templates/${t.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !t.isActive }),
    });
    load();
  }

  function handlePreview(t: Template) {
    setPreviewTemplate(t);
    // Render with sample data
    const sampleVars: Record<string, string> = { client_name: 'John Doe', model_name: 'Sophia', booking_id: 'BK-12345', date: '15 Mar 2026', time: '14:00', amount: '250.00', currency: 'GBP' };
    const interpolate = (text: string) => text.replace(/\{\{(\w+)\}\}/g, (_, key) => sampleVars[key] || `{{${key}}}`);
    setPreviewResult({
      subject: t.subjectTemplate ? interpolate(t.subjectTemplate) : null,
      body: interpolate(t.bodyTemplate),
    });
  }

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight mb-2">Notification Templates</h1>
        <div className="space-y-4 animate-pulse"><div className="h-64 bg-zinc-800/30 rounded-xl" /></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight mb-2">Notification Templates</h1>
        <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-6 text-red-400">{error}</div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">Notification Templates</h1>
          <p className="text-sm text-zinc-500 mt-1">{templates.length} templates</p>
        </div>
        <button onClick={openCreate} className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-900 text-sm font-medium transition-colors">
          + Create Template
        </button>
      </div>

      {/* Templates list */}
      <div className="space-y-3">
        {templates.map(t => (
          <div key={t.id} className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-5 hover:bg-zinc-800/30 transition-colors">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${channelBadge[t.channel] || 'bg-zinc-500/10 text-zinc-400 border-zinc-700/50'}`}>
                    {t.channel}
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border border-zinc-700/50 text-zinc-500">
                    {t.eventType}
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border border-zinc-700/50 text-zinc-500">
                    v{t.version}
                  </span>
                </div>
                <h3 className="text-sm font-medium text-zinc-200">{t.name}</h3>
                <p className="text-xs text-zinc-500 font-mono mt-1">{t.code}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {/* Active toggle */}
                <button
                  onClick={() => handleToggleActive(t)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${t.isActive ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20' : 'bg-zinc-500/10 text-zinc-500 hover:bg-zinc-500/20'}`}
                >
                  {t.isActive ? 'Active' : 'Inactive'}
                </button>
                <button onClick={() => handlePreview(t)}
                  className="px-2.5 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 text-xs hover:bg-blue-500/20">
                  Preview
                </button>
                <button onClick={() => openEdit(t)}
                  className="px-2.5 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 text-xs hover:bg-amber-500/20">
                  Edit
                </button>
                <button onClick={() => setDeleteTarget(t)}
                  className="px-2.5 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-xs hover:bg-red-500/20">
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
        {templates.length === 0 && (
          <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-12 text-center">
            <p className="text-zinc-500">No templates yet. Create one to get started.</p>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {modalMode && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setModalMode(null)}>
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-zinc-100 mb-4">
              {modalMode === 'create' ? 'Create Template' : `Edit Template (v${templates.find(t => t.id === editId)?.version ?? ''})`}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Code</label>
                  <input type="text" required value={form.code} onChange={e => setForm({ ...form, code: e.target.value })}
                    disabled={modalMode === 'edit'}
                    className="w-full rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-100 px-3 py-2 text-sm disabled:opacity-50" placeholder="booking_confirmed" />
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Name</label>
                  <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                    className="w-full rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-100 px-3 py-2 text-sm" placeholder="Booking Confirmed" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Channel</label>
                  <select value={form.channel} onChange={e => setForm({ ...form, channel: e.target.value })}
                    className="w-full rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-100 px-3 py-2 text-sm">
                    <option value="email">email</option>
                    <option value="telegram">telegram</option>
                    <option value="sms">sms</option>
                    <option value="push">push</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Event Type</label>
                  <input type="text" required value={form.eventType} onChange={e => setForm({ ...form, eventType: e.target.value })}
                    className="w-full rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-100 px-3 py-2 text-sm" placeholder="booking.confirmed" />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-xs text-zinc-500 mb-1">Subject Template (optional, for email)</label>
                <input type="text" value={form.subjectTemplate} onChange={e => setForm({ ...form, subjectTemplate: e.target.value })}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-100 px-3 py-2 text-sm" placeholder="Booking {{booking_id}} confirmed" />
              </div>
              <div className="mb-4">
                <label className="block text-xs text-zinc-500 mb-1">Body Template</label>
                <textarea required rows={5} value={form.bodyTemplate} onChange={e => setForm({ ...form, bodyTemplate: e.target.value })}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-100 px-3 py-2 text-sm font-mono"
                  placeholder="Hi {{client_name}}, your booking with {{model_name}} on {{date}} at {{time}} has been confirmed." />
                <p className="text-xs text-zinc-600 mt-1">Variables: {'{{variable_name}}'}</p>
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setModalMode(null)} className="px-4 py-2 rounded-lg bg-zinc-800 text-zinc-300 text-sm hover:bg-zinc-700">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-900 text-sm font-medium disabled:opacity-50">
                  {submitting ? 'Saving...' : modalMode === 'create' ? 'Create' : 'Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setDeleteTarget(null)}>
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-zinc-100 mb-4">Delete Template</h3>
            <p className="text-sm text-zinc-400 mb-4">
              Are you sure you want to delete <span className="text-zinc-200 font-medium">{deleteTarget.name}</span>?
              This will soft-delete the template.
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 rounded-lg bg-zinc-800 text-zinc-300 text-sm hover:bg-zinc-700">Cancel</button>
              <button onClick={handleDelete} className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-400 text-white text-sm font-medium">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewTemplate && previewResult && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => { setPreviewTemplate(null); setPreviewResult(null); }}>
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-zinc-100 mb-4">Preview: {previewTemplate.name}</h3>
            <p className="text-xs text-zinc-500 mb-4">Rendered with sample data (client_name, model_name, booking_id, date, time, amount, currency)</p>
            {previewResult.subject && (
              <div className="mb-4">
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Subject</p>
                <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-3 text-sm text-zinc-200">{previewResult.subject}</div>
              </div>
            )}
            <div className="mb-4">
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Body</p>
              <pre className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-3 text-sm text-zinc-200 whitespace-pre-wrap">{previewResult.body}</pre>
            </div>
            <div className="flex justify-end">
              <button onClick={() => { setPreviewTemplate(null); setPreviewResult(null); }} className="px-4 py-2 rounded-lg bg-zinc-800 text-zinc-300 text-sm hover:bg-zinc-700">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
