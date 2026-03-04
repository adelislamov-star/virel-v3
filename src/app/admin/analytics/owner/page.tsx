// OWNER ANALYTICS — 21 metrics dashboard
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

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
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground mb-1">{label}</p>
          <p className={`text-2xl font-bold ${danger ? 'text-red-600' : ''}`}>
            {unit === '£' && '£'}{value}{unit === '%' ? '%' : ''}{unit === '/day' ? '/day' : ''}{unit === 'min' ? ' min' : ''}{unit === 'hrs' ? ' hrs' : ''}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (loading) return <div className="p-6"><h1 className="text-3xl font-bold mb-4">Owner Analytics</h1><p>Loading...</p></div>;
  if (!data) return <div className="p-6"><h1 className="text-3xl font-bold mb-4">Owner Analytics</h1><p>No data</p></div>;

  return (
    <div className="p-6 max-w-7xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Owner Analytics</h1>
          <p className="text-muted-foreground">21 key business metrics</p>
        </div>
        <div className="flex gap-2">
          {['week', 'month', 'quarter'].map(p => (
            <Button key={p} size="sm" variant={period === p ? 'default' : 'outline'} onClick={() => setPeriod(p)}>
              This {p.charAt(0).toUpperCase() + p.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Row 1: Revenue */}
      <h2 className="text-lg font-semibold mb-3">Revenue</h2>
      <div className="grid grid-cols-4 gap-4 mb-6">
        <MetricCard label="#1 Revenue" value={data.revenue.total.toFixed(0)} unit="£" />
        <MetricCard label="#2 Net Margin" value={data.revenue.netMargin.toFixed(1)} unit="%" />
        <MetricCard label="#3 Commission" value={data.revenue.commission.toFixed(0)} unit="£" />
        <MetricCard label="#4 Payout" value={data.revenue.payout.toFixed(0)} unit="£" />
      </div>

      {/* Row 2: Lead & Operations */}
      <h2 className="text-lg font-semibold mb-3">Leads & Operations</h2>
      <div className="grid grid-cols-4 gap-4 mb-6">
        <MetricCard label="#5 Lead Conversion" value={data.leads.conversionRate.toFixed(1)} unit="%" />
        <MetricCard label="#6 Avg Response Time" value={data.leads.avgResponseTime} unit="min" />
        <MetricCard label="#7 SLA Breach Rate" value={data.operations.slaBreachRate.toFixed(1)} unit="%" danger={data.operations.slaBreachRate > 2} />
        <MetricCard label="#8 Cancellation Rate" value={data.operations.cancellationRate.toFixed(1)} unit="%" danger={data.operations.cancellationRate > 10} />
      </div>

      {/* Row 3: Risk & Quality */}
      <h2 className="text-lg font-semibold mb-3">Risk & Quality</h2>
      <div className="grid grid-cols-4 gap-4 mb-6">
        <MetricCard label="#9 Chargeback Rate" value={data.risk.chargebackRate.toFixed(2)} unit="%" danger={data.risk.chargebackRate > 0.5} />
        <MetricCard label="#10 Fraud Cases" value={data.risk.fraudCases} />
        <MetricCard label="#11 Avg Model Rating" value={`${data.risk.avgModelRating.toFixed(1)} ★`} />
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-1">#12 Risk Distribution</p>
            <div className="flex gap-3 text-lg font-bold">
              <span className="text-green-600">{data.risk.riskDistribution.green}</span>
              <span className="text-yellow-600">{data.risk.riskDistribution.yellow}</span>
              <span className="text-red-600">{data.risk.riskDistribution.red}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 4: Membership */}
      <h2 className="text-lg font-semibold mb-3">Membership</h2>
      <div className="grid grid-cols-4 gap-4 mb-6">
        <MetricCard label="#17 MRR" value={data.membership.mrr.toFixed(0)} unit="£" />
        <MetricCard label="#18 Churn Rate" value={data.membership.churnRate.toFixed(1)} unit="%" danger={data.membership.churnRate > 5} />
        <MetricCard label="#19 ARPU" value={data.membership.arpu.toFixed(0)} unit="£" />
        <MetricCard label="#20 LTV/CAC Ratio" value={data.membership.ltvCacRatio.toFixed(1)} />
      </div>

      {/* Row 5: System */}
      <h2 className="text-lg font-semibold mb-3">System & Data</h2>
      <div className="grid grid-cols-3 gap-4">
        <MetricCard label="#16 API Error Rate" value={data.system.apiErrorRate.toFixed(2)} unit="%" danger={data.system.apiErrorRate > 1} />
        <MetricCard label="#14 Booking Velocity" value={data.operations.bookingVelocity.toFixed(1)} unit="/day" />
        <MetricCard label="#21 Data Completeness" value={`${data.dataQuality.avgCompletenessScore}%`} danger={data.dataQuality.avgCompletenessScore < 70} />
      </div>
    </div>
  );
}
