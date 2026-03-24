'use client'

import { useState, useEffect } from 'react'

export function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem('vaurel-cookie-consent')) {
      setVisible(true)
    }
  }, [])

  if (!visible) return null

  const accept = (level: 'all' | 'essential') => {
    localStorage.setItem('vaurel-cookie-consent', level)
    setVisible(false)
  }

  return (
    <div className="cookie-banner" role="dialog" aria-label="Cookie consent">
      <div className="cookie-text">
        <strong style={{ color: '#F8F4EE', fontSize: 13 }}>We use cookies</strong>
        <br />
        We use essential cookies to keep this site working, and optional analytics cookies to understand how it is used.
        By clicking &ldquo;Accept All&rdquo; you consent to all cookies.{' '}
        <a href="/privacy">Privacy Policy</a>
      </div>
      <div className="cookie-btns">
        <button
          className="cookie-btn cookie-btn-essential"
          onClick={() => accept('essential')}
        >
          Reject Optional
        </button>
        <button
          className="cookie-btn cookie-btn-accept"
          onClick={() => accept('all')}
        >
          Accept All
        </button>
      </div>
    </div>
  )
}
