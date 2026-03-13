'use client';

import { useEffect, useState, useCallback } from 'react';
import { Bar, XAxis, YAxis, Tooltip, BarChart, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

// ── Types ──────────────────────────────────────────────
type Snapshot = {
  totalRevenue: number;
  netMargin: number;
  arpu: number;
  mrr: number;
  conversionRate: number;
  lostRevenueAmount: number;
  altOfferAcceptanceRate: number;
  availabilityConflictCount: number;
  jobsFailedRate: number;
  notificationDeliveryRate: number;
  riskEscalationsCount: number;
  chargebackRate: number;
  vipRevenueShare: number;
  winbackConversionRate: number;
  retentionRecoveryRate: number;
  membershipBenefitCost: number;
  lostRevenueByRootCauseJson: { type: string; amount: number; count: number }[] | null;
  staffConversionRankingJson: { rank: number; name: string; conversionRate: number }[] | null;
  staffLostRevenueRankingJson: { rank: number; name: string; lostRevenueAmount: number }[] | null;
};

type PeriodPreset = 'this_week' | 'this_month' | 'last_month' | 'custom';

// ── Helpers ────────────────────────────────────────────
function getPeriodDates(preset: PeriodPreset): { start: Date; end: Date } {
  const now = new Date();
  switch (preset) {
    case 'this_week': {
      const day = now.getDay();
      const diff = day === 0 ? 6 : day - 1;
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diff);
      return { start, end: now };
    }
    case 'last_month': {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      return { start, end };
    }
    default: // this_month
      return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: now };
  }
}

function fmt(v: number | string | undefined, type: 'money' | 'pct' | 'num' = 'num'): string {
  const n = Number(v ?? 0);
  if (type === 'money') return `£${n.toLocaleString('en-GB', { maximumFractionDigits: 0 })}`;
  if (type === 'pct') return `${n.toFixed(1)}%`;
  return String(n);
}

