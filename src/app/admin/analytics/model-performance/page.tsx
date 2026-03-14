'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';

type RawModel = {
  id: string;
  name: string;
  status: string;
  modelRiskIndex: string;
  dataCompletenessScore: number;
  stats: { age: number | null } | null;
  primaryLocation: { title: string } | null;
  media?: { url: string; isPrimary: boolean; type: string }[];
};

type Model = {
  id: string;
  name: string;
  photoUrl: string | null;
  status: string;
  modelRiskIndex: string;
  dataCompletenessScore: number;
  age: number | null;
  city: string | null;
};

const statusStyles: Record<string, string> = {
  active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  published: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  vacation: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  archived: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  draft: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
};

const riskStyles: Record<string, string> = {
  green: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  yellow: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  red: 'bg-red-500/10 text-red-400 border-red-500/20',
};

export default function ModelPerformancePage() {
  const router = useRouter();
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Stats
  const [stats, setStats] = useState({ total: 0, active: 0, avgCompleteness: 0, redRisk: 0 });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams({ all: 'true' });

      const res = await fetch(`/api/v1/models?${params}`);
      const json = await res.json();
      if (json.success) {
        const rawList: RawModel[] = json.data?.models || json.models || [];

        // Map raw data to flat Model type
        let list: Model[] = rawList.map((r) => ({
          id: r.id,
          name: r.name,
          status: r.status,
          modelRiskIndex: r.modelRiskIndex,
          dataCompletenessScore: r.dataCompletenessScore,
          age: r.stats?.age ?? null,
          city: r.primaryLocation?.title ?? null,
          photoUrl: r.media?.find((m) => m.isPrimary && m.type === 'photo')?.url
            || r.media?.find((m) => m.type === 'photo')?.url
            || null,
        }));

        // Client-side filters
        if (statusFilter) {
          list = list.filter((m) => m.status === statusFilter);
        }

        // Client-side filters
        if (search) {
          const q = search.toLowerCase();
          list = list.filter((m) => m.name.toLowerCase().includes(q));
        }
        if (riskFilter) {
          list = list.filter((m) => m.modelRiskIndex === riskFilter);
        }

        // Sort by completeness desc
        list.sort((a, b) => (b.dataCompletenessScore ?? 0) - (a.dataCompletenessScore ?? 0));

        // Compute stats from full list
        const activeCount = list.filter((m) => m.status === 'active' || m.status === 'published').length;
        const scores = list.map((m) => m.dataCompletenessScore ?? 0);
        const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
        const redCount = list.filter((m) => m.modelRiskIndex === 'red').length;

        setStats({ total: list.length, active: activeCount, avgCompleteness: avgScore, redRisk: redCount });
        setModels(list);
      } else {
        setError(json.error?.message || 'Failed to load models');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, riskFilter, search]);

  useEffect(() => { load(); }, [load]);

  const handleSearch = (val: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setSearch(val), 300);
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-white">Model Performance</h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Models', value: stats.total, color: 'text-white' },
          { label: 'Active Models', value: stats.active, color: 'text-emerald-400' },
          { label: 'Avg Completeness', value: `${stats.avgCompleteness}%`, color: 'text-blue-400' },
          { label: 'Red Risk', value: stats.redRisk, color: 'text-red-400' },
        ].map((s) => (
          <div key={s.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <div className="text-xs text-zinc-500 mb-1">{s.label}</div>
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search by name..."
          onChange={(e) => handleSearch(e.target.value)}
          className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 w-72 focus:outline-none focus:border-zinc-500"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200"
        >
          <option value="">All Status</option>
          <option value="published">Active / Published</option>
          <option value="vacation">Vacation</option>
          <option value="archived">Archived</option>
          <option value="draft">Draft</option>
        </select>
        <select
          value={riskFilter}
          onChange={(e) => setRiskFilter(e.target.value)}
          className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200"
        >
          <option value="">All Risk</option>
          <option value="green">Green</option>
          <option value="yellow">Yellow</option>
          <option value="red">Red</option>
        </select>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400 text-sm">{error}</div>
      )}

      {/* Leaderboard Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400 text-left">
                <th className="px-4 py-3 font-medium w-12">Rank</th>
                <th className="px-4 py-3 font-medium">Model</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Risk Index</th>
                <th className="px-4 py-3 font-medium">Completeness</th>
                <th className="px-4 py-3 font-medium">Age</th>
                <th className="px-4 py-3 font-medium">City</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-zinc-500">Loading...</td></tr>
              )}
              {!loading && models.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-zinc-500">No models found</td></tr>
              )}
              {!loading && models.map((m, idx) => (
                <tr key={m.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/50 transition-colors">
                  <td className="px-4 py-3 text-zinc-500 font-medium">{idx + 1}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {m.photoUrl ? (
                        <img src={m.photoUrl} alt="" className="w-8 h-8 rounded-full object-cover bg-zinc-700" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-zinc-400 text-xs font-bold">
                          {m.name.charAt(0)}
                        </div>
                      )}
                      <span className="text-zinc-200 font-medium">{m.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs border ${statusStyles[m.status] ?? 'bg-zinc-700 text-zinc-300 border-zinc-600'}`}>
                      {m.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {m.modelRiskIndex ? (
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs border ${riskStyles[m.modelRiskIndex] ?? 'bg-zinc-700 text-zinc-300 border-zinc-600'}`}>
                        {m.modelRiskIndex}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-zinc-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            (m.dataCompletenessScore ?? 0) >= 80 ? 'bg-emerald-500' :
                            (m.dataCompletenessScore ?? 0) >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${m.dataCompletenessScore ?? 0}%` }}
                        />
                      </div>
                      <span className="text-xs text-zinc-400">{m.dataCompletenessScore ?? 0}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-zinc-400">{m.age ?? '—'}</td>
                  <td className="px-4 py-3 text-zinc-400">{m.city ?? '—'}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => router.push(`/admin/models/${m.id}`)}
                      className="px-3 py-1 text-xs rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-700 transition-colors"
                    >
                      View Profile
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
