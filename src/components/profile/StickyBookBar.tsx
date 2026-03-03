'use client'

import { useState, useEffect } from 'react'

interface StickyBookBarProps {
  modelName: string
  minPrice: number | null
}

export function StickyBookBar({ modelName, minPrice }: StickyBookBarProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const heroBtn = document.querySelector('.btn-hero')
    if (!heroBtn) return

    const check = () => {
      const rect = heroBtn.getBoundingClientRect()
      // Show bar only when the Book Now button has scrolled completely above the viewport
      setVisible(rect.bottom < 0)
    }

    window.addEventListener('scroll', check, { passive: true })
    check()
    return () => window.removeEventListener('scroll', check)
  }, [])

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        padding: '0 16px',
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
          gap: 12,
          maxWidth: 1280,
          margin: '0 auto',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <span style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 18,
            fontWeight: 300,
            color: '#f5f0e8',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {modelName}
          </span>
          {minPrice && (
            <span style={{
              fontSize: 13,
              letterSpacing: '.05em',
              color: '#C5A572',
              whiteSpace: 'nowrap',
            }}>
              From £{minPrice.toLocaleString('en-GB')}/hr
            </span>
          )}
        </div>
        <a
          href="#booking"
          style={{
            display: 'inline-block',
            flexShrink: 0,
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
            whiteSpace: 'nowrap',
          }}
        >
          Book Now
        </a>
      </div>
    </div>
  )
}
