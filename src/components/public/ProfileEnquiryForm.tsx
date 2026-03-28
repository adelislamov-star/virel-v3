'use client'

import { useState } from 'react'

interface Rate {
  label: string
  incall: number | null
  outcall: number | null
}

interface Props {
  companionName: string
  rates: Rate[]
}

export function ProfileEnquiryForm({ companionName, rates }: Props) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('loading')
    const fd = new FormData(e.currentTarget)
    const payload = {
      name: fd.get('name') as string,
      contact: fd.get('contact') as string,
      date: fd.get('date') as string,
      duration: fd.get('duration') as string,
      callType: fd.get('callType') as string,
      message: fd.get('message') as string,
      companion: companionName,
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

  if (status === 'success') {
    return (
      <div className="pr-form-success">
        <div className="pr-form-success-icon">✓</div>
        <p>Request sent — we will contact you shortly.</p>
      </div>
    )
  }

  return (
    <form className="pr-form-grid" onSubmit={handleSubmit} noValidate>
      <div className="pr-form-half">
        <div className="pr-form-t">Your details</div>
        <div className="pr-f-row">
          <label className="pr-f-label">Name or alias *</label>
          <input name="name" className="pr-f-input" required placeholder="How shall we address you?" />
        </div>
        <div className="pr-f-row">
          <label className="pr-f-label">Contact — WhatsApp / Telegram / Email *</label>
          <input name="contact" className="pr-f-input" required placeholder="How would you like us to reach you?" />
        </div>
        <div className="pr-f-row">
          <label className="pr-f-label">Preferred date</label>
          <input name="date" className="pr-f-input" placeholder="e.g. Friday evening" />
        </div>
        <div className="pr-f-row">
          <label className="pr-f-label">Duration</label>
          <select name="duration" className="pr-f-select">
            <option value="">Select duration</option>
            {rates.map((r) => (
              <option key={r.label} value={r.label}>
                {r.label}{r.incall ? ` — £${r.incall.toLocaleString('en-GB')}` : ''}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="pr-form-half">
        <div className="pr-form-t">Arrangement details</div>
        <div className="pr-f-row">
          <label className="pr-f-label">Type</label>
          <select name="callType" className="pr-f-select">
            <option value="">Incall or Outcall?</option>
            <option value="incall">Incall</option>
            <option value="outcall">Outcall — your location</option>
          </select>
        </div>
        <div className="pr-f-row">
          <label className="pr-f-label">Special requests or preferences</label>
          <textarea name="message" className="pr-f-textarea" placeholder="Anything you'd like us to know..." />
        </div>
        <button
          type="submit"
          className="pr-f-submit"
          disabled={status === 'loading'}
        >
          {status === 'loading' ? 'Sending…' : 'Send private request'}
        </button>
        {status === 'error' && (
          <p className="pr-f-error">Something went wrong. Please try WhatsApp or Telegram.</p>
        )}
        <p className="pr-f-note">We respond within 15 minutes. All information kept strictly confidential.</p>
      </div>
    </form>
  )
}
