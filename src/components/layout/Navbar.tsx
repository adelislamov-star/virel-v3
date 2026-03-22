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
        <li><Link href="/london">Locations</Link></li>
        <li><Link href="/about">About</Link></li>
        <li><Link href="/discretion">Discretion</Link></li>
      </ul>
      <div className="nav-right">
        <a href="https://wa.me/447000000000" className="nav-icon" title="WhatsApp" aria-label="WhatsApp">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M20.5 3.5A12 12 0 0 0 3.6 19.4L2 22l2.7-1.6A12 12 0 1 0 20.5 3.5z" stroke="currentColor" strokeWidth="1.5"/><path d="M9 10c0-.6.4-1 1-1s1 .4 1 1v.5c0 .3-.1.5-.3.7l-.7.7c.4.8 1.1 1.5 1.9 1.9l.7-.7c.2-.2.4-.3.7-.3H14c.6 0 1 .4 1 1s-.4 1-1 1a6 6 0 0 1-6-6z" stroke="currentColor" strokeWidth="1.2"/></svg>
        </a>
        <a href="https://t.me/vaurel_bookings" className="nav-icon" title="Telegram" aria-label="Telegram">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M21.5 2.5L2 10l7 2.5 2 7.5 3-4 5 3.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>
        </a>
        <div className="nav-div" />
        <Link href="/signin" className="nav-signin">Sign In</Link>
        <a href="https://wa.me/447000000000" className="nav-cta">Enquire</a>
      </div>
    </nav>
  )
}
