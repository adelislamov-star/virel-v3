'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'

interface Model {
  id: string
  name: string
  slug: string
  stats?: { age?: number; nationality?: string } | null
  media: { url: string }[]
  primaryLocation?: { name: string; slug: string } | null
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
      <style>{`
        .filter-bar { display:flex; align-items:center; justify-content:space-between; padding:0 40px; border-bottom:1px solid rgba(255,255,255,0.05); }
        @media(max-width:600px){ .filter-bar{padding:0 20px;} }
        .filter-toggle { display:flex; align-items:center; gap:10px; padding:18px 0; cursor:pointer; background:none; border:none; font-family:inherit; }
        .filter-label { font-size:11px; letter-spacing:.18em; color:#6b6560; text-transform:uppercase; }
        .filter-badge { background:#c9a84c; color:#080808; width:16px; height:16px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:9px; font-weight:700; }
        .filter-result-count { font-size:11px; letter-spacing:.08em; color:#3a3530; }

        .filter-panel { background:#0a0a0a; border-bottom:1px solid rgba(255,255,255,0.05); padding:28px 40px; display:grid; grid-template-columns:1fr 1fr 1fr; gap:40px; }
        @media(max-width:900px){ .filter-panel{grid-template-columns:1fr 1fr;} }
        @media(max-width:550px){ .filter-panel{grid-template-columns:1fr; padding:20px;} }
        .filter-section-label { font-size:10px; letter-spacing:.2em; color:#c9a84c; text-transform:uppercase; margin-bottom:14px; display:block; }
        .filter-chips { display:flex; flex-wrap:wrap; gap:6px; }
        .chip { padding:6px 14px; font-size:11px; letter-spacing:.06em; cursor:pointer; background:none; border:1px solid rgba(255,255,255,0.07); color:#6b6560; font-family:inherit; transition:all .15s; }
        .chip:hover { border-color:rgba(255,255,255,0.18); color:#ddd5c8; }
        .chip.on { border-color:rgba(201,168,76,0.5); color:#c9a84c; background:rgba(201,168,76,0.04); }
        .filter-clear { background:none; border:1px solid rgba(255,255,255,0.07); color:#6b6560; padding:6px 16px; font-size:10px; letter-spacing:.15em; text-transform:uppercase; cursor:pointer; font-family:inherit; transition:all .2s; margin-top:22px; }
        .filter-clear:hover { color:#ddd5c8; border-color:rgba(255,255,255,0.2); }

        .cf-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:2px; padding:2px; background:rgba(255,255,255,0.03); }
        @media(max-width:1100px){ .cf-grid{grid-template-columns:repeat(3,1fr);} }
        @media(max-width:750px){ .cf-grid{grid-template-columns:repeat(2,1fr);} }
        @media(max-width:480px){ .cf-grid{grid-template-columns:1fr;} }
        .cf-card { position:relative; aspect-ratio:3/4; overflow:hidden; background:#111; display:block; text-decoration:none; }
        .cf-card img { width:100%; height:100%; object-fit:cover; transition:transform 1s cubic-bezier(.25,.46,.45,.94); filter:grayscale(10%); }
        .cf-card:hover img { transform:scale(1.06); filter:grayscale(0%); }
        .cf-overlay { position:absolute; inset:0; background:linear-gradient(to top,rgba(0,0,0,.88) 0%,transparent 55%); }
        .cf-content { position:absolute; bottom:0; left:0; right:0; padding:28px 24px; }
        .cf-name { font-family:'Cormorant Garamond',serif; font-size:28px; font-weight:300; color:#fff; margin:0 0 4px; }
        .cf-meta { font-size:10px; letter-spacing:.12em; color:rgba(255,255,255,.4); text-transform:uppercase; }
        .cf-cta { display:inline-block; margin-top:14px; font-size:10px; letter-spacing:.15em; color:#c9a84c; text-transform:uppercase; opacity:0; transform:translateY(6px); transition:opacity .25s,transform .25s; }
        .cf-card:hover .cf-cta { opacity:1; transform:none; }
        .cf-placeholder { width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; background:linear-gradient(135deg,#0f0f0f,#1a1811); }
        .no-results { padding:80px 40px; text-align:center; font-family:'Cormorant Garamond',serif; font-size:24px; color:#3a3530; }
      `}</style>

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
                <Link key={model.id} href={`/catalog/${model.slug}`} className="cf-card">
                  {photo
                    ? <img src={photo} alt={model.name} loading="lazy" />
                    : <div className="cf-placeholder">
                        <span style={{ fontSize: 40, color: '#2a2520', marginBottom: 10 }}>◈</span>
                        <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 11, letterSpacing: '.18em', color: '#2a2520', textTransform: 'uppercase' }}>Photo Coming Soon</span>
                      </div>
                  }
                  <div className="cf-overlay" />
                  <div className="cf-content">
                    <p className="cf-name">{model.name}</p>
                    <p className="cf-meta">{[model.stats?.age && `${model.stats.age} yrs`, model.stats?.nationality].filter(Boolean).join('  ·  ')}</p>
                    <span className="cf-cta">View Profile →</span>
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
