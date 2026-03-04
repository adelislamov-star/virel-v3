// INQUIRIES LIST PAGE
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const statusStyles: Record<string, string> = {
  new: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  qualified: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  awaiting_client: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  awaiting_deposit: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  converted: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  lost: 'bg-red-500/10 text-red-400 border-red-500/20',
  spam: 'bg-red-500/10 text-red-400 border-red-500/20',
};

export default function InquiriesPage() {
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => { loadInquiries(); }, []);
  
  async function loadInquiries() {
    try {
      const res = await fetch('/api/v1/inquiries?limit=50');
      const data = await res.json();
      setInquiries(data.data?.inquiries || []);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load inquiries:', error);
      setLoading(false);
    }
  }
  
  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">Inquiries</h1>
          <p className="text-sm text-zinc-500 mt-1">Loading...</p>
        </div>
        <div className="space-y-3 animate-pulse">
          {[...Array(5)].map((_, i) => <div key={i} className="h-24 bg-zinc-800/30 rounded-xl" />)}
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">Inquiries</h1>
        <p className="text-sm text-zinc-500 mt-1">{inquiries.length} total inquiries</p>
      </div>
      
      <div className="space-y-3">
        {inquiries.map(inquiry => (
          <div key={inquiry.id} className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-5 hover:bg-zinc-800/30 transition-colors duration-100">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${statusStyles[inquiry.status] || 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'}`}>
                    {inquiry.status}
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border border-zinc-700/50 text-zinc-500">
                    {inquiry.priority}
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border bg-purple-500/10 text-purple-400 border-purple-500/20">
                    {inquiry.source}
                  </span>
                </div>
                
                <h3 className="text-sm font-medium text-zinc-200 mb-1">
                  {inquiry.subject || 'No subject'}
                </h3>
                
                <div className="text-xs text-zinc-500 space-y-0.5">
                  {inquiry.client && <p>{inquiry.client.fullName}</p>}
                  {inquiry.requestedLocation && <p>{inquiry.requestedLocation.title}</p>}
                  {inquiry.message && <p className="line-clamp-2">{inquiry.message}</p>}
                  <p>{new Date(inquiry.createdAt).toLocaleString()}</p>
                </div>
              </div>
              
              <Link href={`/admin/inquiries/${inquiry.id}`}>
                <button className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-900 text-xs font-medium transition-colors duration-150">
                  View
                </button>
              </Link>
            </div>
          </div>
        ))}
        
        {inquiries.length === 0 && (
          <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-8 text-center">
            <p className="text-zinc-500">No inquiries found</p>
          </div>
        )}
      </div>
    </div>
  );
}
