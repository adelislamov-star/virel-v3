'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'

interface Props {
  coverPhotoUrl: string | null
  galleryPhotoUrls: string[]
  name: string
}

export function CompanionGallery({ coverPhotoUrl, galleryPhotoUrls, name }: Props) {
  const allPhotos = [coverPhotoUrl, ...galleryPhotoUrls].filter(Boolean) as string[]
  const [activeIndex, setActiveIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const touchStartX = useRef<number | null>(null)

  const prev = useCallback(() => setActiveIndex(i => (i - 1 + allPhotos.length) % allPhotos.length), [allPhotos.length])
  const next = useCallback(() => setActiveIndex(i => (i + 1) % allPhotos.length), [allPhotos.length])

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
      if (e.key === 'Escape') setLightboxOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [prev, next])

  // Touch/swipe handlers
  const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX }
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 40) diff > 0 ? next() : prev()
    touchStartX.current = null
  }

  if (allPhotos.length === 0) {
    return (
      <div style={{ width: '100%', aspectRatio: '3/4', background: 'linear-gradient(135deg, #111 0%, #1a1a1a 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 64, color: '#2a2520', fontWeight: 300 }}>{name.charAt(0)}</span>
      </div>
    )
  }

  return (
    <>
      {/* Main gallery */}
      <div className="cg-wrap" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        {/* Main photo */}
        <div className="cg-main" onClick={() => setLightboxOpen(true)} style={{ cursor: 'zoom-in' }}>
          <Image fill src={allPhotos[activeIndex]} alt={`${name} — photo ${activeIndex + 1}`} style={{ objectFit: 'cover', objectPosition: 'center 15%' }} sizes="60vw" priority={activeIndex === 0} />
          {/* Watermark */}
          <div style={{ position: 'absolute', bottom: 18, left: 0, right: 0, display: 'flex', justifyContent: 'center', pointerEvents: 'none', userSelect: 'none', zIndex: 10 }}>
            <span style={{ fontSize: 11, fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, letterSpacing: '0.55em', color: 'rgba(197, 165, 114, 0.55)', textTransform: 'uppercase' }}>VAUREL</span>
          </div>
          {/* Arrow buttons — desktop only */}
          {allPhotos.length > 1 && (
            <>
              <button className="cg-arrow cg-arrow-left" onClick={e => { e.stopPropagation(); prev() }} aria-label="Previous photo">&#8249;</button>
              <button className="cg-arrow cg-arrow-right" onClick={e => { e.stopPropagation(); next() }} aria-label="Next photo">&#8250;</button>
            </>
          )}
          {/* Dot indicators — mobile only */}
          {allPhotos.length > 1 && (
            <div className="cg-dots">
              {allPhotos.map((_, i) => (
                <span key={i} className={`cg-dot${i === activeIndex ? ' active' : ''}`} onClick={e => { e.stopPropagation(); setActiveIndex(i) }} />
              ))}
            </div>
          )}
        </div>
        {/* Thumbnails — desktop only */}
        {allPhotos.length > 1 && (
          <div className="cg-thumbs">
            {allPhotos.map((url, i) => (
              <div key={i} className={`cg-thumb${i === activeIndex ? ' active' : ''}`} onClick={() => setActiveIndex(i)}>
                <Image src={url} alt={`${name} thumbnail ${i + 1}`} width={72} height={96} style={{ objectFit: 'cover' }} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div className="cg-lightbox" onClick={() => setLightboxOpen(false)} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
          <button className="cg-lb-close" onClick={() => setLightboxOpen(false)}>&#10005;</button>
          <button className="cg-lb-arrow cg-lb-prev" onClick={e => { e.stopPropagation(); prev() }}>&#8249;</button>
          <div className="cg-lb-img" onClick={e => e.stopPropagation()}>
            <Image fill src={allPhotos[activeIndex]} alt={`${name} — photo ${activeIndex + 1}`} style={{ objectFit: 'contain' }} sizes="100vw" />
            <div style={{ position: 'absolute', bottom: 18, left: 0, right: 0, display: 'flex', justifyContent: 'center', pointerEvents: 'none', userSelect: 'none', zIndex: 10 }}>
              <span style={{ fontSize: 11, fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, letterSpacing: '0.55em', color: 'rgba(197, 165, 114, 0.55)', textTransform: 'uppercase' }}>VAUREL</span>
            </div>
          </div>
          <button className="cg-lb-arrow cg-lb-next" onClick={e => { e.stopPropagation(); next() }}>&#8250;</button>
          <div className="cg-lb-counter">{activeIndex + 1} / {allPhotos.length}</div>
        </div>
      )}
    </>
  )
}
