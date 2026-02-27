// SETTINGS PAGE
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function SettingsPage() {
  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">⚙️ Settings</h1>
        <p className="text-muted-foreground">System configuration</p>
      </div>
      
      <div className="space-y-6">
        {/* Database */}
        <Card>
          <CardHeader>
            <CardTitle>Database</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span>Provider</span>
              <Badge>PostgreSQL (Neon.tech)</Badge>
            </div>
            <div className="flex justify-between">
              <span>Tables</span>
              <Badge variant="outline">30+ tables</Badge>
            </div>
            <div className="flex justify-between">
              <span>Status</span>
              <Badge variant="default">✓ Connected</Badge>
            </div>
          </CardContent>
        </Card>
        
        {/* Integrations */}
        <Card>
          <CardHeader>
            <CardTitle>Integrations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span>Telegram (DivaReceptionBot)</span>
              <Badge variant="secondary">Not configured</Badge>
            </div>
            <div className="flex justify-between">
              <span>Telegram (KeshaZeroGapBot)</span>
              <Badge variant="secondary">Not configured</Badge>
            </div>
            <div className="flex justify-between">
              <span>Stripe Payments</span>
              <Badge variant="secondary">Not configured</Badge>
            </div>
            <div className="flex justify-between">
              <span>Email (Resend)</span>
              <Badge variant="secondary">Not configured</Badge>
            </div>
          </CardContent>
        </Card>
        
        {/* System Info */}
        <Card>
          <CardHeader>
            <CardTitle>System Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Version</span>
              <span className="font-mono">v3.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Release</span>
              <span>Release 1 (Foundation)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Environment</span>
              <span>Development</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Node.js</span>
              <span>v20.x</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
