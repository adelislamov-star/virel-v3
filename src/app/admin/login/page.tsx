'use client';
import { useState } from 'react';
import { siteConfig } from '@/../config/site';

export default function LoginPage() {
  const [email, setEmail] = useState('admin@vaurel.co.uk');
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
    <div className="relative min-h-screen w-full flex items-center justify-end pr-24">
      <img
        src="/cat.jpeg"
        alt=""
        className="absolute inset-0 w-full h-full object-cover object-center"
      />
      <div className="absolute inset-0 bg-gradient-to-l from-black/80 via-black/20 to-transparent" />
      <div className="relative z-10 w-full max-w-xs">
        <p className="text-xs tracking-[0.3em] text-white/40 uppercase mb-1">{siteConfig.name}</p>
        <h1 className="text-2xl font-light text-white mb-8">Welcome back</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full bg-transparent border-b border-white/20 text-white text-sm py-2 placeholder-white/30 focus:outline-none focus:border-white/60 transition-colors"
            required
          />
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full bg-transparent border-b border-white/20 text-white text-sm py-2 placeholder-white/30 focus:outline-none focus:border-white/60 transition-colors"
            required
          />
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 py-2.5 text-sm font-medium tracking-widest uppercase bg-amber-500 hover:bg-amber-400 text-black transition-colors disabled:opacity-50"
          >
            {loading ? '...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
