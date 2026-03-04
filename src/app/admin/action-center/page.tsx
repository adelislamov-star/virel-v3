// ACTION CENTER - Main operator dashboard (UPDATED WITH REVIEWS, INCIDENTS, FRAUD)
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

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
          subject: `Review by ${r.client?.fullName || 'Unknown'} for ${r.model?.name || 'Unknown'} — ${r.rating}★`,
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
          subject: `Fraud signal: ${s.signalType.replace(/_/g, ' ')} — ${s.client?.fullName || 'Unknown'}`,
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

  function getPriorityColor(priority: string) {
    const colors: any = { critical: 'destructive', high: 'orange', medium: 'yellow', normal: 'default', low: 'secondary' };
    return colors[priority] || 'default';
  }

  function getTypeIcon(type: string) {
    const icons: Record<string, string> = {
      task: '📋 Task',
      exception: '⚠️ Exception',
      review: '⭐ Review',
      incident: '🚨 Incident',
      fraud_alert: '🛡️ Fraud'
    };
    return icons[type] || type;
  }

  function getSLALabel(item: ActionItem) {
    if (!item.slaMinutesRemaining) return null;
    if (item.slaBreached) return <Badge variant="destructive">SLA BREACHED</Badge>;
    if (item.slaMinutesRemaining < 15) return <Badge variant="destructive">{item.slaMinutesRemaining}min left</Badge>;
    if (item.slaMinutesRemaining < 30) return <Badge variant="orange">{item.slaMinutesRemaining}min left</Badge>;
    return <Badge variant="secondary">{item.slaMinutesRemaining}min left</Badge>;
  }

  const urgentItems = items.filter(i => i.slaBreached || i.priority === 'critical' || i.severity === 'critical');
  const highPriorityItems = items.filter(i => !urgentItems.includes(i) && (i.priority === 'high' || i.severity === 'high'));
  const normalItems = items.filter(i => !urgentItems.includes(i) && !highPriorityItems.includes(i));

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Action Center</h1>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">🎯 Action Center</h1>
        <p className="text-muted-foreground">{items.length} items requiring attention</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Urgent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{urgentItems.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">High Priority</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{highPriorityItems.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Normal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{normalItems.length}</div>
          </CardContent>
        </Card>
      </div>

      {urgentItems.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-red-600">🔴 URGENT ({urgentItems.length})</h2>
          <div className="space-y-3">
            {urgentItems.map(item => (
              <Card key={item.id} className="border-red-300 bg-red-50">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={getPriorityColor(item.priority)}>{getTypeIcon(item.type)}</Badge>
                        {getSLALabel(item)}
                        <Badge variant="outline">{item.entityType}</Badge>
                      </div>
                      <h3 className="font-semibold mb-1">{item.subject || item.summary}</h3>
                      <p className="text-sm text-muted-foreground">
                        Created {new Date(item.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleView(item)}>View</Button>
                      <Button size="sm" variant="outline">Assign to Me</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {highPriorityItems.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-orange-600">🟡 HIGH PRIORITY ({highPriorityItems.length})</h2>
          <div className="space-y-3">
            {highPriorityItems.map(item => (
              <Card key={item.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={getPriorityColor(item.priority)}>{getTypeIcon(item.type)}</Badge>
                        {getSLALabel(item)}
                        <Badge variant="outline">{item.entityType}</Badge>
                      </div>
                      <h3 className="font-semibold mb-1">{item.subject || item.summary}</h3>
                      <p className="text-sm text-muted-foreground">
                        Created {new Date(item.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleView(item)}>View</Button>
                      <Button size="sm" variant="outline">Assign</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {normalItems.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">NORMAL ({normalItems.length})</h2>
          <div className="space-y-3">
            {normalItems.map(item => (
              <Card key={item.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="default">{getTypeIcon(item.type)}</Badge>
                        <Badge variant="outline">{item.entityType}</Badge>
                      </div>
                      <h3 className="font-semibold mb-1">{item.subject || item.summary}</h3>
                      <p className="text-sm text-muted-foreground">
                        Created {new Date(item.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleView(item)}>View</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {items.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              ✅ All clear! No items requiring attention.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
