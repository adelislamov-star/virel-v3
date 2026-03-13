'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';

// ── Types ──────────────────────────────────────────────────────
type ClientProfile = {
  client: any;
  identities: any[];
  retentionProfile: any;
  riskHistory: any[];
  activeBookings: any[];
  recentBookings: any[];
  activeMembership: any;
  openIncidents: any[];
  fraudSignals: any[];
  stats: {
    totalBookings: number;
    completedBookings: number;
    cancellationRate: number;
    totalSpent: number;
    avgBookingValue: number;
    lastBookingAt: string | null;
  };
};

type TimelineEvent = {
  id: string;
  eventType: string;
  title: string;
  description: string | null;
  metadataJson: any;
  severity: string;
  createdAt: string;
};

type MergeCandidate = {
  id: string;
  primaryClient: { id: string; fullName: string; phone: string | null; email: string | null };
  duplicateClient: { id: string; fullName: string; phone: string | null; email: string | null };
  score: number;
  reasonsJson: any;
  status: string;
};

// ── Styles ─────────────────────────────────────────────────────
const riskStyles: Record<string, string> = {
  normal: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  monitoring: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  restricted: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  blocked: 'bg-red-500/10 text-red-400 border-red-500/20',
};

const eventIcons: Record<string, string> = {
  'booking.confirmed': '✓',
  'booking.cancelled': '✕',
  'booking.completed': '★',
  'booking.no_show': '⊘',
  'fraud.signal.created': '⚠',
  'risk_status.changed': '◉',
  'retention.action.created': '↻',
  'client.merged': '⇄',
  'payment.received': '$',
  'review.submitted': '✎',
  'incident.created': '!',
  'membership.started': '♦',
};

const severityColors: Record<string, string> = {
  info: 'border-zinc-700',
  warning: 'border-yellow-500/30',
  error: 'border-red-500/30',
  critical: 'border-red-500/50',
};

