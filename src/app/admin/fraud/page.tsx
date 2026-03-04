// FRAUD MONITOR PAGE
'use client';

import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';

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

export default function FraudMonitorPage() {
  const [stats, setStats] = useState<FraudStats>({ clientsMonitored: 0, clientsBlocked: 0, signalsThisWeek: 0, totalChargebacks: 0 });
  const [clients, setClients] = useState<FraudClient[]>([]);
  const [signals, setSignals] = useState<FraudSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [statsRes, clientsRes, signalsRes] = await Promise.all([
        fetch('/api/v1/fraud/stats'),
        fetch('/api/v1/fraud/clients?limit=50'),
        fetch('/api/v1/fraud/signals?limit=20')
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
  }

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
        <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-3">Recent Fraud Signals</h2>
        <div className="space-y-3">
          {signals.map(signal => (
            <div key={signal.id} className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border border-zinc-700/50 text-zinc-400">{signal.signalType.replace(/_/g, ' ')}</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${signal.riskScoreImpact >= 20 ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'}`}>+{signal.riskScoreImpact} risk</span>
                {signal.booking?.shortId && <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border border-zinc-700/50 text-zinc-500">{signal.booking.shortId}</span>}
              </div>
              <div className="flex items-center gap-4 text-xs text-zinc-500">
                <span>{signal.client?.fullName || 'Unknown'}</span>
                {signal.model?.name && <span>Model: {signal.model.name}</span>}
                <span>{formatDistanceToNow(new Date(signal.createdAt), { addSuffix: true })}</span>
              </div>
            </div>
          ))}
          {signals.length === 0 && (
            <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-8 text-center">
              <p className="text-zinc-500">No recent fraud signals.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
