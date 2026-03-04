// REVENUE LEAKAGE CONTROL
'use client';

import Link from 'next/link';

export default function RevenuLeakagePage() {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">Revenue Leakage Control</h1>
        <p className="text-sm text-zinc-500 mt-1">Track and prevent revenue loss</p>
      </div>

      <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-5">
        <h3 className="text-sm font-semibold text-zinc-300 mb-3">Coming in Phase 3</h3>
        <p className="text-sm text-zinc-500 mb-4">
          Revenue leakage tracking, root cause analysis, and automated alerts will be available in Phase 3.
        </p>
        <Link href="/admin/reports">
          <button className="px-4 py-2 rounded-lg border border-zinc-700 hover:border-zinc-600 text-zinc-300 hover:text-zinc-100 text-sm font-medium transition-colors duration-150">
            View Reports
          </button>
        </Link>
      </div>
    </div>
  );
}
