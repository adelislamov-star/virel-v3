// FRAUD MONITOR PAGE
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';

type FraudClient = {
  id: string;
  fullName?: string;
  email?: string;
  phone?: string;
  riskStatus: string;
  totalSpent: number;
  bookingCount: number;
  chargebackCount: number;
  tags: string[];
};

type FraudSignal = {
  id: string;
  client?: { id: string; fullName: string; riskStatus: string };
  booking?: { id: string; shortId?: string };
  model?: { id: string; name: string };
  signalType: string;
  riskScoreImpact: number;
  createdAt: string;
};

type FraudStats = {
  clientsMonitored: number;
  clientsBlocked: number;
  signalsThisWeek: number;
  totalChargebacks: number;
};

function getRiskColor(status: string): any {
  const colors: Record<string, string> = { normal: 'default', monitoring: 'yellow', restricted: 'orange', blocked: 'destructive' };
  return colors[status] || 'default';
}

export default function FraudMonitorPage() {
  const [stats, setStats] = useState<FraudStats>({ clientsMonitored: 0, clientsBlocked: 0, signalsThisWeek: 0, totalChargebacks: 0 });
  const [clients, setClients] = useState<FraudClient[]>([]);
  const [signals, setSignals] = useState<FraudSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [statsRes, clientsRes, signalsRes] = await Promise.all([
        fetch('/api/v1/fraud/stats'),
        fetch('/api/v1/fraud/clients?limit=50'),
        fetch('/api/v1/fraud/signals?limit=20')
      ]);
      const statsData = await statsRes.json();
      const clientsData = await clientsRes.json();
      const signalsData = await signalsRes.json();
      setStats(statsData.data || stats);
      setClients(clientsData.data?.clients || []);
      setSignals(signalsData.data?.signals || []);
    } catch (error) {
      console.error('Failed to load fraud data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function changeRiskStatus(clientId: string, riskStatus: string) {
    try {
      setSubmitting(true);
      await fetch(`/api/v1/fraud/clients/${clientId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ riskStatus })
      });
      await loadData();
    } catch (error) {
      console.error('Failed to change risk status:', error);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">🛡️ Fraud Monitor</h1>
        <p className="text-muted-foreground">Risk monitoring and fraud detection</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Clients Monitored</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{stats.clientsMonitored}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Blocked</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{stats.clientsBlocked}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Signals This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.signalsThisWeek}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Chargebacks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{stats.totalChargebacks}</div>
          </CardContent>
        </Card>
      </div>

      {/* Clients at Risk */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Clients at Risk</h2>
        <div className="space-y-3">
          {clients.map(client => (
            <Card key={client.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={getRiskColor(client.riskStatus)}>
                        {client.riskStatus}
                      </Badge>
                      {client.chargebackCount > 0 && (
                        <Badge variant="destructive">{client.chargebackCount} chargebacks</Badge>
                      )}
                    </div>
                    <h3 className="font-semibold mb-1">{client.fullName || 'Unknown'}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {client.email && <span>{client.email}</span>}
                      {client.phone && <span>{client.phone}</span>}
                      <span>£{client.totalSpent.toFixed(0)} spent</span>
                      <span>{client.bookingCount} bookings</span>
                    </div>
                  </div>
                  <div>
                    <select
                      className="rounded-md border p-2 text-sm bg-background"
                      value={client.riskStatus}
                      disabled={submitting}
                      onChange={e => changeRiskStatus(client.id, e.target.value)}
                    >
                      <option value="normal">Normal</option>
                      <option value="monitoring">Monitoring</option>
                      <option value="restricted">Restricted</option>
                      <option value="blocked">Blocked</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {clients.length === 0 && (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                ✅ No clients at risk.
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Recent Fraud Signals */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Recent Fraud Signals</h2>
        <div className="space-y-3">
          {signals.map(signal => (
            <Card key={signal.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">{signal.signalType.replace(/_/g, ' ')}</Badge>
                      <Badge variant={signal.riskScoreImpact >= 20 ? 'destructive' : 'yellow'}>
                        +{signal.riskScoreImpact} risk
                      </Badge>
                      {signal.booking?.shortId && (
                        <Badge variant="outline">{signal.booking.shortId}</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{signal.client?.fullName || 'Unknown'}</span>
                      {signal.model?.name && <span>Model: {signal.model.name}</span>}
                      <span>{formatDistanceToNow(new Date(signal.createdAt), { addSuffix: true })}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {signals.length === 0 && (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                ✅ No recent fraud signals.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
