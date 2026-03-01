'use client'

import Link from 'next/link'
import { useState } from 'react'

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
      <style>{`
        .h-link { font-size:12px; letter-spacing:.1em; text-transform:uppercase; color:#6b6560; text-decoration:none; transition:color .2s; }
        .h-link:hover { color:#ddd5c8; }
        .h-join { font-size:11px; letter-spacing:.14em; text-transform:uppercase; border:1px solid rgba(201,168,76,0.3); color:#c9a84c; padding:9px 20px; text-decoration:none; transition:all .2s; }
        .h-join:hover { background:rgba(201,168,76,0.08); border-color:#c9a84c; }
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-burger { display: block !important; }
        }
      `}</style>

      <nav style={{ maxWidth: 1280, margin: '0 auto', padding: '0 40px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 22, fontWeight: 300, color: '#f0e8dc', textDecoration: 'none', letterSpacing: '.08em' }}>
          Virel
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 36 }} className="desktop-nav">
          {[
            ['/london-escorts', 'Companions'],
            ['/services', 'Services'],
            ['/faq', 'FAQ'],
            ['/contact', 'Contact'],
          ].map(([href, label]) => (
            <Link key={href} href={href} className="h-link">{label}</Link>
          ))}
          <Link href="/join" className="h-join">Join Us</Link>
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
            ['/london-escorts', 'Companions'],
            ['/services', 'Services'],
            ['/faq', 'FAQ'],
            ['/contact', 'Contact'],
            ['/join', 'Join Us'],
          ].map(([href, label]) => (
            <Link key={href} href={href} className="h-link" onClick={() => setMobileMenuOpen(false)}>{label}</Link>
          ))}
        </div>
      )}
    </header>
  )
}
