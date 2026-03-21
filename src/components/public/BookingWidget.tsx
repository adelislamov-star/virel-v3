'use client'
import { useState, useEffect } from 'react'

interface Rate {
  label: string
  durationMin: number
  incallPrice: number | null
  outcallPrice: number | null
}

interface BookingWidgetProps {
  modelName: string
  modelSlug: string
  availability: string | null
  isVerified: boolean
  isExclusive: boolean
  lastActiveAt: string | null
  rates: Rate[]
}

export function BookingWidget({
  modelName, modelSlug, availability,
  isVerified, isExclusive, lastActiveAt, rates,
}: BookingWidgetProps) {
  const [activeToday, setActiveToday] = useState(false)
  useEffect(() => {
    if (!lastActiveAt) return
    const today = new Date()
    const last = new Date(lastActiveAt)
    setActiveToday(
      last.getDate() === today.getDate() &&
      last.getMonth() === today.getMonth() &&
      last.getFullYear() === today.getFullYear()
    )
  }, [lastActiveAt])
  const incallRates = rates.filter(r => r.incallPrice != null && r.incallPrice > 0)
  const outcallRates = rates.filter(r => r.outcallPrice != null && r.outcallPrice > 0)
  const hasAnyPrice = incallRates.length > 0 || outcallRates.length > 0

  const whatsappUrl = process.env.NEXT_PUBLIC_AGENCY_WHATSAPP
    ? `https://wa.me/${process.env.NEXT_PUBLIC_AGENCY_WHATSAPP}?text=${encodeURIComponent(`Hi, I'd like to book ${modelName}`)}`
    : '/contact'
  const telegramUrl = process.env.NEXT_PUBLIC_AGENCY_TELEGRAM
    ? `https://t.me/${process.env.NEXT_PUBLIC_AGENCY_TELEGRAM}`
    : '/contact'

  return (
      <div className="bw-root">
        <h1 className="bw-name">{modelName}</h1>
        <div className="bw-badges">
          {isExclusive && <span className="bw-badge bw-badge-e">★ Exclusive</span>}
          {isVerified && <span className="bw-badge bw-badge-v">✓ Verified Photos</span>}
          <span className="bw-badge bw-badge-g">✓ Genuine Photos</span>
          {activeToday && (
            <span className="bw-badge bw-badge-active"><span className="bw-active-dot" /> Active Today</span>
          )}
        </div>

        {!hasAnyPrice && (
          <p className="bw-no-price">Contact us for pricing</p>
        )}

        {availability === 'Available Now' && (
          <div className="bw-avail">
            <span className="bw-avail-dot" />
            Available Now
          </div>
        )}

        <div style={{ marginTop: 24 }}>
          <a href={`/book?modelSlug=${modelSlug}`} className="bw-btn bw-btn-primary">Book Now</a>
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="bw-btn bw-btn-secondary">
            📱 WhatsApp
          </a>
          <a href={telegramUrl} target="_blank" rel="noopener noreferrer" className="bw-btn bw-btn-secondary">
            ✈ Telegram
          </a>
          <p style={{ fontSize: 11, color: '#5a5450', textAlign: 'center', marginTop: 12, letterSpacing: '.04em' }}>
            Our team typically responds within 15 minutes
          </p>
        </div>
      </div>
  )
}
