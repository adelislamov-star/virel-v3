// STAFF PERFORMANCE — Admin page
// Leaderboard, detail drawer, score rules, manual adjust
'use client';

import { useState, useEffect, useCallback } from 'react';

type LeaderEntry = {
  rank: number;
  userId: string;
  userName: string;
  userEmail: string;
  totalScore: number;
  breakdown: Record<string, { raw: number; weight: number; weighted: number }>;
  manualAdjust: number;
  adjustReason: string | null;
  snapshotId: string;
};

type ScoreRule = {
  id: string;
  metricKey: string;
  label: string;
  weight: number;
  description: string | null;
  isActive: boolean;
};

type UserDetail = {
  user: { id: string; name: string; email: string };
  performance: any[];
  scores: any[];
};

// Period helpers
function getMonthRange(offset = 0): { start: string; end: string; label: string } {
  const d = new Date();
  d.setMonth(d.getMonth() - offset);
  const y = d.getFullYear();
  const m = d.getMonth();
  const start = new Date(y, m, 1).toISOString().split('T')[0];
  const end = new Date(y, m + 1, 0).toISOString().split('T')[0];
  const label = d.toLocaleString('default', { month: 'long', year: 'numeric' });
  return { start, end, label };
}

export default function StaffPerformancePage() {
  const [leaderboard, setLeaderboard] = useState<LeaderEntry[]>([]);
  const [rules, setRules] = useState<ScoreRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [building, setBuilding] = useState(false);
  const [error, setError] = useState('');

  // Period picker
  const [periodOffset, setPeriodOffset] = useState(0);
  const period = getMonthRange(periodOffset);

  // Detail drawer
  const [selectedUser, setSelectedUser] = useState<LeaderEntry | null>(null);
  const [userDetail, setUserDetail] = useState<UserDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Adjust modal
  const [adjusting, setAdjusting] = useState<LeaderEntry | null>(null);
  const [adjustValue, setAdjustValue] = useState('');
  const [adjustReason, setAdjustReason] = useState('');

  // Rules editing
  const [editingRules, setEditingRules] = useState(false);
  const [draftRules, setDraftRules] = useState<ScoreRule[]>([]);

  const loadLeaderboard = useCallback(async () => {
    try {
      setError('');
      const res = await fetch(
        `/api/v1/staff-performance?periodStart=${period.start}T00:00:00.000Z&periodEnd=${period.end}T23:59:59.999Z`
      );
      const data = await res.json();
      if (data.success) setLeaderboard(data.data.leaderboard);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [period.start, period.end]);

  const loadRules = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/staff-score-rules');
      const data = await res.json();
      if (data.success) setRules(data.data.rules);
    } catch {}
  }, []);

  useEffect(() => { setLoading(true); loadLeaderboard(); }, [loadLeaderboard]);
  useEffect(() => { loadRules(); }, [loadRules]);

  async function handleBuildSnapshots() {
    setBuilding(true);
    try {
      const res = await fetch('/api/v1/staff-performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          periodStart: `${period.start}T00:00:00.000Z`,
          periodEnd: `${period.end}T23:59:59.999Z`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setLoading(true);
        loadLeaderboard();
      }
    } catch {}
    finally { setBuilding(false); }
  }

  async function openDetail(entry: LeaderEntry) {
    setSelectedUser(entry);
    setDetailLoading(true);
    try {
      const res = await fetch(
        `/api/v1/staff-performance/${entry.userId}?periodStart=${period.start}T00:00:00.000Z&periodEnd=${period.end}T23:59:59.999Z`
      );
      const data = await res.json();
      if (data.success) setUserDetail(data.data);
    } catch {}
    finally { setDetailLoading(false); }
  }

  async function submitAdjust() {
    if (!adjusting) return;
    try {
      const res = await fetch(`/api/v1/staff-performance/scores/${adjusting.snapshotId}/adjust`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adjustment: parseFloat(adjustValue),
          reason: adjustReason,
          adjustedBy: 'admin',
        }),
      });
      if (res.ok) {
        setAdjusting(null);
        setAdjustValue('');
        setAdjustReason('');
        setLoading(true);
        loadLeaderboard();
      }
    } catch {}
  }

  async function saveRules() {
    try {
      const res = await fetch('/api/v1/staff-score-rules', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rules: draftRules.map(r => ({ metricKey: r.metricKey, weight: r.weight, isActive: r.isActive })),
        }),
      });
      if (res.ok) {
        setEditingRules(false);
        loadRules();
      }
    } catch {}
  }

  const totalWeight = (editingRules ? draftRules : rules).reduce((s, r) => s + r.weight, 0);

  if (loading && leaderboard.length === 0) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight mb-2">Staff Performance</h1>
        <div className="space-y-4 animate-pulse"><div className="h-64 bg-zinc-800/30 rounded-xl" /></div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">Staff Performance</h1>
          <p className="text-sm text-zinc-500 mt-1">{period.label}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <button onClick={() => setPeriodOffset(o => o + 1)}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 text-sm hover:bg-zinc-700">←</button>
            <span className="px-3 py-1.5 text-sm text-zinc-300 min-w-[140px] text-center">{period.label}</span>
            <button onClick={() => setPeriodOffset(o => Math.max(0, o - 1))} disabled={periodOffset === 0}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 text-sm hover:bg-zinc-700 disabled:opacity-50">→</button>
          </div>
          <button onClick={handleBuildSnapshots} disabled={building}
            className="px-4 py-2 rounded-lg bg-amber-500/20 text-amber-400 text-sm font-medium hover:bg-amber-500/30 border border-amber-500/30 disabled:opacity-50">
            {building ? 'Building...' : 'Build Snapshots'}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 text-red-400 text-sm mb-6">{error}</div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Staff Evaluated', value: leaderboard.length, color: 'text-zinc-100' },
          { label: 'Avg Score', value: leaderboard.length > 0 ? (leaderboard.reduce((s, e) => s + e.totalScore, 0) / leaderboard.length).toFixed(1) : '0', color: 'text-blue-400' },
          { label: 'Top Score', value: leaderboard.length > 0 ? leaderboard[0]?.totalScore.toFixed(1) : '0', color: 'text-emerald-400' },
          { label: 'Score Rules', value: rules.filter(r => r.isActive).length, color: 'text-amber-400' },
        ].map(card => (
          <div key={card.label} className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-5">
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">{card.label}</p>
            <p className={`text-2xl font-semibold ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Leaderboard Table */}
      <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 overflow-hidden mb-8">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800/50">
              <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider w-12">Rank</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Staff</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Score</th>
              {rules.filter(r => r.isActive).map(r => (
                <th key={r.metricKey} className="text-center px-3 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">{r.label}</th>
              ))}
              <th className="text-center px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Adjust</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map(entry => (
              <tr key={entry.userId} className="border-b border-zinc-800/30 hover:bg-zinc-800/20 cursor-pointer"
                onClick={() => openDetail(entry)}>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                    entry.rank === 1 ? 'bg-amber-500/20 text-amber-400' :
                    entry.rank === 2 ? 'bg-zinc-400/20 text-zinc-300' :
                    entry.rank === 3 ? 'bg-orange-500/20 text-orange-400' :
                    'bg-zinc-800 text-zinc-500'
                  }`}>{entry.rank}</span>
                </td>
                <td className="px-4 py-3">
                  <p className="text-zinc-200 font-medium">{entry.userName}</p>
                  <p className="text-zinc-500 text-xs">{entry.userEmail}</p>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`text-lg font-bold ${
                    entry.totalScore >= 70 ? 'text-emerald-400' :
                    entry.totalScore >= 40 ? 'text-amber-400' : 'text-red-400'
                  }`}>{entry.totalScore.toFixed(1)}</span>
                  {entry.manualAdjust !== 0 && (
                    <span className="text-xs text-zinc-500 ml-1">({entry.manualAdjust > 0 ? '+' : ''}{entry.manualAdjust})</span>
                  )}
                </td>
                {rules.filter(r => r.isActive).map(r => (
                  <td key={r.metricKey} className="px-3 py-3 text-center text-zinc-400 text-xs">
                    {entry.breakdown[r.metricKey]?.weighted.toFixed(1) || '-'}
                  </td>
                ))}
                <td className="px-4 py-3 text-center text-zinc-500 text-xs">
                  {entry.manualAdjust !== 0 ? `${entry.manualAdjust > 0 ? '+' : ''}${entry.manualAdjust}` : '-'}
                </td>
                <td className="px-4 py-3 text-center" onClick={e => e.stopPropagation()}>
                  <button onClick={() => { setAdjusting(entry); setAdjustValue(''); setAdjustReason(''); }}
                    className="px-2 py-1 rounded bg-zinc-800 text-zinc-400 text-xs hover:bg-zinc-700 hover:text-zinc-200">
                    Adjust
                  </button>
                </td>
              </tr>
            ))}
            {leaderboard.length === 0 && (
              <tr><td colSpan={6 + rules.filter(r => r.isActive).length} className="px-4 py-12 text-center text-zinc-500">
                No snapshots for this period. Click &quot;Build Snapshots&quot; to generate.
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Score Rules Section */}
      <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-zinc-100">Score Rules</h2>
          <div className="flex gap-2">
            {editingRules ? (
              <>
                <button onClick={() => setEditingRules(false)}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-400 text-sm hover:bg-zinc-700">Cancel</button>
                <button onClick={saveRules} disabled={Math.abs(totalWeight - 100) > 0.1}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 text-sm hover:bg-emerald-500/30 border border-emerald-500/30 disabled:opacity-50">
                  Save Rules
                </button>
              </>
            ) : (
              <button onClick={() => { setEditingRules(true); setDraftRules(rules.map(r => ({ ...r }))); }}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 text-sm hover:bg-zinc-700">
                Edit Weights
              </button>
            )}
          </div>
        </div>

        {editingRules && Math.abs(totalWeight - 100) > 0.1 && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-red-400 text-sm mb-4">
            Weights must sum to 100. Current: {totalWeight.toFixed(0)}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          {(editingRules ? draftRules : rules).map((rule, idx) => (
            <div key={rule.metricKey} className="flex items-center justify-between p-3 rounded-lg border border-zinc-800/50 bg-zinc-800/30">
              <div>
                <p className="text-sm text-zinc-200 font-medium">{rule.label}</p>
                <p className="text-xs text-zinc-500">{rule.description}</p>
              </div>
              <div className="flex items-center gap-2">
                {editingRules ? (
                  <input type="number" min={0} max={100} value={rule.weight}
                    onChange={e => {
                      const v = parseFloat(e.target.value) || 0;
                      setDraftRules(prev => prev.map((r, i) => i === idx ? { ...r, weight: v } : r));
                    }}
                    className="w-16 rounded bg-zinc-900 border border-zinc-700 text-zinc-100 px-2 py-1 text-sm text-center" />
                ) : (
                  <span className="text-amber-400 font-semibold text-sm">{rule.weight}%</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detail Drawer (slide-over) */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/60" onClick={() => { setSelectedUser(null); setUserDetail(null); }} />
          <div className="relative w-[500px] bg-zinc-900 border-l border-zinc-800 overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-zinc-100">{selectedUser.userName}</h2>
              <button onClick={() => { setSelectedUser(null); setUserDetail(null); }}
                className="text-zinc-500 hover:text-zinc-200 text-xl">✕</button>
            </div>

            <div className="mb-6">
              <p className="text-sm text-zinc-500">{selectedUser.userEmail}</p>
              <div className="flex items-center gap-3 mt-3">
                <span className={`text-3xl font-bold ${
                  selectedUser.totalScore >= 70 ? 'text-emerald-400' :
                  selectedUser.totalScore >= 40 ? 'text-amber-400' : 'text-red-400'
                }`}>{selectedUser.totalScore.toFixed(1)}</span>
                <span className="text-sm text-zinc-500">/ 100</span>
              </div>
            </div>

            {/* Score Breakdown */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-3">Score Breakdown</h3>
              <div className="space-y-2">
                {Object.entries(selectedUser.breakdown).map(([key, val]) => (
                  <div key={key} className="flex items-center justify-between p-2 rounded bg-zinc-800/50">
                    <span className="text-sm text-zinc-300">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-zinc-500">raw: {val.raw}</span>
                      <span className="text-xs text-zinc-500">×{val.weight}%</span>
                      <span className="text-sm font-medium text-amber-400">{val.weighted.toFixed(1)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Performance Detail */}
            {detailLoading ? (
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-zinc-800 rounded w-2/3" />
                <div className="h-4 bg-zinc-800 rounded w-1/2" />
              </div>
            ) : userDetail?.performance?.[0] && (
              <div>
                <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-3">Performance Metrics</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Bookings Completed', value: userDetail.performance[0].bookingsCompleted },
                    { label: 'Bookings Cancelled', value: userDetail.performance[0].bookingsCancelled },
                    { label: 'Inquiries Handled', value: userDetail.performance[0].inquiriesHandled },
                    { label: 'Inquiries Converted', value: userDetail.performance[0].inquiriesConverted },
                    { label: 'Conversion Rate', value: `${userDetail.performance[0].conversionRate}%` },
                    { label: 'Revenue Generated', value: `£${userDetail.performance[0].revenueGenerated}` },
                    { label: 'Lost Revenue', value: `£${userDetail.performance[0].lostRevenueAmount}` },
                    { label: 'Cancellation Rate', value: `${userDetail.performance[0].cancellationRate}%` },
                    { label: 'Complaints', value: userDetail.performance[0].complaintsCount },
                    { label: 'Retention Actions', value: userDetail.performance[0].retentionActionsCompleted },
                  ].map(m => (
                    <div key={m.label} className="p-2 rounded bg-zinc-800/50">
                      <p className="text-xs text-zinc-500">{m.label}</p>
                      <p className="text-sm font-medium text-zinc-200">{m.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedUser.manualAdjust !== 0 && (
              <div className="mt-6 p-3 rounded-lg border border-amber-500/30 bg-amber-500/5">
                <p className="text-xs text-amber-400 font-medium">Manual Adjustment</p>
                <p className="text-sm text-zinc-300">{selectedUser.manualAdjust > 0 ? '+' : ''}{selectedUser.manualAdjust} points</p>
                {selectedUser.adjustReason && (
                  <p className="text-xs text-zinc-500 mt-1">{selectedUser.adjustReason}</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Adjust Modal */}
      {adjusting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setAdjusting(null)} />
          <div className="relative bg-zinc-900 border border-zinc-800 rounded-xl p-6 w-[400px]">
            <h3 className="text-lg font-semibold text-zinc-100 mb-4">Adjust Score — {adjusting.userName}</h3>
            <p className="text-sm text-zinc-500 mb-4">Current: {adjusting.totalScore.toFixed(1)}</p>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-zinc-500 uppercase tracking-wider">Adjustment (+/-)</label>
                <input type="number" value={adjustValue} onChange={e => setAdjustValue(e.target.value)}
                  placeholder="e.g. +5 or -10"
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-100 px-3 py-2 text-sm mt-1" />
              </div>
              <div>
                <label className="text-xs text-zinc-500 uppercase tracking-wider">Reason</label>
                <input type="text" value={adjustReason} onChange={e => setAdjustReason(e.target.value)}
                  placeholder="Reason for adjustment"
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-100 px-3 py-2 text-sm mt-1" />
              </div>
            </div>

            <div className="flex gap-2 mt-6 justify-end">
              <button onClick={() => setAdjusting(null)}
                className="px-4 py-2 rounded-lg bg-zinc-800 text-zinc-400 text-sm hover:bg-zinc-700">Cancel</button>
              <button onClick={submitAdjust} disabled={!adjustValue || !adjustReason}
                className="px-4 py-2 rounded-lg bg-amber-500/20 text-amber-400 text-sm font-medium hover:bg-amber-500/30 border border-amber-500/30 disabled:opacity-50">
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
