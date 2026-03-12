// RETENTION ENGINE — Admin page
// Clients at risk, retention actions, campaigns, run scan
'use client';

import { useState, useEffect, useCallback } from 'react';

type RetentionProfile = {
  id: string;
  clientId: string;
  segment: string;
  churnRiskScore: number;
  daysSinceLastBooking: number;
  totalSpent: number;
  totalBookings: number;
  avgBookingValue: number;
  nextBestActionType: string | null;
  segmentReason: string | null;
  client: { id: string; firstName: string | null; lastName: string | null; riskStatus: string };
};

type RetentionAction = {
  id: string;
  clientId: string;
  actionType: string;
  status: string;
  channel: string;
  scheduledAt: string;
  completedAt: string | null;
  result: string | null;
  client?: { id: string; firstName: string | null; lastName: string | null };
};

type Campaign = {
  id: string;
  name: string;
  triggerType: string;
  channel: string;
  isActive: boolean;
};

const segmentBadge: Record<string, string> = {
  new: 'bg-zinc-500/10 text-zinc-400 border-zinc-700/50',
  active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  cooling: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  at_risk: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  lost: 'bg-red-500/10 text-red-400 border-red-500/20',
  vip: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  whale: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
};

const actionStatusBadge: Record<string, string> = {
  planned: 'bg-zinc-500/10 text-zinc-400',
  sent: 'bg-blue-500/10 text-blue-400',
  completed: 'bg-emerald-500/10 text-emerald-400',
  failed: 'bg-red-500/10 text-red-400',
  cancelled: 'bg-zinc-500/10 text-zinc-500',
};

