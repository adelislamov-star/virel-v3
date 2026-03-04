// ACTION CENTER
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type ActionItem = {
  id: string;
  type: 'task' | 'exception' | 'review' | 'incident' | 'fraud_alert';
  priority: string;
  severity?: string;
  subject?: string;
  summary?: string;
  entityType: string;
  entityId: string;
  status: string;
  slaBreached?: boolean;
  slaMinutesRemaining?: number | null;
  createdAt: string;
};

const badgeStyles: Record<string, string> = {
  critical: 'bg-red-500/10 text-red-400 border-red-500/20',
  high: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  normal: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  low: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
};

const typeBadgeStyles: Record<string, string> = {
  task: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  exception: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  review: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  incident: 'bg-red-500/10 text-red-400 border-red-500/20',
  fraud_alert: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
};

const typeLabels: Record<string, string> = {
  task: 'Task',
  exception: 'Exception',
  review: 'Review',
  incident: 'Incident',
  fraud_alert: 'Fraud',
};

export default function ActionCenterPage() {
  const router = useRouter();
  const [items, setItems] = useState<ActionItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadItems();
    const interval = setInterval(loadItems, 30000);
    return () => clearInterval(interval);
  }, []);

  async function loadItems() {
    try {
      const [tasksRes, exceptionsRes, reviewsRes, incidentsRes, signalsRes] = await Promise.all([
        fetch('/api/v1/tasks?status=open'),
        fetch('/api/v1/exceptions?status=open'),
        fetch('/api/v1/reviews?status=pending&limit=5'),
        fetch('/api/v1/incidents?status=reported&limit=5'),
        fetch('/api/v1/fraud/signals?limit=5')
      ]);

      const tasksData = await tasksRes.json();
      const exceptionsData = await exceptionsRes.json();
      const reviewsData = await reviewsRes.json();
      const incidentsData = await incidentsRes.json();
      const signalsData = await signalsRes.json();

      const combined: ActionItem[] = [
        ...(tasksData.data?.tasks || []).map((t: any) => ({ ...t, type: 'task' as const })),
        ...(exceptionsData.data?.exceptions || []).map((e: any) => ({
          ...e, type: 'exception' as const, priority: e.severity
        })),
        ...(reviewsData.data?.reviews || []).map((r: any) => ({
          id: r.id,
          type: 'review' as const,
          priority: r.toxicityFlag || r.suspiciousFlag ? 'high' : 'normal',
          subject: `Review by ${r.client?.fullName || 'Unknown'} for ${r.model?.name || 'Unknown'}`,
          entityType: 'review',
          entityId: r.id,
          status: r.status,
          createdAt: r.createdAt
        })),
        ...(incidentsData.data?.incidents || []).map((i: any) => ({
          id: i.id,
          type: 'incident' as const,
          priority: i.severity,
          subject: i.description.slice(0, 80),
          entityType: 'incident',
          entityId: i.id,
          status: i.status,
          createdAt: i.createdAt
        })),
        ...(signalsData.data?.signals || []).map((s: any) => ({
          id: s.id,
          type: 'fraud_alert' as const,
          priority: s.riskScoreImpact >= 20 ? 'high' : 'normal',
          subject: `Fraud signal: ${s.signalType.replace(/_/g, ' ')}`,
          entityType: 'fraud',
          entityId: s.clientId,
          status: 'open',
          createdAt: s.createdAt
        }))
      ];

      combined.sort((a, b) => {
        if (a.slaBreached && !b.slaBreached) return -1;
        if (!a.slaBreached && b.slaBreached) return 1;
        const priorityOrder: any = { critical: 0, high: 1, medium: 2, normal: 2, low: 3 };
        const aPriority = priorityOrder[a.priority] || 99;
        const bPriority = priorityOrder[b.priority] || 99;
        if (aPriority !== bPriority) return aPriority - bPriority;
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });

      setItems(combined);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load action items:', error);
      setLoading(false);
    }
  }

  function handleView(item: ActionItem) {
    switch (item.type) {
      case 'task': router.push(`/admin/tasks/${item.id}`); break;
      case 'review': router.push('/admin/reviews'); break;
      case 'incident': router.push('/admin/incidents'); break;
      case 'fraud_alert': router.push('/admin/fraud'); break;
      case 'exception':
        if (item.entityType === 'booking') router.push(`/admin/bookings/${item.entityId}`);
        break;
    }
  }

  function getSLALabel(item: ActionItem) {
    if (!item.slaMinutesRemaining) return null;
    if (item.slaBreached) return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border bg-red-500/10 text-red-400 border-red-500/20">SLA BREACHED</span>
    );
    if (item.slaMinutesRemaining < 15) return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border bg-red-500/10 text-red-400 border-red-500/20">{item.slaMinutesRemaining}min left</span>
    );
    if (item.slaMinutesRemaining < 30) return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border bg-amber-500/10 text-amber-400 border-amber-500/20">{item.slaMinutesRemaining}min left</span>
    );
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border bg-zinc-500/10 text-zinc-400 border-zinc-500/20">{item.slaMinutesRemaining}min left</span>
    );
  }

  const urgentItems = items.filter(i => i.slaBreached || i.priority === 'critical' || i.severity === 'critical');
  const highPriorityItems = items.filter(i => !urgentItems.includes(i) && (i.priority === 'high' || i.severity === 'high'));
  const normalItems = items.filter(i => !urgentItems.includes(i) && !highPriorityItems.includes(i));

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">Action Center</h1>
          <p className="text-sm text-zinc-500 mt-1">Items requiring attention</p>
        </div>
        <div className="space-y-4 animate-pulse">
          <div className="grid grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-zinc-800/30 rounded-xl" />)}
          </div>
          <div className="h-20 bg-zinc-800/30 rounded-xl" />
          <div className="h-20 bg-zinc-800/30 rounded-xl" />
        </div>
      </div>
    );
  }

  function renderItem(item: ActionItem, urgent?: boolean) {
    return (
      <div
        key={item.id}
        className={`rounded-xl border p-5 transition-colors duration-100 ${
          urgent
            ? 'border-red-500/30 bg-red-500/5 hover:bg-red-500/10'
            : 'border-zinc-800/50 bg-zinc-900/50 hover:bg-zinc-800/30'
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${typeBadgeStyles[item.type] || 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'}`}>
                {typeLabels[item.type] || item.type}
              </span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${badgeStyles[item.priority] || badgeStyles.normal}`}>
                {item.priority}
              </span>
              {getSLALabel(item)}
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border border-zinc-700/50 text-zinc-500">
                {item.entityType}
              </span>
            </div>
            <h3 className="text-sm font-medium text-zinc-200 mb-1 truncate">{item.subject || item.summary}</h3>
            <p className="text-xs text-zinc-500">
              Created {new Date(item.createdAt).toLocaleString()}
            </p>
          </div>
          <div className="flex gap-2 ml-4 shrink-0">
            <button
              onClick={() => handleView(item)}
              className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-900 text-xs font-medium transition-colors duration-150"
            >
              View
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">Action Center</h1>
        <p className="text-sm text-zinc-500 mt-1">{items.length} items requiring attention</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-5">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Urgent</p>
          <p className={`text-2xl font-semibold mt-2 ${urgentItems.length > 0 ? 'text-red-400' : 'text-zinc-100'}`}>{urgentItems.length}</p>
        </div>
        <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-5">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">High Priority</p>
          <p className={`text-2xl font-semibold mt-2 ${highPriorityItems.length > 0 ? 'text-amber-400' : 'text-zinc-100'}`}>{highPriorityItems.length}</p>
        </div>
        <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-5">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Normal</p>
          <p className="text-2xl font-semibold text-zinc-100 mt-2">{normalItems.length}</p>
        </div>
      </div>

      {urgentItems.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-red-400 uppercase tracking-wider mb-3">Urgent ({urgentItems.length})</h2>
          <div className="space-y-3">
            {urgentItems.map(item => renderItem(item, true))}
          </div>
        </div>
      )}

      {highPriorityItems.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-3">High Priority ({highPriorityItems.length})</h2>
          <div className="space-y-3">
            {highPriorityItems.map(item => renderItem(item))}
          </div>
        </div>
      )}

      {normalItems.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">Normal ({normalItems.length})</h2>
          <div className="space-y-3">
            {normalItems.map(item => renderItem(item))}
          </div>
        </div>
      )}

      {items.length === 0 && (
        <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-8 text-center">
          <p className="text-zinc-500">All clear — no items requiring attention.</p>
        </div>
      )}
    </div>
  );
}
