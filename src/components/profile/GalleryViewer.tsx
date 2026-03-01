'use client'

import { useState } from 'react'

interface Photo {
  id: string
  url: string
}

interface GalleryViewerProps {
  photos: Photo[]
  modelName: string
  primaryUrl: string
}

export function GalleryViewer({ photos, modelName, primaryUrl }: GalleryViewerProps) {
  const [activeUrl, setActiveUrl] = useState(primaryUrl)
  const [lightbox, setLightbox] = useState<string | null>(null)

  if (photos.length === 0) return null

  return (
    <>
      {/* Main photo */}
      <div
        className="gallery-main"
        style={{ marginBottom: 8, cursor: 'zoom-in' }}
        onClick={() => setLightbox(activeUrl)}
      >
        <img src={activeUrl} alt={modelName} />
      </div>

      {/* Thumbnails */}
      {photos.length > 1 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4, marginBottom: 60 }}>
          {photos.slice(0, 10).map((photo) => (
            <div
              key={photo.id}
              className="thumb"
              onClick={() => setActiveUrl(photo.url)}
              style={{
                outline: activeUrl === photo.url ? '2px solid #c9a84c' : '2px solid transparent',
                outlineOffset: -2,
                opacity: activeUrl === photo.url ? 1 : 0.55,
                transition: 'opacity .25s, outline-color .25s',
              }}
            >
              <img src={photo.url} alt={modelName} loading="lazy" />
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.95)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'zoom-out',
          }}
        >
          <style>{`@keyframes fadeInLb { from{opacity:0} to{opacity:1} } [data-lb]{animation:fadeInLb .2s ease}`}</style>

          {/* Prev */}
          {photos.findIndex(p => p.url === lightbox) > 0 && (
            <button
              onClick={e => {
                e.stopPropagation()
                const idx = photos.findIndex(p => p.url === lightbox)
                const prev = photos[idx - 1].url
                setLightbox(prev)
                setActiveUrl(prev)
              }}
              style={{ position:'absolute', left:24, top:'50%', transform:'translateY(-50%)', background:'rgba(255,255,255,0.08)', border:'none', color:'#fff', width:48, height:48, fontSize:22, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}
            >‹</button>
          )}

          <img
            src={lightbox}
            alt={modelName}
            data-lb
            onClick={e => e.stopPropagation()}
            style={{ maxHeight:'92vh', maxWidth:'92vw', objectFit:'contain', cursor:'default', boxShadow:'0 0 100px rgba(0,0,0,0.9)' }}
          />

          {/* Next */}
          {photos.findIndex(p => p.url === lightbox) < photos.length - 1 && (
            <button
              onClick={e => {
                e.stopPropagation()
                const idx = photos.findIndex(p => p.url === lightbox)
                const next = photos[idx + 1].url
                setLightbox(next)
                setActiveUrl(next)
              }}
              style={{ position:'absolute', right:24, top:'50%', transform:'translateY(-50%)', background:'rgba(255,255,255,0.08)', border:'none', color:'#fff', width:48, height:48, fontSize:22, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}
            >›</button>
          )}

          {/* Close */}
          <button onClick={() => setLightbox(null)} style={{ position:'absolute', top:20, right:20, background:'none', border:'none', color:'rgba(255,255,255,0.5)', fontSize:32, cursor:'pointer', lineHeight:1 }}>×</button>

          {/* Counter */}
          <div style={{ position:'absolute', bottom:20, left:'50%', transform:'translateX(-50%)', fontSize:11, letterSpacing:'.12em', color:'rgba(255,255,255,0.3)' }}>
            {photos.findIndex(p => p.url === lightbox) + 1} / {photos.length}
          </div>
        </div>
      )}
    </>
  )
}
