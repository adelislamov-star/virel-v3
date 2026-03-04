// DYNAMIC PRICING MANAGEMENT
'use client';

import { useEffect, useState } from 'react';

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

  const [form, setForm] = useState({
    name: '', conditionType: 'day_of_week', conditionConfig: '{}',
    actionType: 'multiply', actionValue: '1.2', appliesTo: 'all', priority: '0'
  });

  const [calc, setCalc] = useState({
    modelId: '', startAt: '', durationHours: '2', basePrice: '300'
  });

  useEffect(() => { loadRules(); loadModels(); }, []);

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
      case 'add': return `+\u00a3${rule.actionValue}`;
      case 'set_minimum': return `min \u00a3${rule.actionValue}`;
      default: return rule.actionValue;
    }
  }

  const activeRules = rules.filter(r => r.status === 'active');
  const totalUplift = rules.reduce((s, r) => s + r.revenueImpact, 0);
  const totalApplied = rules.reduce((s, r) => s + r.timesApplied, 0);
  const inputClass = 'w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors duration-150';
  const labelClass = 'text-xs font-medium text-zinc-500 uppercase tracking-wider block mb-1.5';
  const selectClass = 'w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-zinc-200 focus:outline-none focus:border-zinc-600 transition-colors duration-150';

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">Dynamic Pricing</h1>
          <p className="text-sm text-zinc-500 mt-1">Loading...</p>
        </div>
        <div className="space-y-4 animate-pulse">
          <div className="grid grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-zinc-800/30 rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">Dynamic Pricing</h1>
          <p className="text-sm text-zinc-500 mt-1">Manage pricing rules and test calculations</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-900 text-sm font-medium transition-colors duration-150">
          {showForm ? 'Cancel' : '+ New Rule'}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-5">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Active Rules</p>
          <p className="text-2xl font-semibold text-zinc-100 mt-2">{activeRules.length}</p>
        </div>
        <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-5">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Total Revenue Uplift</p>
          <p className="text-2xl font-semibold text-emerald-400 mt-2">\u00a3{totalUplift.toFixed(0)}</p>
        </div>
        <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-5">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Total Times Applied</p>
          <p className="text-2xl font-semibold text-zinc-100 mt-2">{totalApplied}</p>
        </div>
      </div>
      {showForm && (
        <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-5 mb-6">
          <h3 className="text-sm font-semibold text-zinc-300 mb-4">New Pricing Rule</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div><label className={labelClass}>Name</label><input className={inputClass} value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
            <div><label className={labelClass}>Priority</label><input type="number" className={inputClass} value={form.priority} onChange={e => setForm({...form, priority: e.target.value})} /></div>
            <div><label className={labelClass}>Condition Type</label>
              <select className={selectClass} value={form.conditionType} onChange={e => setForm({...form, conditionType: e.target.value})}>
                <option value="day_of_week">Day of Week</option><option value="time_of_day">Time of Day</option><option value="advance_booking">Advance Booking</option><option value="season">Season</option><option value="demand">Demand</option>
              </select>
            </div>
            <div><label className={labelClass}>Condition Config (JSON)</label><textarea className={inputClass + ' font-mono'} rows={2} value={form.conditionConfig} onChange={e => setForm({...form, conditionConfig: e.target.value})} /></div>
            <div><label className={labelClass}>Action Type</label>
              <select className={selectClass} value={form.actionType} onChange={e => setForm({...form, actionType: e.target.value})}>
                <option value="multiply">Multiply</option><option value="add">Add</option><option value="set_minimum">Set Minimum</option>
              </select>
            </div>
            <div><label className={labelClass}>Action Value</label><input type="number" step="0.01" className={inputClass} value={form.actionValue} onChange={e => setForm({...form, actionValue: e.target.value})} /></div>
            <div><label className={labelClass}>Applies To</label>
              <select className={selectClass} value={form.appliesTo} onChange={e => setForm({...form, appliesTo: e.target.value})}>
                <option value="all">All</option><option value="model">Specific Model</option><option value="location">Specific Location</option>
              </select>
            </div>
            <div className="flex items-end"><button onClick={createRule} className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-900 text-sm font-medium transition-colors duration-150">Create Rule</button></div>
          </div>
        </div>
      )}

      <div className="space-y-3 mb-8">
        {rules.map(rule => (
          <div key={rule.id} className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-5">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-sm font-medium text-zinc-200">{rule.name}</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${rule.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'}`}>{rule.status}</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border border-zinc-700/50 text-zinc-500">{rule.conditionType.replace(/_/g, ' ')}</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border border-zinc-700/50 text-zinc-500">{formatAction(rule)}</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border border-zinc-700/50 text-zinc-500">{rule.appliesTo}</span>
                </div>
                <p className="text-xs text-zinc-500">Priority: {rule.priority} | Applied {rule.timesApplied}x | Impact: \u00a3{rule.revenueImpact.toFixed(2)}</p>
              </div>
              <div className="flex gap-2 ml-4 shrink-0">
                <button onClick={() => toggleRule(rule.id, rule.status)} className="px-3 py-1.5 rounded-lg border border-zinc-700 hover:border-zinc-600 text-zinc-300 text-xs font-medium transition-colors duration-150">{rule.status === 'active' ? 'Disable' : 'Enable'}</button>
                <button onClick={() => deleteRule(rule.id)} className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium border border-red-500/20 transition-colors duration-150">Delete</button>
              </div>
            </div>
          </div>
        ))}
        {rules.length === 0 && (
          <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-8 text-center"><p className="text-zinc-500">No pricing rules yet.</p></div>
        )}
      </div>
      <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-5">
        <h3 className="text-sm font-semibold text-zinc-300 mb-4">Price Calculator</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
          <div><label className={labelClass}>Model</label>
            <select className={selectClass} value={calc.modelId} onChange={e => setCalc({...calc, modelId: e.target.value})}>
              <option value="">Select...</option>
              {models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div><label className={labelClass}>Date & Time</label><input type="datetime-local" className={inputClass} value={calc.startAt} onChange={e => setCalc({...calc, startAt: e.target.value})} /></div>
          <div><label className={labelClass}>Duration (hrs)</label><input type="number" className={inputClass} value={calc.durationHours} onChange={e => setCalc({...calc, durationHours: e.target.value})} /></div>
          <div><label className={labelClass}>Base Price (\u00a3)</label><input type="number" className={inputClass} value={calc.basePrice} onChange={e => setCalc({...calc, basePrice: e.target.value})} /></div>
          <div className="flex items-end"><button onClick={calculatePrice} disabled={calcLoading} className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-900 text-sm font-medium transition-colors duration-150 disabled:opacity-50">{calcLoading ? 'Calculating...' : 'Calculate'}</button></div>
        </div>

        {calcResult && (
          <div className="rounded-lg border border-zinc-800/50 p-4 bg-zinc-800/20">
            <div className="flex gap-8 mb-4">
              <div><p className="text-xs text-zinc-500">Base Price</p><p className="text-xl font-semibold text-zinc-100">\u00a3{calcResult.basePrice}</p></div>
              <div><p className="text-xs text-zinc-500">Final Price</p><p className="text-xl font-semibold text-emerald-400">\u00a3{calcResult.finalPrice}</p></div>
              <div><p className="text-xs text-zinc-500">Difference</p><p className="text-xl font-semibold text-zinc-100">{calcResult.finalPrice > calcResult.basePrice ? '+' : ''}\u00a3{(calcResult.finalPrice - calcResult.basePrice).toFixed(2)}</p></div>
            </div>
            {calcResult.adjustments.length > 0 ? (
              <div className="space-y-1">
                <p className="text-xs font-semibold text-zinc-400 mb-2">Adjustments:</p>
                {calcResult.adjustments.map((adj, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-zinc-300">{adj.ruleName} ({adj.type} {adj.value})</span>
                    <span className={adj.effect >= 0 ? 'text-emerald-400' : 'text-red-400'}>{adj.effect >= 0 ? '+' : ''}\u00a3{adj.effect.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-zinc-500">No rules applied \u2014 base price unchanged.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
