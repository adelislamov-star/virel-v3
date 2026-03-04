// OWNER ANALYTICS
'use client';

import { useEffect, useState } from 'react';

type OwnerData = {
  revenue: { total: number; netMargin: number; commission: number; payout: number };
  leads: { conversionRate: number; avgResponseTime: number; sourceROI: Record<string, number> };
  operations: { slaBreachRate: number; cancellationRate: number; bookingVelocity: number; avgOnboardingTime: number };
  risk: { chargebackRate: number; fraudCases: number; avgModelRating: number; riskDistribution: { green: number; yellow: number; red: number } };
  system: { apiErrorRate: number };
  membership: { mrr: number; churnRate: number; arpu: number; ltvCacRatio: number };
  dataQuality: { avgCompletenessScore: number };
};

export default function OwnerAnalyticsPage() {
  const [data, setData] = useState<OwnerData | null>(null);
  const [period, setPeriod] = useState('month');
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, [period]);

  async function loadData() {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/analytics/owner?period=${period}`);
      const json = await res.json();
      setData(json.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  function MetricCard({ label, value, unit, danger }: { label: string; value: number | string; unit?: string; danger?: boolean }) {
    const display = `${unit === '£' ? '£' : ''}${value}${unit === '%' ? '%' : ''}${unit === '/day' ? '/day' : ''}${unit === 'min' ? ' min' : ''}${unit === 'hrs' ? ' hrs' : ''}`;
    return (
      <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-5">
        <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{label}</p>
        <p className={`text-2xl font-semibold mt-2 ${danger ? 'text-red-400' : 'text-zinc-100'}`}>{display}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">Owner Analytics</h1>
          <p className="text-sm text-zinc-500 mt-1">Loading...</p>
        </div>
        <div className="space-y-4 animate-pulse">
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-zinc-800/30 rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!data) return <div className="p-8 max-w-7xl mx-auto"><h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">Owner Analytics</h1><p className="text-zinc-500 mt-2">No data</p></div>;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">Owner Analytics</h1>
          <p className="text-sm text-zinc-500 mt-1">21 key business metrics</p>
        </div>
        <div className="flex gap-2">
          {['week', 'month', 'quarter'].map(p => (
            <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors duration-150 ${period === p ? 'bg-amber-500 text-zinc-900' : 'border border-zinc-700 hover:border-zinc-600 text-zinc-400 hover:text-zinc-200'}`}>
              This {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">Revenue</h2>
      <div className="grid grid-cols-4 gap-4 mb-8">
        <MetricCard label="#1 Revenue" value={data.revenue.total.toFixed(0)} unit="£" />
        <MetricCard label="#2 Net Margin" value={data.revenue.netMargin.toFixed(1)} unit="%" />
        <MetricCard label="#3 Commission" value={data.revenue.commission.toFixed(0)} unit="£" />
        <MetricCard label="#4 Payout" value={data.revenue.payout.toFixed(0)} unit="£" />
      </div>

      <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">Leads & Operations</h2>
      <div className="grid grid-cols-4 gap-4 mb-8">
        <MetricCard label="#5 Lead Conversion" value={data.leads.conversionRate.toFixed(1)} unit="%" />
        <MetricCard label="#6 Avg Response Time" value={data.leads.avgResponseTime} unit="min" />
        <MetricCard label="#7 SLA Breach Rate" value={data.operations.slaBreachRate.toFixed(1)} unit="%" danger={data.operations.slaBreachRate > 2} />
        <MetricCard label="#8 Cancellation Rate" value={data.operations.cancellationRate.toFixed(1)} unit="%" danger={data.operations.cancellationRate > 10} />
      </div>

      <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">Risk & Quality</h2>
      <div className="grid grid-cols-4 gap-4 mb-8">
        <MetricCard label="#9 Chargeback Rate" value={data.risk.chargebackRate.toFixed(2)} unit="%" danger={data.risk.chargebackRate > 0.5} />
        <MetricCard label="#10 Fraud Cases" value={data.risk.fraudCases} />
        <MetricCard label="#11 Avg Model Rating" value={`${data.risk.avgModelRating.toFixed(1)}`} />
        <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-5">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">#12 Risk Distribution</p>
          <div className="flex gap-3 text-lg font-semibold mt-2">
            <span className="text-emerald-400">{data.risk.riskDistribution.green}</span>
            <span className="text-yellow-400">{data.risk.riskDistribution.yellow}</span>
            <span className="text-red-400">{data.risk.riskDistribution.red}</span>
          </div>
        </div>
      </div>

      <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">Membership</h2>
      <div className="grid grid-cols-4 gap-4 mb-8">
        <MetricCard label="#17 MRR" value={data.membership.mrr.toFixed(0)} unit="£" />
        <MetricCard label="#18 Churn Rate" value={data.membership.churnRate.toFixed(1)} unit="%" danger={data.membership.churnRate > 5} />
        <MetricCard label="#19 ARPU" value={data.membership.arpu.toFixed(0)} unit="£" />
        <MetricCard label="#20 LTV/CAC Ratio" value={data.membership.ltvCacRatio.toFixed(1)} />
      </div>

      <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">System & Data</h2>
      <div className="grid grid-cols-3 gap-4">
        <MetricCard label="#16 API Error Rate" value={data.system.apiErrorRate.toFixed(2)} unit="%" danger={data.system.apiErrorRate > 1} />
        <MetricCard label="#14 Booking Velocity" value={data.operations.bookingVelocity.toFixed(1)} unit="/day" />
        <MetricCard label="#21 Data Completeness" value={`${data.dataQuality.avgCompletenessScore}%`} danger={data.dataQuality.avgCompletenessScore < 70} />
      </div>
    </div>
  );
}