// ── Component ──────────────────────────────────────────
export default function OwnerAnalyticsPage() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [rebuilding, setRebuilding] = useState(false);
  const [error, setError] = useState('');
  const [preset, setPreset] = useState<PeriodPreset>('this_month');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const loadSnapshot = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      let dates: { start: Date; end: Date };
      if (preset === 'custom' && customFrom && customTo) {
        dates = { start: new Date(customFrom), end: new Date(customTo) };
      } else {
        dates = getPeriodDates(preset);
      }
      const params = new URLSearchParams({
        periodStart: dates.start.toISOString(),
        periodEnd: dates.end.toISOString(),
      });
      const res = await fetch(`/api/v1/analytics/owner/snapshot?${params}`);
      const json = await res.json();
      if (json.success) {
        const s = json.data.snapshot;
        // Normalize numbers
        const normalized: Snapshot = {
          totalRevenue: Number(s.totalRevenue ?? 0),
          netMargin: Number(s.netMargin ?? 0),
          arpu: Number(s.arpu ?? 0),
          mrr: Number(s.mrr ?? 0),
          conversionRate: Number(s.conversionRate ?? 0),
          lostRevenueAmount: Number(s.lostRevenueAmount ?? 0),
          altOfferAcceptanceRate: Number(s.altOfferAcceptanceRate ?? 0),
          availabilityConflictCount: Number(s.availabilityConflictCount ?? 0),
          jobsFailedRate: Number(s.jobsFailedRate ?? 0),
          notificationDeliveryRate: Number(s.notificationDeliveryRate ?? 0),
          riskEscalationsCount: Number(s.riskEscalationsCount ?? 0),
          chargebackRate: Number(s.chargebackRate ?? 0),
          vipRevenueShare: Number(s.vipRevenueShare ?? 0),
          winbackConversionRate: Number(s.winbackConversionRate ?? 0),
          retentionRecoveryRate: Number(s.retentionRecoveryRate ?? 0),
          membershipBenefitCost: Number(s.membershipBenefitCost ?? 0),
          lostRevenueByRootCauseJson: s.lostRevenueByRootCauseJson ?? null,
          staffConversionRankingJson: s.staffConversionRankingJson ?? null,
          staffLostRevenueRankingJson: s.staffLostRevenueRankingJson ?? null,
        };
        setSnapshot(normalized);
      } else {
        setError(json.error?.message || 'Failed to load');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [preset, customFrom, customTo]);

  useEffect(() => {
    if (preset !== 'custom' || (customFrom && customTo)) {
      loadSnapshot();
    }
  }, [loadSnapshot]);

  const handleRebuild = async () => {
    setRebuilding(true);
    try {
      const dates = preset === 'custom' && customFrom && customTo
        ? { start: new Date(customFrom), end: new Date(customTo) }
        : getPeriodDates(preset);
      await fetch('/api/v1/analytics/owner/rebuild', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ periodStart: dates.start.toISOString(), periodEnd: dates.end.toISOString() }),
      });
      await loadSnapshot();
    } catch {}
    setRebuilding(false);
  };

  // ── MetricCard ──────────────────────────────────
  function Card({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
    return (
      <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-5">
        <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{label}</p>
        <p className={`text-2xl font-semibold mt-2 ${danger ? 'text-red-400' : 'text-zinc-100'}`}>{value}</p>
      </div>
    );
  }

  // ── ProgressBar ─────────────────────────────────
  function ProgressBar({ label, value, color = 'bg-amber-500' }: { label: string; value: number; color?: string }) {
    return (
      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-zinc-400">{label}</span>
          <span className="text-zinc-200 font-medium">{value.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-zinc-800 rounded-full h-2">
          <div className={`${color} rounded-full h-2 transition-all`} style={{ width: `${Math.min(value, 100)}%` }} />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">Owner Analytics</h1>
          <p className="text-sm text-zinc-500 mt-1">Comprehensive business metrics</p>
        </div>
        <div className="flex gap-2 items-center">
          {(['this_week', 'this_month', 'last_month', 'custom'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPreset(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                preset === p ? 'bg-amber-500 text-zinc-900' : 'border border-zinc-700 hover:border-zinc-600 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {p === 'this_week' ? 'This Week' : p === 'this_month' ? 'This Month' : p === 'last_month' ? 'Last Month' : 'Custom'}
            </button>
          ))}
          <button
            onClick={handleRebuild}
            disabled={rebuilding}
            className="ml-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700 disabled:opacity-50"
          >
            {rebuilding ? 'Rebuilding...' : 'Rebuild'}
          </button>
        </div>
      </div>

      {/* Custom date pickers */}
      {preset === 'custom' && (
        <div className="flex gap-3 items-end">
          <div>
            <label className="text-xs text-zinc-500">From</label>
            <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
              className="block bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200" />
          </div>
          <div>
            <label className="text-xs text-zinc-500">To</label>
            <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
              className="block bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200" />
          </div>
          <button onClick={loadSnapshot}
            className="px-4 py-2 rounded-lg text-sm bg-amber-500 text-zinc-900 font-medium hover:bg-amber-400">
            Apply
          </button>
        </div>
      )}

      {/* Error */}
      {error && <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400 text-sm">{error}</div>}

      {loading ? (
        <div className="space-y-4 animate-pulse">
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-zinc-800/30 rounded-xl" />)}
          </div>
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-zinc-800/30 rounded-xl" />)}
          </div>
        </div>
      ) : snapshot ? (
        <>
          {/* ── Revenue Row ── */}
          <div>
            <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">Revenue</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card label="Total Revenue" value={fmt(snapshot.totalRevenue, 'money')} />
              <Card label="Net Margin" value={fmt(snapshot.netMargin, 'pct')} />
              <Card label="ARPU" value={fmt(snapshot.arpu, 'money')} />
              <Card label="MRR" value={fmt(snapshot.mrr, 'money')} />
            </div>
          </div>

          {/* ── Operations Row ── */}
          <div>
            <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">Operations</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card label="Conversion Rate" value={fmt(snapshot.conversionRate, 'pct')} />
              <Card label="Lost Revenue" value={fmt(snapshot.lostRevenueAmount, 'money')} danger={snapshot.lostRevenueAmount > 0} />
              <Card label="Alt Offer Acceptance" value={fmt(snapshot.altOfferAcceptanceRate, 'pct')} />
              <Card label="Availability Conflicts" value={fmt(snapshot.availabilityConflictCount)} />
            </div>
          </div>

          {/* ── Risk Row ── */}
          <div>
            <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">Risk</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card label="Jobs Failed Rate" value={fmt(snapshot.jobsFailedRate, 'pct')} danger={snapshot.jobsFailedRate > 5} />
              <Card label="Notification Delivery" value={fmt(snapshot.notificationDeliveryRate, 'pct')} />
              <Card label="Risk Escalations" value={fmt(snapshot.riskEscalationsCount)} />
              <Card label="Chargeback Rate" value={fmt(snapshot.chargebackRate, 'pct')} danger={snapshot.chargebackRate > 0.5} />
            </div>
          </div>

          {/* ── Lost Revenue Breakdown ── */}
          <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-5">
            <h3 className="text-sm font-semibold text-zinc-300 mb-4">Lost Revenue Breakdown</h3>
            {snapshot.lostRevenueByRootCauseJson && snapshot.lostRevenueByRootCauseJson.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={snapshot.lostRevenueByRootCauseJson}>
                    <XAxis dataKey="type" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px', color: '#e4e4e7' }}
                      labelStyle={{ color: '#a1a1aa' }}
                    />
                    <Bar dataKey="amount" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-zinc-500 text-sm">No lost revenue data for this period</p>
            )}
          </div>

          {/* ── Staff Rankings ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-5">
              <h3 className="text-sm font-semibold text-zinc-300 mb-4">Top by Conversion</h3>
              {snapshot.staffConversionRankingJson && snapshot.staffConversionRankingJson.length > 0 ? (
                <div className="space-y-2">
                  {snapshot.staffConversionRankingJson.map((s) => (
                    <div key={s.rank} className="flex items-center gap-3 text-sm">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        s.rank === 1 ? 'bg-amber-500/20 text-amber-400' :
                        s.rank === 2 ? 'bg-zinc-500/20 text-zinc-300' :
                        'bg-zinc-800 text-zinc-500'
                      }`}>{s.rank}</span>
                      <span className="text-zinc-200 flex-1">{s.name || 'Unknown'}</span>
                      <span className="text-zinc-400 font-medium">{Number(s.conversionRate).toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-zinc-500 text-sm">No staff data yet</p>
              )}
            </div>

            <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-5">
              <h3 className="text-sm font-semibold text-zinc-300 mb-4">Most Lost Revenue</h3>
              {snapshot.staffLostRevenueRankingJson && snapshot.staffLostRevenueRankingJson.length > 0 ? (
                <div className="space-y-2">
                  {snapshot.staffLostRevenueRankingJson.map((s) => (
                    <div key={s.rank} className="flex items-center gap-3 text-sm">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        s.rank === 1 ? 'bg-red-500/20 text-red-400' :
                        s.rank === 2 ? 'bg-amber-500/20 text-amber-400' :
                        'bg-zinc-800 text-zinc-500'
                      }`}>{s.rank}</span>
                      <span className="text-zinc-200 flex-1">{s.name || 'Unknown'}</span>
                      <span className="text-red-400 font-medium">£{Number(s.lostRevenueAmount).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-zinc-500 text-sm">No staff data yet</p>
              )}
            </div>
          </div>

          {/* ── VIP & Retention ── */}
          <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-5">
            <h3 className="text-sm font-semibold text-zinc-300 mb-4">VIP & Retention</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <ProgressBar label="VIP Revenue Share" value={snapshot.vipRevenueShare} color="bg-purple-500" />
                <ProgressBar label="Win-back Conversion Rate" value={snapshot.winbackConversionRate} color="bg-amber-500" />
                <ProgressBar label="Retention Recovery Rate" value={snapshot.retentionRecoveryRate} color="bg-emerald-500" />
              </div>
              <div className="flex items-center justify-center">
                <div className="text-center">
                  <p className="text-xs text-zinc-500 uppercase tracking-wider">Membership Benefit Cost</p>
                  <p className="text-3xl font-semibold text-zinc-100 mt-2">{fmt(snapshot.membershipBenefitCost, 'money')}</p>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="text-zinc-500 text-center py-12">No data available for this period</div>
      )}
    </div>
  );
}
