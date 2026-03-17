// LOGIN PAGE
'use client';

import { useState } from 'react';
import { siteConfig } from '@/../config/site';

export default function LoginPage() {
  const [email, setEmail] = useState('admin@virel.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (res.ok) {
      window.location.href = '/admin/models';
    } else {
      const data = await res.json();
      setError(data.error || 'Invalid email or password');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center">
      <div className="w-full max-w-md p-8 rounded-2xl border border-zinc-800/50 bg-zinc-900/50">
        <div className="text-center mb-8">
          <h1 className="text-sm font-semibold tracking-widest text-zinc-400 uppercase">{siteConfig.name}</h1>
          <p className="text-xs text-zinc-600 mt-1">Operations Platform v3</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider block mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors duration-150"
              required
            />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider block mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors duration-150"
              required
            />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-900 text-sm font-medium transition-colors duration-150 disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
