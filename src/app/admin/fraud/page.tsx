// FRAUD MONITOR PAGE
'use client';

import { useEffect, useState, useCallback } from 'react';

type FraudClient = {
  id: string;
  fullName?: string;
  email?: string;
  phone?: string;
  riskStatus: string;
  totalSpent: number;
  bookingCount: number;
  chargebackCount: number;
  tags: string[];
};

type FraudSignal = {
  id: string;
  client?: { id: string; fullName: string; riskStatus: string };
  booking?: { id: string; shortId?: string };
  model?: { id: string; name: string };
  signalType: string;
  riskScoreImpact: number;
  status: string;
  sourceModule: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
};

type FraudStats = {
  clientsMonitored: number;
  clientsBlocked: number;
  signalsThisWeek: number;
  totalChargebacks: number;
};

const riskStyles: Record<string, string> = {
  normal: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  monitoring: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  restricted: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  blocked: 'bg-red-500/10 text-red-400 border-red-500/20',
};

const signalStatusStyles: Record<string, string> = {
  new: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  reviewing: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  confirmed: 'bg-red-500/10 text-red-400 border-red-500/20',
  dismissed: 'bg-zinc-500/10 text-zinc-400 border-zinc-700/50',
};

export default function FraudMonitorPage() {
  const [stats, setStats] = useState<FraudStats>({ clientsMonitored: 0, clientsBlocked: 0, signalsThisWeek: 0, totalChargebacks: 0 });
  const [clients, setClients] = useState<FraudClient[]>([]);
  const [signals, setSignals] = useState<FraudSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Filters
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSource, setFilterSource] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const signalParams = new URLSearchParams({ limit: '30' });
      if (filterStatus) signalParams.set('status', filterStatus);
      if (filterSource) signalParams.set('sourceModule', filterSource);

      const [statsRes, clientsRes, signalsRes] = await Promise.all([
        fetch('/api/v1/fraud/stats'),
        fetch('/api/v1/fraud/clients?limit=50'),
        fetch(`/api/v1/fraud/signals?${signalParams}`)
      ]);
      const statsData = await statsRes.json();
      const clientsData = await clientsRes.json();
      const signalsData = await signalsRes.json();
      setStats(statsData.data || stats);
      setClients(clientsData.data?.clients || []);
      setSignals(signalsData.data?.signals || []);
    } catch (error) {
      console.error('Failed to load fraud data:', error);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterSource]);

  useEffect(() => { loadData(); }, [loadData]);

  async function changeRiskStatus(clientId: string, riskStatus: string) {
    try {
      setSubmitting(true);
      await fetch(`/api/v1/fraud/clients/${clientId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ riskStatus })
      });
      await loadData();
    } catch (error) {
      console.error('Failed to change risk status:', error);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReviewSignal(signalId: string, status: 'confirmed' | 'dismissed') {
    try {
      setSubmitting(true);
      await fetch(`/api/v1/fraud/signals/${signalId}/review`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      await loadData();
    } catch (error) {
      console.error('Failed to review signal:', error);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">Fraud Monitor</h1>
          <p className="text-sm text-zinc-500 mt-1">Loading...</p>
        </div>
        <div className="space-y-4 animate-pulse">
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-zinc-800/30 rounded-xl" />)}
          </div>
          {[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-zinc-800/30 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">Fraud Monitor</h1>
        <p className="text-sm text-zinc-500 mt-1">Risk monitoring and fraud detection</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-5">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Clients Monitored</p>
          <p className="text-2xl font-semibold text-yellow-400 mt-2">{stats.clientsMonitored}</p>
        </div>
        <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-5">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Blocked</p>
          <p className="text-2xl font-semibold text-red-400 mt-2">{stats.clientsBlocked}</p>
        </div>
        <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-5">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Signals This Week</p>
          <p className="text-2xl font-semibold text-zinc-100 mt-2">{stats.signalsThisWeek}</p>
        </div>
        <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-5">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Chargebacks</p>
          <p className="text-2xl font-semibold text-red-400 mt-2">{stats.totalChargebacks}</p>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-3">Clients at Risk</h2>
        <div className="space-y-3">
          {clients.map(client => (
            <div key={client.id} className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${riskStyles[client.riskStatus] || riskStyles.normal}`}>{client.riskStatus}</span>
                    {client.chargebackCount > 0 && <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border bg-red-500/10 text-red-400 border-red-500/20">{client.chargebackCount} chargebacks</span>}
                  </div>
                  <h3 className="text-sm font-medium text-zinc-200 mb-1">{client.fullName || 'Unknown'}</h3>
                  <div className="flex items-center gap-4 text-xs text-zinc-500">
                    {client.email && <span>{client.email}</span>}
                    {client.phone && <span>{client.phone}</span>}
                    <span>£{client.totalSpent.toFixed(0)} spent</span>
                    <span>{client.bookingCount} bookings</span>
                  </div>
                </div>
                <select
                  className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-zinc-200 focus:outline-none focus:border-zinc-600 transition-colors duration-150"
                  value={client.riskStatus}
                  disabled={submitting}
                  onChange={e => changeRiskStatus(client.id, e.target.value)}
                >
                  <option value="normal">Normal</option>
                  <option value="monitoring">Monitoring</option>
                  <option value="restricted">Restricted</option>
                  <option value="blocked">Blocked</option>
                </select>
              </div>
            </div>
          ))}
          {clients.length === 0 && (
            <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-8 text-center">
              <p className="text-zinc-500">No clients at risk.</p>
            </div>
          )}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Fraud Signals</h2>
          <div className="flex gap-2">
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-100 px-3 py-1.5 text-xs">
              <option value="">All Statuses</option>
              <option value="new">New</option>
              <option value="reviewing">Reviewing</option>
              <option value="confirmed">Confirmed</option>
              <option value="dismissed">Dismissed</option>
            </select>
            <select value={filterSource} onChange={e => setFilterSource(e.target.value)}
              className="rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-100 px-3 py-1.5 text-xs">
              <option value="">All Sources</option>
              <option value="payments">Payments</option>
              <option value="inquiries">Inquiries</option>
              <option value="bookings">Bookings</option>
              <option value="membership">Membership</option>
              <option value="retention">Retention</option>
              <option value="manual">Manual</option>
            </select>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800/50">
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Client</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Type</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Source</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Impact</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Created</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {signals.map(signal => (
                <tr key={signal.id} className="border-b border-zinc-800/30 hover:bg-zinc-800/20">
                  <td className="px-4 py-3">
                    <p className="text-zinc-200 text-sm">{signal.client?.fullName || 'Unknown'}</p>
                    {signal.booking?.shortId && (
                      <p className="text-zinc-500 text-xs">{signal.booking.shortId}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-zinc-400 text-xs">{signal.signalType.replace(/_/g, ' ')}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-zinc-500 text-xs">{signal.sourceModule || '-'}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${
                      signal.riskScoreImpact >= 20 ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                    }`}>+{signal.riskScoreImpact}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${signalStatusStyles[signal.status] || signalStatusStyles.new}`}>
                      {signal.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-500 text-xs">
                    {new Date(signal.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {(signal.status === 'new' || signal.status === 'reviewing') && (
                      <div className="flex gap-1 justify-center">
                        <button onClick={() => handleReviewSignal(signal.id, 'confirmed')} disabled={submitting}
                          className="px-2 py-1 rounded bg-red-500/20 text-red-400 text-xs hover:bg-red-500/30 disabled:opacity-50">
                          Confirm
                        </button>
                        <button onClick={() => handleReviewSignal(signal.id, 'dismissed')} disabled={submitting}
                          className="px-2 py-1 rounded bg-zinc-700 text-zinc-400 text-xs hover:bg-zinc-600 disabled:opacity-50">
                          Dismiss
                        </button>
                      </div>
                    )}
                    {signal.status === 'confirmed' && (
                      <span className="text-xs text-red-400">Confirmed</span>
                    )}
                    {signal.status === 'dismissed' && (
                      <span className="text-xs text-zinc-500">Dismissed</span>
                    )}
                  </td>
                </tr>
              ))}
              {signals.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-zinc-500">No fraud signals found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
