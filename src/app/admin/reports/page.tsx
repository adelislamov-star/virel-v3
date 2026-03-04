// REPORTS & EXPORTS PAGE — Updated with CSV export and lost revenue
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type ReportType = 'revenue' | 'bookings' | 'models' | 'lost_revenue';

export default function ReportsPage() {
  const [activeReport, setActiveReport] = useState<ReportType | null>(null);
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState<ReportType | null>(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  async function generateReport(type: ReportType) {
    try {
      setLoading(true);
      setActiveReport(type);
      setReportData(null);

      const params = new URLSearchParams();
      if (dateFrom) params.set('from', dateFrom);
      if (dateTo) params.set('to', dateTo);

      let url = '';
      switch (type) {
        case 'revenue': url = `/api/v1/reports/revenue?${params}`; break;
        case 'bookings': url = `/api/v1/reports/bookings?${params}`; break;
        case 'models': url = '/api/v1/reports/models'; break;
        case 'lost_revenue': url = `/api/v1/reports/lost-revenue?${params}`; break;
      }

      const res = await fetch(url);
      const data = await res.json();
      setReportData(data.data);
    } catch (error) {
      console.error('Failed to generate report:', error);
    } finally {
      setLoading(false);
    }
  }

  async function exportCSV(type: ReportType) {
    try {
      setExporting(type);
      const res = await fetch('/api/v1/reports/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportType: type,
          from: dateFrom || undefined,
          to: dateTo || undefined,
          format: 'csv'
        })
      });

      if (!res.ok) throw new Error('Export failed');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}-report-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setExporting(null);
    }
  }

  return (
    <div className="p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Reports & Exports</h1>
        <p className="text-muted-foreground">Generate, view, and export operational reports</p>
      </div>

      {/* Date Range */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex gap-4 items-end flex-wrap">
            <div>
              <label className="text-sm font-medium block mb-1">From</label>
              <input type="date" className="rounded-md border p-2 text-sm bg-background" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">To</label>
              <input type="date" className="rounded-md border p-2 text-sm bg-background" value={dateTo} onChange={e => setDateTo(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {([
          { type: 'revenue' as ReportType, icon: '💰', title: 'Revenue Report', desc: 'Revenue, commission, and payout summary' },
          { type: 'bookings' as ReportType, icon: '📅', title: 'Bookings Report', desc: 'Booking statistics by status, model, and period' },
          { type: 'models' as ReportType, icon: '👤', title: 'Model Performance', desc: 'Rating, booking count, and completeness per model' },
          { type: 'lost_revenue' as ReportType, icon: '📉', title: 'Lost Revenue', desc: 'Revenue leakage incidents and root causes' }
        ]).map(r => (
          <Card key={r.type}>
            <CardHeader><CardTitle>{r.icon} {r.title}</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">{r.desc}</p>
              <div className="flex gap-2">
                <Button onClick={() => generateReport(r.type)} disabled={loading && activeReport === r.type}>
                  {loading && activeReport === r.type ? 'Generating...' : 'Generate'}
                </Button>
                <Button variant="outline" onClick={() => exportCSV(r.type)} disabled={exporting === r.type}>
                  {exporting === r.type ? 'Exporting...' : 'Export CSV'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Results */}
      {reportData && (
        <Card>
          <CardHeader>
            <CardTitle>
              {activeReport === 'revenue' && '💰 Revenue Report'}
              {activeReport === 'bookings' && '📅 Bookings Report'}
              {activeReport === 'models' && '👤 Model Performance'}
              {activeReport === 'lost_revenue' && '📉 Lost Revenue'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeReport === 'revenue' && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold">£{(reportData.totalRevenue || 0).toFixed(0)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Commission</p>
                  <p className="text-2xl font-bold">£{(reportData.totalCommission || 0).toFixed(0)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Payout</p>
                  <p className="text-2xl font-bold">£{(reportData.totalPayout || 0).toFixed(0)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Bookings</p>
                  <p className="text-2xl font-bold">{reportData.bookingCount || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg Value</p>
                  <p className="text-2xl font-bold">£{(reportData.avgBookingValue || 0).toFixed(0)}</p>
                </div>
              </div>
            )}

            {activeReport === 'bookings' && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold mb-2">By Status (total: {reportData.total || 0})</p>
                  <div className="flex gap-4 flex-wrap">
                    {Object.entries(reportData.byStatus || {}).map(([status, count]) => (
                      <div key={status} className="text-sm">
                        <span className="font-medium">{status}:</span> {count as number}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold mb-2">By Model</p>
                  <div className="space-y-1">
                    {(reportData.byModel || []).map((m: any) => (
                      <div key={m.id} className="flex justify-between text-sm">
                        <span>{m.name}</span>
                        <span className="font-medium">{m.count} bookings</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeReport === 'models' && (
              <div className="space-y-2">
                {(reportData.models || []).map((m: any) => (
                  <div key={m.id} className="flex items-center justify-between text-sm border-b pb-2">
                    <div>
                      <span className="font-medium">{m.name}</span>
                      <span className="text-muted-foreground ml-2">({m.status})</span>
                    </div>
                    <div className="flex gap-4">
                      <span>{m.avgRating ? m.avgRating.toFixed(1) : '—'} ★</span>
                      <span>{m.bookingCount} bookings</span>
                      <span>{m.completenessScore}% complete</span>
                      <span className={m.riskIndex === 'red' ? 'text-red-600' : m.riskIndex === 'yellow' ? 'text-yellow-600' : 'text-green-600'}>
                        {m.riskIndex}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeReport === 'lost_revenue' && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Lost</p>
                    <p className="text-2xl font-bold text-red-600">£{(reportData.totalLost || 0).toFixed(0)}</p>
                  </div>
                </div>

                {(reportData.byType || []).length > 0 && (
                  <div>
                    <p className="text-sm font-semibold mb-2">By Type</p>
                    <div className="space-y-1">
                      {reportData.byType.map((t: any) => (
                        <div key={t.type} className="flex justify-between text-sm">
                          <span>{t.type}</span>
                          <span>{t.count} incidents — £{t.amount.toFixed(0)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(reportData.byResponsible || []).length > 0 && (
                  <div>
                    <p className="text-sm font-semibold mb-2">By Responsible Role</p>
                    <div className="space-y-1">
                      {reportData.byResponsible.map((r: any) => (
                        <div key={r.role} className="flex justify-between text-sm">
                          <span>{r.role}</span>
                          <span>{r.count} — £{r.amount.toFixed(0)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(reportData.entries || []).length === 0 && (
                  <p className="text-muted-foreground text-sm">No lost revenue entries recorded yet.</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
