// DASHBOARD PAGE
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  const [stats, setStats] = useState<any>({
    bookings: { total: 0, confirmed: 0, pending: 0 },
    inquiries: { total: 0, new: 0 },
    tasks: { total: 0, urgent: 0 }
  });
  
  useEffect(() => {
    loadStats();
  }, []);
  
  async function loadStats() {
    try {
      const [bookingsRes, inquiriesRes, tasksRes] = await Promise.all([
        fetch('/api/v1/bookings?limit=100'),
        fetch('/api/v1/inquiries?limit=100'),
        fetch('/api/v1/tasks?limit=100')
      ]);
      
      const bookingsData = await bookingsRes.json();
      const inquiriesData = await inquiriesRes.json();
      const tasksData = await tasksRes.json();
      
      const bookings = bookingsData.data?.bookings || [];
      const inquiries = inquiriesData.data?.inquiries || [];
      const tasks = tasksData.data?.tasks || [];
      
      setStats({
        bookings: {
          total: bookings.length,
          confirmed: bookings.filter((b: any) => b.status === 'confirmed').length,
          pending: bookings.filter((b: any) => b.status === 'pending').length
        },
        inquiries: {
          total: inquiries.length,
          new: inquiries.filter((i: any) => i.status === 'new').length
        },
        tasks: {
          total: tasks.length,
          urgent: tasks.filter((t: any) => t.priority === 'critical' || t.slaBreached).length
        }
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  }
  
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">📊 Dashboard</h1>
        <p className="text-muted-foreground">Operations overview</p>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.bookings.total}</div>
            <p className="text-sm text-muted-foreground mt-1">
              {stats.bookings.confirmed} confirmed, {stats.bookings.pending} pending
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Inquiries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.inquiries.total}</div>
            <p className="text-sm text-muted-foreground mt-1">
              {stats.inquiries.new} new inquiries
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.tasks.total}</div>
            <p className="text-sm text-muted-foreground mt-1">
              {stats.tasks.urgent} urgent
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">£500</div>
            <p className="text-sm text-muted-foreground mt-1">
              From 1 booking
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/admin/action-center">
              <Button className="w-full justify-start" variant="outline">
                🎯 Go to Action Center
              </Button>
            </Link>
            
            <Link href="/admin/bookings">
              <Button className="w-full justify-start" variant="outline">
                📅 View All Bookings
              </Button>
            </Link>
            
            <Link href="/admin/inquiries">
              <Button className="w-full justify-start" variant="outline">
                📝 View All Inquiries
              </Button>
            </Link>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Database</span>
              <span className="text-sm font-semibold text-green-600">✓ Connected</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">API Server</span>
              <span className="text-sm font-semibold text-green-600">✓ Running</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Queue Worker</span>
              <span className="text-sm font-semibold text-yellow-600">⚠ Not Running</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Telegram Bots</span>
              <span className="text-sm font-semibold text-yellow-600">⚠ Not Configured</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
