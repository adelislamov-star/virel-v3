'use client'

import Link from 'next/link'
import { useState } from 'react'
import { PanicButton } from '@/components/public/PanicButton'
import { siteConfig } from '@/../config/site'

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: 'rgba(8,8,8,0.92)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      fontFamily: 'DM Sans, sans-serif',
    }}>
      <nav style={{ maxWidth: 1280, margin: '0 auto', padding: '0 40px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 22, fontWeight: 300, color: '#f0e8dc', textDecoration: 'none', letterSpacing: '.08em' }}>
          {siteConfig.name}
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 36 }} className="desktop-nav">
          {[
            ['/companions', 'Companions'],
            ['/about', 'About'],
            ['/contact', 'Contact'],
          ].map(([href, label]) => (
            <Link key={href} href={href} className="h-link">{label}</Link>
          ))}
          <Link href="/companions" className="h-book">Book Now</Link>
          <PanicButton />
        </div>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b6560', display: 'none' }}
          className="mobile-burger"
        >
          <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            {mobileMenuOpen
              ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            }
          </svg>
        </button>
      </nav>

      {mobileMenuOpen && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: '#080808', padding: '20px 40px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[
            ['/companions', 'Companions'],
            ['/about', 'About'],
            ['/contact', 'Contact'],
          ].map(([href, label]) => (
            <Link key={href} href={href} className="h-link" onClick={() => setMobileMenuOpen(false)}>{label}</Link>
          ))}
          <Link href="/companions" className="h-book" onClick={() => setMobileMenuOpen(false)}>Book Now</Link>
        </div>
      )}
    </header>
  )
}
