'use client'

import { useEffect, useState } from 'react'

export function FloatingContacts() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const fn = () => setVisible(window.scrollY > 420)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <div className={`float-wrap${visible ? ' show' : ''}`}>
      <a href="https://wa.me/447000000000" className="float-btn float-wa" aria-label="WhatsApp">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M20.5 3.5A12 12 0 0 0 3.6 19.4L2 22l2.7-1.6A12 12 0 1 0 20.5 3.5z" stroke="currentColor" strokeWidth="1.5"/></svg>
        WhatsApp
      </a>
      <a href="https://t.me/vaurel_bookings" className="float-btn float-tg" aria-label="Telegram">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M21.5 2.5L2 10l7 2.5 2 7.5 3-4 5 3.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>
        Telegram
      </a>
    </div>
  )
}