export default function RetentionPage() {
  const [tab, setTab] = useState<'at_risk' | 'lost' | 'all'>('at_risk');
  const [profiles, setProfiles] = useState<RetentionProfile[]>([]);
  const [actions, setActions] = useState<RetentionAction[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [total, setTotal] = useState(0);

  // Create action modal
  const [createModal, setCreateModal] = useState<string | null>(null); // clientId
  const [actionForm, setActionForm] = useState({ actionType: 'follow_up', channel: 'email', scheduledAt: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);

  // Complete modal
  const [completeTarget, setCompleteTarget] = useState<RetentionAction | null>(null);
  const [completeResult, setCompleteResult] = useState('');

  const loadProfiles = useCallback(async () => {
    try {
      setError('');
      const segmentFilter = tab === 'all' ? '' : `&segment=${tab}`;
      const res = await fetch(`/api/v1/retention/clients?limit=50${segmentFilter}`);
      const data = await res.json();
      if (data.success) {
        setProfiles(data.data.profiles);
        setTotal(data.data.total);
      }
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [tab]);

  const loadActions = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/retention/actions?limit=50');
      const data = await res.json();
      if (data.success) setActions(data.data.actions);
    } catch {}
  }, []);

  const loadCampaigns = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/retention/campaigns');
      const data = await res.json();
      if (data.success) setCampaigns(data.data.campaigns);
    } catch {}
  }, []);

  useEffect(() => { loadProfiles(); }, [loadProfiles]);
  useEffect(() => { loadActions(); loadCampaigns(); }, [loadActions, loadCampaigns]);

  async function handleCreateAction(e: React.FormEvent) {
    e.preventDefault();
    if (!createModal) return;
    setSubmitting(true);
    try {
      await fetch('/api/v1/retention/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: createModal,
          actionType: actionForm.actionType,
          channel: actionForm.channel,
          scheduledAt: actionForm.scheduledAt || new Date().toISOString(),
          metadataJson: actionForm.notes ? { notes: actionForm.notes } : undefined,
        }),
      });
      setCreateModal(null);
      setActionForm({ actionType: 'follow_up', channel: 'email', scheduledAt: '', notes: '' });
      loadActions();
    } finally { setSubmitting(false); }
  }

  async function handleComplete(e: React.FormEvent) {
    e.preventDefault();
    if (!completeTarget) return;
    setSubmitting(true);
    try {
      await fetch(`/api/v1/retention/actions/${completeTarget.id}/complete`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ result: completeResult }),
      });
      setCompleteTarget(null);
      setCompleteResult('');
      loadActions();
    } finally { setSubmitting(false); }
  }

  async function handleCancelAction(id: string) {
    await fetch(`/api/v1/retention/actions/${id}/cancel`, { method: 'PATCH' });
    loadActions();
  }

  async function handleRunScan() {
    setSubmitting(true);
    try {
      await fetch('/api/v1/retention/run-scan', { method: 'POST' });
      loadProfiles();
    } finally { setSubmitting(false); }
  }

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight mb-2">Retention Engine</h1>
        <div className="space-y-4 animate-pulse"><div className="h-64 bg-zinc-800/30 rounded-xl" /></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight mb-2">Retention Engine</h1>
        <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-6 text-red-400">{error}</div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">Retention Engine</h1>
          <p className="text-sm text-zinc-500 mt-1">{total} profiles in segment</p>
        </div>
        <button onClick={handleRunScan} disabled={submitting}
          className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-900 text-sm font-medium transition-colors disabled:opacity-50">
          Run Scan
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {([['at_risk', 'At Risk'], ['lost', 'Lost'], ['all', 'All Clients']] as const).map(([key, label]) => (
          <button key={key} onClick={() => { setTab(key); setLoading(true); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === key ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Clients Table */}
      <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 overflow-hidden mb-8">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800/50">
              <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Client</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Segment</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Churn Risk</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Days Inactive</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Total Spent</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Next Action</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider"></th>
            </tr>
          </thead>
          <tbody>
            {profiles.map(p => (
              <tr key={p.id} className="border-b border-zinc-800/30 hover:bg-zinc-800/20">
                <td className="px-4 py-3 text-zinc-200">{p.client.firstName} {p.client.lastName}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${segmentBadge[p.segment] || segmentBadge.new}`}>
                    {p.segment}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${p.churnRiskScore > 60 ? 'bg-red-500' : p.churnRiskScore > 30 ? 'bg-orange-500' : 'bg-emerald-500'}`}
                        style={{ width: `${p.churnRiskScore}%` }} />
                    </div>
                    <span className="text-xs text-zinc-400">{p.churnRiskScore}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-zinc-400">{p.daysSinceLastBooking}d</td>
                <td className="px-4 py-3 text-right text-zinc-300">{Number(p.totalSpent).toFixed(2)}</td>
                <td className="px-4 py-3">
                  {p.nextBestActionType && (
                    <span className="text-xs text-zinc-500">{p.nextBestActionType.replace(/_/g, ' ')}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => setCreateModal(p.clientId)}
                    className="px-2.5 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 text-xs hover:bg-amber-500/20">
                    Create Action
                  </button>
                </td>
              </tr>
            ))}
            {profiles.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-zinc-500">No profiles in this segment.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Actions Section */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-zinc-100 mb-4">Retention Actions</h2>
        <div className="space-y-2">
          {actions.map(a => (
            <div key={a.id} className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-4 flex items-center justify-between hover:bg-zinc-800/30">
              <div className="flex items-center gap-3">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${actionStatusBadge[a.status] || actionStatusBadge.planned}`}>
                  {a.status}
                </span>
                <span className="text-sm text-zinc-200">{a.actionType.replace(/_/g, ' ')}</span>
                <span className="text-xs text-zinc-500">{a.channel}</span>
                <span className="text-xs text-zinc-600">
                  {a.client ? `${a.client.firstName || ''} ${a.client.lastName || ''}`.trim() : a.clientId}
                </span>
                <span className="text-xs text-zinc-600">
                  {new Date(a.scheduledAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex gap-2">
                {(a.status === 'planned' || a.status === 'sent') && (
                  <>
                    <button onClick={() => { setCompleteTarget(a); setCompleteResult(''); }}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs hover:bg-emerald-500/20">
                      Complete
                    </button>
                    <button onClick={() => handleCancelAction(a.id)}
                      className="px-2.5 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-xs hover:bg-red-500/20">
                      Cancel
                    </button>
                  </>
                )}
                {a.result && (
                  <span className="text-xs text-zinc-500 italic">{a.result}</span>
                )}
              </div>
            </div>
          ))}
          {actions.length === 0 && (
            <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-12 text-center">
              <p className="text-zinc-500">No retention actions yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* Campaigns Section */}
      <div>
        <h2 className="text-lg font-semibold text-zinc-100 mb-4">Campaigns</h2>
        <div className="space-y-2">
          {campaigns.map(c => (
            <div key={c.id} className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-4 flex items-center justify-between hover:bg-zinc-800/30">
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${c.isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-500/10 text-zinc-500'}`}>
                  {c.isActive ? 'Active' : 'Inactive'}
                </span>
                <span className="text-sm text-zinc-200">{c.name}</span>
                <span className="text-xs text-zinc-500">{c.triggerType.replace(/_/g, ' ')}</span>
                <span className="text-xs text-zinc-600">{c.channel}</span>
              </div>
            </div>
          ))}
          {campaigns.length === 0 && (
            <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-12 text-center">
              <p className="text-zinc-500">No campaigns configured.</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Action Modal */}
      {createModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setCreateModal(null)}>
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-zinc-100 mb-4">Create Retention Action</h3>
            <form onSubmit={handleCreateAction}>
              <div className="space-y-4 mb-4">
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Action Type</label>
                  <select value={actionForm.actionType} onChange={e => setActionForm({ ...actionForm, actionType: e.target.value })}
                    className="w-full rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-100 px-3 py-2 text-sm">
                    <option value="follow_up">Follow Up</option>
                    <option value="win_back_offer">Win Back Offer</option>
                    <option value="vip_checkin">VIP Check-in</option>
                    <option value="membership_offer">Membership Offer</option>
                    <option value="birthday_message">Birthday Message</option>
                    <option value="inactivity_alert">Inactivity Alert</option>
                    <option value="manual_call_task">Manual Call Task</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Channel</label>
                  <select value={actionForm.channel} onChange={e => setActionForm({ ...actionForm, channel: e.target.value })}
                    className="w-full rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-100 px-3 py-2 text-sm">
                    <option value="email">email</option>
                    <option value="telegram">telegram</option>
                    <option value="sms">sms</option>
                    <option value="internal">internal</option>
                    <option value="phone_call">phone_call</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Scheduled At</label>
                  <input type="datetime-local" value={actionForm.scheduledAt} onChange={e => setActionForm({ ...actionForm, scheduledAt: e.target.value })}
                    className="w-full rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-100 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Notes</label>
                  <textarea rows={2} value={actionForm.notes} onChange={e => setActionForm({ ...actionForm, notes: e.target.value })}
                    className="w-full rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-100 px-3 py-2 text-sm" />
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setCreateModal(null)} className="px-4 py-2 rounded-lg bg-zinc-800 text-zinc-300 text-sm hover:bg-zinc-700">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-900 text-sm font-medium disabled:opacity-50">
                  {submitting ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complete Action Modal */}
      {completeTarget && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setCompleteTarget(null)}>
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-zinc-100 mb-4">Complete Action</h3>
            <form onSubmit={handleComplete}>
              <div className="mb-4">
                <label className="block text-xs text-zinc-500 mb-1">Result</label>
                <textarea required rows={3} value={completeResult} onChange={e => setCompleteResult(e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-100 px-3 py-2 text-sm"
                  placeholder="Describe the outcome..." />
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setCompleteTarget(null)} className="px-4 py-2 rounded-lg bg-zinc-800 text-zinc-300 text-sm hover:bg-zinc-700">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-900 text-sm font-medium disabled:opacity-50">
                  {submitting ? 'Saving...' : 'Complete'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
