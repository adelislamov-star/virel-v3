'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

interface District {
  id: string
  name: string
  slug: string
}

interface Props {
  districts: District[]
  currentFilters: {
    hairColor?: string
    nationality?: string
    districtId?: string
    availability?: string
    minPrice?: string
    maxPrice?: string
    age?: string
    service?: string
    sort?: string
  }
}

const HAIR_COLORS = ['Blonde', 'Brunette', 'Redhead', 'Dark']
const PRICE_RANGES = [
  { label: 'Under £300', min: '0', max: '300' },
  { label: '£300–500', min: '300', max: '500' },
  { label: '£500–800', min: '500', max: '800' },
  { label: '£800+', min: '800', max: undefined },
]
const AGE_RANGES = [
  { label: '18–24', value: '18-24' },
  { label: '25–30', value: '25-30' },
  { label: '30+', value: '30plus' },
]
const NATIONALITIES = [
  'Brazilian', 'Eastern European', 'British', 'Italian',
  'French', 'Spanish', 'Colombian', 'Other',
]
const DISTRICT_NAMES = [
  'Mayfair', 'Knightsbridge', 'Chelsea', 'Kensington',
  'Belgravia', 'Notting Hill', 'Marylebone', 'Soho', 'Earls Court',
]

function FilterGroup({ title, defaultOpen = false, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
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

export function CompanionFilters({ districts, currentFilters }: Props) {
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
      if (max) params.set('maxPrice', max); else params.delete('maxPrice')
    }
    params.delete('page')
    router.push(`/companions?${params.toString()}`)
  }

  function clearAll() {
    router.push('/companions')
  }

  const hasFilters = Object.values(currentFilters).some(v => v && v !== 'recommended')

  const districtOptions = DISTRICT_NAMES.map(name => {
    const match = districts.find(d => d.name.toLowerCase() === name.toLowerCase())
    return match ? { id: match.id, name: match.name } : null
  }).filter(Boolean) as { id: string; name: string }[]

  return (
    <aside className="sidebar">
      {/* Header */}
      <div className="sb-header">
        <span className="sb-header-label">Filter</span>
        {hasFilters && (
          <button className="sb-clear-top" onClick={clearAll}>Clear all</button>
        )}
      </div>

      {/* Availability — open by default */}
      <FilterGroup title="Availability" defaultOpen>
        <button
          className={`sb-option${currentFilters.availability === 'available-now' ? ' active' : ''}`}
          onClick={() => setFilter('availability', currentFilters.availability === 'available-now' ? undefined : 'available-now')}
        >
          {currentFilters.availability === 'available-now' ? '☑ ' : '☐ '}Available Now
        </button>
      </FilterGroup>

      {/* Price */}
      <FilterGroup title="Price per hour">
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

      {/* Nationality */}
      <FilterGroup title="Nationality">
        {NATIONALITIES.map(n => {
          const isActive = currentFilters.nationality?.toLowerCase() === n.toLowerCase()
          return (
            <button
              key={n}
              className={`sb-option${isActive ? ' active' : ''}`}
              onClick={() => setFilter('nationality', isActive ? undefined : n)}
            >
              {isActive ? '☑ ' : '☐ '}{n}
            </button>
          )
        })}
      </FilterGroup>

      {/* Hair Colour */}
      <FilterGroup title="Hair Colour">
        {HAIR_COLORS.map(h => {
          const isActive = currentFilters.hairColor?.toLowerCase() === h.toLowerCase()
          return (
            <button
              key={h}
              className={`sb-option${isActive ? ' active' : ''}`}
              onClick={() => setFilter('hairColor', isActive ? undefined : h)}
            >
              {isActive ? '☑ ' : '☐ '}{h}
            </button>
          )
        })}
      </FilterGroup>

      {/* District */}
      <FilterGroup title="District">
        {districtOptions.map(d => {
          const isActive = currentFilters.districtId === d.id
          return (
            <button
              key={d.id}
              className={`sb-option${isActive ? ' active' : ''}`}
              onClick={() => setFilter('districtId', isActive ? undefined : d.id)}
            >
              {isActive ? '☑ ' : '☐ '}{d.name}
            </button>
          )
        })}
      </FilterGroup>

      {/* Age */}
      <FilterGroup title="Age">
        {AGE_RANGES.map(a => {
          const isActive = currentFilters.age === a.value
          return (
            <button
              key={a.value}
              className={`sb-option${isActive ? ' active' : ''}`}
              onClick={() => setFilter('age', isActive ? undefined : a.value)}
            >
              {isActive ? '☑ ' : '☐ '}{a.label}
            </button>
          )
        })}
      </FilterGroup>
    </aside>
  )
}
