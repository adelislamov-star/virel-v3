'use client'

import { useState } from 'react'
import Image from 'next/image'

interface Props {
  coverPhotoUrl: string | null
  galleryPhotoUrls: string[]
  name: string
}

export function CompanionGallery({ coverPhotoUrl, galleryPhotoUrls, name }: Props) {
  const allPhotos = [coverPhotoUrl, ...galleryPhotoUrls].filter(Boolean) as string[]
  const [activeIndex, setActiveIndex] = useState(0)

  if (allPhotos.length === 0) {
    return (
      <div style={{
        width: '100%', aspectRatio: '3/4', background: 'linear-gradient(135deg, #111, #1a1a1a)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 80, color: '#2a2520', fontWeight: 300 }}>
          {name.charAt(0)}
        </span>
      </div>
    )
  }

  return (
    <>
      <style>{`
        .cg-main { position:relative; width:100%; aspect-ratio:3/4; overflow:hidden; background:#111; }
        .cg-thumbs { display:flex; gap:8px; margin-top:12px; overflow-x:auto; scrollbar-width:none; }
        .cg-thumbs::-webkit-scrollbar { display:none; }
        .cg-thumb { flex-shrink:0; width:72px; height:96px; overflow:hidden; cursor:pointer; opacity:0.5; transition:opacity .2s; border:2px solid transparent; }
        .cg-thumb.active { opacity:1; border-color:rgba(197,165,114,.5); }
        .cg-thumb:hover { opacity:0.85; }
        .cg-thumb img { width:100%; height:100%; object-fit:cover; }
      `}</style>
      <div>
        <div className="cg-main">
          <Image
            fill
            src={allPhotos[activeIndex]}
            alt={`${name} — photo ${activeIndex + 1}`}
            style={{ objectFit: 'cover', objectPosition: 'center 15%' }}
            sizes="60vw"
            priority={activeIndex === 0}
          />
        </div>
        {allPhotos.length > 1 && (
          <div className="cg-thumbs">
            {allPhotos.map((url, i) => (
              <div
                key={i}
                className={`cg-thumb${i === activeIndex ? ' active' : ''}`}
                onClick={() => setActiveIndex(i)}
              >
                <Image
                  src={url}
                  alt={`${name} thumbnail ${i + 1}`}
                  width={72}
                  height={96}
                  style={{ objectFit: 'cover' }}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
