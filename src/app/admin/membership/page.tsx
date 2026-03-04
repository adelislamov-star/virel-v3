// MEMBERSHIP & SUBSCRIPTIONS
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type Plan = {
  id: string;
  name: string;
  tier: number;
  priceMonthly: number;
  bookingDiscountPercent: number;
  prioritySupportLevel: number;
  status: string;
  _count: { memberships: number };
};

type Membership = {
  id: string;
  clientId: string;
  status: string;
  startedAt: string;
  nextBillingAt: string | null;
  autoRenew: boolean;
  client: { id: string; fullName: string | null };
  plan: { id: string; name: string };
};

type Invoice = {
  id: string;
  amount: number;
  currency: string;
  status: string;
  periodStart: string;
  periodEnd: string;
  paidAt: string | null;
  membership: {
    client: { fullName: string | null };
    plan: { name: string };
  };
};

type Stats = {
  mrr: number;
  activeSubscribers: number;
  churnRate: number;
  arpu: number;
};

export default function MembershipPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [planForm, setPlanForm] = useState({
    name: '', tier: '1', priceMonthly: '', bookingDiscountPercent: '0', prioritySupportLevel: '0', perks: ''
  });

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    try {
      const [plansRes, statsRes, invoicesRes] = await Promise.all([
        fetch('/api/v1/membership/plans'),
        fetch('/api/v1/membership/stats'),
        fetch('/api/v1/membership/invoices?limit=20')
      ]);

      const plansData = await plansRes.json();
      const statsData = await statsRes.json();
      const invoicesData = await invoicesRes.json();

      setPlans(plansData.data?.plans || []);
      setStats(statsData.data || null);
      setInvoices(invoicesData.data?.invoices || []);

      // Load active memberships from plans data
      // Fetch from a broader query
      const membershipsArr: Membership[] = [];
      // We need to query memberships — let's do it through a dedicated call
      // For now, we'll show stats + plans + invoices
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function createPlan() {
    try {
      await fetch('/api/v1/membership/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...planForm,
          perks: planForm.perks ? JSON.parse(planForm.perks) : null
        })
      });
      setShowPlanForm(false);
      setPlanForm({ name: '', tier: '1', priceMonthly: '', bookingDiscountPercent: '0', prioritySupportLevel: '0', perks: '' });
      loadAll();
    } catch (e) { console.error(e); }
  }

  async function archivePlan(id: string) {
    await fetch(`/api/v1/membership/plans/${id}`, { method: 'DELETE' });
    loadAll();
  }

  function getStatusColor(status: string) {
    const map: Record<string, string> = {
      active: 'default', pending: 'yellow', past_due: 'orange',
      suspended: 'destructive', cancelled: 'secondary', expired: 'secondary',
      draft: 'secondary', paid: 'default', failed: 'destructive', void: 'secondary'
    };
    return (map[status] || 'default') as any;
  }

  if (loading) return <div className="p-6"><h1 className="text-3xl font-bold mb-4">Membership</h1><p>Loading...</p></div>;

  return (
    <div className="p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Membership & Subscriptions</h1>
        <p className="text-muted-foreground">Manage plans, subscriptions, and billing</p>
      </div>

      {/* Summary Cards */}
      {stats && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">MRR</CardTitle></CardHeader>
            <CardContent><div className="text-3xl font-bold text-green-600">£{stats.mrr.toFixed(0)}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">Active Subscribers</CardTitle></CardHeader>
            <CardContent><div className="text-3xl font-bold">{stats.activeSubscribers}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">Churn Rate</CardTitle></CardHeader>
            <CardContent><div className={`text-3xl font-bold ${stats.churnRate > 5 ? 'text-red-600' : ''}`}>{stats.churnRate}%</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">ARPU</CardTitle></CardHeader>
            <CardContent><div className="text-3xl font-bold">£{stats.arpu.toFixed(0)}</div></CardContent>
          </Card>
        </div>
      )}

      {/* Plans Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Plans</h2>
          <Button size="sm" onClick={() => setShowPlanForm(!showPlanForm)}>
            {showPlanForm ? 'Cancel' : '+ New Plan'}
          </Button>
        </div>

        {showPlanForm && (
          <Card className="mb-4">
            <CardContent className="pt-6">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium block mb-1">Name</label>
                  <input className="w-full rounded-md border p-2 text-sm bg-background" value={planForm.name} onChange={e => setPlanForm({...planForm, name: e.target.value})} />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Tier</label>
                  <input type="number" className="w-full rounded-md border p-2 text-sm bg-background" value={planForm.tier} onChange={e => setPlanForm({...planForm, tier: e.target.value})} />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Price / Month (£)</label>
                  <input type="number" className="w-full rounded-md border p-2 text-sm bg-background" value={planForm.priceMonthly} onChange={e => setPlanForm({...planForm, priceMonthly: e.target.value})} />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Booking Discount %</label>
                  <input type="number" className="w-full rounded-md border p-2 text-sm bg-background" value={planForm.bookingDiscountPercent} onChange={e => setPlanForm({...planForm, bookingDiscountPercent: e.target.value})} />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Support Level</label>
                  <input type="number" className="w-full rounded-md border p-2 text-sm bg-background" value={planForm.prioritySupportLevel} onChange={e => setPlanForm({...planForm, prioritySupportLevel: e.target.value})} />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Perks (JSON)</label>
                  <input className="w-full rounded-md border p-2 text-sm bg-background font-mono" value={planForm.perks} onChange={e => setPlanForm({...planForm, perks: e.target.value})} placeholder='["perk1","perk2"]' />
                </div>
              </div>
              <Button className="mt-4" onClick={createPlan}>Create Plan</Button>
            </CardContent>
          </Card>
        )}

        <div className="space-y-3">
          {plans.map(plan => (
            <Card key={plan.id}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">{plan.name}</span>
                      <Badge variant="outline">Tier {plan.tier}</Badge>
                      <Badge variant={getStatusColor(plan.status)}>{plan.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      £{plan.priceMonthly}/mo | {plan.bookingDiscountPercent}% discount | Level {plan.prioritySupportLevel} support | {plan._count.memberships} subscribers
                    </p>
                  </div>
                  <Button size="sm" variant="destructive" onClick={() => archivePlan(plan.id)}>Archive</Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {plans.length === 0 && (
            <Card><CardContent className="pt-6"><p className="text-center text-muted-foreground">No membership plans yet.</p></CardContent></Card>
          )}
        </div>
      </div>

      {/* Invoices Section */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Recent Invoices</h2>
        <div className="space-y-2">
          {invoices.map(inv => (
            <Card key={inv.id}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{inv.membership?.client?.fullName || 'Unknown'}</span>
                    <span className="text-muted-foreground">{inv.membership?.plan?.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span>£{inv.amount.toFixed(2)}</span>
                    <span className="text-muted-foreground">
                      {new Date(inv.periodStart).toLocaleDateString()} - {new Date(inv.periodEnd).toLocaleDateString()}
                    </span>
                    <Badge variant={getStatusColor(inv.status)}>{inv.status}</Badge>
                    {inv.paidAt && <span className="text-muted-foreground text-xs">Paid {new Date(inv.paidAt).toLocaleDateString()}</span>}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {invoices.length === 0 && (
            <Card><CardContent className="pt-6"><p className="text-center text-muted-foreground">No invoices yet.</p></CardContent></Card>
          )}
        </div>
      </div>
    </div>
  );
}
