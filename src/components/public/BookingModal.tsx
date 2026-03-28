'use client'

import { useEffect, useRef, useState } from 'react'
import './BookingModal.css'

interface BookingModalProps {
  isOpen: boolean
  onClose: () => void
}

type Status = 'idle' | 'loading' | 'success' | 'error'

interface Companion {
  id: string
  name: string
  slug: string
  coverPhotoUrl: string | null
}

interface Rate {
  id: string
  label: string
  durationType: string
  durationMin: number
  sortOrder: number
  incall: number | null
  outcall: number | null
}

const TIME_SLOTS: string[] = []
for (let h = 8; h < 24; h++) {
  TIME_SLOTS.push(`${h.toString().padStart(2, '0')}:00`)
  TIME_SLOTS.push(`${h.toString().padStart(2, '0')}:30`)
}

const DURATION_OPTIONS = [
  { key: '30min', label: '30 Minutes', min: 30 },
  { key: '45min', label: '45 Minutes', min: 45 },
  { key: '1hour', label: '1 Hour', min: 60 },
  { key: '90min', label: '90 Minutes', min: 90 },
  { key: '2hours', label: '2 Hours', min: 120 },
  { key: '3hours', label: '3 Hours', min: 180 },
  { key: 'overnight', label: 'Overnight', min: 540 },
]

const DURATION_MIN_MAP: Record<number, string> = {
  30: '30min', 45: '45min', 60: '1hour', 90: '90min',
  120: '2hours', 180: '3hours', 540: 'overnight',
}

const DURATION_MIN_MAP_REVERSE: Record<string, number> = {
  '30min': 30, '45min': 45, '1hour': 60, '90min': 90,
  '2hours': 120, '3hours': 180, '4hours': 240, '5hours': 300,
  '6hours': 360, '8hours': 480, 'overnight': 540, 'extra_hour': 60,
}

function SectionHeader({ number, title, optional }: { number: string; title: string; optional?: boolean }) {
  return (
    <div className="bm-section-header">
      <span className="bm-section-number">{number}</span>
      <span className="bm-section-title">{title}</span>
      <div className="bm-section-line" />
      {optional && <span className="bm-section-optional">optional</span>}
    </div>
  )
}

