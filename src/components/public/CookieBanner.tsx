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
      <div className="cookie-banner">
        <p className="cookie-text">
          We use cookies to improve your experience. By continuing to browse, you agree to our{' '}
          <a href="/privacy">privacy policy</a>.
        </p>
        <div className="cookie-btns">
          <button className="cookie-btn cookie-btn-accept" onClick={() => accept('all')}>Accept All</button>
          <button className="cookie-btn cookie-btn-essential" onClick={() => accept('essential')}>Essential Only</button>
        </div>
      </div>
  )
}
