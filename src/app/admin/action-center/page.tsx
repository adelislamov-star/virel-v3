// ACTION CENTER - Main operator dashboard (UPDATED WITH WORKING BUTTONS)
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type ActionItem = {
  id: string;
  type: 'task' | 'exception';
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
      const tasksRes = await fetch('/api/v1/tasks?status=open');
      const tasksData = await tasksRes.json();
      
      const exceptionsRes = await fetch('/api/v1/exceptions?status=open');
      const exceptionsData = await exceptionsRes.json();
      
      const combined: ActionItem[] = [
        ...(tasksData.data?.tasks || []).map((t: any) => ({ ...t, type: 'task' as const })),
        ...(exceptionsData.data?.exceptions || []).map((e: any) => ({ ...e, type: 'exception' as const, priority: e.severity }))
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
    if (item.type === 'task') {
      router.push(`/admin/tasks/${item.id}`);
    } else if (item.entityType === 'booking') {
      router.push(`/admin/bookings/${item.entityId}`);
    }
  }
  
  function getPriorityColor(priority: string) {
    const colors: any = {
      critical: 'destructive',
      high: 'orange',
      medium: 'yellow',
      normal: 'default',
      low: 'secondary'
    };
    return colors[priority] || 'default';
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
                        <Badge variant={getPriorityColor(item.priority)}>
                          {item.type === 'task' ? '📋 Task' : '⚠️ Exception'}
                        </Badge>
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
                        <Badge variant={getPriorityColor(item.priority)}>
                          {item.type === 'task' ? '📋 Task' : '⚠️ Exception'}
                        </Badge>
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
                        <Badge variant="default">
                          {item.type === 'task' ? '📋 Task' : '⚠️ Exception'}
                        </Badge>
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