export function BookingModal({ isOpen, onClose }: BookingModalProps) {
  const [status, setStatus] = useState<Status>('idle')
  const [step, setStep] = useState<1 | 2>(1)
  const nameInputRef = useRef<HTMLInputElement>(null)

  // Step 1 state
  const [companions, setCompanions] = useState<Companion[]>([])
  const [selectedCompanion, setSelectedCompanion] = useState<Companion | null>(null)
  const [companionOpen, setCompanionOpen] = useState(false)
  const [callType, setCallType] = useState<'incall' | 'outcall'>('incall')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [timeOpen, setTimeOpen] = useState(false)
  const [duration, setDuration] = useState('')
  const [durationOpen, setDurationOpen] = useState(false)
  const [message, setMessage] = useState('')

  // Rates from companion
  const [rates, setRates] = useState<Rate[]>([])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      // Fetch companions
      fetch('/api/public/models?limit=100')
        .then(r => r.json())
        .then(res => setCompanions(res.data || []))
        .catch(() => {})
    } else {
      document.body.style.overflow = ''
      setStatus('idle')
      setStep(1)
      setSelectedCompanion(null)
      setCompanionOpen(false)
      setCallType('incall')
      setDate('')
      setTime('')
      setTimeOpen(false)
      setDuration('')
      setDurationOpen(false)
      setMessage('')
      setRates([])
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  useEffect(() => {
    if (step === 2) {
      setTimeout(() => nameInputRef.current?.focus(), 100)
    }
  }, [step])

  // Load rates when companion changes
  useEffect(() => {
    if (!selectedCompanion) {
      setRates([])
      return
    }
    fetch(`/api/public/models/${selectedCompanion.slug}`)
      .then(r => r.json())
      .then(res => {
        if (!res.success || !res.data?.modelRates) return
        // Group flat rates by durationType into incall/outcall rows
        const rateMap = new Map<string, Rate>()
        for (const mr of res.data.modelRates) {
          const key = mr.durationType
          const durationMin = DURATION_MIN_MAP_REVERSE[key] ?? 60
          const opt = DURATION_OPTIONS.find(d => d.key === key)
          const existing = rateMap.get(key) || {
            id: mr.id,
            label: opt?.label ?? key,
            durationType: key,
            durationMin,
            sortOrder: opt ? DURATION_OPTIONS.indexOf(opt) + 1 : 99,
            incall: null,
            outcall: null,
          }
          if (mr.callType === 'incall') existing.incall = Number(mr.price)
          if (mr.callType === 'outcall') existing.outcall = Number(mr.price)
          rateMap.set(key, existing)
        }
        const parsed = Array.from(rateMap.values())
          .filter(r => r.durationMin > 0)
          .sort((a, b) => a.sortOrder - b.sortOrder)
        setRates(parsed)
      })
      .catch(() => {})
  }, [selectedCompanion])

  if (!isOpen) return null

  const today = new Date().toISOString().split('T')[0]

  // Build duration list — merge with rates if companion selected
  const getDurationDisplay = () => {
    if (rates.length === 0) {
      // No companion — show durations without prices
      return DURATION_OPTIONS.map(d => ({
        key: d.key,
        label: d.label,
        price: null as number | null,
      }))
    }
    // With companion — show rates with prices, filter to non-Extra Hour
    return rates
      .filter(r => {
        const key = DURATION_MIN_MAP[r.durationMin]
        return key && key !== 'extra_hour'
      })
      .map(r => {
        const key = DURATION_MIN_MAP[r.durationMin]
        const opt = DURATION_OPTIONS.find(d => d.key === key)
        const price = callType === 'incall' ? r.incall : r.outcall
        return {
          key: key || r.label,
          label: opt?.label || r.label,
          price: price && price > 0 ? price : null,
        }
      })
  }

  const durationDisplay = getDurationDisplay()
  const selectedDurationLabel = durationDisplay.find(d => d.key === duration)?.label || ''
  const selectedDurationPrice = durationDisplay.find(d => d.key === duration)?.price

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('loading')
    const data = Object.fromEntries(new FormData(e.currentTarget))
    // Merge step 1 hidden fields + step 2 form fields
    const payload = {
      ...data,
      companion: selectedCompanion?.name || '',
      callType,
      date,
      time,
      duration: selectedDurationLabel || duration,
      message,
    }
    try {
      const res = await fetch('/api/public/enquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error()
      setStatus('success')
    } catch {
      setStatus('error')
    }
  }

  return (
    <div
      className="bm-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bm-title"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bm-panel">
        <button className="bm-close" onClick={onClose} aria-label="Close">&#10005;</button>

        {status === 'success' ? (
          <div className="bm-success">
            <div className="bm-success-icon">&#10003;</div>
            <h2 className="bm-success-title">Enquiry Received</h2>
            <p className="bm-success-text">
              We will respond personally within 15 minutes.
            </p>
            <button className="btn-gold bm-success-btn" onClick={onClose}>
              Close
            </button>
          </div>
        ) : (
          <>
            <p className="bm-steps">Step <span>{step}</span> of <span>2</span></p>
            <p className="sec-eyebrow">Make an Arrangement</p>
            <h2 className="bm-title" id="bm-title">Book a Companion</h2>

            <form className="bm-form" onSubmit={handleSubmit} noValidate>
              {/* ── Step 1: Booking Details ── */}
              <div style={{ display: step === 1 ? 'contents' : 'none' }}>

                {/* 01 — SELECT COMPANION */}
                <div className="bm-section">
                  <SectionHeader number="01" title="Select Companion" optional />
                  <div className="bm-dropdown">
                    <button
                      className={`bm-dropdown-trigger ${companionOpen ? 'open' : ''}`}
                      onClick={() => setCompanionOpen(!companionOpen)}
                      type="button"
                    >
                      {selectedCompanion ? (
                        <span className="bm-companion-selected">
                          {selectedCompanion.coverPhotoUrl ? (
                            <img src={selectedCompanion.coverPhotoUrl} alt="" className="bm-companion-avatar" />
                          ) : (
                            <span className="bm-companion-avatar-ph">
                              {selectedCompanion.name?.charAt(0)}
                            </span>
                          )}
                          <span>{selectedCompanion.name}</span>
                        </span>
                      ) : (
                        <span className="bm-placeholder">Select a companion...</span>
                      )}
                      <span className="bm-chevron">&#9660;</span>
                    </button>

                    {companionOpen && (
                      <>
                        <div className="bm-dropdown-overlay" onClick={() => setCompanionOpen(false)} />
                        <div className="bm-dropdown-list">
                          {companions.map(c => (
                            <div
                              key={c.id}
                              className={`bm-companion-option ${selectedCompanion?.id === c.id ? 'selected' : ''}`}
                              onClick={() => {
                                setSelectedCompanion(c)
                                setCompanionOpen(false)
                                setDuration('')
                              }}
                            >
                              {c.coverPhotoUrl ? (
                                <img src={c.coverPhotoUrl} alt="" className="bm-companion-avatar" />
                              ) : (
                                <span className="bm-companion-avatar-ph">
                                  {c.name?.charAt(0)}
                                </span>
                              )}
                              <span className="bm-companion-name">{c.name}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* 02 — LOCATION PREFERENCE */}
                <div className="bm-section">
                  <SectionHeader number="02" title="Location Preference" />
                  <div className="bm-location-cards">
                    <button
                      className={`bm-location-card ${callType === 'incall' ? 'active' : ''}`}
                      onClick={() => { setCallType('incall'); setDuration('') }}
                      type="button"
                    >
                      <span className="bm-location-card-title">Incall</span>
                      <span className="bm-location-card-desc">Our private location</span>
                    </button>
                    <button
                      className={`bm-location-card ${callType === 'outcall' ? 'active' : ''}`}
                      onClick={() => { setCallType('outcall'); setDuration('') }}
                      type="button"
                    >
                      <span className="bm-location-card-title">Outcall</span>
                      <span className="bm-location-card-desc">Your hotel or residence</span>
                    </button>
                  </div>
                </div>

                {/* 03 — DATE & TIME */}
                <div className="bm-section">
                  <SectionHeader number="03" title="Date & Time" />
                  <div className="bm-datetime-row">
                    <div>
                      <span className="bm-field-label">Date</span>
                      <input
                        type="date"
                        className="bm-book-input"
                        min={today}
                        value={date}
                        onChange={e => setDate(e.target.value)}
                      />
                    </div>
                    <div>
                      <span className="bm-field-label">Time</span>
                      <div className="bm-dropdown">
                        <button
                          className={`bm-dropdown-trigger ${timeOpen ? 'open' : ''}`}
                          onClick={() => setTimeOpen(!timeOpen)}
                          type="button"
                        >
                          {time ? <span>{time}</span> : <span className="bm-placeholder">Select time...</span>}
                          <span className="bm-chevron">&#9660;</span>
                        </button>
                        {timeOpen && (
                          <>
                            <div className="bm-dropdown-overlay" onClick={() => setTimeOpen(false)} />
                            <div className="bm-dropdown-list">
                              {TIME_SLOTS.map(t => (
                                <div
                                  key={t}
                                  className={`bm-duration-option ${time === t ? 'selected' : ''}`}
                                  onClick={() => { setTime(t); setTimeOpen(false) }}
                                >
                                  <span className="bm-duration-option-label">{t}</span>
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 04 — DURATION */}
                <div className="bm-section">
                  <SectionHeader number="04" title="Duration" />
                  <div className="bm-dropdown">
                    <button
                      className={`bm-dropdown-trigger ${durationOpen ? 'open' : ''}`}
                      onClick={() => setDurationOpen(!durationOpen)}
                      type="button"
                    >
                      {duration ? (
                        <span>
                          {selectedDurationLabel}
                          {selectedDurationPrice != null && ` \u2014 \u00A3${selectedDurationPrice.toLocaleString()}`}
                        </span>
                      ) : (
                        <span className="bm-placeholder">Select duration...</span>
                      )}
                      <span className="bm-chevron">&#9660;</span>
                    </button>

                    {durationOpen && (
                      <>
                        <div className="bm-dropdown-overlay" onClick={() => setDurationOpen(false)} />
                        <div className="bm-dropdown-list">
                          {durationDisplay.map(d => (
                            <div
                              key={d.key}
                              className={`bm-duration-option ${duration === d.key ? 'selected' : ''}`}
                              onClick={() => { setDuration(d.key); setDurationOpen(false) }}
                            >
                              <span className="bm-duration-option-label">{d.label}</span>
                              {d.price != null && (
                                <span className="bm-duration-option-price">
                                  &pound;{d.price.toLocaleString()}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Special requests */}
                <div className="bm-section">
                  <SectionHeader number="05" title="Special Requests" optional />
                  <textarea
                    className="bm-book-textarea"
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    rows={3}
                    placeholder="Any preferences or special requests..."
                  />
                </div>

                <button
                  type="button"
                  className="btn-gold bm-submit"
                  onClick={() => setStep(2)}
                >
                  Continue &rarr;
                </button>
              </div>

              {/* ── Step 2: Contact Details ── */}
              <div style={{ display: step === 2 ? 'contents' : 'none' }}>
                <div className="bm-field">
                  <label className="bm-label" htmlFor="bm-name">Your Name</label>
                  <input
                    ref={nameInputRef}
                    id="bm-name" name="name" type="text"
                    className="bm-input"
                    placeholder="First name or alias"
                    required
                  />
                </div>

                <div className="bm-field">
                  <label className="bm-label" htmlFor="bm-contact">
                    Contact — WhatsApp / Telegram / Email
                  </label>
                  <input
                    id="bm-contact" name="contact" type="text"
                    className="bm-input"
                    placeholder="How shall we reach you?"
                    required
                  />
                </div>

                {status === 'error' && (
                  <p className="bm-error">
                    Something went wrong. Please try again or contact us directly.
                  </p>
                )}

                <div className="bm-step-btns">
                  <button type="button" className="bm-back" onClick={() => setStep(1)}>
                    &larr; Back
                  </button>
                  <button
                    type="submit"
                    className="btn-gold bm-submit"
                    disabled={status === 'loading'}
                    style={{ flex: 1 }}
                  >
                    {status === 'loading' ? 'Sending\u2026' : 'Send Enquiry'}
                  </button>
                </div>
              </div>

              <p className="bm-footer-note">
                All enquiries handled with complete discretion.
                We respond within 15 minutes, 24/7.
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
