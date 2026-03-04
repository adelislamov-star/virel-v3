// MODELS LIST PAGE
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const statusStyles: Record<string, string> = {
  active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  draft: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  published: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  suspended: 'bg-red-500/10 text-red-400 border-red-500/20',
};

export default function ModelsPage() {
  const [models, setModels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => { loadModels(); }, []);
  
  async function loadModels() {
    try {
      const res = await fetch('/api/v1/models');
      const data = await res.json();
      setModels(data.data?.models || []);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load models:', error);
      setLoading(false);
    }
  }
  
  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">Models</h1>
          <p className="text-sm text-zinc-500 mt-1">Loading...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
          {[...Array(6)].map((_, i) => <div key={i} className="h-40 bg-zinc-800/30 rounded-xl" />)}
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">Models</h1>
          <p className="text-sm text-zinc-500 mt-1">{models.length} total models</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/quick-upload"
            className="px-4 py-2 rounded-lg border border-zinc-700 hover:border-zinc-600 text-zinc-300 hover:text-zinc-100 text-sm font-medium transition-colors duration-150"
          >
            Quick Upload
          </Link>
          <Link href="/admin/models/new"
            className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-900 text-sm font-medium transition-colors duration-150"
          >
            + Add Model
          </Link>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {models.map(model => (
          <div key={model.id} className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-5 hover:bg-zinc-800/30 transition-colors duration-100">
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold text-lg text-zinc-100">{model.name}</h3>
                <p className="text-xs text-zinc-500">{model.publicCode}</p>
              </div>
              
              <div className="flex gap-2">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${statusStyles[model.status] || statusStyles.draft}`}>
                  {model.status}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border border-zinc-700/50 text-zinc-500">
                  {model.visibility}
                </span>
              </div>
              
              {model.ratingInternal && (
                <div className="text-sm text-zinc-400">
                  Internal Rating: <span className="font-semibold text-zinc-200">{model.ratingInternal}/5</span>
                </div>
              )}
              
              <button
                onClick={() => window.location.href = `/admin/models/${model.id}`}
                className="w-full px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-900 text-sm font-medium transition-colors duration-150"
              >
                Edit Profile
              </button>
            </div>
          </div>
        ))}
        
        {models.length === 0 && (
          <div className="col-span-full rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-8 text-center">
            <p className="text-zinc-500">No models found</p>
          </div>
        )}
      </div>
    </div>
  );
}
