'use client'

import { useRouter, useSearchParams } from 'next/navigation'

const SORT_OPTIONS = [
  { label: 'Recommended', value: 'recommended' },
  { label: 'Newest', value: 'newest' },
  { label: 'Price ↑', value: 'price-asc' },
  { label: 'Price ↓', value: 'price-desc' },
]

export function SortTabs({ current }: { current: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function setSort(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value === 'recommended') {
      params.delete('sort')
    } else {
      params.set('sort', value)
    }
    params.delete('page')
    const qs = params.toString()
    router.push(`/companions${qs ? `?${qs}` : ''}`)
  }

  return (
    <div className="sort-tabs">
      {SORT_OPTIONS.map(o => (
        <button
          key={o.value}
          className={`sort-tab${current === o.value ? ' active' : ''}`}
          onClick={() => setSort(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
