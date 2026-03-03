'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'

// ── REVEAL INIT — always rendered, sets up scroll animations ──
export function RevealInit() {
  useEffect(() => {
    // Add js-ready so CSS can safely hide .reveal elements
    document.body.classList.add('js-ready')

    const observer = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible') }),
      { threshold: 0, rootMargin: '0px 0px 60px 0px' }
    )

    requestAnimationFrame(() => {
      document.querySelectorAll('.reveal').forEach(el => observer.observe(el))
    })

    // Hard fallback — if something goes wrong, show everything after 2s
    const fallback = setTimeout(() => {
      document.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'))
    }, 2000)

    return () => { observer.disconnect(); clearTimeout(fallback) }
  }, [])

  return null
}

// ── DRAG GALLERY ──
export function DragGallery({ photos, modelName }: { photos: { id: string; url: string }[]; modelName: string }) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [lightbox, setLightbox] = useState<string | null>(null)
  const [lightboxIdx, setLightboxIdx] = useState(0)

  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    let isDown = false, startX = 0, scrollLeft = 0

    const onDown = (e: MouseEvent) => {
      isDown = true
      track.classList.add('grabbing')
      startX = e.pageX - track.offsetLeft
      scrollLeft = track.scrollLeft
    }
    const onUp = () => { isDown = false; track.classList.remove('grabbing') }
    const onMove = (e: MouseEvent) => {
      if (!isDown) return
      e.preventDefault()
      track.scrollLeft = scrollLeft - (e.pageX - track.offsetLeft - startX) * 1.4
    }

    track.addEventListener('mousedown', onDown)
    track.addEventListener('mouseleave', onUp)
    track.addEventListener('mouseup', onUp)
    track.addEventListener('mousemove', onMove)
    return () => {
      track.removeEventListener('mousedown', onDown)
      track.removeEventListener('mouseleave', onUp)
      track.removeEventListener('mouseup', onUp)
      track.removeEventListener('mousemove', onMove)
    }
  }, [])

  function openLightbox(idx: number) { setLightboxIdx(idx); setLightbox(photos[idx]?.url) }
  function closeLightbox() { setLightbox(null) }
  function prev() { const i = Math.max(0, lightboxIdx - 1); setLightboxIdx(i); setLightbox(photos[i].url) }
  function next() { const i = Math.min(photos.length - 1, lightboxIdx + 1); setLightboxIdx(i); setLightbox(photos[i].url) }

  return (
    <>
      <div className="gallery-track" ref={trackRef}>
        {photos.map((photo, idx) => (
          <div key={photo.id} className="gallery-item" onClick={() => openLightbox(idx)} style={{ cursor: 'zoom-in', position: 'relative' }}>
            <Image fill src={photo.url} alt={modelName} style={{ objectFit: 'cover', objectPosition: 'top' }} sizes="300px" />
          </div>
        ))}
      </div>

      {lightbox && (
        <div
          onClick={closeLightbox}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.96)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'zoom-out',
          }}
        >
          {lightboxIdx > 0 && (
            <button onClick={e => { e.stopPropagation(); prev() }} style={navBtn}>‹</button>
          )}
          <Image
            src={lightbox}
            alt={modelName}
            width={1200}
            height={1600}
            onClick={e => e.stopPropagation()}
            style={{ maxHeight: '92vh', maxWidth: '92vw', objectFit: 'contain', cursor: 'default', width: 'auto', height: 'auto' }}
          />
          {lightboxIdx < photos.length - 1 && (
            <button onClick={e => { e.stopPropagation(); next() }} style={{ ...navBtn, left: 'auto', right: 24 }}>›</button>
          )}
          <button onClick={closeLightbox} style={{ position: 'absolute', top: 20, right: 20, background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 36, cursor: 'pointer', lineHeight: 1 }}>×</button>
          <div style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', fontSize: 11, letterSpacing: '.12em', color: 'rgba(255,255,255,0.3)' }}>
            {lightboxIdx + 1} / {photos.length}
          </div>
        </div>
      )}
    </>
  )
}

const navBtn: React.CSSProperties = {
  position: 'absolute', left: 24, top: '50%', transform: 'translateY(-50%)',
  background: 'rgba(255,255,255,0.07)', border: 'none', color: '#fff',
  width: 52, height: 52, fontSize: 28, cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
}

// ── EXPERIENCES TOGGLE ──
export function ExpToggle({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div>
      <div style={{ display: open ? 'block' : 'none' }}>{children}</div>
      <button onClick={() => setOpen(!open)} className="exp-more-btn">
        {open ? 'Show less ←' : 'Show all experiences →'}
      </button>
    </div>
  )
}

// ── SERVICE TAGS COLLAPSE ──
interface ServiceTag {
  slug: string
  displayTitle: string
}

export function ServiceTagsCollapse({ tags }: { tags: ServiceTag[] }) {
  const [showAll, setShowAll] = useState(false)
  const limit = 8
  const visible = showAll ? tags : tags.slice(0, limit)
  const remaining = tags.length - limit

  return (
    <div className="service-tags">
      {visible.map(s => (
        <a key={s.slug} href={`/services/${s.slug}`} className="service-tag">
          {s.displayTitle}
        </a>
      ))}
      {!showAll && remaining > 0 && (
        <button onClick={() => setShowAll(true)} className="service-more-btn">
          +{remaining} more
        </button>
      )}
    </div>
  )
}
