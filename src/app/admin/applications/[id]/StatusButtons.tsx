'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const STATUSES = ['new', 'reviewing', 'approved', 'rejected']

const colors: Record<string, string> = {
  new: 'bg-blue-600',
  reviewing: 'bg-yellow-500',
  approved: 'bg-green-600',
  rejected: 'bg-red-600',
}

export function StatusButtons({ id, current }: { id: string; current: string }) {
  const [status, setStatus] = useState(current)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const change = async (s: string) => {
    if (s === status) return
    setLoading(true)
    await fetch(`/api/applications/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: s }),
    })
    setStatus(s)
    setLoading(false)
    router.refresh()
  }

  return (
    <div className="flex gap-2">
      {STATUSES.map(s => (
        <button
          key={s}
          onClick={() => change(s)}
          disabled={loading}
          className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all capitalize ${
            status === s
              ? `${colors[s]} text-white`
              : 'border border-border hover:bg-muted'
          }`}
        >
          {s}
        </button>
      ))}
    </div>
  )
}