// ── Helpers ────────────────────────────────────────────────────
function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDateTime(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatMoney(v: number) {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(v);
}

// ── Component ──────────────────────────────────────────────────
export default function ClientProfilePage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;

  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [timelinePage, setTimelinePage] = useState(1);
  const [timelineHasMore, setTimelineHasMore] = useState(false);
  const [candidates, setCandidates] = useState<MergeCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Tab state
  const [activeTab, setActiveTab] = useState<'timeline' | 'bookings' | 'fraud' | 'incidents'>('timeline');

  // Modals
  const [showRiskModal, setShowRiskModal] = useState(false);
  const [showMergePanel, setShowMergePanel] = useState(false);
  const [showMergeConfirm, setShowMergeConfirm] = useState<MergeCandidate | null>(null);
  const [riskForm, setRiskForm] = useState({ riskStatus: '', reasonCode: '' });
  const [submitting, setSubmitting] = useState(false);

  // ── Load profile ───────────────────────────────────
  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/v1/clients/${clientId}/profile`);
      const json = await res.json();
      if (json.success) {
        setProfile(json.data);
      } else {
        setError(json.error?.message || 'Failed to load client');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  // ── Load timeline ──────────────────────────────────
  const loadTimeline = useCallback(async (pg = 1, append = false) => {
    try {
      const res = await fetch(`/api/v1/clients/${clientId}/timeline?page=${pg}&limit=20`);
      const json = await res.json();
      if (json.success) {
        if (append) {
          setTimeline((prev) => [...prev, ...json.data.events]);
        } else {
          setTimeline(json.data.events);
        }
        setTimelineHasMore(json.data.pagination.page < json.data.pagination.totalPages);
        setTimelinePage(pg);
      }
    } catch {}
  }, [clientId]);

  // ── Load merge candidates ──────────────────────────
  const loadCandidates = useCallback(async () => {
    try {
      const res = await fetch(`/api/v1/clients/${clientId}/merge-candidates`);
      const json = await res.json();
      if (json.success) setCandidates(json.data.candidates);
    } catch {}
  }, [clientId]);

  useEffect(() => {
    loadProfile();
    loadTimeline(1);
    loadCandidates();
  }, [loadProfile, loadTimeline, loadCandidates]);

  // ── Risk status change ─────────────────────────────
  const handleRiskChange = async () => {
    if (!riskForm.riskStatus || !riskForm.reasonCode) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/v1/clients/${clientId}/risk-status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(riskForm),
      });
      const json = await res.json();
      if (json.success) {
        setShowRiskModal(false);
        setRiskForm({ riskStatus: '', reasonCode: '' });
        loadProfile();
        loadTimeline(1);
      }
    } catch {}
    setSubmitting(false);
  };

  // ── Merge client ───────────────────────────────────
  const handleMerge = async (candidate: MergeCandidate) => {
    setSubmitting(true);
    try {
      const otherClient = candidate.primaryClient.id === clientId
        ? candidate.duplicateClient
        : candidate.primaryClient;
      const res = await fetch('/api/v1/clients/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          primaryClientId: clientId,
          duplicateClientId: otherClient.id,
          reasonCode: 'merge_candidate_resolved',
        }),
      });
      const json = await res.json();
      if (json.success) {
        setShowMergeConfirm(null);
        loadProfile();
        loadTimeline(1);
        loadCandidates();
      }
    } catch {}
    setSubmitting(false);
  };

  if (loading) {
    return <div className="p-8 text-zinc-500">Loading client profile...</div>;
  }
  if (error || !profile) {
    return <div className="p-8 text-red-400">{error || 'Client not found'}</div>;
  }

  const { client, stats, retentionProfile, activeMembership } = profile;

  return (
    <div className="p-6 space-y-6">
      {/* Back */}
      <button onClick={() => router.push('/admin/clients')} className="text-sm text-zinc-500 hover:text-zinc-300">
        ← Back to Clients
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ═══ LEFT COLUMN — Profile ═══ */}
        <div className="space-y-4">
          {/* Header */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
            <div className="flex items-start justify-between">
              <h2 className="text-xl font-bold text-white">
                {client.fullName || `${client.firstName ?? ''} ${client.lastName ?? ''}`.trim() || 'Unknown'}
              </h2>
              {client.vipStatus && (
                <span className="px-2 py-0.5 rounded-full text-xs bg-purple-500/10 text-purple-400 border border-purple-500/20 font-semibold">VIP</span>
              )}
            </div>

            <div className="space-y-2 text-sm">
              {client.phone && <div className="text-zinc-300">📞 {client.phone}</div>}
              {client.email && <div className="text-zinc-400">✉ {client.email}</div>}
              {client.language && <div className="text-zinc-500">🌐 {client.language}</div>}
              {(client.city || client.country) && (
                <div className="text-zinc-500">📍 {[client.city, client.country].filter(Boolean).join(', ')}</div>
              )}
            </div>

            {/* Risk Status */}
            <div className="flex items-center gap-2">
              <span className={`inline-block px-2 py-0.5 rounded-full text-xs border ${riskStyles[client.riskStatus] ?? 'bg-zinc-700 text-zinc-300'}`}>
                {client.riskStatus}
              </span>
              <button
                onClick={() => { setRiskForm({ riskStatus: client.riskStatus, reasonCode: '' }); setShowRiskModal(true); }}
                className="text-xs text-zinc-500 hover:text-zinc-300 underline"
              >
                Change
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-zinc-400 mb-3">Statistics</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-zinc-500">Total Spent</div>
                <div className="text-zinc-200 font-semibold">{formatMoney(stats.totalSpent)}</div>
              </div>
              <div>
                <div className="text-zinc-500">Avg Booking</div>
                <div className="text-zinc-200 font-semibold">{formatMoney(stats.avgBookingValue)}</div>
              </div>
              <div>
                <div className="text-zinc-500">Total Bookings</div>
                <div className="text-zinc-200 font-semibold">{stats.totalBookings}</div>
              </div>
              <div>
                <div className="text-zinc-500">Cancellation Rate</div>
                <div className="text-zinc-200 font-semibold">{stats.cancellationRate}%</div>
              </div>
            </div>
            {retentionProfile && (
              <div className="mt-3 pt-3 border-t border-zinc-800 text-sm">
                <span className="text-zinc-500">Segment: </span>
                <span className="text-zinc-300 font-medium">{retentionProfile.segment?.replace('_', ' ')}</span>
              </div>
            )}
          </div>

          {/* Membership */}
          {activeMembership && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-zinc-400 mb-2">Membership</h3>
              <div className="text-sm text-zinc-200">{activeMembership.plan?.name ?? 'Active Plan'}</div>
              <div className="text-xs text-zinc-500 mt-1">Expires: {formatDate(activeMembership.expiresAt)}</div>
            </div>
          )}

          {/* Merge Button */}
          <button
            onClick={() => setShowMergePanel(true)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-sm text-zinc-300 hover:bg-zinc-700 transition-colors"
          >
            Merge Candidates ({candidates.length})
          </button>
        </div>

        {/* ═══ RIGHT COLUMN — Tabs ═══ */}
        <div className="lg:col-span-2 space-y-4">
          {/* Tab Bar */}
          <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1">
            {(['timeline', 'bookings', 'fraud', 'incidents'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {tab === 'fraud' ? 'Fraud & Risk' : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl">
            {/* ── Timeline Tab ── */}
            {activeTab === 'timeline' && (
              <div className="p-4 space-y-3">
                {timeline.length === 0 && (
                  <div className="text-zinc-500 text-sm text-center py-8">No events yet</div>
                )}
                {timeline.map((ev) => (
                  <div
                    key={ev.id}
                    className={`border-l-2 ${severityColors[ev.severity] ?? 'border-zinc-700'} pl-4 py-2`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">{eventIcons[ev.eventType] ?? '•'}</span>
                      <span className="text-sm text-zinc-200 font-medium">{ev.title}</span>
                      <span className="text-xs text-zinc-600 ml-auto">{formatDateTime(ev.createdAt)}</span>
                    </div>
                    <div className="text-xs text-zinc-500 mt-1">
                      {ev.eventType}
                      {ev.metadataJson && typeof ev.metadataJson === 'object' && (
                        <span className="ml-2 text-zinc-600">
                          {Object.entries(ev.metadataJson as Record<string, unknown>)
                            .slice(0, 3)
                            .map(([k, v]) => `${k}: ${v}`)
                            .join(' · ')}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {timelineHasMore && (
                  <button
                    onClick={() => loadTimeline(timelinePage + 1, true)}
                    className="w-full py-2 text-sm text-zinc-500 hover:text-zinc-300"
                  >
                    Load More
                  </button>
                )}
              </div>
            )}

            {/* ── Bookings Tab ── */}
            {activeTab === 'bookings' && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800 text-zinc-400 text-left">
                      <th className="px-4 py-3 font-medium">Date</th>
                      <th className="px-4 py-3 font-medium">Model</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...(profile.activeBookings ?? []), ...(profile.recentBookings ?? [])].length === 0 && (
                      <tr><td colSpan={4} className="px-4 py-8 text-center text-zinc-500">No bookings</td></tr>
                    )}
                    {[...(profile.activeBookings ?? []), ...(profile.recentBookings ?? [])].map((b: any) => (
                      <tr key={b.id} className="border-b border-zinc-800/50">
                        <td className="px-4 py-3 text-zinc-300">{formatDate(b.startAt)}</td>
                        <td className="px-4 py-3 text-zinc-400">{b.model?.name ?? '—'}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs ${
                            b.status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-400' :
                            b.status === 'completed' ? 'bg-blue-500/10 text-blue-400' :
                            b.status === 'cancelled' ? 'bg-red-500/10 text-red-400' :
                            b.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400' :
                            'bg-zinc-700 text-zinc-300'
                          }`}>
                            {b.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-zinc-300">{b.priceTotal ? formatMoney(Number(b.priceTotal)) : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* ── Fraud & Risk Tab ── */}
            {activeTab === 'fraud' && (
              <div className="p-4 space-y-6">
                {/* Fraud Signals */}
                <div>
                  <h3 className="text-sm font-semibold text-zinc-400 mb-3">Fraud Signals</h3>
                  {(profile.fraudSignals ?? []).length === 0 ? (
                    <div className="text-zinc-500 text-sm">No fraud signals</div>
                  ) : (
                    <div className="space-y-2">
                      {profile.fraudSignals.map((s: any) => (
                        <div key={s.id} className="flex items-center gap-3 text-sm bg-zinc-800/50 rounded-lg p-3">
                          <span className="text-yellow-400">⚠</span>
                          <div className="flex-1">
                            <span className="text-zinc-200">{s.signalType}</span>
                            <span className="text-zinc-600 ml-2">impact: {s.riskScoreImpact}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-xs ${
                            s.status === 'confirmed' ? 'bg-red-500/10 text-red-400' :
                            s.status === 'dismissed' ? 'bg-zinc-700 text-zinc-500' :
                            'bg-blue-500/10 text-blue-400'
                          }`}>{s.status}</span>
                          <span className="text-xs text-zinc-600">{formatDate(s.createdAt)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Risk History */}
                <div>
                  <h3 className="text-sm font-semibold text-zinc-400 mb-3">Risk History</h3>
                  {(profile.riskHistory ?? []).length === 0 ? (
                    <div className="text-zinc-500 text-sm">No risk changes</div>
                  ) : (
                    <div className="space-y-2">
                      {profile.riskHistory.map((h: any) => (
                        <div key={h.id} className="flex items-center gap-3 text-sm bg-zinc-800/50 rounded-lg p-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs border ${riskStyles[h.previousStatus] ?? 'bg-zinc-700 text-zinc-300'}`}>
                            {h.previousStatus}
                          </span>
                          <span className="text-zinc-500">→</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs border ${riskStyles[h.newStatus] ?? 'bg-zinc-700 text-zinc-300'}`}>
                            {h.newStatus}
                          </span>
                          <span className="text-zinc-500 text-xs flex-1">{h.reason || h.reasonCode}</span>
                          <span className="text-xs text-zinc-600">{formatDate(h.createdAt)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Incidents Tab ── */}
            {activeTab === 'incidents' && (
              <div className="p-4">
                {(profile.openIncidents ?? []).length === 0 ? (
                  <div className="text-zinc-500 text-sm text-center py-8">No open incidents</div>
                ) : (
                  <div className="space-y-2">
                    {profile.openIncidents.map((i: any) => (
                      <div key={i.id} className="flex items-center gap-3 text-sm bg-zinc-800/50 rounded-lg p-3">
                        <span className="text-red-400">!</span>
                        <div className="flex-1">
                          <span className="text-zinc-200">{i.incidentType}</span>
                          <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                            i.severity === 'critical' ? 'bg-red-500/10 text-red-400' :
                            i.severity === 'high' ? 'bg-amber-500/10 text-amber-400' :
                            'bg-zinc-700 text-zinc-300'
                          }`}>{i.severity}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                          i.status === 'open' ? 'bg-red-500/10 text-red-400' :
                          'bg-yellow-500/10 text-yellow-400'
                        }`}>{i.status}</span>
                        <span className="text-xs text-zinc-600">{formatDate(i.createdAt)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══ Risk Status Modal ═══ */}
      {showRiskModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-md space-y-4">
            <h3 className="text-lg font-semibold text-white">Change Risk Status</h3>
            <select
              value={riskForm.riskStatus}
              onChange={(e) => setRiskForm({ ...riskForm, riskStatus: e.target.value })}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200"
            >
              <option value="normal">Normal</option>
              <option value="monitoring">Monitoring</option>
              <option value="restricted">Restricted</option>
              <option value="blocked">Blocked</option>
            </select>
            <input
              placeholder="Reason..."
              value={riskForm.reasonCode}
              onChange={(e) => setRiskForm({ ...riskForm, reasonCode: e.target.value })}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500"
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowRiskModal(false)} className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200">Cancel</button>
              <button
                onClick={handleRiskChange}
                disabled={submitting || !riskForm.reasonCode}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50"
              >
                {submitting ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Merge Candidates Slide-over ═══ */}
      {showMergePanel && (
        <div className="fixed inset-0 bg-black/60 flex justify-end z-50">
          <div className="bg-zinc-900 border-l border-zinc-700 w-full max-w-lg h-full overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Merge Candidates</h3>
              <button onClick={() => setShowMergePanel(false)} className="text-zinc-500 hover:text-zinc-300 text-xl">✕</button>
            </div>

            {candidates.length === 0 ? (
              <div className="text-zinc-500 text-sm py-8 text-center">No pending merge candidates</div>
            ) : (
              <div className="space-y-3">
                {candidates.map((c) => {
                  const other = c.primaryClient.id === clientId ? c.duplicateClient : c.primaryClient;
                  return (
                    <div key={c.id} className="bg-zinc-800 rounded-xl p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-200 font-medium text-sm">{other.fullName}</span>
                        <span className="text-xs text-zinc-500">Score: {c.score}</span>
                      </div>
                      <div className="text-xs text-zinc-500 space-y-1">
                        {other.phone && <div>Phone: {other.phone}</div>}
                        {other.email && <div>Email: {other.email}</div>}
                        {c.reasonsJson && typeof c.reasonsJson === 'object' && (
                          <div>Match: {Array.isArray(c.reasonsJson) ? (c.reasonsJson as string[]).join(', ') : JSON.stringify(c.reasonsJson)}</div>
                        )}
                      </div>
                      <button
                        onClick={() => setShowMergeConfirm(c)}
                        className="w-full mt-2 px-3 py-1.5 bg-amber-600/20 text-amber-400 rounded-lg text-xs font-medium hover:bg-amber-600/30"
                      >
                        Merge into this client
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ Merge Confirm Modal ═══ */}
      {showMergeConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60]">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-md space-y-4">
            <h3 className="text-lg font-semibold text-white">Confirm Merge</h3>
            <p className="text-sm text-zinc-400">
              All bookings, inquiries, reviews, and fraud signals from{' '}
              <strong className="text-zinc-200">
                {(showMergeConfirm.primaryClient.id === clientId ? showMergeConfirm.duplicateClient : showMergeConfirm.primaryClient).fullName}
              </strong>{' '}
              will be transferred to the current client. This cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowMergeConfirm(null)} className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200">Cancel</button>
              <button
                onClick={() => handleMerge(showMergeConfirm)}
                disabled={submitting}
                className="px-4 py-2 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-500 disabled:opacity-50"
              >
                {submitting ? 'Merging...' : 'Confirm Merge'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
