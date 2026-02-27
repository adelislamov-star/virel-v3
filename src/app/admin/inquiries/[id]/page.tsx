// INQUIRY DETAIL PAGE
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function InquiryDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [inquiry, setInquiry] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadInquiry();
  }, [params.id]);
  
  async function loadInquiry() {
    try {
      const res = await fetch(`/api/v1/inquiries?limit=100`);
      const data = await res.json();
      const found = data.data?.inquiries?.find((i: any) => i.id === params.id);
      setInquiry(found);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load inquiry:', error);
      setLoading(false);
    }
  }
  
  async function handleStatusChange(newStatus: string) {
    if (!confirm(`Change status to ${newStatus}?`)) return;
    
    try {
      const res = await fetch(`/api/v1/inquiries/${params.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newStatus, reason: 'Manual update' })
      });
      
      if (res.ok) {
        alert('Status updated successfully!');
        loadInquiry();
      } else {
        const error = await res.json();
        alert(`Failed: ${error.error?.message || 'Unknown error'}`);
      }
    } catch (error) {
      alert('Failed to update status');
    }
  }
  
  if (loading) return <div className="p-6">Loading...</div>;
  if (!inquiry) return <div className="p-6">Inquiry not found</div>;
  
  const availableTransitions: any = {
    new: ['qualified', 'spam'],
    qualified: ['awaiting_client', 'lost'],
    awaiting_client: ['awaiting_deposit', 'lost'],
    awaiting_deposit: ['converted', 'lost']
  };
  
  const nextStatuses = availableTransitions[inquiry.status] || [];
  
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
            <CardTitle>Inquiry Details</CardTitle>
            <Badge>{inquiry.status}</Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Subject & Message */}
          <div>
            <h3 className="font-semibold text-2xl mb-2">
              {inquiry.subject || 'Booking Request'}
            </h3>
            {inquiry.message && (
              <div className="bg-muted p-4 rounded mt-3">
                <p className="text-sm">{inquiry.message}</p>
              </div>
            )}
          </div>
          
          {/* Badges */}
          <div className="flex gap-2">
            <Badge variant={inquiry.priority === 'critical' ? 'destructive' : 'default'}>
              {inquiry.priority}
            </Badge>
            <Badge variant="outline">{inquiry.source}</Badge>
          </div>
          
          {/* Client */}
          {inquiry.client && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">Client</p>
              <p className="font-semibold">{inquiry.client.fullName}</p>
              {inquiry.client.email && (
                <p className="text-sm text-muted-foreground">{inquiry.client.email}</p>
              )}
              {inquiry.client.phone && (
                <p className="text-sm text-muted-foreground">{inquiry.client.phone}</p>
              )}
            </div>
          )}
          
          {/* Request Details */}
          <div className="grid grid-cols-2 gap-4">
            {inquiry.requestedLocation && (
              <div>
                <p className="text-sm text-muted-foreground">Location</p>
                <p className="font-medium">📍 {inquiry.requestedLocation.title}</p>
              </div>
            )}
            
            {inquiry.requestedTimeFrom && (
              <div>
                <p className="text-sm text-muted-foreground">Requested Time</p>
                <p className="font-medium">
                  {new Date(inquiry.requestedTimeFrom).toLocaleDateString()}
                  {inquiry.requestedTimeTo && (
                    <span> → {new Date(inquiry.requestedTimeTo).toLocaleDateString()}</span>
                  )}
                </p>
              </div>
            )}
          </div>
          
          {/* Timestamps */}
          <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
            <div>
              <p>Created: {new Date(inquiry.createdAt).toLocaleString()}</p>
            </div>
            <div>
              <p>Updated: {new Date(inquiry.updatedAt).toLocaleString()}</p>
            </div>
          </div>
          
          {/* Status Transitions */}
          {nextStatuses.length > 0 && (
            <div className="pt-4 border-t">
              <p className="text-sm font-semibold mb-3">Change Status:</p>
              <div className="flex gap-2 flex-wrap">
                {nextStatuses.map((status: string) => (
                  <Button
                    key={status}
                    variant={status === 'spam' || status === 'lost' ? 'destructive' : 'default'}
                    onClick={() => handleStatusChange(status)}
                  >
                    {status.replace('_', ' ').toUpperCase()}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
