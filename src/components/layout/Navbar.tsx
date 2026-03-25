'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav className={`vr-nav${scrolled ? ' scrolled' : ''}`}>
      <div className="nav-grad" />
      <div className="nav-left">
        <div className="nav-mark"><span className="nav-v">V</span></div>
        <Link href="/" className="nav-logo">Vaurel</Link>
      </div>
      <ul className="nav-links">
        <li><Link href="/companions">Companions</Link></li>
        <li><Link href="/services">Experiences</Link></li>
        <li><Link href="/london/mayfair-escorts">Locations</Link></li>
        <li><Link href="/about">About</Link></li>
        <li><Link href="/discretion">Discretion</Link></li>
      </ul>
      <div className="nav-right">
        <a href="https://wa.me/447562279678" className="nav-icon" title="WhatsApp" aria-label="WhatsApp">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.126.557 4.126 1.534 5.864L.054 23.177a.75.75 0 00.919.919l5.313-1.48A11.953 11.953 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.718 9.718 0 01-4.964-1.365l-.355-.212-3.679 1.024 1.024-3.679-.212-.355A9.718 9.718 0 012.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z"/></svg>
        </a>
        <a href="https://t.me/+447562279678" className="nav-icon" title="Telegram" aria-label="Telegram">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M21.5 2.5L2 10l7 2.5 2 7.5 3-4 5 3.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>
        </a>
        <div className="nav-div" />
        <Link href="/signin" className="nav-signin">Sign In</Link>
        <a href="https://wa.me/447562279678" className="nav-cta">Enquire</a>
      </div>
    </nav>
  )
}
