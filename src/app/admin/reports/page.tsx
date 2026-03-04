// REPORTS & EXPORTS PAGE
'use client';

import { useState } from 'react';

type ReportType = 'revenue' | 'bookings' | 'models' | 'lost_revenue';

const reportCards: { type: ReportType; title: string; desc: string }[] = [
  { type: 'revenue', title: 'Revenue Report', desc: 'Revenue, commission, and payout summary' },
  { type: 'bookings', title: 'Bookings Report', desc: 'Booking statistics by status, model, and period' },
  { type: 'models', title: 'Model Performance', desc: 'Rating, booking count, and completeness per model' },
  { type: 'lost_revenue', title: 'Lost Revenue', desc: 'Revenue leakage incidents and root causes' }
];

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
        body: JSON.stringify({ reportType: type, from: dateFrom || undefined, to: dateTo || undefined, format: 'csv' })
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

  const inputClass = 'px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-zinc-200 focus:outline-none focus:border-zinc-600 transition-colors duration-150';
  const labelClass = 'text-xs font-medium text-zinc-500 uppercase tracking-wider block mb-1.5';

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">Reports & Exports</h1>
        <p className="text-sm text-zinc-500 mt-1">Generate, view, and export operational reports</p>
      </div>

      <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-5 mb-8">
        <div className="flex gap-4 items-end flex-wrap">
          <div>
            <label className={labelClass}>From</label>
            <input type="date" className={inputClass} value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>To</label>
            <input type="date" className={inputClass} value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {reportCards.map(r => (
          <div key={r.type} className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-5">
            <h3 className="text-sm font-semibold text-zinc-300 mb-1">{r.title}</h3>
            <p className="text-xs text-zinc-500 mb-4">{r.desc}</p>
            <div className="flex gap-2">
              <button onClick={() => generateReport(r.type)} disabled={loading && activeReport === r.type} className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-900 text-sm font-medium transition-colors duration-150 disabled:opacity-50">
                {loading && activeReport === r.type ? 'Generating...' : 'Generate'}
              </button>
              <button onClick={() => exportCSV(r.type)} disabled={exporting === r.type} className="px-4 py-2 rounded-lg border border-zinc-700 hover:border-zinc-600 text-zinc-300 text-sm font-medium transition-colors duration-150 disabled:opacity-50">
                {exporting === r.type ? 'Exporting...' : 'Export CSV'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {reportData && (
        <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-5">
          <h3 className="text-sm font-semibold text-zinc-300 mb-4">
            {activeReport === 'revenue' && 'Revenue Report'}
            {activeReport === 'bookings' && 'Bookings Report'}
            {activeReport === 'models' && 'Model Performance'}
            {activeReport === 'lost_revenue' && 'Lost Revenue'}
          </h3>

          {activeReport === 'revenue' && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { label: 'Total Revenue', value: `£${(reportData.totalRevenue || 0).toFixed(0)}` },
                { label: 'Commission', value: `£${(reportData.totalCommission || 0).toFixed(0)}` },
                { label: 'Payout', value: `£${(reportData.totalPayout || 0).toFixed(0)}` },
                { label: 'Bookings', value: reportData.bookingCount || 0 },
                { label: 'Avg Value', value: `£${(reportData.avgBookingValue || 0).toFixed(0)}` },
              ].map(m => (
                <div key={m.label}>
                  <p className="text-xs text-zinc-500">{m.label}</p>
                  <p className="text-xl font-semibold text-zinc-100 mt-1">{m.value}</p>
                </div>
              ))}
            </div>
          )}

          {activeReport === 'bookings' && (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-zinc-400 mb-2">By Status (total: {reportData.total || 0})</p>
                <div className="flex gap-4 flex-wrap">
                  {Object.entries(reportData.byStatus || {}).map(([status, count]) => (
                    <div key={status} className="text-sm text-zinc-300">
                      <span className="text-zinc-500">{status}:</span> {count as number}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-zinc-400 mb-2">By Model</p>
                <div className="space-y-1">
                  {(reportData.byModel || []).map((m: any) => (
                    <div key={m.id} className="flex justify-between text-sm">
                      <span className="text-zinc-300">{m.name}</span>
                      <span className="text-zinc-400">{m.count} bookings</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeReport === 'models' && (
            <div className="rounded-xl border border-zinc-800/50 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-800/50">
                    <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Model</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Rating</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Bookings</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Complete</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Risk</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/30">
                  {(reportData.models || []).map((m: any) => (
                    <tr key={m.id} className="hover:bg-zinc-800/20 transition-colors duration-100">
                      <td className="px-4 py-3 text-sm text-zinc-200">{m.name} <span className="text-zinc-500">({m.status})</span></td>
                      <td className="px-4 py-3 text-sm text-zinc-300">{m.avgRating ? m.avgRating.toFixed(1) : '—'}</td>
                      <td className="px-4 py-3 text-sm text-zinc-300">{m.bookingCount}</td>
                      <td className="px-4 py-3 text-sm text-zinc-300">{m.completenessScore}%</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={m.riskIndex === 'red' ? 'text-red-400' : m.riskIndex === 'yellow' ? 'text-yellow-400' : 'text-emerald-400'}>{m.riskIndex}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeReport === 'lost_revenue' && (
            <div className="space-y-4">
              <div>
                <p className="text-xs text-zinc-500">Total Lost</p>
                <p className="text-xl font-semibold text-red-400 mt-1">£{(reportData.totalLost || 0).toFixed(0)}</p>
              </div>
              {(reportData.byType || []).length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-zinc-400 mb-2">By Type</p>
                  <div className="space-y-1">
                    {reportData.byType.map((t: any) => (
                      <div key={t.type} className="flex justify-between text-sm">
                        <span className="text-zinc-300">{t.type}</span>
                        <span className="text-zinc-400">{t.count} incidents — £{t.amount.toFixed(0)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {(reportData.byResponsible || []).length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-zinc-400 mb-2">By Responsible Role</p>
                  <div className="space-y-1">
                    {reportData.byResponsible.map((r: any) => (
                      <div key={r.role} className="flex justify-between text-sm">
                        <span className="text-zinc-300">{r.role}</span>
                        <span className="text-zinc-400">{r.count} — £{r.amount.toFixed(0)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {(reportData.entries || []).length === 0 && (
                <p className="text-zinc-500 text-sm">No lost revenue entries recorded yet.</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
