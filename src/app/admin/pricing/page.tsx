// DYNAMIC PRICING MANAGEMENT
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type PricingRule = {
  id: string;
  name: string;
  status: string;
  priority: number;
  conditionType: string;
  conditionConfig: any;
  actionType: string;
  actionValue: number;
  appliesTo: string;
  scopeEntityId: string | null;
  timesApplied: number;
  revenueImpact: number;
};

type CalcResult = {
  finalPrice: number;
  basePrice: number;
  adjustments: { ruleName: string; type: string; value: number; effect: number }[];
};

export default function PricingPage() {
  const [rules, setRules] = useState<PricingRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [models, setModels] = useState<{ id: string; name: string }[]>([]);
  const [calcResult, setCalcResult] = useState<CalcResult | null>(null);
  const [calcLoading, setCalcLoading] = useState(false);

  // Form state
  const [form, setForm] = useState({
    name: '', conditionType: 'day_of_week', conditionConfig: '{}',
    actionType: 'multiply', actionValue: '1.2', appliesTo: 'all', priority: '0'
  });

  // Calculator state
  const [calc, setCalc] = useState({
    modelId: '', startAt: '', durationHours: '2', basePrice: '300'
  });

  useEffect(() => {
    loadRules();
    loadModels();
  }, []);

  async function loadRules() {
    try {
      const res = await fetch('/api/v1/pricing/rules');
      const data = await res.json();
      setRules(data.data?.rules || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function loadModels() {
    try {
      const res = await fetch('/api/v1/models?status=published&limit=100');
      const data = await res.json();
      setModels((data.data?.models || []).map((m: any) => ({ id: m.id, name: m.name })));
    } catch (e) { /* ignore */ }
  }

  async function createRule() {
    try {
      let parsedConfig;
      try { parsedConfig = JSON.parse(form.conditionConfig); } catch { alert('Invalid JSON in condition config'); return; }

      await fetch('/api/v1/pricing/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, conditionConfig: parsedConfig })
      });
      setShowForm(false);
      setForm({ name: '', conditionType: 'day_of_week', conditionConfig: '{}', actionType: 'multiply', actionValue: '1.2', appliesTo: 'all', priority: '0' });
      loadRules();
    } catch (e) { console.error(e); }
  }

  async function toggleRule(id: string, currentStatus: string) {
    const newStatus = currentStatus === 'active' ? 'disabled' : 'active';
    await fetch(`/api/v1/pricing/rules/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    loadRules();
  }

  async function deleteRule(id: string) {
    await fetch(`/api/v1/pricing/rules/${id}`, { method: 'DELETE' });
    loadRules();
  }

  async function calculatePrice() {
    if (!calc.modelId || !calc.startAt) return;
    setCalcLoading(true);
    try {
      const res = await fetch('/api/v1/pricing/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(calc)
      });
      const data = await res.json();
      setCalcResult(data.data);
    } catch (e) { console.error(e); }
    setCalcLoading(false);
  }

  function formatAction(rule: PricingRule) {
    switch (rule.actionType) {
      case 'multiply': return `x${rule.actionValue}`;
      case 'add': return `+£${rule.actionValue}`;
      case 'set_minimum': return `min £${rule.actionValue}`;
      default: return rule.actionValue;
    }
  }

  const activeRules = rules.filter(r => r.status === 'active');
  const totalUplift = rules.reduce((s, r) => s + r.revenueImpact, 0);
  const totalApplied = rules.reduce((s, r) => s + r.timesApplied, 0);

  if (loading) return <div className="p-6"><h1 className="text-3xl font-bold mb-4">Dynamic Pricing</h1><p>Loading...</p></div>;

  return (
    <div className="p-6 max-w-7xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dynamic Pricing</h1>
          <p className="text-muted-foreground">Manage pricing rules and test calculations</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ New Rule'}
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Active Rules</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">{activeRules.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Total Revenue Uplift</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold text-green-600">£{totalUplift.toFixed(0)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Total Times Applied</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">{totalApplied}</div></CardContent>
        </Card>
      </div>

      {/* Create Rule Form */}
      {showForm && (
        <Card className="mb-6">
          <CardHeader><CardTitle>New Pricing Rule</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium block mb-1">Name</label>
                <input className="w-full rounded-md border p-2 text-sm bg-background" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Priority</label>
                <input type="number" className="w-full rounded-md border p-2 text-sm bg-background" value={form.priority} onChange={e => setForm({...form, priority: e.target.value})} />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Condition Type</label>
                <select className="w-full rounded-md border p-2 text-sm bg-background" value={form.conditionType} onChange={e => setForm({...form, conditionType: e.target.value})}>
                  <option value="day_of_week">Day of Week</option>
                  <option value="time_of_day">Time of Day</option>
                  <option value="advance_booking">Advance Booking</option>
                  <option value="season">Season</option>
                  <option value="demand">Demand</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Condition Config (JSON)</label>
                <textarea className="w-full rounded-md border p-2 text-sm bg-background font-mono" rows={2} value={form.conditionConfig} onChange={e => setForm({...form, conditionConfig: e.target.value})} />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Action Type</label>
                <select className="w-full rounded-md border p-2 text-sm bg-background" value={form.actionType} onChange={e => setForm({...form, actionType: e.target.value})}>
                  <option value="multiply">Multiply</option>
                  <option value="add">Add</option>
                  <option value="set_minimum">Set Minimum</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Action Value</label>
                <input type="number" step="0.01" className="w-full rounded-md border p-2 text-sm bg-background" value={form.actionValue} onChange={e => setForm({...form, actionValue: e.target.value})} />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Applies To</label>
                <select className="w-full rounded-md border p-2 text-sm bg-background" value={form.appliesTo} onChange={e => setForm({...form, appliesTo: e.target.value})}>
                  <option value="all">All</option>
                  <option value="model">Specific Model</option>
                  <option value="location">Specific Location</option>
                </select>
              </div>
              <div className="flex items-end">
                <Button onClick={createRule}>Create Rule</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rules List */}
      <div className="space-y-3 mb-8">
        {rules.map(rule => (
          <Card key={rule.id}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold">{rule.name}</span>
                    <Badge variant={rule.status === 'active' ? 'default' : 'secondary'}>{rule.status}</Badge>
                    <Badge variant="outline">{rule.conditionType.replace(/_/g, ' ')}</Badge>
                    <Badge variant="outline">{formatAction(rule)}</Badge>
                    <Badge variant="outline">{rule.appliesTo}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Priority: {rule.priority} | Applied {rule.timesApplied}x | Impact: £{rule.revenueImpact.toFixed(2)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => toggleRule(rule.id, rule.status)}>
                    {rule.status === 'active' ? 'Disable' : 'Enable'}
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => deleteRule(rule.id)}>Delete</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {rules.length === 0 && (
          <Card><CardContent className="pt-6"><p className="text-center text-muted-foreground">No pricing rules yet.</p></CardContent></Card>
        )}
      </div>

      {/* Price Calculator */}
      <Card>
        <CardHeader><CardTitle>Price Calculator</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
            <div>
              <label className="text-sm font-medium block mb-1">Model</label>
              <select className="w-full rounded-md border p-2 text-sm bg-background" value={calc.modelId} onChange={e => setCalc({...calc, modelId: e.target.value})}>
                <option value="">Select...</option>
                {models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Date & Time</label>
              <input type="datetime-local" className="w-full rounded-md border p-2 text-sm bg-background" value={calc.startAt} onChange={e => setCalc({...calc, startAt: e.target.value})} />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Duration (hrs)</label>
              <input type="number" className="w-full rounded-md border p-2 text-sm bg-background" value={calc.durationHours} onChange={e => setCalc({...calc, durationHours: e.target.value})} />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Base Price (£)</label>
              <input type="number" className="w-full rounded-md border p-2 text-sm bg-background" value={calc.basePrice} onChange={e => setCalc({...calc, basePrice: e.target.value})} />
            </div>
            <div className="flex items-end">
              <Button onClick={calculatePrice} disabled={calcLoading}>
                {calcLoading ? 'Calculating...' : 'Calculate'}
              </Button>
            </div>
          </div>

          {calcResult && (
            <div className="border rounded-md p-4 bg-muted/50">
              <div className="flex gap-8 mb-4">
                <div>
                  <p className="text-sm text-muted-foreground">Base Price</p>
                  <p className="text-xl font-bold">£{calcResult.basePrice}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Final Price</p>
                  <p className="text-xl font-bold text-green-600">£{calcResult.finalPrice}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Difference</p>
                  <p className="text-xl font-bold">{calcResult.finalPrice > calcResult.basePrice ? '+' : ''}£{(calcResult.finalPrice - calcResult.basePrice).toFixed(2)}</p>
                </div>
              </div>
              {calcResult.adjustments.length > 0 ? (
                <div className="space-y-1">
                  <p className="text-sm font-semibold mb-2">Adjustments:</p>
                  {calcResult.adjustments.map((adj, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span>{adj.ruleName} ({adj.type} {adj.value})</span>
                      <span className={adj.effect >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {adj.effect >= 0 ? '+' : ''}£{adj.effect.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No rules applied — base price unchanged.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
