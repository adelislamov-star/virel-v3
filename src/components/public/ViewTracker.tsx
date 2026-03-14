'use client'

import { useEffect } from 'react'

export function ViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    // Fire-and-forget view count
    fetch(`/api/public/models/${slug}/view`, { method: 'POST' }).catch(() => {})
  }, [slug])

  return null
}
