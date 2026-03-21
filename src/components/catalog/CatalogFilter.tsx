'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import './CatalogFilter.css'

interface Model {
  id: string
  name: string
  slug: string
  stats?: { age?: number; nationality?: string } | null
  media: { url: string }[]
  primaryLocation?: { name: string; slug: string } | null
  minPrice?: number | null
}

interface Props {
  models: Model[]
  totalCount: number
}

const NATIONALITIES = ['All', 'Brazilian', 'British', 'Colombian', 'Eastern European', 'Italian', 'Spanish', 'Russian', 'Asian', 'Latin']
const AGE_RANGES = [
  { label: 'All ages', min: 0, max: 999 },
  { label: '18–22', min: 18, max: 22 },
  { label: '23–27', min: 23, max: 27 },
  { label: '28–35', min: 28, max: 35 },
  { label: '35+', min: 35, max: 999 },
]
const DISTRICTS = [
  { name: 'All areas', slug: '' },
  { name: 'Mayfair', slug: 'mayfair' },
  { name: 'Kensington', slug: 'kensington' },
  { name: 'Knightsbridge', slug: 'knightsbridge' },
  { name: 'Chelsea', slug: 'chelsea' },
  { name: 'Belgravia', slug: 'belgravia' },
  { name: 'Marylebone', slug: 'marylebone' },
  { name: 'Soho', slug: 'soho' },
  { name: 'Canary Wharf', slug: 'canary-wharf' },
]

export function CatalogFilter({ models, totalCount }: Props) {
  const [nationality, setNationality] = useState('All')
  const [ageRange, setAgeRange] = useState(0)
  const [district, setDistrict] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)

  const filtered = useMemo(() => {
    return models.filter(m => {
      const nat = nationality === 'All' || (m.stats?.nationality || '').toLowerCase().includes(nationality.toLowerCase())
      const age = m.stats?.age
        ? m.stats.age >= AGE_RANGES[ageRange].min && m.stats.age <= AGE_RANGES[ageRange].max
        : true
      const dist = !district || m.primaryLocation?.slug === district
      return nat && age && dist
    })
  }, [models, nationality, ageRange, district])

  const activeFilters = (nationality !== 'All' ? 1 : 0) + (ageRange !== 0 ? 1 : 0) + (district ? 1 : 0)

  return (
    <>
      {/* Filter toggle bar */}
      <div className="filter-bar">
        <button className="filter-toggle" onClick={() => setFiltersOpen(v => !v)}>
          <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
            <path d="M0 1h14M3 5h8M6 9h2" stroke="#6b6560" strokeWidth="1.2"/>
          </svg>
          <span className="filter-label">Filter</span>
          {activeFilters > 0 && <span className="filter-badge">{activeFilters}</span>}
        </button>
        <span className="filter-result-count">{filtered.length} of {totalCount} companions</span>
      </div>

      {/* Filter panel */}
      {filtersOpen && (
        <div className="filter-panel">
          <div>
            <span className="filter-section-label">Nationality</span>
            <div className="filter-chips">
              {NATIONALITIES.map(n => (
                <button key={n} className={`chip${nationality === n ? ' on' : ''}`} onClick={() => setNationality(n)}>{n}</button>
              ))}
            </div>
          </div>
          <div>
            <span className="filter-section-label">Age</span>
            <div className="filter-chips">
              {AGE_RANGES.map((r, i) => (
                <button key={r.label} className={`chip${ageRange === i ? ' on' : ''}`} onClick={() => setAgeRange(i)}>{r.label}</button>
              ))}
            </div>
          </div>
          <div>
            <span className="filter-section-label">District</span>
            <div className="filter-chips">
              {DISTRICTS.map(d => (
                <button key={d.slug} className={`chip${district === d.slug ? ' on' : ''}`} onClick={() => setDistrict(d.slug)}>{d.name}</button>
              ))}
            </div>
            {activeFilters > 0 && (
              <button className="filter-clear" onClick={() => { setNationality('All'); setAgeRange(0); setDistrict('') }}>
                Clear all
              </button>
            )}
          </div>
        </div>
      )}

      {/* Grid */}
      {filtered.length === 0
        ? <div className="no-results">No companions match your filters</div>
        : (
          <div className="cf-grid">
            {filtered.map(model => {
              const photo = model.media[0]?.url
              return (
                <Link key={model.id} href={`/companions/${model.slug}`} className="cf-card">
                  {photo
                    ? <Image fill src={photo} alt={model.name} style={{ objectFit: 'cover' }} sizes="(max-width: 480px) 100vw, (max-width: 750px) 50vw, (max-width: 1100px) 33vw, 25vw" />
                    : <div className="cf-placeholder">
                        <span style={{ fontSize: 40, color: '#2a2520', marginBottom: 10 }}>◈</span>
                        <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 11, letterSpacing: '.18em', color: '#2a2520', textTransform: 'uppercase' }}>Photo Coming Soon</span>
                      </div>
                  }
                  <div className="cf-overlay" />
                  <div className="cf-content">
                    <p className="cf-name">{model.name}</p>
                    <p className="cf-meta">{[model.stats?.age && `${model.stats.age} yrs`, model.stats?.nationality].filter(Boolean).join('  ·  ')}</p>
                    {model.minPrice && (
                      <p style={{ fontSize: 13, letterSpacing: '.05em', textTransform: 'uppercase', color: '#C5A572', margin: '8px 0 0' }}>
                        From £{model.minPrice.toLocaleString('en-GB')}/hr
                      </p>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )
      }
    </>
  )
}
