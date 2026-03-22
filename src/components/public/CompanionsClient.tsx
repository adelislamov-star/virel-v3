'use client'

import { useState } from 'react'
import { ModelCard } from './ModelCard'

interface ModelData {
  id: string
  name: string
  slug: string
  tagline: string | null
  availability: string | null
  isVerified: boolean
  isExclusive: boolean
  districtName: string | null
  minIncallPrice: number | null
  coverPhotoUrl: string | null
}

const ITEMS_PER_PAGE = 12

export function CompanionsClient({ initialData }: { initialData: ModelData[] }) {
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE)

  const visible = initialData.slice(0, visibleCount)
  const total = initialData.length
  const allLoaded = visibleCount >= total
  const progress = total > 0 ? Math.min(visibleCount, total) / total : 1

  if (total === 0) {
    return (
      <div className="no-results">
        <p>No companions found matching your filters.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="results-grid">
        {visible.map(m => (
          <ModelCard
            key={m.id}
            name={m.name}
            slug={m.slug}
            tagline={m.tagline}
            coverPhotoUrl={m.coverPhotoUrl}
            availability={m.availability}
            isVerified={m.isVerified}
            isExclusive={m.isExclusive}
            districtName={m.districtName}
            minIncallPrice={m.minIncallPrice}
          />
        ))}
      </div>

      {/* Load More + Progress */}
      <div className="loadmore-wrap">
        <div className="loadmore-bar-track">
          <div className="loadmore-bar-fill" style={{ width: `${progress * 100}%` }} />
        </div>
        <p className="loadmore-count">
          Showing {Math.min(visibleCount, total)} of {total}
        </p>
        {!allLoaded && (
          <button
            className="loadmore-btn"
            onClick={() => setVisibleCount(prev => prev + ITEMS_PER_PAGE)}
          >
            Load More
          </button>
        )}
      </div>
    </div>
  )
}
