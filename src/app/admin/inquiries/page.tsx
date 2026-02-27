// INQUIRIES LIST PAGE
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function InquiriesPage() {
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadInquiries();
  }, []);
  
  async function loadInquiries() {
    try {
      const res = await fetch('/api/v1/inquiries?limit=50');
      const data = await res.json();
      setInquiries(data.data?.inquiries || []);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load inquiries:', error);
      setLoading(false);
    }
  }
  
  function getStatusColor(status: string) {
    const colors: any = {
      new: 'default',
      qualified: 'default',
      awaiting_client: 'yellow',
      awaiting_deposit: 'orange',
      converted: 'default',
      lost: 'destructive',
      spam: 'destructive'
    };
    return colors[status] || 'default';
  }
  
  if (loading) {
    return <div className="p-6">Loading inquiries...</div>;
  }
  
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">📝 Inquiries</h1>
        <p className="text-muted-foreground">
          {inquiries.length} total inquiries
        </p>
      </div>
      
      <div className="space-y-3">
        {inquiries.map(inquiry => (
          <Card key={inquiry.id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={getStatusColor(inquiry.status)}>
                      {inquiry.status}
                    </Badge>
                    <Badge variant="outline">{inquiry.priority}</Badge>
                    <Badge variant="secondary">{inquiry.source}</Badge>
                  </div>
                  
                  <h3 className="font-semibold text-lg mb-1">
                    {inquiry.subject || 'No subject'}
                  </h3>
                  
                  <div className="text-sm text-muted-foreground space-y-1">
                    {inquiry.client && (
                      <p>👤 {inquiry.client.fullName}</p>
                    )}
                    {inquiry.requestedLocation && (
                      <p>📍 {inquiry.requestedLocation.title}</p>
                    )}
                    {inquiry.message && (
                      <p className="line-clamp-2">💬 {inquiry.message}</p>
                    )}
                    <p>🕐 {new Date(inquiry.createdAt).toLocaleString()}</p>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Link href={`/admin/inquiries/${inquiry.id}`}>
                    <Button size="sm">View</Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {inquiries.length === 0 && (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              No inquiries found
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
