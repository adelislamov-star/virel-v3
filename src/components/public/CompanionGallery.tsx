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
  )
}
