// MEMBERSHIP & SUBSCRIPTIONS
'use client';

import { useEffect, useState } from 'react';

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

type Stats = { mrr: number; activeSubscribers: number; churnRate: number; arpu: number };

const statusStyles: Record<string, string> = {
  active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  past_due: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  suspended: 'bg-red-500/10 text-red-400 border-red-500/20',
  cancelled: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  expired: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  draft: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  paid: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  failed: 'bg-red-500/10 text-red-400 border-red-500/20',
  void: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
};

export default function MembershipPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
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
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function createPlan() {
    try {
      await fetch('/api/v1/membership/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...planForm, perks: planForm.perks ? JSON.parse(planForm.perks) : null })
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

  const inputClass = 'w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors duration-150';
  const labelClass = 'text-xs font-medium text-zinc-500 uppercase tracking-wider block mb-1.5';
  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">Membership & Subscriptions</h1>
          <p className="text-sm text-zinc-500 mt-1">Loading...</p>
        </div>
        <div className="space-y-4 animate-pulse">
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-zinc-800/30 rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">Membership & Subscriptions</h1>
        <p className="text-sm text-zinc-500 mt-1">Manage plans, subscriptions, and billing</p>
      </div>

      {stats && (
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-5">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">MRR</p>
            <p className="text-2xl font-semibold text-emerald-400 mt-2">\u00a3{stats.mrr.toFixed(0)}</p>
          </div>
          <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-5">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Active Subscribers</p>
            <p className="text-2xl font-semibold text-zinc-100 mt-2">{stats.activeSubscribers}</p>
          </div>
          <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-5">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Churn Rate</p>
            <p className={`text-2xl font-semibold mt-2 ${stats.churnRate > 5 ? 'text-red-400' : 'text-zinc-100'}`}>{stats.churnRate}%</p>
          </div>
          <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-5">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">ARPU</p>
            <p className="text-2xl font-semibold text-zinc-100 mt-2">\u00a3{stats.arpu.toFixed(0)}</p>
          </div>
        </div>
      )}

      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Plans</h2>
          <button onClick={() => setShowPlanForm(!showPlanForm)} className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-900 text-xs font-medium transition-colors duration-150">{showPlanForm ? 'Cancel' : '+ New Plan'}</button>
        </div>

        {showPlanForm && (
          <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-5 mb-4">
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div><label className={labelClass}>Name</label><input className={inputClass} value={planForm.name} onChange={e => setPlanForm({...planForm, name: e.target.value})} /></div>
              <div><label className={labelClass}>Tier</label><input type="number" className={inputClass} value={planForm.tier} onChange={e => setPlanForm({...planForm, tier: e.target.value})} /></div>
              <div><label className={labelClass}>Price / Month (\u00a3)</label><input type="number" className={inputClass} value={planForm.priceMonthly} onChange={e => setPlanForm({...planForm, priceMonthly: e.target.value})} /></div>
              <div><label className={labelClass}>Booking Discount %</label><input type="number" className={inputClass} value={planForm.bookingDiscountPercent} onChange={e => setPlanForm({...planForm, bookingDiscountPercent: e.target.value})} /></div>
              <div><label className={labelClass}>Support Level</label><input type="number" className={inputClass} value={planForm.prioritySupportLevel} onChange={e => setPlanForm({...planForm, prioritySupportLevel: e.target.value})} /></div>
              <div><label className={labelClass}>Perks (JSON)</label><input className={inputClass + ' font-mono'} value={planForm.perks} onChange={e => setPlanForm({...planForm, perks: e.target.value})} placeholder='["perk1","perk2"]' /></div>
            </div>
            <button onClick={createPlan} className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-900 text-sm font-medium transition-colors duration-150">Create Plan</button>
          </div>
        )}
        <div className="space-y-3">
          {plans.map(plan => (
            <div key={plan.id} className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-zinc-200">{plan.name}</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border border-zinc-700/50 text-zinc-500">Tier {plan.tier}</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${statusStyles[plan.status] || statusStyles.draft}`}>{plan.status}</span>
                  </div>
                  <p className="text-xs text-zinc-500">\u00a3{plan.priceMonthly}/mo | {plan.bookingDiscountPercent}% discount | Level {plan.prioritySupportLevel} support | {plan._count.memberships} subscribers</p>
                </div>
                <button onClick={() => archivePlan(plan.id)} className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium border border-red-500/20 transition-colors duration-150">Archive</button>
              </div>
            </div>
          ))}
          {plans.length === 0 && (
            <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-8 text-center"><p className="text-zinc-500">No membership plans yet.</p></div>
          )}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-4">Recent Invoices</h2>
        <div className="space-y-2">
          {invoices.map(inv => (
            <div key={inv.id} className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 px-5 py-3">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                  <span className="font-medium text-zinc-200">{inv.membership?.client?.fullName || 'Unknown'}</span>
                  <span className="text-zinc-500">{inv.membership?.plan?.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-zinc-300">\u00a3{inv.amount.toFixed(2)}</span>
                  <span className="text-zinc-500 text-xs">{new Date(inv.periodStart).toLocaleDateString()} - {new Date(inv.periodEnd).toLocaleDateString()}</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${statusStyles[inv.status] || statusStyles.draft}`}>{inv.status}</span>
                  {inv.paidAt && <span className="text-zinc-600 text-xs">Paid {new Date(inv.paidAt).toLocaleDateString()}</span>}
                </div>
              </div>
            </div>
          ))}
          {invoices.length === 0 && (
            <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-8 text-center"><p className="text-zinc-500">No invoices yet.</p></div>
          )}
        </div>
      </div>
    </div>
  );
}
