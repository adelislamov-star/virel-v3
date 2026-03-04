// UNIT ECONOMICS
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type UnitData = {
  profitPerBooking: number;
  avgBookingValue: number;
  avgCommission: number;
  avgPayout: number;
  ltvEstimate: number;
  cacEstimate: number;
  ltvCacRatio: number;
  paybackPeriodMonths: number;
  bySource: { source: string; leads: number; bookings: number; revenue: number; cost: number; roi: number }[];
  byModel: { modelId: string; modelName: string; bookings: number; revenue: number; payout: number; profit: number }[];
};

export default function UnitEconomicsPage() {
  const [data, setData] = useState<UnitData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/analytics/unit-economics?period=month')
      .then(r => r.json())
      .then(d => { setData(d.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6"><h1 className="text-3xl font-bold mb-4">Unit Economics</h1><p>Loading...</p></div>;
  if (!data) return <div className="p-6"><h1 className="text-3xl font-bold mb-4">Unit Economics</h1><p>No data</p></div>;

  return (
    <div className="p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Unit Economics</h1>
        <p className="text-muted-foreground">Per-booking and per-client profitability</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Profit/Booking</p>
            <p className="text-2xl font-bold text-green-600">£{data.profitPerBooking.toFixed(0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Avg Booking Value</p>
            <p className="text-2xl font-bold">£{data.avgBookingValue.toFixed(0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">LTV</p>
            <p className="text-2xl font-bold">£{data.ltvEstimate.toFixed(0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">CAC</p>
            <p className="text-2xl font-bold">£{data.cacEstimate || '—'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">LTV/CAC</p>
            <p className="text-2xl font-bold">{data.ltvCacRatio || '—'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Payback</p>
            <p className="text-2xl font-bold">{data.paybackPeriodMonths ? `${data.paybackPeriodMonths} mo` : '—'}</p>
          </CardContent>
        </Card>
      </div>

      {/* By Lead Source */}
      <Card className="mb-8">
        <CardHeader><CardTitle>By Lead Source</CardTitle></CardHeader>
        <CardContent>
          {data.bySource.length > 0 ? (
            <div className="space-y-2">
              <div className="grid grid-cols-6 gap-4 text-xs font-semibold text-muted-foreground border-b pb-2">
                <span>Source</span><span>Leads</span><span>Bookings</span><span>Revenue</span><span>Cost</span><span>ROI</span>
              </div>
              {data.bySource.map(s => (
                <div key={s.source} className="grid grid-cols-6 gap-4 text-sm border-b pb-2">
                  <span className="font-medium">{s.source}</span>
                  <span>{s.leads}</span>
                  <span>{s.bookings}</span>
                  <span>£{s.revenue.toFixed(0)}</span>
                  <span>£{s.cost.toFixed(0)}</span>
                  <span>{s.roi ? `${s.roi.toFixed(1)}%` : '—'}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No lead source data yet.</p>
          )}
        </CardContent>
      </Card>

      {/* Top Models by Profit */}
      <Card>
        <CardHeader><CardTitle>Top Models by Profit</CardTitle></CardHeader>
        <CardContent>
          {data.byModel.length > 0 ? (
            <div className="space-y-2">
              <div className="grid grid-cols-5 gap-4 text-xs font-semibold text-muted-foreground border-b pb-2">
                <span>Model</span><span>Bookings</span><span>Revenue</span><span>Payout</span><span>Profit</span>
              </div>
              {data.byModel.map(m => (
                <div key={m.modelId} className="grid grid-cols-5 gap-4 text-sm border-b pb-2">
                  <span className="font-medium">{m.modelName}</span>
                  <span>{m.bookings}</span>
                  <span>£{m.revenue.toFixed(0)}</span>
                  <span>£{m.payout.toFixed(0)}</span>
                  <span className="text-green-600 font-medium">£{m.profit.toFixed(0)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No model data yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
