// TASK DETAIL PAGE
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function TaskDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadTask();
  }, [params.id]);
  
  async function loadTask() {
    try {
      const res = await fetch(`/api/v1/tasks?status=open&limit=100`);
      const data = await res.json();
      const found = data.data?.tasks?.find((t: any) => t.id === params.id);
      setTask(found);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load task:', error);
      setLoading(false);
    }
  }
  
  async function handleStatusChange(newStatus: string) {
    try {
      const res = await fetch(`/api/v1/tasks/${params.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newStatus })
      });
      
      if (res.ok) {
        alert('Status updated!');
        router.push('/admin/action-center');
      }
    } catch (error) {
      alert('Failed to update status');
    }
  }
  
  if (loading) return <div className="p-6">Loading...</div>;
  if (!task) return <div className="p-6">Task not found</div>;
  
  return (
    <div className="p-6 max-w-4xl">
      <Button 
        variant="outline" 
        onClick={() => router.back()}
        className="mb-4"
      >
        ← Back
      </Button>
      
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Task Details</CardTitle>
            <Badge>{task.status}</Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Subject */}
          <div>
            <h3 className="font-semibold text-lg mb-2">{task.subject}</h3>
            <div className="flex gap-2">
              <Badge variant={task.priority === 'critical' ? 'destructive' : 'default'}>
                {task.priority}
              </Badge>
              <Badge variant="outline">{task.type}</Badge>
            </div>
          </div>
          
          {/* Details */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Entity Type:</span>
              <p className="font-medium">{task.entityType}</p>
            </div>
            
            <div>
              <span className="text-muted-foreground">Entity ID:</span>
              <p className="font-mono text-xs">{task.entityId}</p>
            </div>
            
            <div>
              <span className="text-muted-foreground">Created:</span>
              <p>{new Date(task.createdAt).toLocaleString()}</p>
            </div>
            
            {task.slaDeadlineAt && (
              <div>
                <span className="text-muted-foreground">SLA Deadline:</span>
                <p>{new Date(task.slaDeadlineAt).toLocaleString()}</p>
              </div>
            )}
            
            {task.assignedUser && (
              <div>
                <span className="text-muted-foreground">Assigned To:</span>
                <p>{task.assignedUser.name}</p>
              </div>
            )}
          </div>
          
          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t">
            {task.status === 'open' && (
              <>
                <Button onClick={() => handleStatusChange('in_progress')}>
                  Start Working
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => handleStatusChange('done')}
                >
                  Mark as Done
                </Button>
              </>
            )}
            
            {task.status === 'in_progress' && (
              <>
                <Button onClick={() => handleStatusChange('done')}>
                  Complete
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => handleStatusChange('failed')}
                >
                  Mark as Failed
                </Button>
              </>
            )}
            
            <Button 
              variant="destructive"
              onClick={() => handleStatusChange('cancelled')}
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
