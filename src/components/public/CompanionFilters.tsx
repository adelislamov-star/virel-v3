'use client'

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
  { label: '£300–£500', min: '300', max: '500' },
  { label: '£500–£800', min: '500', max: '800' },
  { label: '£800–£1,200', min: '800', max: '1200' },
  { label: '£1,200+', min: '1200', max: undefined },
]
const AGE_RANGES = [
  { label: '18–24', value: '18-24' },
  { label: '25–30', value: '25-30' },
  { label: '30+', value: '30plus' },
]
const NATIONALITIES = [
  'Brazilian', 'British', 'Colombian', 'Czech', 'Eastern European',
  'French', 'Italian', 'Russian', 'Spanish', 'Turkish',
]

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
    params.delete('page') // Reset to page 1 on filter change
    const qs = params.toString()
    router.push(`/companions${qs ? `?${qs}` : ''}`)
  }

  function clearAll() {
    router.push('/companions')
  }

  const hasFilters = Object.values(currentFilters).some(v => v && v !== 'recommended')

  return (
    <aside className="sidebar">
      {/* Price */}
      <div className="sb-section">
        <span className="sb-label">Price per hour</span>
        {PRICE_RANGES.map(r => {
          const isActive = currentFilters.minPrice === r.min
          return (
            <button
              key={r.label}
              className={`sb-option${isActive ? ' active' : ''}`}
              onClick={() => {
                if (isActive) {
                  setFilter('minPrice', undefined)
                  setFilter('maxPrice', undefined)
                } else {
                  const params = new URLSearchParams(searchParams.toString())
                  params.set('minPrice', r.min)
                  if (r.max) params.set('maxPrice', r.max); else params.delete('maxPrice')
                  params.delete('page')
                  router.push(`/companions?${params.toString()}`)
                }
              }}
              style={{ background: 'none', border: 'none', fontFamily: 'inherit', textAlign: 'left', width: '100%' }}
            >
              {isActive ? '● ' : '○ '}{r.label}
            </button>
          )
        })}
      </div>

      {/* Hair Colour */}
      <div className="sb-section">
        <span className="sb-label">Hair Colour</span>
        {HAIR_COLORS.map(h => {
          const isActive = currentFilters.hairColor?.toLowerCase() === h.toLowerCase()
          return (
            <button
              key={h}
              className={`sb-option${isActive ? ' active' : ''}`}
              onClick={() => setFilter('hairColor', isActive ? undefined : h)}
              style={{ background: 'none', border: 'none', fontFamily: 'inherit', textAlign: 'left', width: '100%' }}
            >
              {isActive ? '☑ ' : '☐ '}{h}
            </button>
          )
        })}
      </div>

      {/* Nationality */}
      <div className="sb-section">
        <span className="sb-label">Nationality</span>
        <select
          value={currentFilters.nationality || ''}
          onChange={e => setFilter('nationality', e.target.value || undefined)}
          className="sort-select"
          style={{ width: '100%', marginTop: 4 }}
        >
          <option value="">All nationalities</option>
          {NATIONALITIES.map(n => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </div>

      {/* District */}
      <div className="sb-section">
        <span className="sb-label">District</span>
        <select
          value={currentFilters.districtId || ''}
          onChange={e => setFilter('districtId', e.target.value || undefined)}
          className="sort-select"
          style={{ width: '100%', marginTop: 4 }}
        >
          <option value="">All districts</option>
          {districts.map(d => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
      </div>

      {/* Availability */}
      <div className="sb-section">
        <span className="sb-label">Availability</span>
        <button
          className={`sb-option${currentFilters.availability === 'available-now' ? ' active' : ''}`}
          onClick={() => setFilter('availability', currentFilters.availability === 'available-now' ? undefined : 'available-now')}
          style={{ background: 'none', border: 'none', fontFamily: 'inherit', textAlign: 'left', width: '100%' }}
        >
          {currentFilters.availability === 'available-now' ? '☑ ' : '☐ '}Available Now
        </button>
      </div>

      {/* Age */}
      <div className="sb-section">
        <span className="sb-label">Age</span>
        {AGE_RANGES.map(a => {
          const isActive = currentFilters.age === a.value
          return (
            <button
              key={a.value}
              className={`sb-option${isActive ? ' active' : ''}`}
              onClick={() => setFilter('age', isActive ? undefined : a.value)}
              style={{ background: 'none', border: 'none', fontFamily: 'inherit', textAlign: 'left', width: '100%' }}
            >
              {isActive ? '☑ ' : '☐ '}{a.label}
            </button>
          )
        })}
      </div>

      {/* Sort */}
      <div className="sb-section">
        <span className="sb-label">Sort by</span>
        <select
          value={currentFilters.sort || 'recommended'}
          onChange={e => setFilter('sort', e.target.value === 'recommended' ? undefined : e.target.value)}
          className="sort-select"
          style={{ width: '100%', marginTop: 4 }}
        >
          <option value="recommended">Recommended</option>
          <option value="newest">Newest</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
        </select>
      </div>

      {hasFilters && (
        <button className="sb-clear" onClick={clearAll}>
          Clear Filters
        </button>
      )}
    </aside>
  )
}
