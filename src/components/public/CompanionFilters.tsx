'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

interface District {
  id: string
  name: string
  slug: string
}

interface Experience {
  slug: string
  label: string
}

interface Props {
  districts: District[]
  nationalities: string[]
  hairColors: string[]
  experiences: Experience[]
  ageRanges: { label: string; value: string }[]
  currentFilters: {
    hairColor?: string
    nationality?: string
    districtId?: string
    availability?: string
    minPrice?: string
    maxPrice?: string
    service?: string
    age?: string
    sort?: string
  }
}

const PRICE_RANGES = [
  { label: '£250–400', min: '250', max: '400' },
  { label: '£400–600', min: '400', max: '600' },
  { label: '£600+',   min: '600', max: undefined },
]

function FilterGroup({
  title,
  defaultOpen = false,
  children,
}: {
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="fg">
      <button className="fg-header" onClick={() => setOpen(!open)}>
        <span className="sb-label">{title}</span>
        <span className={`fg-chevron${open ? ' open' : ''}`}>›</span>
      </button>
      {open && <div className="fg-body">{children}</div>}
    </div>
  )
}

export function CompanionFilters({ districts, nationalities, hairColors, experiences, ageRanges, currentFilters }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function setFilter(key: string, value: string | undefined) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    params.delete('page')
    const qs = params.toString()
    router.push(`/companions${qs ? `?${qs}` : ''}`)
  }

  function setPriceFilter(min: string, max: string | undefined) {
    const params = new URLSearchParams(searchParams.toString())
    const isActive = currentFilters.minPrice === min
    if (isActive) {
      params.delete('minPrice')
      params.delete('maxPrice')
    } else {
      params.set('minPrice', min)
      if (max) params.set('maxPrice', max)
      else params.delete('maxPrice')
    }
    params.delete('page')
    router.push(`/companions?${params.toString()}`)
  }

  function clearAll() {
    router.push('/companions')
  }

  const hasFilters = Object.values(currentFilters).some(v => v && v !== 'recommended')

  return (
    <aside className="sidebar">
      {/* Header */}
      <div className="sb-header">
        <span className="sb-header-label">Filter</span>
        {hasFilters && (
          <button className="sb-clear-top" onClick={clearAll}>Clear all</button>
        )}
      </div>

      {/* 1. Location */}
      <FilterGroup title="Location">
        {districts.map(d => {
          const isActive = currentFilters.districtId === d.id
          return (
            <button
              key={d.id}
              className={`sb-option${isActive ? ' active' : ''}`}
              onClick={() => setFilter('districtId', isActive ? undefined : d.id)}
            >
              {d.name}
            </button>
          )
        })}
      </FilterGroup>

      {/* 2. Rate */}
      <FilterGroup title="Rate">
        <div className="sb-chips">
          {PRICE_RANGES.map(r => (
            <button
              key={r.label}
              className={`sb-chip${currentFilters.minPrice === r.min ? ' active' : ''}`}
              onClick={() => setPriceFilter(r.min, r.max)}
            >
              {r.label}
            </button>
          ))}
        </div>
      </FilterGroup>

      {/* 3. Experience — from DB, only if data exists */}
      {experiences.length > 0 && (
        <FilterGroup title="Experience">
          {experiences.map(e => {
            const isActive = currentFilters.service === e.slug
            return (
              <button
                key={e.slug}
                className={`sb-option${isActive ? ' active' : ''}`}
                onClick={() => setFilter('service', isActive ? undefined : e.slug)}
              >
                {e.label}
              </button>
            )
          })}
        </FilterGroup>
      )}

      {/* 4. Origin — from DB, only if data exists */}
      {nationalities.length > 0 && (
        <FilterGroup title="Origin">
          {nationalities.map(n => {
            const isActive = currentFilters.nationality?.toLowerCase() === n.toLowerCase()
            return (
              <button
                key={n}
                className={`sb-option${isActive ? ' active' : ''}`}
                onClick={() => setFilter('nationality', isActive ? undefined : n)}
              >
                {n}
              </button>
            )
          })}
        </FilterGroup>
      )}

      {/* 5. Hair — from DB, only if data exists */}
      {hairColors.length > 0 && (
        <FilterGroup title="Hair">
          {hairColors.map(h => {
            const isActive = currentFilters.hairColor?.toLowerCase() === h.toLowerCase()
            return (
              <button
                key={h}
                className={`sb-option${isActive ? ' active' : ''}`}
                onClick={() => setFilter('hairColor', isActive ? undefined : h)}
              >
                {h}
              </button>
            )
          })}
        </FilterGroup>
      )}

      {/* 6. Age — from DB, only if data exists */}
      {ageRanges.length > 0 && (
        <FilterGroup title="Age">
          {ageRanges.map(a => {
            const isActive = currentFilters.age === a.value
            return (
              <button
                key={a.value}
                className={`sb-option${isActive ? ' active' : ''}`}
                onClick={() => setFilter('age', isActive ? undefined : a.value)}
              >
                {a.label}
              </button>
            )
          })}
        </FilterGroup>
      )}

      {/* 7. Tonight — last */}
      <FilterGroup title="Tonight">
        <button
          className={`sb-option${currentFilters.availability === 'available-now' ? ' active' : ''}`}
          onClick={() => setFilter('availability', currentFilters.availability === 'available-now' ? undefined : 'available-now')}
        >
          Available now
        </button>
      </FilterGroup>
    </aside>
  )
}
