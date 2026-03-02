'use client'

import { useState, useEffect, useRef } from 'react'

interface StickyBookBarProps {
  modelName: string
  minPrice: number | null
}

export function StickyBookBar({ modelName, minPrice }: StickyBookBarProps) {
  const [visible, setVisible] = useState(false)
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Show bar when hero sentinel is NOT intersecting (scrolled past)
        setVisible(!entry.isIntersecting)
      },
      { threshold: 0 }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [])

  return (
    <>
      {/* Invisible sentinel placed inside hero — when it scrolls out of view, bar appears */}
      <div
        ref={sentinelRef}
        style={{ position: 'absolute', top: 0, left: 0, width: 1, height: 1, pointerEvents: 'none' }}
        data-sticky-sentinel
      />

      {/* Sticky bar */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          transform: visible ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.3s ease',
        }}
      >
        <div
          style={{
            background: 'rgba(10,10,10,0.95)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderTop: '1px solid #1A1A1A',
            padding: '12px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            maxWidth: 1280,
            margin: '0 auto',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 18,
              fontWeight: 300,
              color: '#f5f0e8',
            }}>
              {modelName}
            </span>
            {minPrice && (
              <span style={{
                fontSize: 13,
                letterSpacing: '.05em',
                color: '#C5A572',
              }}>
                From £{minPrice.toLocaleString('en-GB')}/hr
              </span>
            )}
          </div>
          <a
            href="#booking"
            style={{
              display: 'inline-block',
              background: '#C5A572',
              color: '#0a0a0a',
              padding: '10px 24px',
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: '.15em',
              textTransform: 'uppercase',
              textDecoration: 'none',
              fontFamily: "'DM Sans', sans-serif",
              transition: 'background 0.2s',
            }}
          >
            Book Now
          </a>
        </div>
      </div>
    </>
  )
}
