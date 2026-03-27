'use client'

import { useEffect, useState } from 'react'

interface ProfileStickyBarProps {
  name: string
  lowestPrice: number | null
  availability: string | null
  waUrl: string
  tgUrl: string
}

export function ProfileStickyBar({
  name, lowestPrice, availability, waUrl, tgUrl
}: ProfileStickyBarProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const threshold = window.innerHeight * 0.55
    const fn = () => setVisible(window.scrollY > threshold)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  const isAvailable = availability === 'Available Now'

  return (
    <div className={`psb-bar${visible ? ' psb-show' : ''}`}>
      <div className="psb-info">
        <span className="psb-name">{name}</span>
        {lowestPrice && (
          <span className="psb-price">From £{lowestPrice.toLocaleString('en-GB')} / hr</span>
        )}
        {isAvailable && (
          <>
            <span className="psb-sep" />
            <span className="psb-avail">
              <span className="psb-dot" />
              Available now
            </span>
          </>
        )}
      </div>
      <div className="psb-btns">
        <button
          className="psb-form-btn"
          onClick={() => {
            document.getElementById('pr-enquire')?.scrollIntoView({ behavior: 'smooth' })
          }}
        >
          Leave a request
        </button>
        <a href={tgUrl} target="_blank" rel="noopener noreferrer" className="psb-tg">
          Telegram
        </a>
        <a href={waUrl} target="_blank" rel="noopener noreferrer" className="psb-wa">
          WhatsApp
        </a>
      </div>
    </div>
  )
}
