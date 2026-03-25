'use client'

import { useEffect, useRef, useState } from 'react'

interface BookingModalProps {
  isOpen: boolean
  onClose: () => void
}

type Status = 'idle' | 'loading' | 'success' | 'error'

export function BookingModal({ isOpen, onClose }: BookingModalProps) {
  const [status, setStatus] = useState<Status>('idle')
  const [step, setStep] = useState<1 | 2>(1)
  const firstInputRef = useRef<HTMLInputElement>(null)
  const nameInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      setTimeout(() => firstInputRef.current?.focus(), 100)
    } else {
      document.body.style.overflow = ''
      setStatus('idle')
      setStep(1)
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

  if (!isOpen) return null

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('loading')
    const data = Object.fromEntries(new FormData(e.currentTarget))
    try {
      const res = await fetch('/api/public/enquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
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
        <button className="bm-close" onClick={onClose} aria-label="Close">✕</button>

        {status === 'success' ? (
          <div className="bm-success">
            <div className="bm-success-icon">✓</div>
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
                <div className="bm-field">
                  <label className="bm-label" htmlFor="bm-companion">
                    Preferred Companion <span className="bm-optional">(optional)</span>
                  </label>
                  <input
                    ref={firstInputRef}
                    id="bm-companion" name="companion" type="text"
                    className="bm-input"
                    placeholder="Name, or leave blank for a recommendation"
                  />
                </div>

                <div className="bm-row">
                  <div className="bm-field">
                    <label className="bm-label" htmlFor="bm-date">Date</label>
                    <input
                      id="bm-date" name="date" type="date"
                      className="bm-input bm-input-date"
                      required
                    />
                  </div>
                  <div className="bm-field">
                    <label className="bm-label" htmlFor="bm-duration">Duration</label>
                    <select id="bm-duration" name="duration" className="bm-input bm-select" required>
                      <option value="">Select…</option>
                      <option value="1 hour">1 hour</option>
                      <option value="2 hours">2 hours</option>
                      <option value="3 hours">3 hours</option>
                      <option value="Dinner date">Dinner date</option>
                      <option value="Overnight">Overnight</option>
                      <option value="Weekend">Weekend</option>
                    </select>
                  </div>
                </div>

                <div className="bm-field">
                  <label className="bm-label" htmlFor="bm-location">Location</label>
                  <input
                    id="bm-location" name="location" type="text"
                    className="bm-input"
                    placeholder="Hotel, area or postcode in London"
                    required
                  />
                </div>

                <div className="bm-field">
                  <label className="bm-label" htmlFor="bm-message">
                    Message <span className="bm-optional">(optional)</span>
                  </label>
                  <textarea
                    id="bm-message" name="message"
                    className="bm-input bm-textarea"
                    placeholder="Any preferences or special requests…"
                    rows={3}
                  />
                </div>

                <button
                  type="button"
                  className="btn-gold bm-submit"
                  onClick={() => setStep(2)}
                >
                  Continue →
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
                    ← Back
                  </button>
                  <button
                    type="submit"
                    className="btn-gold bm-submit"
                    disabled={status === 'loading'}
                    style={{ flex: 1 }}
                  >
                    {status === 'loading' ? 'Sending…' : 'Send Enquiry'}
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
